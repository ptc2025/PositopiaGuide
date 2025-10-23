import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Heart, Users, Calendar } from "lucide-react";
import type { EmotionCheckIn, Child } from "@shared/schema";

interface DashboardStats {
  totalCheckIns: number;
  emotionBreakdown: {
    red: number;
    yellow: number;
    green: number;
  };
  childrenStats: Array<{
    child: Child;
    checkIns: number;
    lastEmotion?: string;
  }>;
  recentCheckIns: EmotionCheckIn[];
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [familyCode, setFamilyCode] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChildName, setSelectedChildName] = useState<string>("");
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const storedFamilyCode = localStorage.getItem("familyCode");
    const storedChildId = localStorage.getItem("selectedChildId");
    const storedChildName = localStorage.getItem("selectedChildName");
    
    if (!storedChildId || !storedFamilyCode) {
      setLocation("/select-profile");
    } else {
      setFamilyCode(storedFamilyCode);
      setSelectedChildId(storedChildId);
      setSelectedChildName(storedChildName || "");
      setIsAuthChecked(true);
    }
  }, [setLocation]);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard", familyCode],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard?familyCode=${familyCode}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
    enabled: !!familyCode && isAuthChecked,
  });

  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen storybook-background p-4 relative">
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <Card className="w-full max-w-md storybook-card relative z-10">
          <CardContent className="py-12 text-center">
            <p className="child-text-medium text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emotionColors: Record<string, string> = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
    general: "bg-blue-500",
  };

  const emotionLabels: Record<string, string> = {
    red: "Not Great",
    yellow: "Nervous",
    green: "Feeling Good",
    general: "General",
  };

  return (
    <div className="min-h-screen storybook-background p-4 relative">
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="child-text-giant font-bold">Family Dashboard</h1>
            <p className="child-text-medium text-muted-foreground">Track emotional well-being across all children</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        ) : !stats ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="storybook-card">
                <CardHeader className="pb-2">
                  <CardTitle className="child-text-body font-medium text-muted-foreground">
                    Total Check-ins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    <p className="child-text-giant font-bold" data-testid="text-total-checkins">
                      {stats.totalCheckIns}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="storybook-card">
                <CardHeader className="pb-2">
                  <CardTitle className="child-text-body font-medium text-muted-foreground">
                    Feeling Good
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${emotionColors.green}`} />
                    <p className="child-text-giant font-bold" data-testid="text-green-count">
                      {stats.emotionBreakdown.green}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="storybook-card">
                <CardHeader className="pb-2">
                  <CardTitle className="child-text-body font-medium text-muted-foreground">
                    Nervous
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${emotionColors.yellow}`} />
                    <p className="child-text-giant font-bold" data-testid="text-yellow-count">
                      {stats.emotionBreakdown.yellow}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="storybook-card">
                <CardHeader className="pb-2">
                  <CardTitle className="child-text-body font-medium text-muted-foreground">
                    Not Great
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${emotionColors.red}`} />
                    <p className="child-text-giant font-bold" data-testid="text-red-count">
                      {stats.emotionBreakdown.red}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Children Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Children Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.childrenStats.length === 0 ? (
                  <p className="text-muted-foreground">No children in this family yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.childrenStats.map(({ child, checkIns, lastEmotion }) => (
                      <Card key={child.id} data-testid={`child-stat-${child.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: child.avatarColor }}
                            >
                              {child.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <CardTitle className="text-base">{child.name}</CardTitle>
                              <CardDescription>{checkIns} check-ins</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        {lastEmotion && (
                          <CardContent className="pt-2">
                            <Badge variant="secondary" className="capitalize">
                              Last: {emotionLabels[lastEmotion as keyof typeof emotionLabels]}
                            </Badge>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentCheckIns.length === 0 ? (
                  <p className="text-muted-foreground">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentCheckIns.slice(0, 10).map((checkIn) => {
                      const child = stats.childrenStats.find(s => s.child.id === checkIn.childId)?.child;
                      const date = new Date(checkIn.createdAt);
                      
                      return (
                        <div 
                          key={checkIn.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover-elevate"
                          data-testid={`recent-checkin-${checkIn.id}`}
                        >
                          <div 
                            className={`w-2 h-2 rounded-full mt-2 ${emotionColors[checkIn.emotionCategory]}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{child?.name || "Unknown"}</p>
                              <Badge variant="outline" className="capitalize text-xs">
                                {emotionLabels[checkIn.emotionCategory]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {checkIn.feelingText}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
