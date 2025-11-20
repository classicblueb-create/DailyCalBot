import React, { useState, useRef, useEffect } from 'react';
import { analyzeFoodImage, askDietCoach } from './services/geminiService';
import { FoodAnalysis, Meal, CalendarDay, Insight, TimeSlot, DayStats } from './types';
import { CameraIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, UserIcon, ChartIcon, TrophyIcon, LightBulbIcon, XIcon, ImageIcon, ChatBubbleIcon, SendIcon, WaterDropIcon, CalendarIcon, ChevronDownIcon, GridIcon, ListIcon, FireIcon } from './components/Icons';
import { Card, Badge, PageTransition, Header, ProgressRing } from './components/Shared';
import { MealCard, MacroCard, InsightCard, WaterQuickAdd, HydrationSlotCard, ReminderBanner, StackedCards } from './components/Cards';

// --- Helper Components ---

const DatePill = ({ day, date, isActive, onClick }: CalendarDay & { onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-12 h-16 rounded-[1.2rem] transition-all duration-300 shrink-0 cursor-pointer ${
    isActive 
      ? 'bg-lavender-500 text-white shadow-lg shadow-lavender-300 scale-105' 
      : 'bg-white text-gray-400 hover:bg-gray-50'
  }`}>
    <span className="text-[10px] font-bold mb-1 uppercase tracking-wide">{day}</span>
    <span className="text-lg font-extrabold">{date}</span>
  </div>
);

// --- Splash Screen Component ---

const SplashScreen = () => {
  // Randomize confetti positions
  const confettiItems = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${3 + Math.random() * 2}s`,
    icon: ['🍎', '🥑', '🥦', '💧', '🥩', '🥗', '🏋️', '💖', '✨'][Math.floor(Math.random() * 9)],
    size: `${1.5 + Math.random() * 2}rem`
  }));

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] flex flex-col items-center justify-center overflow-hidden font-sans">
       {/* Floating Confetti */}
       {confettiItems.map((item) => (
         <div 
            key={item.id}
            className="absolute animate-float-up opacity-0"
            style={{
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
              fontSize: item.size,
              bottom: '-50px' 
            }}
         >
           {item.icon}
         </div>
       ))}

       <div className="relative z-10 flex flex-col items-center mb-12 animate-fade-in-up">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-lavender-100 to-white opacity-50"></div>
             <span className="text-5xl">🥗</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Daily Food Scan</h1>
          <p className="text-gray-400 font-bold text-sm mt-2 tracking-wide">Your personal nutrition buddy</p>
       </div>

       {/* Running Animation */}
       <div className="w-full max-w-xs h-2 bg-gray-100 rounded-full relative overflow-hidden mt-8">
          <div className="absolute top-0 left-0 h-full w-full">
             <div className="w-full h-full bg-lavender-100 absolute"></div>
             {/* Running Character */}
             <div className="absolute top-[-20px] left-0 animate-run-across w-full h-full">
                <div className="w-8 h-8 text-2xl transform -translate-y-1">🏃💨</div>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- Calendar Modal Component ---

