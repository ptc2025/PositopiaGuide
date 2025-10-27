import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, User, ArrowLeft, UserPlus, Shield } from "lucide-react";
import type { Child } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { checkSession } from "@/lib/auth";
import duneImage from "@assets/dune-with-pinwheel-241x300_1760364974212.jpg";

const AVATAR_COLORS = [
  { name: "Blue", value: "blue", bg: "bg-blue-400", hover: "hover:bg-blue-500" },
  { name: "Purple", value: "purple", bg: "bg-purple-400", hover: "hover:bg-purple-500" },
  { name: "Pink", value: "pink", bg: "bg-pink-400", hover: "hover:bg-pink-500" },
  { name: "Green", value: "green", bg: "bg-green-400", hover: "hover:bg-green-500" },
  { name: "Yellow", value: "yellow", bg: "bg-yellow-400", hover: "hover:bg-yellow-500" },
  { name: "Orange", value: "orange", bg: "bg-orange-400", hover: "hover:bg-orange-500" },
];

export default function ProfileSelect() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].value);
  const [sessionData, setSessionData] = useState<any>(null);
  
  // Check for family authentication via session
  useEffect(() => {
    checkSession().then((session) => {
      console.log("Profile Select - Session check:", session);
      if (!session.authenticated || !session.familyId) {
        console.log("Profile Select - No auth or familyId, redirecting to family-setup");
        setLocation("/family-setup");
        return;
      }
      setSessionData(session);
      
      // If parent is logged in, redirect to parent dashboard
      if (session.userType === "parent") {
        console.log("Profile Select - Parent detected, redirecting to parent-dashboard");
        setLocation("/parent-dashboard");
      } else {
        console.log("Profile Select - Child/family session, staying on profile-select");
      }
    }).catch((error) => {
      console.error("Profile Select - Session check error:", error);
      setLocation("/family-setup");
    });
  }, [setLocation]);

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ["/api/children", sessionData?.familyCode],
    queryFn: async () => {
      const response = await fetch(`/api/children?familyCode=${sessionData?.familyCode}`);
      if (!response.ok) throw new Error("Failed to fetch children");
      return response.json();
    },
    enabled: !!sessionData?.familyCode,
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: { name: string; avatarColor: string; familyCode: string; familyId: string }) => {
      const res = await apiRequest("POST", "/api/children", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children?familyCode=${sessionData?.familyCode}`] });
      setIsDialogOpen(false);
      setNewChildName("");
      setSelectedColor(AVATAR_COLORS[0].value);
    },
  });

  const handleSelectChild = (child: Child) => {
    localStorage.setItem("selectedChildId", child.id);
    localStorage.setItem("selectedChildName", child.name);
    setLocation("/");
  };

  const handleCreateChild = () => {
    if (newChildName.trim() && sessionData?.familyCode && sessionData?.familyId) {
      createChildMutation.mutate({
        name: newChildName.trim(),
        avatarColor: selectedColor,
        familyCode: sessionData.familyCode,
        familyId: sessionData.familyId,
      });
    }
  };

  // If no session data (this should be handled by redirect already but just in case)
  if (!sessionData?.familyCode || !sessionData?.familyId) {
    return null;
  }

  return (
    <div className="min-h-screen storybook-background relative">
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      
      {/* Parent Access Button */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          onClick={() => setLocation("/family-setup")}
          className="gap-2"
          data-testid="button-parent-access"
        >
          <Shield className="w-4 h-4" />
          Parent Access
        </Button>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src={duneImage} alt="Dune the Bunny" className="w-24 h-auto" />
          </div>
          <h1 className="child-text-giant text-foreground mb-2" data-testid="text-profile-title">
            Who's Checking In?
          </h1>
          <p className="child-text-medium text-muted-foreground">Select your profile or create a new one</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading profiles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {children.map((child) => {
              const colorConfig = AVATAR_COLORS.find(c => c.value === child.avatarColor) || AVATAR_COLORS[0];
              return (
                <Button
                  key={child.id}
                  variant="outline"
                  onClick={() => handleSelectChild(child)}
                  className={`h-auto flex-col gap-3 py-6 ${colorConfig.hover}`}
                  data-testid={`button-select-child-${child.id}`}
                >
                  <div className={`w-20 h-20 rounded-full ${colorConfig.bg} flex items-center justify-center`}>
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <span className="child-text-medium font-medium">{child.name}</span>
                </Button>
              );
            })}

            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="h-auto flex-col gap-3 py-6 border-dashed hover-elevate"
              data-testid="button-add-child"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-8 h-8" />
              </div>
              <span className="text-lg font-medium">Add Profile</span>
            </Button>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Profile</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="childName">Name</Label>
                <Input
                  id="childName"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Enter name"
                  data-testid="input-child-name"
                />
              </div>

              <div>
                <Label>Choose a color</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-12 h-12 rounded-full ${color.bg} ${
                        selectedColor === color.value ? "ring-4 ring-primary" : ""
                      }`}
                      data-testid={`button-color-${color.value}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-child">
                Cancel
              </Button>
              <Button
                onClick={handleCreateChild}
                disabled={!newChildName.trim() || createChildMutation.isPending}
                data-testid="button-save-child"
              >
                Create Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
