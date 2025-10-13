import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Heart, Smile, Frown } from "lucide-react";
import type { EmotionCheckIn } from "@shared/schema";

const emotionColors = {
  red: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200",
  yellow: "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200",
  green: "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200",
};

const emotionIcons = {
  red: Frown,
  yellow: Heart,
  green: Smile,
};

export default function History() {
  const [, setLocation] = useLocation();
  const childId = localStorage.getItem("selectedChildId");
  const childName = localStorage.getItem("selectedChildName");

  const { data: checkIns = [], isLoading } = useQuery<EmotionCheckIn[]>({
    queryKey: ["/api/emotion-checkins", childId],
    queryFn: async () => {
      const response = await fetch(`/api/emotion-checkins?childId=${childId}`);
      if (!response.ok) throw new Error("Failed to fetch check-ins");
      return response.json();
    },
    enabled: !!childId,
  });

  if (!childId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Profile Selected</CardTitle>
            <CardDescription>Please select a child profile first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")}
              className="w-full"
              data-testid="button-go-home"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold">{childName}'s Emotion History</h1>
            <p className="text-muted-foreground">Track your emotional journey</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : checkIns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No emotion check-ins yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start sharing your feelings to build your history!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {checkIns.map((checkIn) => {
              const EmotionIcon = emotionIcons[checkIn.emotion];
              const date = new Date(checkIn.timestamp);
              
              return (
                <Card key={checkIn.id} data-testid={`checkin-${checkIn.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${emotionColors[checkIn.emotion]}`}>
                          <EmotionIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg capitalize">
                            {checkIn.emotion} Zone
                          </CardTitle>
                          <CardDescription>
                            {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {checkIn.emotion}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{checkIn.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