const CalendarModal = ({ isOpen, onClose, currentMonth, onDateSelect, dayStats, allMeals }: { 
  isOpen: boolean; 
  onClose: () => void; 
  currentMonth: string;
  onDateSelect: (date: number) => void;
  dayStats: DayStats[];
  allMeals: Meal[];
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  if (!isOpen) return null;

  // Helper to group meals by date for List View
  const getMealsByDate = () => {
    const groups: { [key: string]: Meal[] } = {};
    allMeals.forEach(meal => {
      const dateKey = meal.timestamp.toLocaleDateString('en-US'); // Use generic key
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(meal);
    });
    
    // Sort keys (Dates) descending
    const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return sortedKeys.map(key => ({
      date: new Date(key),
      meals: groups[key]
    }));
  };

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up">
       <div 
         className="absolute inset-0" 
         onClick={onClose}
       ></div>
       <div className={`bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 transition-all duration-300 ${viewMode === 'list' ? 'h-[85vh]' : 'h-auto sm:h-auto'}`}>
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-20 pb-2 border-b border-gray-50">
             <div>
                <h2 className="text-2xl font-extrabold text-gray-800">{viewMode === 'grid' ? currentMonth : 'ประวัติการกิน'}</h2>
                <p className="text-gray-400 text-xs font-bold">{viewMode === 'grid' ? 'เลือกวันที่เพื่อดูรายละเอียด' : 'รายการอาหารย้อนหลัง'}</p>
             </div>
             
             <div className="flex items-center space-x-2">
                <div className="bg-gray-100 p-1 rounded-xl flex">
                   <button 
                     onClick={() => setViewMode('grid')}
                     className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-lavender-500' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     <GridIcon className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => setViewMode('list')}
                     className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-lavender-500' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     <ListIcon className="w-4 h-4" />
                   </button>
                </div>
                <button onClick={onClose} className="p-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <XIcon className="w-5 h-5 text-gray-500" />
                </button>
             </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto no-scrollbar h-full max-h-[60vh] sm:max-h-[65vh]">
            
            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="animate-fade-in-up">
                <div className="grid grid-cols-7 mb-4">
                  {daysOfWeek.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                  <div className="col-span-2"></div> 
                  {days.map(day => {
                    const stat = dayStats.find(s => s.date === day);
                    let barColor = 'bg-gray-100';
                    let textColor = 'text-gray-300';
                    let label = '-';
                    
                    if (stat?.status === 'good') {
                      barColor = 'bg-green-100';
                      textColor = 'text-green-600';
                      label = `${stat.calories}`;
                    } else if (stat?.status === 'ok') {
                      barColor = 'bg-lavender-100';
                      textColor = 'text-lavender-600';
                      label = `${stat.calories}`;
                    } else if (stat?.status === 'bad') {
                      barColor = 'bg-orange-100';
                      textColor = 'text-orange-500';
                      label = `${stat.calories}`;
                    }

                    return (
                      <div 
                        key={day} 
                        onClick={() => { onDateSelect(day); onClose(); }}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                          <span className="text-sm font-bold text-gray-700 mb-1 group-hover:scale-110 transition-transform">{day}</span>
                          <div className={`w-full h-5 rounded-md flex items-center justify-center text-[8px] font-extrabold ${barColor} ${textColor} transition-all`}>
                            {stat?.status !== 'none' ? label : ''}
                          </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-center space-x-4 pb-4">
                  <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span><span className="text-[10px] text-gray-500">สุขภาพดี</span></div>
                  <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-lavender-400 mr-1"></span><span className="text-[10px] text-gray-500">ปกติ</span></div>
                  <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-400 mr-1"></span><span className="text-[10px] text-gray-500">สูง</span></div>
                </div>
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="space-y-6 animate-fade-in-up pb-12">
                {getMealsByDate().map((group, idx) => (
                   <div key={idx} className="flex items-start">
                      {/* Left: Date */}
                      <div className="w-16 shrink-0 flex flex-col items-center pt-2">
                         <span className="text-2xl font-extrabold text-gray-800">{group.date.getDate()}</span>
                         <span className="text-xs font-bold text-gray-400 uppercase">{group.date.toLocaleDateString('th-TH', { weekday: 'short'})}</span>
                      </div>
                      
                      {/* Right: Meals Timeline */}
                      <div className="flex-1 border-l-2 border-gray-100 pl-4 pb-6 space-y-3 relative">
                         <div className="absolute top-3 -left-[5px] w-2 h-2 rounded-full bg-gray-300"></div>
                         {group.meals.map(meal => (
                            <div key={meal.id} className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-50 items-center hover:shadow-md transition-shadow">
                               <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                  <img src={meal.image} alt={meal.foodName} className="w-full h-full object-cover" />
                               </div>
                               <div className="ml-3 flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-gray-800 truncate">{meal.foodName}</h4>
                                  <p className="text-[10px] text-gray-400 font-bold">{meal.type}</p>
                               </div>
                               <div className="flex flex-col items-end px-2">
                                  <span className="text-xs font-extrabold text-lavender-500 flex items-center">
                                    {meal.calories} 
                                  </span>
                                  <span className="text-[8px] text-gray-300 font-bold">kcal</span>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                ))}
                
                {allMeals.length === 0 && (
                   <div className="text-center py-10 text-gray-400">
                      ไม่พบประวัติการกิน
                   </div>
                )}
              </div>
            )}

          </div>
       </div>
    </div>
  );
}

// --- Chart Components ---

const LineChart = ({ data, color = "#8b5cf6" }: { data: number[], color?: string }) => {
  const height = 120;
  const width = 300;
  const max = Math.max(...data, 1);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / max) * (height - 40) - 20; 
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-hidden py-2">
      <svg viewBox={`-5 -5 ${width + 10} ${height + 10}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path 
          d={`M 0,${height} ${points.split(' ').map((p, i) => `L ${p}`).join(' ')} L ${width},${height} Z`} 
          fill="url(#gradient)" 
        />
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {data.map((val, i) => {
           const x = (i / (data.length - 1)) * width;
           const y = height - (val / max) * (height - 40) - 20;
           return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2.5" />;
        })}
      </svg>
      <div className="flex justify-between mt-2 px-1">
         {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].slice(0, data.length).map((d, i) => (
           <span key={i} className="text-[10px] text-gray-400 font-bold">{d}</span>
         ))}
      </div>
    </div>
  );
};

const DonutChart = () => {
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { color: '#3b82f6', percent: 45, label: 'คาร์บ' },
    { color: '#8b5cf6', percent: 30, label: 'โปรตีน' },
    { color: '#fb923c', percent: 25, label: 'ไขมัน' },
  ];
  let offset = 0;

  return (
    <div className="flex items-center justify-center space-x-4 sm:space-x-6">
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90 overflow-visible">
          {segments.map((seg, i) => {
            const dashArray = `${(circumference * seg.percent) / 100} ${circumference}`;
            const dashOffset = -offset;
            offset += (circumference * seg.percent) / 100;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute text-center">
           <span className="block text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wide">รวม</span>
           <span className="block text-xl sm:text-2xl font-extrabold text-gray-800">100%</span>
        </div>
      </div>
      <div className="flex flex-col space-y-3">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: seg.color }}></div>
            <span className="text-xs font-bold text-gray-500 w-12">{seg.label}</span>
            <span className="text-xs font-extrabold text-gray-800">{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Views ---

const HomeView = ({ 
  meals, 
  calendarDays,
  waterCurrent,
  waterGoal,
  currentDate,
  onDateSelect,
  onCalendarOpen,
  onProfileClick,
  onScanClick,
  onWaterAdd,
  onWaterClick,
  onCoachClick
}: { 
  meals: Meal[], 
  calendarDays: CalendarDay[],
  waterCurrent: number,
  waterGoal: number,
  currentDate: Date,
  onDateSelect: (date: number) => void,
  onCalendarOpen: () => void,
  onProfileClick: () => void,
  onScanClick: () => void,
  onWaterAdd: (amount: number) => void,
  onWaterClick: () => void,
  onCoachClick: () => void
}) => {
  
  // Stack Cards Data
  const stackedItems = [
    {
      id: 'daily-scan',
      className: 'bg-gradient-to-br from-lavender-100 to-purple-50',
      content: (
        <div className="relative h-full w-full p-6 flex items-center justify-between group overflow-hidden">
          <div className="relative z-10 max-w-[60%]">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-extrabold text-purple-600 uppercase tracking-wide shadow-sm">Daily Scan</span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 leading-tight mb-2">ติดตามอาหาร<br/>ของคุณวันนี้</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); onScanClick(); }}
              className="mt-2 bg-white text-purple-600 px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center"
            >
              <CameraIcon className="w-3 h-3 mr-1.5" />
              สแกนเลย
            </button>
          </div>
          <div className="text-[5rem] relative z-10 drop-shadow-2xl filter saturate-100 transform rotate-12 translate-y-2 group-hover:scale-110 transition-transform duration-500">
              🥗
          </div>
          <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-purple-200 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -left-4 -top-8 w-24 h-24 bg-white rounded-full opacity-60 blur-2xl"></div>
        </div>
      )
    },
    {
      id: 'hydration',
      className: 'bg-gradient-to-br from-babyblue-100 to-blue-50',
      content: (
        <div className="relative h-full w-full p-6 flex items-center justify-between group overflow-hidden">
           <div className="relative z-10 max-w-[65%]">
             <div className="flex items-center space-x-2 mb-2">
               <span className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-extrabold text-blue-500 uppercase tracking-wide shadow-sm">Hydration</span>
             </div>
             <h2 className="text-xl font-extrabold text-gray-800 leading-tight mb-1">ดื่มน้ำไปแล้ว</h2>
             <p className="text-3xl font-extrabold text-blue-500 mb-2">{(waterCurrent/1000).toFixed(1)} <span className="text-base text-gray-400">/ {(waterGoal/1000).toFixed(1)} L</span></p>
             <button 
              onClick={(e) => { e.stopPropagation(); onWaterClick(); }}
              className="bg-white text-blue-500 px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center"
            >
              <WaterDropIcon className="w-3 h-3 mr-1.5" />
              บันทึกเพิ่ม
            </button>
           </div>
           <div className="text-[4.5rem] relative z-10 drop-shadow-2xl transform -rotate-6 group-hover:scale-110 transition-transform duration-500">
               💧
           </div>
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-200 rounded-full opacity-40 blur-3xl"></div>
        </div>
      )
    },
    {
      id: 'coach',
      className: 'bg-gradient-to-br from-peach-100 to-orange-50',
      content: (
        <div className="relative h-full w-full p-6 flex items-center justify-between group overflow-hidden">
           <div className="relative z-10 max-w-[60%]">
             <div className="flex items-center space-x-2 mb-2">
               <span className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-extrabold text-orange-500 uppercase tracking-wide shadow-sm">AI Coach</span>
             </div>
             <h2 className="text-xl font-extrabold text-gray-800 leading-tight mb-2">ถามเคล็ดลับ<br/>สุขภาพ</h2>
             <button 
              onClick={(e) => { e.stopPropagation(); onCoachClick(); }}
              className="mt-2 bg-white text-orange-500 px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center"
            >
              <ChatBubbleIcon className="w-3 h-3 mr-1.5" />
              คุยกับโค้ช
            </button>
           </div>
           <div className="text-[4.5rem] relative z-10 drop-shadow-2xl transform rotate-6 group-hover:scale-110 transition-transform duration-500">
               🥑
           </div>
           <div className="absolute left-1/2 top-1/2 w-32 h-32 bg-orange-200 rounded-full opacity-40 blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      )
    }
  ];

  return (
  <PageTransition>
    <div className="px-6 pt-12 pb-6 bg-white rounded-b-[2.5rem] shadow-sm z-10">
      <div className="flex justify-between items-start mb-6">
        <div>
          <button 
            onClick={onCalendarOpen}
            className="flex items-center text-gray-400 text-xs font-bold mb-1 uppercase tracking-wide hover:text-lavender-500 transition-colors"
          >
            {currentDate.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
            <ChevronDownIcon className="w-3 h-3 ml-1" />
          </button>
          <h1 className="text-3xl font-extrabold text-gray-800">สวัสดี, Sandra! <span className="inline-block animate-bounce">👋</span></h1>
        </div>
        <button 
          onClick={onProfileClick}
          className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden border-[3px] border-white shadow-md hover:scale-105 transition-transform"
        >
          <img src="https://picsum.photos/id/64/100/100" alt="Profile" className="w-full h-full object-cover" />
        </button>
      </div>

      <div className="flex items-center space-x-2">
         <div className="flex-1 flex justify-between overflow-x-auto no-scrollbar space-x-2 pb-2 -mx-2 px-2">
          {calendarDays.map((d, i) => (
            <DatePill key={i} {...d} onClick={() => onDateSelect(d.date)} />
          ))}
        </div>
        <div className="h-10 w-px bg-gray-100 mx-2"></div>
        <button 
           onClick={onCalendarOpen}
           className="flex flex-col items-center justify-center w-12 h-16 rounded-[1.2rem] bg-gray-50 text-lavender-400 hover:bg-lavender-50 hover:text-lavender-600 transition-colors shrink-0 pb-2"
        >
           <CalendarIcon className="w-5 h-5 mb-1" />
           <span className="text-[8px] font-bold">ปฏิทิน</span>
        </button>
      </div>
    </div>

    <main className="flex-1 overflow-y-auto px-6 pt-8 pb-32 no-scrollbar">
      
      {/* Stacked Cards Section */}
      <StackedCards items={stackedItems} />

      {/* Water Summary & Quick Add */}
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-gray-800 mb-3 px-1">ดื่มน้ำให้สดชื่น 💧</h2>
        <div className="flex space-x-4">
          <div onClick={onWaterClick} className="w-1/3 bg-white rounded-[2rem] p-4 shadow-soft flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform">
             <ProgressRing value={waterCurrent} max={waterGoal} size={60} stroke={5} color="text-blue-400" bgColor="text-blue-50" />
             <div className="mt-2 text-center">
               <span className="text-sm font-extrabold text-gray-800 block">{(waterCurrent / 1000).toFixed(1)} L</span>
               <span className="text-[10px] text-gray-400 font-bold">จาก {(waterGoal / 1000).toFixed(1)} L</span>
             </div>
          </div>
          <div className="flex-1">
            <WaterQuickAdd onAdd={onWaterAdd} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-lg font-extrabold text-gray-800">รายการอาหารวันนี้</h2>
        <button className="text-xs font-bold text-lavender-500 hover:text-lavender-600 bg-lavender-50 px-3 py-1.5 rounded-full transition-colors">ดูทั้งหมด</button>
      </div>

      <div className="flex flex-col">
        {meals.length > 0 ? (
            meals.map(meal => <MealCard key={meal.id} meal={meal} />)
        ) : (
            <div className="text-center py-10 text-gray-400 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
              <span className="text-4xl mb-2 block">🍽️</span>
              ยังไม่มีรายการอาหารสำหรับวันนี้
            </div>
        )}
      </div>
    </main>
  </PageTransition>
  );
};

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'coach';
}

const CoachPopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'สวัสดีค่ะ! โค้ชกะทิยินดีให้บริการ วันนี้ให้ช่วยคิดเมนูอะไรดีคะ? 🥗✨', sender: 'coach' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const replyText = await askDietCoach(input);
    
    const coachMsg: ChatMessage = { id: (Date.now() + 1).toString(), text: replyText, sender: 'coach' };
    setMessages(prev => [...prev, coachMsg]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 bg-white shadow-sm z-10 relative flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-mint-100 flex items-center justify-center text-xl border-2 border-white shadow-md">
                👩‍⚕️
            </div>
            <div>
                <h1 className="text-xl font-extrabold text-gray-800">โค้ชกะทิ AI</h1>
                <p className="text-[10px] font-bold text-mint-500 flex items-center">
                    <span className="w-1.5 h-1.5 bg-mint-500 rounded-full mr-1 animate-pulse"></span>
                    ออนไลน์
                </p>
            </div>
        </div>
        <button 
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 no-scrollbar bg-gray-50/50">
         {messages.map((msg) => (
             <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {msg.sender === 'coach' && <div className="w-6 h-6 rounded-full bg-mint-100 text-xs flex items-center justify-center mr-2 self-end mb-1">👩‍⚕️</div>}
                 <div className={`max-w-[75%] px-4 py-2.5 rounded-[1.2rem] shadow-sm text-sm font-medium leading-relaxed ${
                     msg.sender === 'user' 
                     ? 'bg-lavender-500 text-white rounded-tr-none' 
                     : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                 }`}>
                     {msg.text}
                 </div>
             </div>
         ))}
         {loading && (
             <div className="flex justify-start mb-4">
                 <div className="w-6 h-6 mr-2"></div>
                 <div className="bg-white px-4 py-3 rounded-[1.2rem] rounded-tl-none border border-gray-100 shadow-sm flex space-x-1">
                     <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                     <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                 </div>
             </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-100 z-30">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="bg-gray-100 p-1.5 rounded-[2rem] flex items-center"
          >
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ถามโค้ชได้เลย..." 
                className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-gray-700 font-medium placeholder-gray-400 text-sm"
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 bg-lavender-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-lavender-600 disabled:opacity-50 transition-colors shrink-0"
              >
                  <SendIcon className="w-4 h-4 ml-0.5" />
              </button>
          </form>
      </div>
    </div>
  );
};

const AnalyticsView = ({ waterData }: { waterData: number[] }) => {
  const [range, setRange] = useState<'week' | 'month' | '3months'>('week');
  const [mode, setMode] = useState<'calories' | 'water'>('calories');
  
  const calorieData = range === 'week' 
    ? [1800, 2100, 1950, 2400, 1700, 2200, 1900]
    : [2000, 1900, 2100, 1800, 2200, 2000, 1950];

  return (
    <PageTransition>
       <div className="px-6 pt-12 pb-6 bg-white rounded-b-[2.5rem] shadow-sm z-10">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">สถิติ & ภาพรวม</h1>
        
        {/* Tabs: Calorie vs Water */}
        <div className="flex space-x-2 mb-4">
            <button 
                onClick={() => setMode('calories')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'calories' ? 'bg-lavender-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
            >
                🔥 แคลอรี่
            </button>
            <button 
                onClick={() => setMode('water')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'water' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
            >
                💧 การดื่มน้ำ
            </button>
        </div>

        <div className="bg-gray-100 p-1.5 rounded-2xl flex">
           {(['week', 'month', '3months'] as const).map((r) => (
             <button 
               key={r}
               onClick={() => setRange(r)}
               className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                 range === r ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               {r === 'week' ? 'สัปดาห์' : r === 'month' ? 'เดือน' : '3 เดือน'}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 no-scrollbar">
        <Card className="mb-6">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800 text-lg">{mode === 'calories' ? 'แคลอรี่รายสัปดาห์' : 'การดื่มน้ำรายสัปดาห์'}</h3>
             <Badge color={mode === 'calories' ? 'green' : 'blue'}>{mode === 'calories' ? '-12% จากเป้า' : '4/7 วันตามเป้า'}</Badge>
           </div>
           <LineChart data={mode === 'calories' ? calorieData : waterData} color={mode === 'calories' ? '#8b5cf6' : '#3b82f6'} />
        </Card>

        {mode === 'calories' ? (
            <Card className="mb-6">
                <h3 className="font-bold text-gray-800 text-lg mb-6">สัดส่วนสารอาหาร</h3>
                <DonutChart />
            </Card>
        ) : (
            <Card className="mb-6 bg-blue-50 border-none">
                 <h3 className="font-bold text-blue-900 text-lg mb-2">เกร็ดความรู้</h3>
                 <p className="text-blue-700 text-sm leading-relaxed">คุณมักจะลืมดื่มน้ำในช่วงเย็น ลองจิบน้ำทีละนิดระหว่างพักผ่อนเพื่อสุขภาพที่ดีนะคะ 🌙</p>
            </Card>
        )}
      </div>
    </PageTransition>
  );
};

const InsightsView = () => {
  const insights: Insight[] = [
    {
        id: '1',
        type: 'warning',
        title: 'น้ำตาลสูงขึ้น',
        description: 'สัปดาห์นี้คุณทานของหวานเยอะกว่าปกติ ลองเปลี่ยนเป็นผลไม้ดูไหมคะ? 🍎',
        icon: '🍭'
    },
    {
        id: '2',
        type: 'success',
        title: 'โปรตีนถึงเป้า',
        description: 'เยี่ยมมาก! คุณทานโปรตีนครบตามเป้าหมายมา 3 วันติดแล้ว 💪',
        icon: '🥩'
    },
    {
        id: '3',
        type: 'info',
        title: 'ดื่มน้ำน้อยไปนิด',
        description: 'อย่าลืมจิบน้ำระหว่างวันให้มากขึ้นเพื่อสุขภาพที่ดีนะคะ 💧',
        icon: '🥤'
    }
  ];

  return (
      <PageTransition>
          <Header 
            title="ข้อมูลเชิงลึก" 
            subtitle="คำแนะนำเพื่อสุขภาพที่ดีของคุณ" 
            action={<div className="bg-lavender-100 text-lavender-500 p-2 rounded-xl"><LightBulbIcon className="w-6 h-6" /></div>}
          />
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 no-scrollbar">
              <div className="grid gap-2">
                  {insights.map(insight => (
                      <InsightCard key={insight.id} insight={insight} />
                  ))}
              </div>
              
              <h3 className="font-bold text-gray-800 mt-8 mb-4">แท็กอาหารที่คุณทานบ่อย</h3>
              <div className="flex flex-wrap gap-2">
                  {['โปรตีนสูง', 'คาร์บต่ำ', 'ผักเยอะ', 'น้ำตาลน้อย', 'ไฟเบอร์สูง', 'คลีน'].map((tag, i) => (
                      <Badge key={i} color="lavender" className="text-sm py-2 px-4 bg-white border border-gray-100 shadow-sm hover:bg-lavender-50 transition-colors cursor-default">
                          #{tag}
                      </Badge>
                  ))}
              </div>
          </div>
      </PageTransition>
  );
};

const HydrationView = ({ 
    waterCurrent, 
    waterGoal, 
    timeSlots,
    onAdd 
}: { 
    waterCurrent: number, 
    waterGoal: number, 
    timeSlots: TimeSlot[],
    onAdd: (amount: number) => void
}) => (
  <PageTransition>
     <Header 
        title="ดื่มน้ำ" 
        subtitle="ติดตามความชุ่มชื้นของคุณ" 
        action={<div className="bg-blue-50 text-blue-500 p-2 rounded-xl"><WaterDropIcon className="w-6 h-6" /></div>}
     />
     <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 no-scrollbar">
         {/* Main Ring */}
         <div className="flex flex-col items-center justify-center mb-8">
             <div className="relative">
                 <div className="absolute inset-0 bg-blue-200 rounded-full blur-2xl opacity-30"></div>
                 <ProgressRing value={waterCurrent} max={waterGoal} size={180} stroke={12} color="text-blue-400" bgColor="text-blue-50" />
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-4xl font-extrabold text-blue-600">{waterCurrent}</span>
                     <span className="text-sm font-bold text-blue-300 uppercase">ml</span>
                     <span className="text-xs font-bold text-gray-400 mt-2">เป้าหมาย {waterGoal} ml</span>
                 </div>
             </div>
         </div>

         {/* Quick Add */}
         <WaterQuickAdd onAdd={onAdd} />

         {/* Time Slots */}
         <h3 className="text-lg font-extrabold text-gray-800 mb-4 px-1">ช่วงเวลา</h3>
         {timeSlots.map(slot => (
             <HydrationSlotCard key={slot.id} slot={slot} />
         ))}
     </div>
  </PageTransition>
);

const ProfileView = ({ waterGoal, setWaterGoal }: { waterGoal: number, setWaterGoal: (val: number) => void }) => {
  const [activity, setActivity] = useState<'sedentary' | 'active' | 'very'>('active');

  return (
    <PageTransition>
      <div className="px-6 pt-12 pb-6 bg-white rounded-b-[2.5rem] shadow-sm z-10">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
            <img src="https://picsum.photos/id/64/100/100" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">Sandra M.</h1>
            <button className="text-lavender-500 text-xs font-bold bg-lavender-50 px-3 py-1 rounded-full mt-1">แก้ไขโปรไฟล์</button>
          </div>
        </div>
        
        {/* Weight Goal Card */}
        <div className="bg-gradient-to-r from-blue-500 to-babyblue-500 rounded-[2rem] p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden transform transition-transform hover:scale-[1.02]">
           <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">น้ำหนักปัจจุบัน</p>
                <p className="text-3xl font-extrabold">65 <span className="text-lg opacity-80 font-medium">kg</span></p>
              </div>
              <div className="h-8 w-px bg-blue-300/50 mx-4"></div>
              <div>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">เป้าหมาย</p>
                <p className="text-3xl font-extrabold">60 <span className="text-lg opacity-80 font-medium">kg</span></p>
              </div>
           </div>
           <div className="mt-5 pt-4 border-t border-white/20 flex justify-between items-center relative z-10">
              <span className="text-xs font-bold text-blue-50">เป้าหมาย: 30 ต.ค.</span>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide">เหลืออีก 5 kg</div>
           </div>
           <div className="absolute -right-6 -bottom-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/5"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 no-scrollbar">
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">เป้าหมายแคลอรี่</h3>
            <span className="text-2xl font-extrabold text-lavender-500">1,800 <span className="text-sm text-gray-400 font-medium">kcal</span></span>
          </div>
          
          <div className="mb-6">
             <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wide">ระดับกิจกรรม</h4>
             <div className="flex bg-gray-50 p-1.5 rounded-2xl">
               {(['sedentary', 'active', 'very'] as const).map(lvl => (
                 <button
                   key={lvl}
                   onClick={() => setActivity(lvl)}
                   className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                     activity === lvl 
                       ? 'bg-white text-gray-800 shadow-sm border border-gray-100' 
                       : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   {lvl === 'sedentary' ? 'น้อย' : lvl === 'active' ? 'ปานกลาง' : 'มาก'}
                 </button>
               ))}
             </div>
          </div>

           <div className="flex justify-between items-center mb-2 pt-4 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center"><WaterDropIcon className="w-4 h-4 mr-2 text-blue-500"/> เป้าหมายการดื่มน้ำ</h3>
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <input 
                    type="number" 
                    value={waterGoal}
                    onChange={(e) => setWaterGoal(Number(e.target.value))}
                    className="bg-transparent w-12 text-right font-bold text-gray-700 outline-none"
                />
                <span className="text-xs text-gray-400 font-bold ml-1">ml</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 p-5 rounded-[2rem] flex flex-col items-center text-center relative overflow-hidden transition-transform hover:-translate-y-1">
             <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-200 rounded-full opacity-30 blur-xl"></div>
             <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl z-10">🔥</div>
             <span className="text-2xl font-extrabold text-gray-800 z-10">5 วัน</span>
             <span className="text-[10px] font-bold text-orange-400 mt-1 z-10 uppercase tracking-wide">ต่อเนื่อง</span>
          </div>
          <div className="bg-yellow-50 p-5 rounded-[2rem] flex flex-col items-center text-center relative overflow-hidden transition-transform hover:-translate-y-1">
             <div className="absolute -left-4 -top-4 w-16 h-16 bg-yellow-200 rounded-full opacity-30 blur-xl"></div>
             <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl z-10">⭐</div>
             <span className="text-2xl font-extrabold text-gray-800 z-10">สัปดาห์นี้</span>
             <span className="text-[10px] font-bold text-yellow-500 mt-1 z-10 uppercase tracking-wide">ดีที่สุด</span>
          </div>
        </div>

        <Card className="mb-6">
          <div className="flex items-center mb-4">
            <TrophyIcon className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="font-bold text-gray-800">เหรียญรางวัล</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {[
              { emoji: '🥗', label: 'Healthy', unlocked: true },
              { emoji: '💧', label: 'Water', unlocked: true },
              { emoji: '🏋️', label: 'Gym', unlocked: false },
              { emoji: '🥑', label: 'Keto', unlocked: false },
              { emoji: '🍎', label: 'Fruit', unlocked: true },
              { emoji: '🥕', label: 'Veggie', unlocked: false },
              { emoji: '🍳', label: 'Chef', unlocked: false },
              { emoji: '👑', label: 'King', unlocked: false },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center group cursor-pointer">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border transition-all duration-300 ${
                  badge.unlocked 
                    ? 'bg-gradient-to-b from-white to-gray-50 border-gray-100 group-hover:scale-110 group-hover:shadow-md' 
                    : 'bg-gray-50 border-transparent opacity-40 grayscale'
                }`}>
                  {badge.emoji}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'insights' | 'profile' | 'hydration'>('home');
  const [screen, setScreen] = useState<'main' | 'scanning' | 'result'>('main');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Calendar State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [dayStats, setDayStats] = useState<DayStats[]>([]);

  // --- Hydration State ---
  const [waterGoal, setWaterGoal] = useState(2500);
  const [waterCurrent, setWaterCurrent] = useState(1250);
  const [showReminder, setShowReminder] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
      { id: 'morning', label: 'เช้า', period: '06:00 - 11:00', target: 1000, current: 800, icon: '🌅', color: 'bg-orange-50 text-orange-500' },
      { id: 'afternoon', label: 'บ่าย', period: '11:00 - 17:00', target: 1000, current: 450, icon: '☀️', color: 'bg-yellow-50 text-yellow-500' },
      { id: 'evening', label: 'เย็น', period: '17:00 - 22:00', target: 500, current: 0, icon: '🌙', color: 'bg-indigo-50 text-indigo-500' }
  ]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  
  // Simulated meals database
  const [allMeals, setAllMeals] = useState<Meal[]>([
    {
      id: '1',
      type: 'มื้อเช้า',
      foodName: 'ข้าวโอ๊ตและเบอร์รี่',
      calories: 320,
      image: 'https://picsum.photos/id/493/200/200',
      timestamp: new Date(), // Today
      tags: ['โปรตีนสูง', 'ไฟเบอร์สูง']
    },
    {
      id: '2',
      type: 'มื้อเที่ยง',
      foodName: 'ขนมปังหน้าอวอคาโด',
      calories: 450,
      image: 'https://picsum.photos/id/429/200/200',
      timestamp: new Date(), // Today
      tags: ['ไขมันดี', 'มังสวิรัติ']
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Data (Calendar & History)
  useEffect(() => {
    // Simulate App Loading
    setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    const today = new Date();
    
    // 1. Generate Horizontal Days (Current Week)
    const days: CalendarDay[] = [];
    const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    for (let i = -2; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        day: weekDays[d.getDay()],
        date: d.getDate(),
        fullDate: d,
        isActive: d.getDate() === currentDate.getDate()
      });
    }
    setCalendarDays(days);

    // 2. Generate Stats for Month Grid
    const stats: DayStats[] = [];
    for (let i = 1; i <= 30; i++) {
      const rand = Math.random();
      let status: 'good' | 'ok' | 'bad' | 'none' = 'none';
      let calories = 0;
      if (i < today.getDate()) {
        if (rand > 0.7) { status = 'bad'; calories = 2200 + Math.floor(Math.random() * 500); }
        else if (rand > 0.3) { status = 'ok'; calories = 1800 + Math.floor(Math.random() * 200); }
        else { status = 'good'; calories = 1400 + Math.floor(Math.random() * 300); }
        stats.push({ date: i, calories, status });
      }
    }
    setDayStats(stats);

    // 3. Generate Mock Historical Meals for List View
    const mockMeals: Meal[] = [...allMeals];
    const foodTypes = ['มื้อเช้า', 'มื้อเที่ยง', 'มื้อเย็น', 'ของว่าง'];
    const foodExamples = [
       { name: 'สลัดอกไก่', img: 'https://picsum.photos/id/493/200/200', cal: 350 },
       { name: 'แซลมอนย่าง', img: 'https://picsum.photos/id/429/200/200', cal: 550 },
       { name: 'สมูทตี้ผลไม้', img: 'https://picsum.photos/id/1080/200/200', cal: 180 },
       { name: 'กะเพราหมูสับ', img: 'https://picsum.photos/id/292/200/200', cal: 600 },
       { name: 'โยเกิร์ต', img: 'https://picsum.photos/id/225/200/200', cal: 150 }
    ];
    
    // Create random meals for previous 10 days
    for(let i = 1; i < 10; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
        
        // Add 2-3 meals per day
        const mealsCount = 2 + Math.floor(Math.random() * 2);
        for(let j=0; j<mealsCount; j++) {
            const food = foodExamples[Math.floor(Math.random() * foodExamples.length)];
            mockMeals.push({
                id: `mock-${i}-${j}`,
                type: foodTypes[Math.floor(Math.random() * 3)], // Focus on main meals
                foodName: food.name,
                calories: food.cal + Math.floor(Math.random() * 50),
                image: food.img,
                timestamp: pastDate,
                tags: []
            });
        }
    }
    setAllMeals(mockMeals);

  }, []); // Run once on mount

  useEffect(() => {
     // Update Active State in horizontal list when current date changes
     setCalendarDays(prev => prev.map(d => ({
       ...d,
       isActive: d.date === currentDate.getDate()
     })));
  }, [currentDate]);

  // --- Handlers ---
  
  const handleDateSelect = (date: number) => {
     const newDate = new Date(currentDate);
     newDate.setDate(date);
     setCurrentDate(newDate);
  };

  const handleAddWater = (amount: number) => {
     setWaterCurrent(prev => prev + amount);
     setTimeSlots(prev => prev.map(slot => {
         if (slot.id === 'afternoon') return { ...slot, current: slot.current + amount };
         return slot;
     }));
  };

  const handleCameraClick = () => {
    setShowActionSheet(true);
  };

  const handleChooseFromGallery = () => {
    setShowActionSheet(false);
    fileInputRef.current?.click();
  };

  const handleTakePhoto = async () => {
    setShowActionSheet(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งาน");
      setShowCamera(false);
    }
  };

  const handleCloseCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        handleCloseCamera();
        setScreen('scanning');
        setSelectedImage(base64);
        const result = await analyzeFoodImage(base64);
        setAnalysis(result);
        setScreen('result');
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setScreen('scanning');
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        const result = await analyzeFoodImage(base64);
        setAnalysis(result);
        setScreen('result');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToDiary = () => {
    if (analysis && selectedImage) {
      const newMeal: Meal = {
        id: Date.now().toString(),
        type: 'ของว่าง', 
        foodName: analysis.foodName,
        calories: analysis.calories,
        image: selectedImage,
        timestamp: currentDate, // Use selected date
        tags: analysis.tags
      };
      setAllMeals([newMeal, ...allMeals]);
      setScreen('main');
      setActiveTab('home');
      setAnalysis(null);
      setSelectedImage(null);
    }
  };

  // Filter meals for current view
  const currentMeals = allMeals.filter(m => m.timestamp.getDate() === currentDate.getDate());

  // --- Render Content Logic ---

  const renderContent = () => {
    if (showCamera) {
      return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             className="absolute inset-0 w-full h-full object-cover"
           />
           <canvas ref={canvasRef} className="hidden" />
           
           <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
              <button 
                onClick={handleCloseCamera}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
              >
                <XIcon className="w-6 h-6" />
              </button>
           </div>

           <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex flex-col items-center justify-end z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent h-48">
              <button 
                onClick={handleCapture}
                className="w-20 h-20 rounded-full bg-white border-[6px] border-gray-300 shadow-2xl active:scale-95 transition-transform"
              >
              </button>
              <p className="text-white/80 text-xs font-bold mt-4">แตะเพื่อถ่ายภาพ</p>
           </div>
        </div>
      );
    }

    if (screen === 'scanning') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden font-sans bg-lavender-50">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
          
          <div className="z-10 flex flex-col items-center bg-white/40 backdrop-blur-xl p-10 rounded-[3rem] shadow-lg border border-white/50">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-lavender-400 rounded-full animate-ping opacity-20"></div>
               <div className="w-24 h-24 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin relative z-10"></div>
               <div className="absolute inset-0 flex items-center justify-center text-4xl">📸</div>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">กำลังวิเคราะห์...</h2>
            <p className="text-gray-500 font-medium">AI กำลังดูรูปอาหารของคุณ!</p>
          </div>
        </div>
      );
    }

    if (screen === 'result' && analysis) {
      return (
        <div className="flex-1 flex flex-col bg-white font-sans relative overflow-y-auto no-scrollbar">
          <div className="relative h-[45vh] w-full shrink-0 group">
             {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Scanned Food" 
                className="w-full h-full object-cover rounded-b-[3rem] shadow-soft" 
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent opacity-60"></div>
            <button 
              onClick={() => setScreen('main')}
              className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/40 transition-all border border-white/20"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 -mt-16 relative z-10 flex-1 flex flex-col pb-8">
            <Card className="text-center mb-6 border border-gray-50 !rounded-[2.5rem] !shadow-2xl" noHover={true}>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">แคลอรี่โดยประมาณ</p>
              <h1 className="text-6xl font-extrabold text-gray-800 mb-2 tracking-tight">{analysis.calories}<span className="text-xl text-gray-400 font-medium ml-1">kcal</span></h1>
              <h2 className="text-xl font-bold text-lavender-500 mb-3">{analysis.foodName}</h2>
              {analysis.tags && analysis.tags.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  {analysis.tags.map((tag, i) => (
                     <Badge key={i} color="gray" className="!bg-gray-100 !text-gray-600">{tag}</Badge>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex space-x-3 mb-8">
              <MacroCard label="คาร์บ" value={analysis.macros.carbs} unit="g" bgColor="bg-blue-50" color="text-blue-500" />
              <MacroCard label="โปรตีน" value={analysis.macros.protein} unit="g" bgColor="bg-purple-50" color="text-purple-500" />
              <MacroCard label="ไขมัน" value={analysis.macros.fat} unit="g" bgColor="bg-orange-50" color="text-orange-500" />
            </div>

            <div className="mb-32">
               <h3 className="text-lg font-extrabold text-gray-800 mb-3 px-2">รายละเอียด</h3>
               <div className="bg-gray-50 rounded-[2rem] p-6 space-y-5">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wide">ส่วนประกอบ</h4>
                    <p className="text-gray-700 font-medium leading-relaxed">
                      {analysis.ingredients.join(', ')}
                    </p>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wide">คำแนะนำ</h4>
                    <p className="text-gray-700 italic font-medium text-sm">
                      "{analysis.suggestion}"
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <div className="fixed bottom-8 left-0 right-0 px-8 max-w-md mx-auto z-30">
            <button 
              onClick={handleAddToDiary}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-full shadow-xl shadow-gray-300 hover:scale-[1.02] transition-all flex items-center justify-center group"
            >
              <span className="mr-2">บันทึกรายการ</span>
              <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         {activeTab === 'home' && (
           <HomeView 
             meals={currentMeals} 
             calendarDays={calendarDays} 
             waterCurrent={waterCurrent}
             waterGoal={waterGoal}
             currentDate={currentDate}
             onDateSelect={handleDateSelect}
             onCalendarOpen={() => setShowCalendar(true)}
             onProfileClick={() => setActiveTab('profile')} 
             onScanClick={handleCameraClick}
             onWaterAdd={handleAddWater}
             onWaterClick={() => setActiveTab('hydration')}
             onCoachClick={() => setShowCoach(true)}
           />
         )}
         {activeTab === 'analytics' && (
           <AnalyticsView waterData={[1800, 2000, 1500, 2400, 2500, 2100, 2300]} />
         )}
         {activeTab === 'insights' && (
           <InsightsView />
         )}
         {activeTab === 'profile' && (
           <ProfileView waterGoal={waterGoal} setWaterGoal={setWaterGoal} />
         )}
         {activeTab === 'hydration' && (
           <HydrationView 
              waterCurrent={waterCurrent} 
              waterGoal={waterGoal} 
              timeSlots={timeSlots}
              onAdd={handleAddWater}
           />
         )}
      </div>
    );
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans max-w-md mx-auto relative shadow-2xl flex flex-col overflow-hidden">
      
      {/* Main Content */}
      {renderContent()}

      {/* Reminder Banner */}
      {showReminder && !showCamera && screen === 'main' && (
          <ReminderBanner 
             message="ใกล้หมดเวลาช่วงบ่ายแล้ว! คุณดื่มน้ำไป 450ml จาก 1000ml ขาดอีกนิดเดียวค่ะ 💧" 
             onClose={() => setShowReminder(false)} 
          />
      )}

      {/* Floating Coach Button - Always visible unless in Camera */}
      {!showCamera && (
        <div className="absolute bottom-28 right-6 z-40">
          <button 
            onClick={() => setShowCoach(true)}
            className="group flex items-center bg-white/70 backdrop-blur-lg border border-white/80 text-gray-800 rounded-full py-2 px-3 shadow-soft-lg transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95"
          >
            <span className="font-bold text-[10px] mr-2">แชทกับบอท</span>
            <div className="w-8 h-8 bg-gradient-to-tr from-lavender-400 to-purple-400 rounded-full flex items-center justify-center text-white shadow-md">
                <ChatBubbleIcon className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Bottom Navigation - Only on Main Screen */}
      {!showCamera && screen === 'main' && (
        <div className="absolute bottom-8 left-0 right-0 px-4 z-40 flex justify-center">
          <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-[2.5rem] shadow-soft-lg border border-white/50 flex items-center justify-between w-full max-w-[360px]">
            
            {/* Home */}
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                activeTab === 'home' ? 'text-lavender-500 bg-lavender-50' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <HomeIcon className="w-6 h-6" />
            </button>

            {/* Analytics */}
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                activeTab === 'analytics' ? 'text-lavender-500 bg-lavender-50' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <ChartIcon className="w-6 h-6" />
            </button>

            {/* Center Camera Button */}
            <div className="relative -mt-12 mx-1 group">
              <div className="absolute inset-0 bg-lavender-400 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
              <button 
                onClick={handleCameraClick}
                className="relative w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 hover:rotate-3 transition-all duration-300 active:scale-95 border-[4px] border-white"
              >
                <CameraIcon className="w-7 h-7" />
              </button>
            </div>

            {/* Insights */}
            <button 
              onClick={() => setActiveTab('insights')}
              className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                activeTab === 'insights' ? 'text-lavender-500 bg-lavender-50' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <LightBulbIcon className="w-6 h-6" />
            </button>

             {/* Profile */}
             <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                activeTab === 'profile' ? 'text-lavender-500 bg-lavender-50' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <UserIcon className="w-6 h-6" />
            </button>

          </div>
        </div>
      )}

      {/* Coach Popup Overlay */}
      <CoachPopup isOpen={showCoach} onClose={() => setShowCoach(false)} />
      
      {/* Calendar Modal */}
      <CalendarModal 
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        currentMonth={currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
        onDateSelect={handleDateSelect}
        dayStats={dayStats}
        allMeals={allMeals}
      />

      {/* Action Sheet Modal */}
      {showActionSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
           <div 
             className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
             onClick={() => setShowActionSheet(false)}
           ></div>
           <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl animate-fade-in-up">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <h3 className="text-center text-lg font-extrabold text-gray-800 mb-6">เลือกวิธีการสแกน</h3>
              
              <div className="space-y-3">
                 <button 
                   onClick={handleTakePhoto}
                   className="w-full bg-lavender-50 hover:bg-lavender-100 text-lavender-500 font-bold py-4 rounded-2xl flex items-center justify-center transition-colors"
                 >
                   <CameraIcon className="w-6 h-6 mr-3" />
                   ถ่ายรูป
                 </button>
                 <button 
                   onClick={handleChooseFromGallery}
                   className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl flex items-center justify-center transition-colors"
                 >
                   <ImageIcon className="w-6 h-6 mr-3" />
                   เลือกจากอัลบั้ม
                 </button>
              </div>
              
              <button 
                 onClick={() => setShowActionSheet(false)}
                 className="w-full mt-6 py-4 text-gray-400 font-bold hover:text-gray-600"
              >
                ยกเลิก
              </button>
           </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}