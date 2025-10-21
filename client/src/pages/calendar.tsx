import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckInCalendar } from "@/components/check-in-calendar";
import { Home, Sparkles, Loader2, ArrowLeft, BrainCircuit } from "lucide-react";
import { format } from "date-fns";
import type { EmotionCheckIn } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Calendar() {
  const [, setLocation] = useLocation();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChildName, setSelectedChildName] = useState<string>("");
  const [selectedDayCheckIns, setSelectedDayCheckIns] = useState<EmotionCheckIn[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

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

  const handleDayClick = (date: Date, checkInsForDay: EmotionCheckIn[]) => {
    setSelectedDate(date);
    setSelectedDayCheckIns(checkInsForDay);
  };

  const handleGetInsights = () => {
    if (checkIns.length > 0) {
      insightsMutation.mutate();
    }
  };

  const handleChangeProfile = () => {
    localStorage.removeItem("selectedChildId");
    localStorage.removeItem("selectedChildName");
    setLocation("/select-profile");
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'red': return 'text-red-500';
      case 'yellow': return 'text-yellow-500';
      case 'green': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Check-In Calendar</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleChangeProfile}>
            {selectedChildName}'s Calendar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <CheckInCalendar 
                checkIns={checkIns} 
                onDayClick={handleDayClick}
              />
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5" />
                      AI Insights
                    </span>
                    <Button
                      size="sm"
                      onClick={handleGetInsights}
                      disabled={checkIns.length === 0 || insightsMutation.isPending}
                      data-testid="button-get-insights"
                    >
                      {insightsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiInsights ? (
                    <div className="text-sm space-y-2">
                      <p className="text-card-foreground">{aiInsights}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click "Generate" to get AI-powered insights about {selectedChildName}'s emotional patterns.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Selected Day Details */}
              {selectedDate && selectedDayCheckIns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {format(selectedDate, 'MMMM d, yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedDayCheckIns.map((checkIn, index) => (
                        <div key={checkIn.id} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Check-in #{index + 1}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(checkIn.createdAt), 'h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              checkIn.detectedEmotion === 'red' ? 'bg-red-500' :
                              checkIn.detectedEmotion === 'yellow' ? 'bg-yellow-400' :
                              'bg-green-500'
                            }`} />
                            <span className={`text-sm font-medium ${getEmotionColor(checkIn.detectedEmotion)}`}>
                              {checkIn.detectedEmotion === 'red' ? 'Difficult' :
                               checkIn.detectedEmotion === 'yellow' ? 'Unsure' :
                               'Good'}
                            </span>
                          </div>
                          <p className="text-sm text-card-foreground italic">
                            "{checkIn.feelingText}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Check-ins</span>
                      <span className="text-sm font-bold">{checkIns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Most Common</span>
                      <span className="text-sm font-bold">
                        {checkIns.length > 0 ? (() => {
                          const counts: Record<string, number> = { red: 0, yellow: 0, green: 0 };
                          checkIns.forEach(c => {
                            if (c.detectedEmotion in counts) {
                              counts[c.detectedEmotion]++;
                            }
                          });
                          const max = Math.max(counts.red, counts.yellow, counts.green);
                          if (counts.green === max) return '🟢 Green';
                          if (counts.yellow === max) return '🟡 Yellow';
                          return '🔴 Red';
                        })() : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Streak</span>
                      <span className="text-sm font-bold">
                        {checkIns.length > 0 ? (() => {
                          // Calculate current streak of green days
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
                          return streak > 0 ? `${streak} green` : '0';
                        })() : '0'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}