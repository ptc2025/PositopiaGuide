import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Sparkles, Loader2, Calendar as CalendarIcon, TrendingUp, 
  Heart, Star, Sun, Cloud, CloudRain, User, 
  ChevronLeft, ChevronRight, CalendarDays, BrainCircuit,
  Trophy, Target, Activity, Zap
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import type { EmotionCheckIn } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import duneImage from "@assets/dune-with-pinwheel-241x300_1760364974212.jpg";

// Emotion configurations without emojis
const EMOTION_CONFIG = {
  green: {
    label: "Happy",
    color: "bg-green-500",
    lightBg: "bg-green-100",
    darkBg: "dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
    icon: Sun,
    gradient: "from-green-400 to-emerald-400"
  },
  yellow: {
    label: "Unsure",
    color: "bg-yellow-500",
    lightBg: "bg-yellow-100",
    darkBg: "dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-300",
    icon: Cloud,
    gradient: "from-yellow-400 to-amber-400"
  },
  red: {
    label: "Difficult",
    color: "bg-red-500",
    lightBg: "bg-red-100",
    darkBg: "dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
    icon: CloudRain,
    gradient: "from-red-400 to-rose-400"
  }
};

// Achievement milestones
const ACHIEVEMENTS = [
  { checkIns: 7, label: "Week Warrior", icon: Star, color: "text-blue-500" },
  { checkIns: 14, label: "Fortnight Friend", icon: Heart, color: "text-purple-500" },
  { checkIns: 30, label: "Monthly Master", icon: Trophy, color: "text-amber-500" },
  { checkIns: 60, label: "Emotion Expert", icon: Zap, color: "text-emerald-500" },
];

