import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    newUsers: 0
  });
  const [realData, setRealData] = useState({
    trends: { dailySales: {}, dailyOrders: {} },
    orderStatus: [],
    topProducts: [],
    categoryDistribution: {},
    monthlySales: {}
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/analytics?timeRange=${timeRange}`);
      
      if (response.data.analytics) {
        const data = response.data.analytics;
        
        // Set summary statistics
        setAnalytics({
          totalUsers: data.summary.totalUsers,
          totalOrders: data.summary.totalOrders,
          totalRevenue: data.summary.totalRevenue,
          averageOrderValue: data.summary.averageOrderValue,
          conversionRate: data.summary.conversionRate,
          newUsers: data.summary.newUsers
        });

        // Set detailed data for charts
        setRealData({
          trends: data.trends,
          orderStatus: data.orderStatus,
          topProducts: data.topProducts,
          categoryDistribution: data.categoryDistribution,
          monthlySales: data.monthlySales || {}
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to demo data if API fails
      setAnalytics({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        newUsers: 0
      });
      setRealData({
        trends: { dailySales: {}, dailyOrders: {} },
        orderStatus: [],
        topProducts: [],
        categoryDistribution: {},
        monthlySales: {}
      });
    } finally {
      setLoading(false);
    }
  };

  // Process real sales data for charts
  const processRealSalesData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const labels = [];
    const salesData = [];
    const ordersData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      labels.push(date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }));
      
      // Use real data if available, otherwise 0
      salesData.push(realData.trends?.dailySales?.[dateStr] || 0);
      ordersData.push(realData.trends?.dailyOrders?.[dateStr] || 0);
    }

    return { labels, salesData, ordersData };
  };

  const { labels, salesData, ordersData } = processRealSalesData();

  // Sales Trend Chart (Line)
  const salesTrendData = {
    labels,
    datasets: [
      {
        label: 'ยอดขาย (บาท)',
        data: salesData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'จำนวนคำสั่งซื้อ',
        data: ordersData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 9 },
          padding: 5,
          boxWidth: 12
        }
      },
      title: {
        display: true,
        text: 'แนวโน้มยอดขายและคำสั่งซื้อ',
        font: { size: 11, weight: 'bold' },
        padding: { bottom: 5 }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          font: { size: 9 }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: { size: 9 }
        }
      },
      x: {
        ticks: {
          font: { size: 9 }
        }
      }
    }
  };

  // Monthly Sales Comparison (Bar) - Real Data
  const processMonthlyData = () => {
    const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const currentYear = new Date().getFullYear();
    const thisYearData = [];
    const lastYearData = [];

    monthLabels.forEach((_, index) => {
      const monthKey = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
      const lastYearKey = `${currentYear - 1}-${String(index + 1).padStart(2, '0')}`;
      
      thisYearData.push(realData.monthlySales?.[monthKey] || 0);
      lastYearData.push(realData.monthlySales?.[lastYearKey] || 0);
    });

    return { monthLabels, thisYearData, lastYearData };
  };

  const { monthLabels, thisYearData, lastYearData } = processMonthlyData();

  const monthlySalesData = {
    labels: monthLabels,
    datasets: [
      {
        label: `ปี ${new Date().getFullYear()}`,
        data: thisYearData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: `ปี ${new Date().getFullYear() - 1}`,
        data: lastYearData,
        backgroundColor: 'rgba(156, 163, 175, 0.8)'
      }
    ]
  };

  const monthlySalesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 9 },
          padding: 5,
          boxWidth: 12
        }
      },
      title: {
        display: true,
        text: 'เปรียบเทียบยอดขายรายเดือน',
        font: { size: 11, weight: 'bold' },
        padding: { bottom: 5 }
      }
    },
    scales: {
      y: {
        ticks: {
          font: { size: 9 }
        }
      },
      x: {
        ticks: {
          font: { size: 9 }
        }
      }
    }
  };

  // Product Categories (Doughnut) - Real Data
  const processCategoryData = () => {
    const categories = Object.keys(realData.categoryDistribution || {});
    const values = Object.values(realData.categoryDistribution || {});
    
    if (categories.length === 0) {
      return {
        labels: ['ไม่มีข้อมูล'],
        data: [1],
        colors: ['#E5E7EB']
      };
    }

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#6B7280', '#EC4899', '#14B8A6',
      '#F97316', '#84CC16'
    ];

    return {
      labels: categories,
      data: values,
      colors: colors.slice(0, categories.length)
    };
  };

  const categoryDataProcessed = processCategoryData();
  
  const categoryData = {
    labels: categoryDataProcessed.labels,
    datasets: [
      {
        data: categoryDataProcessed.data,
        backgroundColor: categoryDataProcessed.colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 8 },
          padding: 4,
          boxWidth: 10
        }
      },
      title: {
        display: true,
        text: 'การแจกแจงตามหมวดหมู่สินค้า (%)',
        font: { size: 11, weight: 'bold' },
        padding: { bottom: 5 }
      }
    }
  };

  // Order Status (Pie) - Real Data
  const processOrderStatusData = () => {
    const statusMapping = {
      'Delivered': 'เสร็จสิ้น',
      'Processing': 'กำลังดำเนินการ',
      'Cancelled': 'ยกเลิก',
      'Not Process': 'รอดำเนินการ',
      'Shipped': 'จัดส่งแล้ว'
    };

    const statusColors = {
      'เสร็จสิ้น': '#10B981',
      'กำลังดำเนินการ': '#F59E0B',
      'ยกเลิก': '#EF4444',
      'รอดำเนินการ': '#6B7280',
      'จัดส่งแล้ว': '#3B82F6'
    };

    const labels = [];
    const data = [];
    const colors = [];

    if (realData.orderStatus && realData.orderStatus.length > 0) {
      realData.orderStatus.forEach(item => {
        const thaiStatus = statusMapping[item.oderStatus] || item.oderStatus;
        labels.push(thaiStatus);
        data.push(item._count.id);
        colors.push(statusColors[thaiStatus] || '#6B7280');
      });
    } else {
      labels.push('ไม่มีข้อมูล');
      data.push(1);
      colors.push('#E5E7EB');
    }

    return { labels, data, colors };
  };

  const orderStatusProcessed = processOrderStatusData();

  const orderStatusData = {
    labels: orderStatusProcessed.labels,
    datasets: [
      {
        data: orderStatusProcessed.data,
        backgroundColor: orderStatusProcessed.colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const orderStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 8 },
          padding: 4,
          boxWidth: 10
        }
      },
      title: {
        display: true,
        text: 'สถานะคำสั่งซื้อ (%)',
        font: { size: 11, weight: 'bold' },
        padding: { bottom: 5 }
      }
    }
  };

  // Top Products (Bar) - Real Data
  const processTopProductsData = () => {
    if (!realData.topProducts || realData.topProducts.length === 0) {
      return {
        labels: ['ไม่มีข้อมูล'],
        data: [0]
      };
    }

    const labels = realData.topProducts.slice(0, 10).map(product => 
      product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
    );
    const data = realData.topProducts.slice(0, 10).map(product => product.revenue);

    return { labels, data };
  };

  const topProductsProcessed = processTopProductsData();

  const topProductsData = {
    labels: topProductsProcessed.labels,
    datasets: [
      {
        label: 'ยอดขาย (บาท)',
        data: topProductsProcessed.data,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  };

  const topProductsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2.5,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'สินค้าขายดีอันดับ 5',
        font: { size: 11, weight: 'bold' },
        padding: { bottom: 5 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 9 }
        }
      },
      x: {
        ticks: {
          font: { size: 9 }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row justify-center items-center py-6 sm:py-8 gap-2">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500"></div>
        <span className="text-xs sm:text-sm text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  // Show message if no data available
  const hasData = analytics.totalOrders > 0 || analytics.totalRevenue > 0;

  return (
    <div className="space-y-2.5">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
          <i className="fas fa-chart-bar text-orange-500 text-xs"></i>
          <span>รายงานและสถิติ</span>
        </h2>
        <div className="flex gap-1.5">
          {[
            { value: '7d', label: '7 วัน' },
            { value: '30d', label: '30 วัน' },
            { value: '90d', label: '90 วัน' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                timeRange === option.value
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2.5 border border-blue-200">
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-blue-800 truncate">ผู้ใช้ทั้งหมด</p>
              <p className="text-base sm:text-lg font-bold text-blue-900 mt-0.5">{analytics.totalUsers.toLocaleString()}</p>
              <p className="text-[9px] text-blue-600 truncate">
                {analytics.newUsers > 0 ? `+${analytics.newUsers} ใหม่` : 'ไม่มีใหม่'}
              </p>
            </div>
            <i className="fas fa-users text-blue-500 text-sm flex-shrink-0"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2.5 border border-green-200">
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-green-800 truncate">ยอดขายรวม</p>
              <p className="text-base sm:text-lg font-bold text-green-900 mt-0.5">฿{Math.floor(analytics.totalRevenue).toLocaleString()}</p>
              <p className="text-[9px] text-green-600 truncate">
                {timeRange === '7d' ? '7 วัน' : timeRange === '30d' ? '30 วัน' : '90 วัน'}
              </p>
            </div>
            <i className="fas fa-dollar-sign text-green-500 text-sm flex-shrink-0"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2.5 border border-purple-200">
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-purple-800 truncate">คำสั่งซื้อ</p>
              <p className="text-base sm:text-lg font-bold text-purple-900 mt-0.5">{analytics.totalOrders.toLocaleString()}</p>
              <p className="text-[9px] text-purple-600 truncate">
                {timeRange === '7d' ? '7 วัน' : timeRange === '30d' ? '30 วัน' : '90 วัน'}
              </p>
            </div>
            <i className="fas fa-shopping-cart text-purple-500 text-sm flex-shrink-0"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2.5 border border-orange-200">
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-orange-800 truncate">ค่าเฉลี่ย/ออเดอร์</p>
              <p className="text-base sm:text-lg font-bold text-orange-900 mt-0.5">฿{Math.floor(analytics.averageOrderValue).toLocaleString()}</p>
              <p className="text-[9px] text-orange-600 truncate">เฉลี่ย/ออเดอร์</p>
            </div>
            <i className="fas fa-chart-line text-orange-500 text-sm flex-shrink-0"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-2.5 border border-indigo-200">
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-indigo-800 truncate">อัตราการแปลง</p>
              <p className="text-base sm:text-lg font-bold text-indigo-900 mt-0.5">{analytics.conversionRate.toFixed(1)}%</p>
              <p className="text-[9px] text-indigo-600 truncate">สัดส่วนผู้ซื้อ</p>
            </div>
            <i className="fas fa-percentage text-indigo-500 text-sm flex-shrink-0"></i>
          </div>
        </div>
      </div>

      {/* No Data Message */}
      {!hasData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <i className="fas fa-exclamation-triangle text-yellow-500 text-xl mb-1.5"></i>
          <h3 className="text-xs font-semibold text-yellow-800 mb-0.5">ไม่มีข้อมูลการขาย</h3>
          <p className="text-[10px] text-yellow-700">
            ยังไม่มีคำสั่งซื้อในช่วงเวลาที่เลือก
          </p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <div style={{ height: '200px' }}>
            <Line data={salesTrendData} options={salesTrendOptions} />
          </div>
        </div>

        {/* Monthly Sales Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <div style={{ height: '200px' }}>
            <Bar data={monthlySalesData} options={monthlySalesOptions} />
          </div>
        </div>

        {/* Product Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <div style={{ height: '180px' }}>
            <Doughnut data={categoryData} options={categoryOptions} />
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <div style={{ height: '180px' }}>
            <Pie data={orderStatusData} options={orderStatusOptions} />
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
        <div style={{ height: '220px' }}>
          <Bar data={topProductsData} options={topProductsOptions} />
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
        <div className="text-center">
          <h3 className="text-xs font-semibold text-gray-900 mb-1 flex items-center justify-center gap-1.5">
            <i className="fas fa-download text-orange-500 text-xs"></i>
            <span>ส่งออกรายงาน</span>
          </h3>
          <p className="text-[10px] text-gray-600 mb-2">ดาวน์โหลดรายงานในรูปแบบต่างๆ</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            <button className="px-2.5 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-xs font-medium shadow-sm">
              <i className="fas fa-file-excel mr-1"></i>
              Excel
            </button>
            <button className="px-2.5 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-xs font-medium shadow-sm">
              <i className="fas fa-file-pdf mr-1"></i>
              PDF
            </button>
            <button className="px-2.5 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 text-xs font-medium shadow-sm">
              <i className="fas fa-file-csv mr-1"></i>
              CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
