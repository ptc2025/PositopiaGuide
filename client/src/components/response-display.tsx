import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CombinedAudioPlayer } from "@/components/combined-audio-player";
import { Sparkles, Activity, Laugh } from "lucide-react";
import type { ChildResponseContent } from "@shared/schema";

interface ResponseDisplayProps {
  content: ChildResponseContent;
}

export function ResponseDisplay({ content }: ResponseDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Combined Audio Player for music and affirmation */}
      {(content.audio || content.affirmation) && (
        <div data-testid="section-combined-audio">
          <CombinedAudioPlayer 
            audioFile={content.audio} 
            affirmation={content.affirmation}
          />
        </div>
      )}

      {/* Affirmation Text Display */}
      {content.affirmation && (
        <Card data-testid="card-affirmation">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" />
              <span>A Positive Thought for You</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl text-card-foreground italic" data-testid="text-affirmation">
              "{content.affirmation.text}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Activity */}
      {content.activity && (
        <Card data-testid="card-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              <span>Try This Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold text-lg mb-2" data-testid="text-activity-title">
              {content.activity.title}
            </h4>
            <p className="text-card-foreground" data-testid="text-activity-description">
              {content.activity.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Joke */}
      {content.joke && (
        <Card data-testid="card-joke">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laugh className="w-6 h-6 text-accent" />
              <span>Here's Something Funny</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-card-foreground" data-testid="text-joke">
              {content.joke.text}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!content.audio && !content.affirmation && !content.activity && !content.joke && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              I'm still learning! Ask an adult to add more content for me.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
