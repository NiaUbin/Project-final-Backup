import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <i className="fas fa-exclamation-triangle text-red-600"></i>
            </div>
            <h3 className="text-lg font-medium text-red-800">เกิดข้อผิดพลาด</h3>
          </div>
          
          <p className="text-red-700 mb-4">
            เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
          </p>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              <i className="fas fa-redo mr-2"></i>
              รีเฟรชหน้า
            </button>
            
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
              }}
              className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              <i className="fas fa-times mr-2"></i>
              ปิด
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-red-600 font-medium">
                ดูรายละเอียดข้อผิดพลาด (สำหรับนักพัฒนา)
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-red-800 font-mono text-xs overflow-auto">
                <div><strong>Error:</strong> {this.state.error.toString()}</div>
                <div><strong>Stack:</strong> {this.state.errorInfo.componentStack}</div>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
