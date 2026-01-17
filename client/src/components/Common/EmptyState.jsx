import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ 
  icon = 'fas fa-inbox', 
  title = 'ไม่มีข้อมูล', 
  description = 'ยังไม่มีข้อมูลในส่วนนี้',
  actionText = 'เริ่มต้นใช้งาน',
  actionLink = '/',
  actionIcon = 'fas fa-plus',
  gradient = 'from-blue-500 to-purple-500'
}) => {
  return (
    <div className="text-center py-16 px-6">
      <div className="max-w-md mx-auto">
        {/* Animated Icon */}
        <div className={`w-24 h-24 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center mx-auto mb-6 float`}>
          <i className={`${icon} text-white text-3xl`}></i>
        </div>
        
        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {description}
        </p>
        
        {/* Action Button */}
        {actionLink && (
          <Link
            to={actionLink}
            className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 btn-hover`}
          >
            <i className={`${actionIcon} mr-2`}></i>
            {actionText}
          </Link>
        )}
        
        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center space-x-4">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
