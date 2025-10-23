import { useState } from "react";
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
import { Plus, User } from "lucide-react";
import type { Child } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const [familyCodeInput, setFamilyCodeInput] = useState(() => localStorage.getItem("familyCode") || "");
  const [familyCode, setFamilyCode] = useState(() => localStorage.getItem("familyCode") || "");
  const [newChildName, setNewChildName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].value);

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ["/api/children", familyCode],
    queryFn: async () => {
      const response = await fetch(`/api/children?familyCode=${familyCode}`);
      if (!response.ok) throw new Error("Failed to fetch children");
      return response.json();
    },
    enabled: !!familyCode,
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: { name: string; avatarColor: string; familyCode: string }) => {
      return await apiRequest("POST", "/api/children", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", familyCode] });
      setIsDialogOpen(false);
      setNewChildName("");
      setSelectedColor(AVATAR_COLORS[0].value);
    },
  });

  const handleSelectChild = (child: Child) => {
    // Ensure family code is also in localStorage when selecting a child
    if (familyCode) {
      localStorage.setItem("familyCode", familyCode);
    }
    localStorage.setItem("selectedChildId", child.id);
    localStorage.setItem("selectedChildName", child.name);
    setLocation("/");
  };

  const handleCreateChild = () => {
    if (newChildName.trim() && familyCode) {
      createChildMutation.mutate({
        name: newChildName.trim(),
        avatarColor: selectedColor,
        familyCode,
      });
    }
  };

  const handleSetFamilyCode = () => {
    if (familyCodeInput.trim()) {
      localStorage.setItem("familyCode", familyCodeInput.trim());
      setFamilyCode(familyCodeInput.trim()); // Update component state
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    }
  };

  if (!familyCode) {
    return (
      <div className="min-h-screen storybook-background flex items-center justify-center px-4 relative">
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <Card className="w-full max-w-md storybook-card relative z-10">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <img src={duneImage} alt="Dune the Bunny" className="w-24 h-auto" />
            </div>
            <CardTitle className="text-center child-text-large">Welcome to Positopia!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center child-text-medium text-muted-foreground">
              Enter your family code to get started
            </p>
            <div>
              <Label htmlFor="familyCode">Family Code</Label>
              <Input
                id="familyCode"
                value={familyCodeInput}
                onChange={(e) => setFamilyCodeInput(e.target.value)}
                placeholder="Enter your family code"
                data-testid="input-family-code"
              />
            </div>
            <Button onClick={handleSetFamilyCode} className="w-full child-text-medium" size="lg" data-testid="button-continue">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen storybook-background relative">
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
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
