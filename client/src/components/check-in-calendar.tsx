import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import type { EmotionCheckIn } from "@shared/schema";

interface CheckInCalendarProps {
  checkIns: EmotionCheckIn[];
  onDayClick?: (date: Date, checkInsForDay: EmotionCheckIn[]) => void;
}

export function CheckInCalendar({ checkIns, onDayClick }: CheckInCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map of dates to check-ins
  const checkInsByDate = checkIns.reduce((acc, checkIn) => {
    const dateKey = format(new Date(checkIn.createdAt), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(checkIn);
    return acc;
  }, {} as Record<string, EmotionCheckIn[]>);

  // Calculate stats for the current month
  const monthCheckIns = checkIns.filter(checkIn => {
    const checkInDate = new Date(checkIn.createdAt);
    return isSameMonth(checkInDate, currentMonth);
  });

  const stats = {
    total: monthCheckIns.length,
    red: monthCheckIns.filter(c => c.detectedEmotion === 'red').length,
    yellow: monthCheckIns.filter(c => c.detectedEmotion === 'yellow').length,
    green: monthCheckIns.filter(c => c.detectedEmotion === 'green').length,
  };

  const getDayColor = (date: Date): string | null => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayCheckIns = checkInsByDate[dateKey] || [];
    
    if (dayCheckIns.length === 0) return null;
    
    // Get the most recent check-in for the day
    const lastCheckIn = dayCheckIns[dayCheckIns.length - 1];
    return lastCheckIn.detectedEmotion;
  };

  const getDayCheckInCount = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return checkInsByDate[dateKey]?.length || 0;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDayClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayCheckIns = checkInsByDate[dateKey] || [];
    if (onDayClick) {
      onDayClick(date, dayCheckIns);
    }
  };

  // Get day names for header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate padding days for the first week
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl" data-testid="text-current-month">
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Month Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Check-ins</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{stats.red}</div>
              <div className="text-sm text-muted-foreground">Red Days</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.yellow}</div>
              <div className="text-sm text-muted-foreground">Yellow Days</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.green}</div>
              <div className="text-sm text-muted-foreground">Green Days</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Padding days */}
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="aspect-square" />
            ))}

            {/* Actual days */}
            {daysInMonth.map(day => {
              const dayColor = getDayColor(day);
              const checkInCount = getDayCheckInCount(day);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={format(day, 'yyyy-MM-dd')}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`
                    aspect-square relative rounded-lg border-2 transition-all
                    ${isToday ? 'border-primary' : 'border-transparent'}
                    ${dayColor ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                    ${dayColor === 'red' ? 'bg-red-100 dark:bg-red-900/30' : ''}
                    ${dayColor === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}
                    ${dayColor === 'green' ? 'bg-green-100 dark:bg-green-900/30' : ''}
                    ${!dayColor ? 'bg-card hover:bg-accent/10' : ''}
                  `}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  {/* Day number */}
                  <div className={`
                    absolute top-1 left-2 text-sm font-medium
                    ${dayColor === 'red' ? 'text-red-700 dark:text-red-300' : ''}
                    ${dayColor === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' : ''}
                    ${dayColor === 'green' ? 'text-green-700 dark:text-green-300' : ''}
                    ${!dayColor ? 'text-foreground' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Emotion indicator dot */}
                  {dayColor && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`
                        w-3 h-3 rounded-full
                        ${dayColor === 'red' ? 'bg-red-500' : ''}
                        ${dayColor === 'yellow' ? 'bg-yellow-400' : ''}
                        ${dayColor === 'green' ? 'bg-green-500' : ''}
                      `} />
                    </div>
                  )}

                  {/* Check-in count badge */}
                  {checkInCount > 1 && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {checkInCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hover tooltip */}
      {hoveredDay && getDayCheckInCount(hoveredDay) > 0 && (
        <div className="fixed z-50 pointer-events-none" style={{
          left: '50%',
          bottom: '20px',
          transform: 'translateX(-50%)'
        }}>
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="text-sm">
                <div className="font-semibold">{format(hoveredDay, 'MMMM d, yyyy')}</div>
                <div className="text-muted-foreground">
                  {getDayCheckInCount(hoveredDay)} check-in{getDayCheckInCount(hoveredDay) > 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}