
import React, { useState } from 'react';
import { Meal, Insight, TimeSlot } from '../types';
import { Card, Badge, ProgressBar, ProgressRing } from './Shared';
import { ChevronRightIcon, FireIcon, WaterDropIcon, GlassIcon, BottleIcon, XIcon } from './Icons';

export const MealCard = ({ meal }: { meal: Meal }) => (
  <Card className="mb-4 p-3 flex flex-col" onClick={() => {}} noHover={false}>
    <div className="flex items-center">
      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 mr-4 bg-gray-100 shadow-inner">
        <img src={meal.image} alt={meal.foodName} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="mr-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{meal.type}</p>
            <h3 className="font-bold text-gray-800 text-lg leading-tight truncate">{meal.foodName}</h3>
          </div>
          <div className="bg-orange-50 text-orange-500 px-2.5 py-1 rounded-full text-xs font-bold flex items-center shrink-0">
            <FireIcon className="w-3 h-3 mr-1" />
            {meal.calories}
          </div>
        </div>
      </div>
      <div className="ml-2 text-gray-300">
        <ChevronRightIcon className="w-5 h-5" />
      </div>
    </div>
    {/* Tags */}
    {meal.tags && meal.tags.length > 0 && (
      <div className="flex mt-3 gap-2 ml-20 overflow-x-auto no-scrollbar">
        {meal.tags.map((tag, index) => (
          <Badge key={index} color="gray">{tag}</Badge>
        ))}
      </div>
    )}
  </Card>
);

export const MacroCard = ({ label, value, unit, color, bgColor }: { label: string, value: number, unit: string, color: string, bgColor: string }) => (
  <div className={`flex-1 p-4 rounded-[2rem] flex flex-col items-center justify-center ${bgColor} ${color} transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-sm`}>
    <span className="text-[10px] font-bold uppercase opacity-70 mb-1 tracking-widest">{label}</span>
    <span className="text-xl font-extrabold">{value}<span className="text-sm font-normal ml-0.5 opacity-80">{unit}</span></span>
  </div>
);

export const InsightCard = ({ insight }: { insight: Insight }) => {
  let bgColor = 'bg-gray-50';
  let iconColor = 'text-gray-500';
  let iconBg = 'bg-white';

  if (insight.type === 'warning') {
    bgColor = 'bg-red-50';
    iconColor = 'text-red-500';
  } else if (insight.type === 'success') {
    bgColor = 'bg-green-50';
    iconColor = 'text-green-500';
  } else if (insight.type === 'info') {
    bgColor = 'bg-blue-50';
    iconColor = 'text-blue-500';
  }

  return (
    <Card className={`mb-4 ${bgColor} flex items-start space-x-4 border-none shadow-none hover:bg-opacity-80`} noHover={true}>
      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center text-2xl shrink-0 shadow-sm`}>
        {insight.icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-800 mb-1">{insight.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">{insight.description}</p>
      </div>
    </Card>
  );
};

export const StackedCards = ({ 
  items 
}: { 
  items: { 
    id: string; 
    content: React.ReactNode; 
    className?: string;
    onClick?: () => void; 
  }[] 
}) => {
  // Order tracks the visual index of each item in the items array
  const [order, setOrder] = useState(items.map((_, i) => i));

  const handleNext = () => {
    setOrder(prev => {
      const newOrder = [...prev];
      const first = newOrder.shift();
      if (first !== undefined) newOrder.push(first);
      return newOrder;
    });
  };

  return (
    // Increased container height to h-72 (approx 288px) to accommodate the vertical fan spread
    <div className="relative w-full h-72 mb-6 perspective-1000" onClick={handleNext}>
      {items.map((item, originalIndex) => {
        const currentPosition = order.indexOf(originalIndex);
        
        const isTop = currentPosition === 0;
        const isSecond = currentPosition === 1;
        const isThird = currentPosition === 2;
        
        let zIndex = 30;
        let scale = 1;
        let translateY = 0;
        let opacity = 1;
        let brightness = 1;

        if (isTop) {
           // Front card: Lower down to reveal cards behind it at the top
           zIndex = 30;
           scale = 1;
           translateY = 50; // ~5cm visual metaphor (50px down)
           opacity = 1;
           brightness = 1;
        } else if (isSecond) {
          // Middle card: Slightly higher than front
          zIndex = 20;
          scale = 0.95;
          translateY = 25; // 25px down
          opacity = 1; 
          brightness = 0.98;
        } else if (isThird) {
          // Back card: At the top
          zIndex = 10;
          scale = 0.90;
          translateY = 0; // 0px
          opacity = 1;
          brightness = 0.96;
        } else {
           // Cycling transition state
           zIndex = 0;
           scale = 0.85;
           translateY = -50; // Slide up and fade out
           opacity = 0;
        }

        return (
          <div 
            key={item.id}
            className={`absolute left-0 top-0 w-full h-56 transition-all duration-500 ease-spring cursor-pointer rounded-[2.5rem] shadow-xl border border-white/20 overflow-hidden ${item.className}`}
            style={{
              zIndex,
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              filter: `brightness(${brightness})`
            }}
          >
            {item.content}
          </div>
        );
      })}
       {/* Dots positioned at bottom of taller container */}
       <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5">
         {items.map((_, i) => (
           <div 
             key={i} 
             className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${order.indexOf(i) === 0 ? 'bg-lavender-500 w-3' : 'bg-gray-300'}`}
           ></div>
         ))}
       </div>
    </div>
  );
};

