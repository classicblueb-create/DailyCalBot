
import React from 'react';

export const Card = ({ 
  children, 
  className = "", 
  onClick, 
  noHover = false 
}: { 
  children: React.ReactNode, 
  className?: string, 
  onClick?: () => void, 
  noHover?: boolean 
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-[2rem] p-6 shadow-soft transition-all duration-300 ${
      !noHover && onClick 
        ? 'cursor-pointer hover:shadow-soft-lg hover:-translate-y-1 active:scale-[0.98]' 
        : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const Badge = ({ 
  children, 
  color = "gray", 
  className = "" 
}: { 
  children: React.ReactNode, 
  color?: "gray" | "lavender" | "peach" | "mint" | "blue" | "orange" | "green" | "red" | "yellow", 
  className?: string 
}) => {
  const colors = {
    gray: "bg-gray-100 text-gray-500",
    lavender: "bg-lavender-50 text-lavender-500",
    peach: "bg-peach-50 text-peach-400",
    mint: "bg-mint-50 text-mint-500",
    blue: "bg-blue-50 text-blue-500",
    orange: "bg-orange-50 text-orange-500",
    green: "bg-green-50 text-green-500",
    red: "bg-red-50 text-red-500",
    yellow: "bg-yellow-50 text-yellow-600",
  };
  return (
    <span className={`${colors[color]} px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${className}`}>
      {children}
    </span>
  );
};

export const PageTransition = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode, 
  className?: string 
}) => (
  <div className={`animate-fade-in-up flex-1 flex flex-col ${className}`}>
    {children}
  </div>
);

export const Header = ({ 
  title, 
  subtitle, 
  action 
}: { 
  title: string, 
  subtitle?: string, 
  action?: React.ReactNode 
}) => (
  <div className="px-6 pt-12 pb-6 bg-white rounded-b-[2.5rem] shadow-sm z-10 flex flex-col animate-fade-in-up">
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800">{title}</h1>
        {subtitle && <p className="text-gray-500 font-medium mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  </div>
);

export const ProgressBar = ({ 
  value, 
  max, 
  color = "bg-blue-500", 
  height = "h-2" 
}: { 
  value: number, 
  max: number, 
  color?: string, 
  height?: string 
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height}`}>
      <div 
        className={`${color} h-full rounded-full transition-all duration-500 ease-out`} 
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
};

export const ProgressRing = ({ 
  value, 
  max, 
  size = 60, 
  stroke = 4, 
  color = "text-blue-500",
  bgColor = "text-blue-100" 
}: { 
  value: number, 
  max: number, 
  size?: number, 
  stroke?: number,
  color?: string,
  bgColor?: string
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={stroke}
          className={bgColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
         {/* Optional: Center content */}
      </div>
    </div>
  );
};
