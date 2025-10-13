import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Heart, AlertCircle, Settings } from "lucide-react";
import type { EmotionCategory, ChildResponseContent } from "@shared/schema";
import { AudioPlayer } from "@/components/audio-player";
import { ResponseDisplay } from "@/components/response-display";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import duneImage from "@assets/dune-with-pinwheel-241x300_1760364974212.jpg";

type TrafficLightEmotion = "red" | "yellow" | "green";

export default function Home() {
  const [selectedEmotion, setSelectedEmotion] = useState<TrafficLightEmotion | null>(null);
  const [feelingText, setFeelingText] = useState("");
  const [responseContent, setResponseContent] = useState<ChildResponseContent | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { emotion: TrafficLightEmotion; text: string }) => {
      const result = await apiRequest<ChildResponseContent>(
        "POST",
        "/api/analyze-emotion",
        data
      );
      return result;
    },
    onSuccess: (data) => {
      setResponseContent(data);
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
      });
    }
  };

  const handleReset = () => {
    setSelectedEmotion(null);
    setFeelingText("");
    setResponseContent(null);
  };

  const emotionLabels = {
    red: "Not Great",
    yellow: "Nervous",
    green: "Feeling Good",
  };

  const emotionDescriptions = {
    red: "Angry, Sad, or Frustrated",
    yellow: "Worried, Scared, or Unsure",
    green: "Happy, Calm, or Excited",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Admin Link */}
        <div className="flex justify-end mb-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-admin-link">
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </Link>
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
          <h1 className="text-4xl font-bold text-foreground mb-3" data-testid="text-app-title">
            Positopia Companion
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-app-subtitle">
            How are you feeling today?
          </p>
        </div>

        {!selectedEmotion ? (
          /* Traffic Light Selection */
          <div className="flex flex-col items-center gap-8">
            <Card className="p-8 max-w-md w-full">
              <div className="flex flex-col gap-6">
                <Button
                  size="lg"
                  onClick={() => handleEmotionClick("red")}
                  className="h-24 text-2xl font-bold bg-traffic-red hover:bg-traffic-red text-traffic-red-foreground hover-elevate active-elevate-2"
                  data-testid="button-emotion-red"
                >
                  <div className="flex flex-col items-center gap-1">
                    <AlertCircle className="w-8 h-8" />
                    <span>{emotionLabels.red}</span>
                    <span className="text-sm font-normal opacity-90">
                      {emotionDescriptions.red}
                    </span>
                  </div>
                </Button>

                <Button
                  size="lg"
                  onClick={() => handleEmotionClick("yellow")}
                  className="h-24 text-2xl font-bold bg-traffic-yellow hover:bg-traffic-yellow text-traffic-yellow-foreground hover-elevate active-elevate-2"
                  data-testid="button-emotion-yellow"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Sparkles className="w-8 h-8" />
                    <span>{emotionLabels.yellow}</span>
                    <span className="text-sm font-normal opacity-90">
                      {emotionDescriptions.yellow}
                    </span>
                  </div>
                </Button>

                <Button
                  size="lg"
                  onClick={() => handleEmotionClick("green")}
                  className="h-24 text-2xl font-bold bg-traffic-green hover:bg-traffic-green text-traffic-green-foreground hover-elevate active-elevate-2"
                  data-testid="button-emotion-green"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Heart className="w-8 h-8" />
                    <span>{emotionLabels.green}</span>
                    <span className="text-sm font-normal opacity-90">
                      {emotionDescriptions.green}
                    </span>
                  </div>
                </Button>
              </div>
            </Card>
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
