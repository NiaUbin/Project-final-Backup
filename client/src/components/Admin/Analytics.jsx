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
        setAnalytics({
          totalUsers: data.summary.totalUsers,
          totalOrders: data.summary.totalOrders,
          totalRevenue: data.summary.totalRevenue,
          averageOrderValue: data.summary.averageOrderValue,
          conversionRate: data.summary.conversionRate,
          newUsers: data.summary.newUsers
        });
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
      // Fallback
      setAnalytics({ totalUsers: 0, totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, conversionRate: 0, newUsers: 0 });
      setRealData({ trends: { dailySales: {}, dailyOrders: {} }, orderStatus: [], topProducts: [], categoryDistribution: {}, monthlySales: {} });
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
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
      salesData.push(realData.trends?.dailySales?.[dateStr] || 0);
      ordersData.push(realData.trends?.dailyOrders?.[dateStr] || 0);
    }
    return { labels, salesData, ordersData };
  };

  const { labels, salesData, ordersData } = processRealSalesData();

  // Sales Trend Chart Options
  const salesTrendData = {
    labels,
    datasets: [
      {
        label: 'ยอดขาย (บาท)',
        data: salesData,
        borderColor: '#4f46e5', // indigo-600
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      },
      {
        label: 'จำนวนคำสั่งซื้อ',
        data: ordersData,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 2,
         pointHoverRadius: 5
      }
    ]
  };

  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 10, family: "'Prompt', sans-serif" }, usePointStyle: true, boxWidth: 6 } },
      tooltip: { 
          backgroundColor: '#1e293b', 
          titleFont: { family: "'Prompt', sans-serif" }, 
          bodyFont: { family: "'Prompt', sans-serif" },
          padding: 10,
          cornerRadius: 8
      }
    },
    scales: {
      y: { type: 'linear', display: true, position: 'left', grid: { borderDash: [2, 4], color: '#f1f5f9' }, ticks: { font: { size: 10, family: "'Prompt', sans-serif" } } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { size: 10, family: "'Prompt', sans-serif" } } },
      x: { grid: { display: false }, ticks: { font: { size: 10, family: "'Prompt', sans-serif" }, maxTicksLimit: 7 } }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  // Monthly Sales
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
      { label: `ปี ${new Date().getFullYear()}`, data: thisYearData, backgroundColor: '#6366f1', borderRadius: 4 }, // indigo-500
      { label: `ปี ${new Date().getFullYear() - 1}`, data: lastYearData, backgroundColor: '#cbd5e1', borderRadius: 4 } // slate-300
    ]
  };

  const monthlySalesOptions = {
     responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 10, family: "'Prompt', sans-serif" }, usePointStyle: true, boxWidth: 6 } }
    },
    scales: {
        y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#f1f5f9' }, ticks: { font: { family: "'Prompt', sans-serif", size: 10 } } },
        x: { grid: { display: false }, ticks: { font: { family: "'Prompt', sans-serif", size: 10 } } }
    }
  };

  // Category Doughnut
  const processCategoryData = () => {
    const categories = Object.keys(realData.categoryDistribution || {});
    const values = Object.values(realData.categoryDistribution || {});
    
    if (categories.length === 0) return { labels: ['ไม่มีข้อมูล'], data: [1], colors: ['#f1f5f9'] };

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];
    return { labels: categories, data: values, colors: colors.slice(0, categories.length) };
  };

  const categoryData = processCategoryData();
  const doughnutData = {
      labels: categoryData.labels,
      datasets: [{ data: categoryData.data, backgroundColor: categoryData.colors, borderWidth: 0, hoverOffset: 4 }]
  };

  // Order Status Pie
  const processOrderStatusData = () => {
     const statusMapping = {
      'Delivered': 'เสร็จสิ้น', 'Processing': 'กำลังดำเนินการ', 'Cancelled': 'ยกเลิก',
      'Not Process': 'รอดำเนินการ', 'Shipped': 'จัดส่งแล้ว'
    };
    const statusColors = {
      'เสร็จสิ้น': '#10b981', 'กำลังดำเนินการ': '#f59e0b', 'ยกเลิก': '#ef4444',
      'รอดำเนินการ': '#94a3b8', 'จัดส่งแล้ว': '#6366f1'
    };
    const labels = []; const data = []; const colors = [];
    if (realData.orderStatus?.length > 0) {
        realData.orderStatus.forEach(item => {
            const thaiStatus = statusMapping[item.oderStatus] || item.oderStatus;
            labels.push(thaiStatus);
            data.push(item._count.id);
            colors.push(statusColors[thaiStatus] || '#cbd5e1');
        });
    } else {
        labels.push('ไม่มีข้อมูล'); data.push(1); colors.push('#f1f5f9');
    }
    return { labels, data, colors };
  };
  
  const orderStatusP = processOrderStatusData();
  const pieData = {
      labels: orderStatusP.labels,
      datasets: [{ data: orderStatusP.data, backgroundColor: orderStatusP.colors, borderWidth: 0, hoverOffset: 4 }]
  };
  
  const pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: { position: 'right', labels: { font: { size: 10, family: "'Prompt', sans-serif" }, boxWidth: 10, padding: 10 } }
      }
  };


  // Top Products
  const processTopProducts = () => {
      if(!realData.topProducts?.length) return { labels: ['ไม่มีข้อมูล'], data: [0] };
      const labels = realData.topProducts.slice(0, 5).map(p => p.name.length > 30 ? p.name.substring(0,30)+'...' : p.name);
      const data = realData.topProducts.slice(0, 5).map(p => p.revenue);
      return { labels, data };
  };
  const topP = processTopProducts();
  const topProductsData = {
      labels: topP.labels,
      datasets: [{
          label: 'ยอดขาย (บาท)',
          data: topP.data,
          backgroundColor: '#10b981',
          borderRadius: 4,
          barThickness: 20
      }]
  };
  const topProductsOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { beginAtZero: true, grid: { borderDash: [2, 4] }, ticks: { font: { size: 10 } } },
        y: { grid: { display: false }, ticks: { font: { size: 11, family: "'Prompt', sans-serif" } } }
    }
  };


  if (loading) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
              <span className="text-slate-500 font-medium">กำลังประมวลผลข้อมูล...</span>
          </div>
      );
  }

  const StatCard = ({ title, value, subtext, icon, color, bg }) => (
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mb-1">{title}</p>
              <h3 className="text-xl font-bold text-slate-800">{value}</h3>
              <p className={`text-[10px] mt-1 ${color}`}>{subtext}</p>
          </div>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg} ${color}`}>
              <i className={`fas ${icon} text-sm`}></i>
          </div>
      </div>
  );

  return (
    <div className="space-y-3">
       {/* Header Controls */}
       <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <i className="fas fa-chart-line text-sm"></i>
               </div>
               <div>
                   <h2 className="text-base font-bold text-slate-800">Dashboard Overview</h2>
                   <p className="text-[10px] text-slate-500">ภาพรวมสถิติของร้านค้า</p>
               </div>
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-xl">
               {['7d', '30d', '90d'].map(range => (
                   <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            timeRange === range 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-indigo-600'
                        }`}
                   >
                       {range === '7d' ? '7 วันล่าสุด' : range === '30d' ? '30 วันล่าสุด' : '3 เดือน'}
                   </button>
               ))}
           </div>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
           <StatCard 
                title="ยอดขายรวม" 
                value={`฿${Math.floor(analytics.totalRevenue).toLocaleString()}`} 
                subtext={`ในช่วง ${timeRange}`} 
                icon="fa-wallet" 
                color="text-emerald-600" 
                bg="bg-emerald-50" 
            />
           <StatCard 
                title="จำนวนคำสั่งซื้อ" 
                value={analytics.totalOrders.toLocaleString()} 
                subtext={`เฉลี่ย ฿${Math.floor(analytics.averageOrderValue).toLocaleString()}/ออเดอร์`} 
                icon="fa-shopping-bag" 
                color="text-blue-600" 
                bg="bg-blue-50" 
            />
           <StatCard 
                title="ผู้ใช้งานทั้งหมด" 
                value={analytics.totalUsers.toLocaleString()} 
                subtext={`+${analytics.newUsers} ผู้ใช้ใหม่`} 
                icon="fa-users" 
                color="text-indigo-600" 
                bg="bg-indigo-50" 
            />
           <StatCard 
                title="อัตราการซื้อ" 
                value={`${analytics.conversionRate.toFixed(1)}%`} 
                subtext="Conversion Rate" 
                icon="fa-percentage" 
                color="text-violet-600" 
                bg="bg-violet-50" 
            />
       </div>

       {/* Charts Row 1: Sales Trend & Monthly */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
           <div className="lg:col-span-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="text-xs font-bold text-slate-700 mb-2">แนวโน้มการขาย</h3>
               <div className="h-44">
                   <Line data={salesTrendData} options={salesTrendOptions} />
               </div>
           </div>
           <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="text-xs font-bold text-slate-700 mb-2">เปรียบเทียบรายเดือน</h3>
               <div className="h-44">
                   <Bar data={monthlySalesData} options={monthlySalesOptions} />
               </div>
           </div>
       </div>

       {/* Charts Row 2: Categories, Status, Top Products */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="text-xs font-bold text-slate-700 mb-2">สัดส่วนหมวดหมู่</h3>
               <div className="h-32 relative">
                   <Doughnut data={doughnutData} options={{ ...pieOptions, cutout: '70%', plugins: { legend: { display: false } } }} />
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-xl font-bold text-slate-800">{categoryData.labels.length}</span>
                       <span className="text-[10px] text-slate-400">หมวดหมู่</span>
                   </div>
               </div>
               <div className="mt-2 flex flex-wrap gap-2 justify-center">
                   {categoryData.labels.slice(0,4).map((l, i) => (
                       <div key={i} className="flex items-center gap-1 text-[10px] text-slate-600">
                           <span className="w-1.5 h-1.5 rounded-full" style={{ background: categoryData.colors[i] }}></span>{l}
                       </div>
                   ))}
               </div>
           </div>

           <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="text-xs font-bold text-slate-700 mb-2">สถานะคำสั่งซื้อ</h3>
               <div className="h-40">
                    <Pie data={pieData} options={pieOptions} />
               </div>
           </div>

           <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
               <h3 className="text-xs font-bold text-slate-700 mb-2">สินค้าขายดี (Top 5)</h3>
               <div className="flex-1 h-40">
                   <Bar data={topProductsData} options={topProductsOptions} />
               </div>
           </div>
       </div>
    </div>
  );
};

export default Analytics;
