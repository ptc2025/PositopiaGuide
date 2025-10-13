import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";

const BREATHING_EXERCISES = [
  {
    id: "box",
    name: "Box Breathing",
    description: "Breathe in a square pattern - great for calming down",
    steps: [
      { phase: "Breathe In", duration: 4000, color: "bg-blue-500" },
      { phase: "Hold", duration: 4000, color: "bg-purple-500" },
      { phase: "Breathe Out", duration: 4000, color: "bg-green-500" },
      { phase: "Hold", duration: 4000, color: "bg-yellow-500" },
    ],
  },
  {
    id: "478",
    name: "4-7-8 Breathing",
    description: "Dr. Weil's relaxation technique - perfect for bedtime",
    steps: [
      { phase: "Breathe In", duration: 4000, color: "bg-blue-500" },
      { phase: "Hold", duration: 7000, color: "bg-purple-500" },
      { phase: "Breathe Out", duration: 8000, color: "bg-green-500" },
    ],
  },
  {
    id: "simple",
    name: "Simple Deep Breathing",
    description: "Easy breathing for beginners - just breathe slowly",
    steps: [
      { phase: "Breathe In Slowly", duration: 5000, color: "bg-blue-500" },
      { phase: "Breathe Out Slowly", duration: 5000, color: "bg-green-500" },
    ],
  },
];

export default function Breathing() {
  const [, setLocation] = useLocation();
  const [selectedExercise, setSelectedExercise] = useState(BREATHING_EXERCISES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const currentStep = selectedExercise.steps[currentStepIndex];
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const stepProgress = (elapsed / currentStep.duration) * 100;

      if (stepProgress >= 100) {
        setCurrentStepIndex((prev) => (prev + 1) % selectedExercise.steps.length);
        setProgress(0);
      } else {
        setProgress(stepProgress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex, selectedExercise]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setProgress(0);
  };

  const handleExerciseChange = (exercise: typeof BREATHING_EXERCISES[0]) => {
    setSelectedExercise(exercise);
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setProgress(0);
  };

  const currentStep = selectedExercise.steps[currentStepIndex];
  const scale = 0.5 + (progress / 100) * 0.5;

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
            <h1 className="text-3xl font-bold">Breathing Exercises</h1>
            <p className="text-muted-foreground">Calm your mind with guided breathing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {BREATHING_EXERCISES.map((exercise) => (
            <Card
              key={exercise.id}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedExercise.id === exercise.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleExerciseChange(exercise)}
              data-testid={`exercise-${exercise.id}`}
            >
              <CardHeader>
                <CardTitle className="text-lg">{exercise.name}</CardTitle>
                <CardDescription className="text-sm">{exercise.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className={`w-48 h-48 rounded-full ${currentStep.color} transition-all duration-300 flex items-center justify-center mb-8`}
                style={{
                  transform: `scale(${scale})`,
                }}
                data-testid="breathing-circle"
              >
                <div className="text-white text-center">
                  <p className="text-2xl font-bold mb-2">{currentStep.phase}</p>
                  <p className="text-lg">
                    {Math.ceil(((currentStep.duration - (progress / 100) * currentStep.duration) / 1000))}s
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  data-testid="button-reset"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Choose a breathing exercise above</li>
              <li>Click "Start" to begin</li>
              <li>Follow the circle - breathe in when it grows, out when it shrinks</li>
              <li>Focus on the instructions and countdown</li>
              <li>Practice for 5-10 minutes for best results</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