export default function Calendar() {
  const [, setLocation] = useLocation();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChildName, setSelectedChildName] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    const childId = localStorage.getItem("selectedChildId");
    const childName = localStorage.getItem("selectedChildName");
    if (!childId) {
      setLocation("/select-profile");
    } else {
      setSelectedChildId(childId);
      setSelectedChildName(childName || "");
    }
  }, [setLocation]);

  // Fetch check-ins for the selected child
  const { data: checkIns = [], isLoading } = useQuery<EmotionCheckIn[]>({
    queryKey: [`/api/emotion-checkins?childId=${selectedChildId}`],
    enabled: !!selectedChildId,
  });

  // Mutation to get AI insights
  const insightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calendar-insights", {
        childId: selectedChildId,
        checkIns: checkIns,
      });
      const result = await response.json();
      return result.insights;
    },
    onSuccess: (insights) => {
      setAiInsights(insights);
    },
  });

  // Calendar data processing
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

  // Calculate stats
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

  // Calculate percentages for progress bars
  const totalForPercentage = stats.total || 1;
  const percentages = {
    green: Math.round((stats.green / totalForPercentage) * 100),
    yellow: Math.round((stats.yellow / totalForPercentage) * 100),
    red: Math.round((stats.red / totalForPercentage) * 100),
  };

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    const sortedCheckIns = [...checkIns].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    for (const checkIn of sortedCheckIns) {
      if (checkIn.detectedEmotion === 'green') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  // Get current achievement
  const currentAchievement = ACHIEVEMENTS.filter(a => checkIns.length >= a.checkIns).pop();
  const nextAchievement = ACHIEVEMENTS.find(a => checkIns.length < a.checkIns);

  const getDayColor = (date: Date): string | null => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayCheckIns = checkInsByDate[dateKey] || [];
    
    if (dayCheckIns.length === 0) return null;
    
    // Get the most recent check-in for the day
    const lastCheckIn = dayCheckIns[dayCheckIns.length - 1];
    return lastCheckIn.detectedEmotion;
  };

  const getDayCheckIns = (date: Date): EmotionCheckIn[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return checkInsByDate[dateKey] || [];
  };

  const handleChangeProfile = () => {
    localStorage.removeItem("selectedChildId");
    localStorage.removeItem("selectedChildName");
    setLocation("/select-profile");
  };

  const handleGetInsights = () => {
    if (checkIns.length > 0) {
      insightsMutation.mutate();
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Get day names for header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Calculate padding days for the first week
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="min-h-screen storybook-background relative overflow-hidden">
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      
      {/* Floating decorative elements */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float opacity-20"
          style={{
            left: `${20 + i * 30}%`,
            top: `${10 + i * 20}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${15 + i * 5}s`
          }}
        >
          <CalendarIcon className="w-16 h-16 text-primary" />
        </div>
      ))}
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="child-text-giant font-bold">Emotion Calendar</h1>
              <p className="child-text-medium text-muted-foreground">Track {selectedChildName}'s feelings</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {currentAchievement && (
              <Badge className="px-4 py-2 child-text-body" variant="outline">
                <currentAchievement.icon className={`w-5 h-5 mr-2 ${currentAchievement.color}`} />
                {currentAchievement.label}
              </Badge>
            )}
            <Button variant="outline" size="lg" onClick={handleChangeProfile} data-testid="button-change-profile">
              <User className="w-5 h-5 mr-2" />
              {selectedChildName}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Emotion Legend */}
            <Card className="storybook-card">
              <CardContent className="pt-6">
                <div className="flex justify-center gap-8">
                  {Object.entries(EMOTION_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="child-text-body font-semibold">{config.label}</p>
                          <p className="text-sm text-muted-foreground">{stats[key as keyof typeof stats]} days</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="storybook-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <CalendarDays className="w-8 h-8 text-primary" />
                    <span className="child-text-giant font-bold text-primary">{stats.total}</span>
                  </div>
                  <p className="child-text-body font-medium">Check-ins This Month</p>
                  <Progress value={(stats.total / 30) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="storybook-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                    <span className="child-text-giant font-bold text-green-500">{currentStreak}</span>
                  </div>
                  <p className="child-text-body font-medium">Happy Streak</p>
                  <p className="text-sm text-muted-foreground mt-1">Consecutive green days</p>
                </CardContent>
              </Card>

              <Card className="storybook-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="w-8 h-8 text-blue-500" />
                    <span className="child-text-giant font-bold text-blue-500">{percentages.green}%</span>
                  </div>
                  <p className="child-text-body font-medium">Happiness Rate</p>
                  <div className="flex gap-1 mt-2">
                    <div className={`h-2 rounded bg-green-500`} style={{width: `${percentages.green}%`}} />
                    <div className={`h-2 rounded bg-yellow-500`} style={{width: `${percentages.yellow}%`}} />
                    <div className={`h-2 rounded bg-red-500`} style={{width: `${percentages.red}%`}} />
                  </div>
                </CardContent>
              </Card>

              <Card className="storybook-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Target className="w-8 h-8 text-purple-500" />
                    <span className="child-text-giant font-bold text-purple-500">
                      {nextAchievement ? nextAchievement.checkIns - checkIns.length : 0}
                    </span>
                  </div>
                  <p className="child-text-body font-medium">To Next Badge</p>
                  {nextAchievement && (
                    <Progress 
                      value={(checkIns.length / nextAchievement.checkIns) * 100} 
                      className="mt-2"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="calendar" className="child-text-body">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="insights" className="child-text-body">
                  <BrainCircuit className="w-5 h-5 mr-2" />
                  AI Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Calendar */}
                  <div className="lg:col-span-2">
                    <Card className="storybook-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            data-testid="button-prev-month"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </Button>
                          <div className="flex items-center gap-3">
                            <CardTitle className="child-text-large">
                              {format(currentMonth, 'MMMM yyyy')}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            data-testid="button-next-month"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Day Names Header */}
                        <div className="grid grid-cols-7 gap-2 mb-4">
                          {dayNames.map(day => (
                            <div key={day} className="text-center child-text-body font-semibold text-primary">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-3">
                          {/* Padding days */}
                          {paddingDays.map((_, index) => (
                            <div key={`padding-${index}`} className="aspect-square" />
                          ))}

                          {/* Actual days */}
                          {daysInMonth.map(day => {
                            const dayColor = getDayColor(day);
                            const dayCheckIns = getDayCheckIns(day);
                            const isToday = isSameDay(day, new Date());
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const emotionConfig = dayColor ? EMOTION_CONFIG[dayColor as keyof typeof EMOTION_CONFIG] : null;

                            return (
                              <button
                                key={format(day, 'yyyy-MM-dd')}
                                onClick={() => handleDayClick(day)}
                                className={`
                                  aspect-square relative rounded-xl border-2 transition-all
                                  transform hover:scale-105 hover:shadow-lg
                                  ${isToday ? 'border-primary border-3 shadow-md' : 'border-border'}
                                  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                                  ${dayColor ? `${emotionConfig?.lightBg} ${emotionConfig?.darkBg}` : 'bg-card hover:bg-accent/20'}
                                `}
                                data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                              >
                                {/* Day number */}
                                <div className={`
                                  absolute top-2 left-2 child-text-body font-bold
                                  ${emotionConfig?.textColor || 'text-foreground'}
                                `}>
                                  {format(day, 'd')}
                                </div>

                                {/* Emotion icon */}
                                {dayColor && emotionConfig && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <emotionConfig.icon className={`w-8 h-8 ${emotionConfig.textColor}`} />
                                  </div>
                                )}

                                {/* Check-in count badge */}
                                {dayCheckIns.length > 1 && (
                                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                    {dayCheckIns.length}
                                  </div>
                                )}

                                {/* Today indicator */}
                                {isToday && (
                                  <div className="absolute top-2 right-2">
                                    <Star className="w-4 h-4 text-amber-500" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Day Details Sidebar */}
                  <div className="space-y-6">
                    {/* Dune Helper */}
                    <Card className="storybook-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <img src={duneImage} alt="Dune the Bunny" className="w-20 h-auto" />
                          <div className="flex-1">
                            <p className="child-text-body font-medium">
                              {selectedDate ? 
                                `Let's look at ${format(selectedDate, 'MMMM d')}'s feelings!` :
                                "Click on any day to see how you felt!"
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Selected Day Details */}
                    {selectedDate && (
                      <Card className="storybook-card animate-in slide-in-from-right">
                        <CardHeader>
                          <CardTitle className="child-text-medium">
                            {format(selectedDate, 'EEEE, MMMM d')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {getDayCheckIns(selectedDate).length > 0 ? (
                            <div className="space-y-4">
                              {getDayCheckIns(selectedDate).map((checkIn, index) => {
                                const config = EMOTION_CONFIG[checkIn.detectedEmotion as keyof typeof EMOTION_CONFIG];
                                const Icon = config.icon;
                                return (
                                  <div key={checkIn.id} className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                                          <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                          <p className="child-text-body font-medium">{config.label}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {format(new Date(checkIn.createdAt), 'h:mm a')}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {checkIn.feelingText && (
                                      <div className="bg-muted/30 rounded-lg p-3">
                                        <p className="child-text-body italic">"{checkIn.feelingText}"</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="child-text-body text-muted-foreground text-center py-8">
                              No check-ins on this day
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="insights">
                <Card className="storybook-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="child-text-large flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-primary" />
                        AI Insights
                      </CardTitle>
                      <Button
                        size="lg"
                        onClick={handleGetInsights}
                        disabled={checkIns.length === 0 || insightsMutation.isPending}
                        className="child-text-body"
                        data-testid="button-get-insights"
                      >
                        {insightsMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Thinking...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate Insights
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-[200px] flex items-center justify-center">
                      {aiInsights ? (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6">
                            <p className="child-text-body text-foreground whitespace-pre-wrap">{aiInsights}</p>
                          </div>
                          {/* Suggestions based on insights */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                              <CardContent className="pt-4">
                                <Sun className="w-6 h-6 text-green-600 mb-2" />
                                <p className="text-sm font-medium">Keep it up!</p>
                                <p className="text-xs text-muted-foreground">Your positive days are growing</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                              <CardContent className="pt-4">
                                <Activity className="w-6 h-6 text-blue-600 mb-2" />
                                <p className="text-sm font-medium">Stay consistent</p>
                                <p className="text-xs text-muted-foreground">Regular check-ins help track progress</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                              <CardContent className="pt-4">
                                <Heart className="w-6 h-6 text-purple-600 mb-2" />
                                <p className="text-sm font-medium">You're doing great</p>
                                <p className="text-xs text-muted-foreground">Every feeling matters</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                            <BrainCircuit className="w-12 h-12 text-primary" />
                          </div>
                          <div>
                            <p className="child-text-large font-medium">Ready to discover patterns?</p>
                            <p className="child-text-body text-muted-foreground mt-2">
                              Click "Generate Insights" to see what we've learned about {selectedChildName}'s emotions
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
        
        @keyframes slide-in-from-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-in {
          animation: slide-in-from-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}