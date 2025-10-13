import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioManager } from "@/components/admin/audio-manager";
import { AffirmationManager } from "@/components/admin/affirmation-manager";
import { ActivityManager } from "@/components/admin/activity-manager";
import { JokeManager } from "@/components/admin/joke-manager";
import { TtsSettings } from "@/components/admin/tts-settings";
import { Settings, Music, Sparkles, Activity, Laugh } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-admin-title">
              Admin Panel
            </h1>
            <Link href="/">
              <Button variant="outline" data-testid="button-home">
                <Home className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8" data-testid="tabs-admin">
            <TabsTrigger value="audio" className="flex items-center gap-2" data-testid="tab-audio">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Audio Files</span>
            </TabsTrigger>
            <TabsTrigger value="affirmations" className="flex items-center gap-2" data-testid="tab-affirmations">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Affirmations</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2" data-testid="tab-activities">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activities</span>
            </TabsTrigger>
            <TabsTrigger value="jokes" className="flex items-center gap-2" data-testid="tab-jokes">
              <Laugh className="w-4 h-4" />
              <span className="hidden sm:inline">Jokes</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">TTS Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audio">
            <AudioManager />
          </TabsContent>

          <TabsContent value="affirmations">
            <AffirmationManager />
          </TabsContent>

          <TabsContent value="activities">
            <ActivityManager />
          </TabsContent>

          <TabsContent value="jokes">
            <JokeManager />
          </TabsContent>

          <TabsContent value="settings">
            <TtsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
