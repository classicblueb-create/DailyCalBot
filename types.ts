
export interface Macro {
  name: 'Carbs' | 'Protein' | 'Fat';
  value: number; // in grams
  unit: string;
  color: string;
  bgColor: string;
}

export interface FoodAnalysis {
  foodName: string;
  calories: number;
  macros: {
    carbs: number;
    protein: number;
    fat: number;
  };
  ingredients: string[];
  suggestion: string;
  tags: string[];
}

export interface Meal {
  id: string;
  type: string;
  foodName: string;
  calories: number;
  image: string; // base64 or url
  timestamp: Date;
  tags?: string[];
}

export interface CalendarDay {
  day: string;
  date: number;
  fullDate: Date;
  isActive: boolean;
}

export interface DayStats {
  date: number;
  calories: number;
  status: 'good' | 'ok' | 'bad' | 'none'; // good: low/target, ok: slight over, bad: way over
}

export interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  icon: string;
}

export interface HydrationLog {
  id: string;
  amount: number; // in ml
  timestamp: Date;
}

export interface TimeSlot {
  id: 'morning' | 'afternoon' | 'evening';
  label: string;
  period: string;
  target: number; // ml
  current: number; // ml
  icon: string; // emoji or icon name
  color: string;
}
