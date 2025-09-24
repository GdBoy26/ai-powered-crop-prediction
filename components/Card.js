import React from 'react';
import { useAppContext } from '../context/AppContext';

const Card = ({ title, icon, children, className = '' }) => {
  const { theme } = useAppContext();
  return (
    <div className={`p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl border ${
      theme === 'dark' 
        ? 'bg-dark-700 border-dark-600 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    } ${className}`}>
      <div className="flex items-center mb-4">
        {icon && <span className="text-3xl mr-3">{icon}</span>}
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
};



export default Card;