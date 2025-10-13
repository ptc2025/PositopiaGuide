import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import type { TtsSetting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export function TtsSettings() {
  const { data: settings, isLoading } = useQuery<TtsSetting>({
    queryKey: ["/api/tts-settings"],
  });

  const [formData, setFormData] = useState({
    voiceProfile: "alloy",
    speed: 100,
    pitch: 100,
    volume: 80,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        voiceProfile: settings.voiceProfile,
        speed: settings.speed,
        pitch: settings.pitch,
        volume: settings.volume,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest("PUT", "/api/tts-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tts-settings"] });
    },
  });

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  const voiceOptions = [
    { value: "alloy", label: "Alloy (Neutral)" },
    { value: "echo", label: "Echo (Male)" },
    { value: "fable", label: "Fable (British Male)" },
    { value: "onyx", label: "Onyx (Deep Male)" },
    { value: "nova", label: "Nova (Female)" },
    { value: "shimmer", label: "Shimmer (Soft Female)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Text-to-Speech Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Label htmlFor="voiceProfile">Voice Profile</Label>
              <Select
                value={formData.voiceProfile}
                onValueChange={(value) =>
                  setFormData({ ...formData, voiceProfile: value })
                }
              >
                <SelectTrigger id="voiceProfile" className="mt-2" data-testid="select-voice-profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="speed">Speed ({formData.speed}%)</Label>
              <Slider
                id="speed"
                value={[formData.speed]}
                onValueChange={([value]) => setFormData({ ...formData, speed: value })}
                min={50}
                max={200}
                step={5}
                className="mt-2"
                data-testid="slider-speed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                50% = Half speed, 100% = Normal, 200% = Double speed
              </p>
            </div>

            <div>
              <Label htmlFor="pitch">Pitch ({formData.pitch}%)</Label>
              <Slider
                id="pitch"
                value={[formData.pitch]}
                onValueChange={([value]) => setFormData({ ...formData, pitch: value })}
                min={50}
                max={200}
                step={5}
                className="mt-2"
                data-testid="slider-pitch"
              />
              <p className="text-xs text-muted-foreground mt-1">
                50% = Lower pitch, 100% = Normal, 200% = Higher pitch
              </p>
            </div>

            <div>
              <Label htmlFor="volume">Volume ({formData.volume}%)</Label>
              <Slider
                id="volume"
                value={[formData.volume]}
                onValueChange={([value]) => setFormData({ ...formData, volume: value })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
                data-testid="slider-tts-volume"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="w-full"
              data-testid="button-save-tts"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
