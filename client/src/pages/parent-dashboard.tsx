import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Settings, Shield, LogOut, UserPlus, Calendar,
  Music, MessageSquare, Activity, Smile, Volume2, 
  Palette, ChevronRight, Trash2, Edit
} from "lucide-react";
import type { Child, Family, FamilySetting, AssetDistribution } from "@shared/schema";
import duneImage from "@assets/dune-with-pinwheel-241x300_1760364974212.jpg";
import { checkSession } from "@/lib/auth";

export default function ParentDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Check for parent authentication via session
  useEffect(() => {
    checkSession().then((session) => {
      console.log("Parent Dashboard - Session check:", session);
      if (!session.authenticated || session.userType !== "parent") {
        console.log("Parent Dashboard - Redirecting to family-setup");
        setLocation("/family-setup");
        return;
      }
      console.log("Parent Dashboard - Session valid, setting data");
      setSessionData(session);
      setIsCheckingSession(false);
    }).catch((error) => {
      console.error("Parent Dashboard - Session check error:", error);
      setLocation("/family-setup");
    });
  }, [setLocation]);
  
  // Fetch family data
  const { data: family } = useQuery<Family>({
    queryKey: [`/api/families/${sessionData?.familyCode}`],
    enabled: !!sessionData?.familyCode
  });
  
  // Fetch children profiles
  const { data: children = [] } = useQuery<Child[]>({
    queryKey: [`/api/children?familyCode=${sessionData?.familyCode}`],
    enabled: !!sessionData?.familyCode
  });
  
  // Fetch family settings
  const { data: settings } = useQuery<FamilySetting>({
    queryKey: [`/api/family-settings/${sessionData?.familyId}`],
    enabled: !!sessionData?.familyId
  });
  
  // Fetch asset distributions
  const { data: distributions = [] } = useQuery<AssetDistribution[]>({
    queryKey: [`/api/asset-distributions/${sessionData?.familyId}`],
    enabled: !!sessionData?.familyId
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<FamilySetting>) => {
      const res = await apiRequest("PUT", `/api/family-settings/${sessionData?.familyId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/family-settings/${sessionData?.familyId}`] });
      toast({
        title: "Settings Updated",
        description: "Family settings have been saved"
      });
    }
  });
  
  // Delete child mutation
  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      const res = await apiRequest("DELETE", `/api/children/${childId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children?familyCode=${sessionData?.familyCode}`] });
      toast({
        title: "Profile Deleted",
        description: "Child profile has been removed"
      });
    }
  });
  
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout", {});
      localStorage.clear();
      setLocation("/family-setup");
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local data and redirect anyway
      localStorage.clear();
      setLocation("/family-setup");
    }
  };
  
  const handleSettingToggle = (setting: keyof FamilySetting, value: boolean) => {
    updateSettingsMutation.mutate({ [setting]: value });
  };
  
  const navigateToChildProfile = (childId: string) => {
    localStorage.setItem("selectedChildId", childId);
    setLocation("/child-profile-edit");
  };
  
  const navigateToChildCalendar = (childId: string) => {
    localStorage.setItem("selectedChildId", childId);
    setLocation("/calendar");
  };

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-children flex items-center justify-center">
        <Card className="storybook-card p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="child-text-body">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-children">
      {/* Floating clouds */}
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className="cloud absolute opacity-30"
          style={{
            top: `${10 + i * 25}%`,
            left: `${-20 + i * 40}%`,
            animationDelay: `${i * 3}s`,
            animationDuration: `${30 + i * 10}s`
          }}
        />
      ))}
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <Card className="storybook-card mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={duneImage} 
                alt="Dune the Bunny" 
                className="w-16 h-16 object-contain"
              />
              <div>
                <CardTitle className="child-text-title flex items-center gap-2">
                  <Shield className="w-8 h-8 text-primary" />
                  Parent Dashboard
                </CardTitle>
                <CardDescription className="child-text-body">
                  {family?.familyName} • Code: {sessionData?.familyCode}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </CardHeader>
        </Card>
        
        <Tabs defaultValue="children" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="children" className="child-text-body">
              <Users className="w-5 h-5 mr-2" />
              Children
            </TabsTrigger>
            <TabsTrigger value="settings" className="child-text-body">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="assets" className="child-text-body">
              <Music className="w-5 h-5 mr-2" />
              Content
            </TabsTrigger>
          </TabsList>
          
          {/* Children Tab */}
          <TabsContent value="children" className="space-y-4">
            <Card className="storybook-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="child-text-subtitle">
                    Children Profiles
                  </CardTitle>
                  <CardDescription className="child-text-body">
                    Manage your children's profiles and view their progress
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setLocation("/child-profile-edit")}
                  data-testid="button-add-child"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add Child
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {children.map((child) => (
                    <Card key={child.id} className="hover-elevate">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: child.avatarColor }}
                          >
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigateToChildProfile(child.id)}
                              data-testid={`button-edit-${child.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteChildMutation.mutate(child.id)}
                              data-testid={`button-delete-${child.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h3 className="font-bold text-lg">{child.name}</h3>
                          {child.age && (
                            <p className="text-sm text-muted-foreground">
                              Age: {child.age}
                            </p>
                          )}
                          {child.gender && (
                            <Badge variant="secondary" className="mt-1">
                              {child.gender}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigateToChildCalendar(child.id)}
                            data-testid={`button-calendar-${child.id}`}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Calendar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              localStorage.setItem("selectedChildId", child.id);
                              localStorage.setItem("selectedChildName", child.name);
                              setLocation("/");
                            }}
                            data-testid={`button-login-as-${child.id}`}
                          >
                            <ChevronRight className="w-4 h-4 mr-1" />
                            Login As
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {children.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">
                      No children profiles yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click "Add Child" to create your first profile
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="storybook-card">
              <CardHeader>
                <CardTitle className="child-text-subtitle">
                  Family Settings
                </CardTitle>
                <CardDescription className="child-text-body">
                  Configure global settings for all children
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">
                        Allow Children Login
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Children can select their own profiles
                      </p>
                    </div>
                    <Switch
                      checked={settings?.allowChildrenLogin ?? true}
                      onCheckedChange={(checked) => handleSettingToggle("allowChildrenLogin", checked)}
                      data-testid="switch-allow-children-login"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">
                        Require PIN for Children
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Children need PIN to access their profiles
                      </p>
                    </div>
                    <Switch
                      checked={settings?.requirePinForChild ?? false}
                      onCheckedChange={(checked) => handleSettingToggle("requirePinForChild", checked)}
                      data-testid="switch-require-pin"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Auto-play Music
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically play background music
                      </p>
                    </div>
                    <Switch
                      checked={settings?.autoPlayMusic ?? true}
                      onCheckedChange={(checked) => handleSettingToggle("autoPlayMusic", checked)}
                      data-testid="switch-auto-play-music"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Text-to-Speech
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Read affirmations aloud
                      </p>
                    </div>
                    <Switch
                      checked={settings?.enableTts ?? true}
                      onCheckedChange={(checked) => handleSettingToggle("enableTts", checked)}
                      data-testid="switch-enable-tts"
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme Settings
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {["default", "ocean", "forest"].map((theme) => (
                      <Button
                        key={theme}
                        variant={settings?.themePreset === theme ? "default" : "outline"}
                        onClick={() => updateSettingsMutation.mutate({ themePreset: theme })}
                        className="capitalize"
                        data-testid={`button-theme-${theme}`}
                      >
                        {theme}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4">
            <Card className="storybook-card">
              <CardHeader>
                <CardTitle className="child-text-subtitle">
                  Content Management
                </CardTitle>
                <CardDescription className="child-text-body">
                  Manage which content is available to each child
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2">
                          <Music className="w-5 h-5 text-primary" />
                          Music Library
                        </h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation("/admin")}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Configure which music tracks are available for each child
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          Affirmations
                        </h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation("/admin")}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Customize positive messages for different ages and preferences
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2">
                          <Activity className="w-5 h-5 text-primary" />
                          Activities
                        </h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation("/admin")}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Set age-appropriate activities and exercises
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2">
                          <Smile className="w-5 h-5 text-primary" />
                          Jokes
                        </h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation("/admin")}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Filter jokes based on age and humor preferences
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}