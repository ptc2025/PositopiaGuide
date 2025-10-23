import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX, 
  Sparkles, Wind, Flower2, Waves, Heart, Timer, Settings,
  Star, Award, TrendingUp, Zap
} from "lucide-react";
import duneImage from "@assets/dune.webp";

// Breathing patterns with more customization
const BREATHING_PATTERNS = [
  {
    id: "calm",
    name: "Calm & Easy",
    icon: Heart,
    description: "Perfect for beginners",
    difficulty: "Beginner",
    steps: [
      { phase: "Breathe In", duration: 3000, color: "from-blue-400 to-cyan-400", instruction: "Fill your belly like a balloon!" },
      { phase: "Breathe Out", duration: 3000, color: "from-green-400 to-emerald-400", instruction: "Let all the air out slowly..." },
    ],
  },
  {
    id: "box",
    name: "Box Breathing",
    icon: Wind,
    description: "Great for focus",
    difficulty: "Intermediate",
    steps: [
      { phase: "Breathe In", duration: 4000, color: "from-blue-400 to-blue-500", instruction: "Breathe in through your nose" },
      { phase: "Hold", duration: 4000, color: "from-purple-400 to-purple-500", instruction: "Hold that breath!" },
      { phase: "Breathe Out", duration: 4000, color: "from-green-400 to-green-500", instruction: "Breathe out through your mouth" },
      { phase: "Hold", duration: 4000, color: "from-amber-400 to-orange-400", instruction: "Wait before breathing in" },
    ],
  },
  {
    id: "478",
    name: "Sleepy Time",
    icon: Star,
    description: "For bedtime relaxation",
    difficulty: "Advanced",
    steps: [
      { phase: "Breathe In", duration: 4000, color: "from-indigo-400 to-blue-500", instruction: "Count to 4 as you breathe in" },
      { phase: "Hold", duration: 7000, color: "from-purple-500 to-purple-600", instruction: "Hold for 7 counts" },
      { phase: "Breathe Out", duration: 8000, color: "from-blue-600 to-indigo-700", instruction: "Slowly breathe out for 8" },
    ],
  },
  {
    id: "energy",
    name: "Energy Boost",
    icon: Zap,
    description: "Wake up your body",
    difficulty: "Beginner",
    steps: [
      { phase: "Quick In", duration: 2000, color: "from-yellow-400 to-orange-400", instruction: "Quick breath in!" },
      { phase: "Quick Out", duration: 2000, color: "from-orange-400 to-red-400", instruction: "Quick breath out!" },
    ],
  },
];

// Visualization themes
const VISUALIZATIONS = [
  {
    id: "balloon",
    name: "Balloon",
    icon: "🎈",
    description: "Watch the balloon grow and shrink",
  },
  {
    id: "flower",
    name: "Flower",
    icon: "🌸",
    description: "A flower blooming and closing",
  },
  {
    id: "ocean",
    name: "Ocean Wave",
    icon: "🌊",
    description: "Waves flowing in and out",
  },
  {
    id: "butterfly",
    name: "Butterfly",
    icon: "🦋",
    description: "Butterfly wings opening and closing",
  },
];

// Achievement milestones
const ACHIEVEMENTS = [
  { sessions: 1, badge: "First Breath", icon: Star, color: "text-yellow-500" },
  { sessions: 5, badge: "Steady Breather", icon: Wind, color: "text-blue-500" },
  { sessions: 10, badge: "Calm Master", icon: Heart, color: "text-red-500" },
  { sessions: 25, badge: "Zen Expert", icon: Sparkles, color: "text-purple-500" },
  { sessions: 50, badge: "Breathing Champion", icon: Award, color: "text-amber-500" },
];