// --- Hydration Components ---

export const WaterQuickAdd = ({ onAdd }: { onAdd: (amount: number) => void }) => (
  <Card className="mb-6 p-4 bg-blue-50 border border-blue-100" noHover={true}>
     <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-blue-800 flex items-center">
          <span className="bg-white p-1.5 rounded-lg mr-2 shadow-sm"><WaterDropIcon className="w-4 h-4 text-blue-500"/></span>
          เพิ่มน้ำดื่ม
        </h3>
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Quick Add</span>
     </div>
     <div className="flex space-x-3">
        {[100, 250, 500].map((amount) => (
           <button 
             key={amount}
             onClick={() => onAdd(amount)}
             className="flex-1 bg-white hover:bg-blue-100 active:scale-95 py-3 rounded-2xl shadow-sm flex flex-col items-center justify-center transition-all duration-200 group"
           >
             <div className="text-2xl mb-1 transform group-hover:scale-110 transition-transform">
               {amount === 100 ? '🥛' : amount === 250 ? '🥤' : '🍼'}
             </div>
             <span className="text-xs font-extrabold text-blue-500">{amount} ml</span>
           </button>
        ))}
     </div>
  </Card>
);

export const HydrationSlotCard = ({ slot }: { slot: TimeSlot }) => (
  <div className="bg-white rounded-[2rem] p-5 shadow-soft mb-4 flex items-center">
     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mr-4 shrink-0 ${slot.color}`}>
        {slot.icon}
     </div>
     <div className="flex-1 mr-4">
        <div className="flex justify-between mb-1">
           <h4 className="font-bold text-gray-800">{slot.label}</h4>
           <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{slot.period}</span>
        </div>
        <ProgressBar value={slot.current} max={slot.target} color="bg-blue-400" height="h-2.5" />
        <div className="flex justify-between mt-1">
           <span className="text-xs font-bold text-gray-500">{slot.current} ml</span>
           <span className="text-xs font-bold text-gray-400">เป้า: {slot.target} ml</span>
        </div>
     </div>
     <div className="w-8 flex justify-center">
        {slot.current >= slot.target && (
           <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="3"></polyline></svg>
           </div>
        )}
     </div>
  </div>
);

export const ReminderBanner = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed bottom-24 left-4 right-4 bg-white rounded-[1.5rem] p-4 shadow-2xl border-l-4 border-blue-400 animate-fade-in-up z-50 flex items-start">
     <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 shrink-0">
        💧
     </div>
     <div className="flex-1 mr-2">
        <h4 className="font-bold text-gray-800 text-sm mb-0.5">อย่าลืมดื่มน้ำนะคะ!</h4>
        <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
        <div className="flex space-x-3 mt-2">
           <button onClick={onClose} className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100">ดื่มเลย</button>
           <button onClick={onClose} className="text-[10px] font-bold text-gray-400 px-2 py-1.5 hover:text-gray-600">ไว้ก่อน</button>
        </div>
     </div>
     <button onClick={onClose} className="text-gray-300 hover:text-gray-500">
        <XIcon className="w-4 h-4" />
     </button>
  </div>
);
