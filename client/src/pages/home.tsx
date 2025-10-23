import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Heart, AlertCircle, Settings, User, History, BarChart3, Wind, Calendar } from "lucide-react";
import type { EmotionCategory, ChildResponseContent } from "@shared/schema";
import { AudioPlayer } from "@/components/audio-player";
import { ResponseDisplay } from "@/components/response-display";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import duneImage from "@assets/dune-with-pinwheel-241x300_1760364974212.jpg";

type TrafficLightEmotion = "red" | "yellow" | "green";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChildName, setSelectedChildName] = useState<string>("");
  const [selectedEmotion, setSelectedEmotion] = useState<TrafficLightEmotion | null>(null);
  const [feelingText, setFeelingText] = useState("");
  const [responseContent, setResponseContent] = useState<ChildResponseContent | null>(null);

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

  const analyzeMutation = useMutation({
    mutationFn: async (data: { emotion: TrafficLightEmotion; text: string; childId?: string }) => {
      const response = await apiRequest(
        "POST",
        "/api/analyze-emotion",
        data
      );
      const result = await response.json();
      return result as ChildResponseContent;
    },
    onSuccess: (data) => {
      setResponseContent(data as ChildResponseContent);
      setFeelingText("");
    },
  });

  const handleEmotionClick = (emotion: TrafficLightEmotion) => {
    setSelectedEmotion(emotion);
    setResponseContent(null);
  };

  const handleSubmit = () => {
    if (selectedEmotion && feelingText.trim()) {
      analyzeMutation.mutate({
        emotion: selectedEmotion,
        text: feelingText.trim(),
        childId: selectedChildId || undefined,
      });
    }
  };

  const handleChangeProfile = () => {
    localStorage.removeItem("selectedChildId");
    localStorage.removeItem("selectedChildName");
    setLocation("/select-profile");
  };

  const handleReset = () => {
    setSelectedEmotion(null);
    setFeelingText("");
    setResponseContent(null);
  };

  return (
    <div className="min-h-screen storybook-background relative">
      {/* Animated Clouds */}
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header with Admin and Profile Switch */}
        <div className="flex justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={handleChangeProfile} data-testid="button-change-profile">
            <User className="w-4 h-4 mr-2" />
            {selectedChildName}
          </Button>
          <div className="flex gap-2">
            <Link href="/breathing">
              <Button variant="ghost" size="sm" data-testid="button-breathing-link">
                <Wind className="w-4 h-4 mr-2" />
                Breathe
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" data-testid="button-calendar-link">
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" size="sm" data-testid="button-history-link">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-dashboard-link">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-testid="button-admin-link">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Header with Dune */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src={duneImage}
              alt="Dune the Bunny"
              className="w-32 h-auto"
              data-testid="img-dune-character"
            />
          </div>
          <h1 className="child-text-giant text-foreground mb-3" data-testid="text-app-title">
            Positopia Companion
          </h1>
          <p className="child-text-large text-muted-foreground" data-testid="text-app-subtitle">
            How are you feeling today?
          </p>
        </div>

        {!selectedEmotion ? (
          /* Traffic Light Selection */
          <div className="flex flex-col items-center">
            <div className="traffic-light-container">
              <div className="flex flex-col items-center gap-4">
                {/* Red Light */}
                <button
                  onClick={() => handleEmotionClick("red")}
                  className="traffic-light-button red flex items-center justify-center"
                  data-testid="button-emotion-red"
                  aria-label="Red - Angry, Sad, or Frustrated"
                >
                  <span className="text-4xl">😟</span>
                </button>

                {/* Yellow Light */}
                <button
                  onClick={() => handleEmotionClick("yellow")}
                  className="traffic-light-button yellow flex items-center justify-center"
                  data-testid="button-emotion-yellow"
                  aria-label="Yellow - Worried, Scared, or Unsure"
                >
                  <span className="text-4xl">😐</span>
                </button>

                {/* Green Light */}
                <button
                  onClick={() => handleEmotionClick("green")}
                  className="traffic-light-button green flex items-center justify-center"
                  data-testid="button-emotion-green"
                  aria-label="Green - Happy, Calm, or Excited"
                >
                  <span className="text-4xl">😊</span>
                </button>
              </div>
              <div className="traffic-light-pole"></div>
            </div>
          </div>
        ) : !responseContent ? (
          /* Feeling Input */
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-prompt">
                  Tell me what's going on...
                </h2>
                <p className="text-muted-foreground">
                  Share your feelings in your own words
                </p>
              </div>

              <Textarea
                value={feelingText}
                onChange={(e) => setFeelingText(e.target.value)}
                placeholder="I feel..."
                className="min-h-32 text-lg resize-none"
                disabled={analyzeMutation.isPending}
                data-testid="input-feeling-text"
              />

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={!feelingText.trim() || analyzeMutation.isPending}
                  size="lg"
                  className="flex-1 text-lg"
                  data-testid="button-submit-feeling"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Understanding...
                    </>
                  ) : (
                    "Share My Feelings"
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  disabled={analyzeMutation.isPending}
                  data-testid="button-cancel"
                >
                  Back
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* Response Display */
          <div className="max-w-3xl mx-auto">
            <ResponseDisplay content={responseContent} />

            <div className="flex justify-center mt-8">
              <Button
                onClick={handleReset}
                size="lg"
                className="text-lg"
                data-testid="button-reset"
              >
                Check In Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