export default function Breathing() {
  const [, setLocation] = useLocation();
  const [selectedPattern, setSelectedPattern] = useState(BREATHING_PATTERNS[0]);
  const [visualization, setVisualization] = useState(VISUALIZATIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState([1]); // Speed multiplier
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem("breathingPreferences");
    if (saved) {
      const prefs = JSON.parse(saved);
      setSpeed(prefs.speed || [1]);
      setSoundEnabled(prefs.soundEnabled ?? true);
      setTotalSessions(prefs.totalSessions || 0);
    }
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("breathingPreferences", JSON.stringify({
      speed: speed,
      soundEnabled: soundEnabled,
      totalSessions: totalSessions,
    }));
  }, [speed, soundEnabled, totalSessions]);

  // Session timer
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentSessionTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Main breathing animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const currentStep = selectedPattern.steps[currentStepIndex];
    const adjustedDuration = currentStep.duration / speed[0];
    const startTime = Date.now();

    // Play sound cue if enabled
    if (soundEnabled && audioRef.current) {
      const pitch = currentStep.phase.includes("In") ? 1.1 : 0.9;
      audioRef.current.playbackRate = pitch;
      audioRef.current.play().catch(() => {});
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const stepProgress = (elapsed / adjustedDuration) * 100;

      if (stepProgress >= 100) {
        const nextIndex = (currentStepIndex + 1) % selectedPattern.steps.length;
        setCurrentStepIndex(nextIndex);
        setProgress(0);
        
        // Track completed cycles
        if (nextIndex === 0) {
          setCyclesCompleted((prev) => prev + 1);
        }
      } else {
        setProgress(stepProgress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex, selectedPattern, speed, soundEnabled]);

  const handlePlayPause = () => {
    if (!isPlaying) {
      setCurrentSessionTime(0);
      setCyclesCompleted(0);
    } else {
      // Session ending - increment total sessions
      if (currentSessionTime > 30) { // Only count sessions > 30 seconds
        setTotalSessions((prev) => prev + 1);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setProgress(0);
    setCurrentSessionTime(0);
    setCyclesCompleted(0);
  };

  const handlePatternChange = (pattern: typeof BREATHING_PATTERNS[0]) => {
    setSelectedPattern(pattern);
    handleReset();
  };

  const currentStep = selectedPattern.steps[currentStepIndex];
  const scale = 0.4 + (progress / 100) * 0.6;
  const rotation = (progress / 100) * 360;

  // Get current achievement
  const currentAchievement = ACHIEVEMENTS.filter(a => totalSessions >= a.sessions).pop();
  const nextAchievement = ACHIEVEMENTS.find(a => totalSessions < a.sessions);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen storybook-background p-4 relative overflow-hidden">
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      
      {/* Floating particles animation */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${5 + Math.random() * 3}s`
              }}
            >
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
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
              <h1 className="child-text-giant font-bold">Magical Breathing</h1>
              <p className="child-text-medium text-muted-foreground">Take deep breaths with Dune!</p>
            </div>
          </div>
          
          {/* Achievement Badge */}
          {currentAchievement && (
            <Badge className="px-4 py-2 child-text-body" variant="outline">
              <currentAchievement.icon className={`w-5 h-5 mr-2 ${currentAchievement.color}`} />
              {currentAchievement.badge}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="exercise" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="exercise" className="child-text-body">
              <Wind className="w-4 h-4 mr-2" />
              Exercise
            </TabsTrigger>
            <TabsTrigger value="customize" className="child-text-body">
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </TabsTrigger>
            <TabsTrigger value="progress" className="child-text-body">
              <TrendingUp className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercise" className="space-y-6">
            {/* Pattern Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BREATHING_PATTERNS.map((pattern) => {
                const Icon = pattern.icon;
                return (
                  <Card
                    key={pattern.id}
                    className={`storybook-card cursor-pointer transition-all hover-elevate ${
                      selectedPattern.id === pattern.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handlePatternChange(pattern)}
                    data-testid={`pattern-${pattern.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-8 h-8 text-primary" />
                        <Badge variant="secondary" className="text-xs">
                          {pattern.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="child-text-body">{pattern.name}</CardTitle>
                      <CardDescription className="text-sm">{pattern.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Main Breathing Visual */}
            <Card className="storybook-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8">
                  {/* Session Stats */}
                  {isPlaying && (
                    <div className="flex gap-6 mb-4">
                      <div className="text-center">
                        <Timer className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="child-text-body font-semibold">{formatTime(currentSessionTime)}</p>
                      </div>
                      <div className="text-center">
                        <RotateCcw className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="child-text-body font-semibold">{cyclesCompleted} cycles</p>
                      </div>
                    </div>
                  )}

                  {/* Visualization Container */}
                  <div className="relative w-64 h-64 mb-8">
                    {/* Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-gray-200"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 120}`}
                        strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                        className="transition-all duration-300"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" className="text-primary" stopColor="currentColor" />
                          <stop offset="100%" className="text-primary/60" stopColor="currentColor" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Central Visualization */}
                    <div className="absolute inset-4 flex items-center justify-center">
                      <div
                        className={`w-full h-full rounded-full bg-gradient-to-br ${currentStep.color} 
                          transition-all duration-300 flex items-center justify-center shadow-lg`}
                        style={{
                          transform: `scale(${scale}) ${visualization.id === 'butterfly' ? `rotate(${rotation}deg)` : ''}`,
                        }}
                        data-testid="breathing-visual"
                      >
                        <div className="text-white text-center p-4">
                          <p className="child-text-large font-bold mb-2">{currentStep.phase}</p>
                          <p className="child-text-medium">
                            {Math.ceil(((currentStep.duration / speed[0] - (progress / 100) * currentStep.duration / speed[0]) / 1000))}s
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Guide Character */}
                    {showGuide && (
                      <div className="absolute -right-16 top-1/2 -translate-y-1/2">
                        <div className="relative">
                          <img 
                            src={duneImage} 
                            alt="Dune the Bunny" 
                            className="w-20 h-auto"
                            style={{
                              animation: isPlaying ? 'bounce 2s ease-in-out infinite' : 'none'
                            }}
                          />
                          {isPlaying && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white rounded-lg px-3 py-1 shadow-lg whitespace-nowrap">
                              <p className="text-sm font-medium">{currentStep.instruction}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      onClick={handlePlayPause}
                      className="child-text-body"
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
                      className="child-text-body"
                      data-testid="button-reset"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      data-testid="button-sound"
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-5 h-5" />
                      ) : (
                        <VolumeX className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customize" className="space-y-6">
            <Card className="storybook-card">
              <CardHeader>
                <CardTitle className="child-text-medium">
                  <Settings className="w-6 h-6 inline mr-2" />
                  Breathing Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Speed Control */}
                <div>
                  <Label className="child-text-body mb-4 block">
                    Breathing Speed: {speed[0] === 0.5 ? "Slow" : speed[0] === 1 ? "Normal" : "Fast"}
                  </Label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={1.5}
                    step={0.25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Slower</span>
                    <span>Faster</span>
                  </div>
                </div>

                {/* Sound Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound" className="child-text-body">
                    Breathing Sounds
                  </Label>
                  <Switch
                    id="sound"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>

                {/* Guide Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="guide" className="child-text-body">
                    Show Dune Helper
                  </Label>
                  <Switch
                    id="guide"
                    checked={showGuide}
                    onCheckedChange={setShowGuide}
                  />
                </div>

                {/* Visualization Theme */}
                <div>
                  <Label className="child-text-body mb-4 block">Visual Theme</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {VISUALIZATIONS.map((viz) => (
                      <Button
                        key={viz.id}
                        variant={visualization.id === viz.id ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setVisualization(viz)}
                      >
                        <span className="mr-2 text-lg">{viz.icon}</span>
                        {viz.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card className="storybook-card">
              <CardHeader>
                <CardTitle className="child-text-medium">
                  <Award className="w-6 h-6 inline mr-2" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="child-text-giant font-bold text-primary">{totalSessions}</p>
                    <p className="child-text-body text-muted-foreground">Total Sessions</p>
                  </div>
                  <div className="text-center p-4 bg-green-100 rounded-lg">
                    <p className="child-text-giant font-bold text-green-600">
                      {Math.floor(totalSessions * 5)} min
                    </p>
                    <p className="child-text-body text-muted-foreground">Practice Time</p>
                  </div>
                </div>

                {/* Achievement Progress */}
                {nextAchievement && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="child-text-body">Next Achievement</Label>
                      <Badge variant="outline">
                        <nextAchievement.icon className={`w-4 h-4 mr-1 ${nextAchievement.color}`} />
                        {nextAchievement.badge}
                      </Badge>
                    </div>
                    <Progress 
                      value={(totalSessions / nextAchievement.sessions) * 100} 
                      className="h-3"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      {nextAchievement.sessions - totalSessions} more sessions to go!
                    </p>
                  </div>
                )}

                {/* All Achievements */}
                <div>
                  <Label className="child-text-body mb-4 block">Achievements</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {ACHIEVEMENTS.map((achievement) => {
                      const Icon = achievement.icon;
                      const isUnlocked = totalSessions >= achievement.sessions;
                      return (
                        <div
                          key={achievement.badge}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isUnlocked 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 bg-gray-50 opacity-50'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mb-2 ${isUnlocked ? achievement.color : 'text-gray-400'}`} />
                          <p className="font-medium text-sm">{achievement.badge}</p>
                          <p className="text-xs text-muted-foreground">{achievement.sessions} sessions</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden audio element for breathing sounds */}
      <audio ref={audioRef} className="hidden">
        <source src="/breathing-sound.mp3" type="audio/mpeg" />
      </audio>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0;
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}