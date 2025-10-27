import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Save, User, Calendar as CalendarIcon, 
  Palette, Heart, Star, Plus, X 
} from "lucide-react";
import type { Child, InsertChild, Gender } from "@shared/schema";
import duneImage from "@assets/dune-with-pinwheel-241x300_1760364974212.jpg";
import { checkSession } from "@/lib/auth";

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F06292",
  "#AED581", "#FFD54F", "#4DB6AC", "#7986CB"
];

const FAVORITE_COLORS = [
  "Red", "Blue", "Green", "Yellow", "Purple", 
  "Orange", "Pink", "Teal", "Brown", "Black"
];

const FAVORITE_ANIMALS = [
  "Dog", "Cat", "Rabbit", "Horse", "Bird",
  "Fish", "Turtle", "Hamster", "Guinea Pig", "Butterfly"
];

export default function ChildProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [sessionData, setSessionData] = useState<any>(null);
  const childId = localStorage.getItem("selectedChildId");
  
  // Check session and get family data
  useEffect(() => {
    checkSession().then((session) => {
      console.log("Child Profile Edit - Session check:", session);
      if (!session.authenticated || session.userType !== "parent") {
        console.log("Child Profile Edit - Not authenticated as parent, redirecting");
        setLocation("/family-setup");
        return;
      }
      setSessionData(session);
    }).catch((error) => {
      console.error("Child Profile Edit - Session check error:", error);
      setLocation("/family-setup");
    });
  }, [setLocation]);
  
  // Form state - initialize with session data once available
  const [formData, setFormData] = useState<Partial<InsertChild>>({
    name: "",
    familyId: "",
    familyCode: "",
    avatarColor: AVATAR_COLORS[0],
    gender: undefined,
    age: undefined,
    birthday: undefined,
    favoriteColor: undefined,
    favoriteAnimal: undefined,
    interests: []
  });
  
  // Update form data when session loads
  useEffect(() => {
    if (sessionData?.familyId && sessionData?.familyCode && !formData.familyId) {
      console.log("Child Profile Edit - Setting family data from session:", {
        familyId: sessionData.familyId,
        familyCode: sessionData.familyCode
      });
      setFormData(prev => ({
        ...prev,
        familyId: sessionData.familyId,
        familyCode: sessionData.familyCode
      }));
    }
  }, [sessionData]);
  
  const [newInterest, setNewInterest] = useState("");
  
  // Fetch existing child data if editing
  const { data: existingChild } = useQuery<Child>({
    queryKey: [`/api/children/${childId}`],
    enabled: !!childId
  });
  
  // Update form when existing child data loads
  useEffect(() => {
    if (existingChild) {
      setFormData({
        name: existingChild.name,
        familyId: existingChild.familyId,
        familyCode: existingChild.familyCode,
        avatarColor: existingChild.avatarColor,
        gender: existingChild.gender as Gender | undefined,
        age: existingChild.age || undefined,
        birthday: existingChild.birthday || undefined,
        favoriteColor: existingChild.favoriteColor || undefined,
        favoriteAnimal: existingChild.favoriteAnimal || undefined,
        interests: existingChild.interests || []
      });
    }
  }, [existingChild]);
  
  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InsertChild>) => {
      console.log("Child Profile Edit - Saving with data:", data);
      if (childId) {
        const res = await apiRequest("PUT", `/api/children/${childId}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/children", data);
        return res.json();
      }
    },
    onSuccess: (result) => {
      console.log("Child Profile Edit - Save successful:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/children", sessionData?.familyCode] });
      toast({
        title: childId ? "Profile Updated" : "Profile Created",
        description: "Child profile has been saved successfully"
      });
      setLocation("/parent-dashboard");
    },
    onError: (error: any) => {
      console.error("Child Profile Edit - Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive"
      });
    }
  });
  
  const handleSave = () => {
    if (!formData.name || formData.name.trim() === "") {
      toast({
        title: "Missing Information",
        description: "Please enter a name for the child",
        variant: "destructive"
      });
      return;
    }
    
    saveMutation.mutate(formData);
  };
  
  const handleAddInterest = () => {
    if (newInterest.trim() && formData.interests) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()]
      });
      setNewInterest("");
    }
  };
  
  const handleRemoveInterest = (index: number) => {
    if (formData.interests) {
      setFormData({
        ...formData,
        interests: formData.interests.filter((_, i) => i !== index)
      });
    }
  };
  
  const calculateAgeFromBirthday = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <Button
          variant="outline"
          onClick={() => setLocation("/parent-dashboard")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card className="storybook-card">
          <CardHeader>
            <div className="flex items-center gap-4">
              <img 
                src={duneImage} 
                alt="Dune the Bunny" 
                className="w-16 h-16 object-contain"
              />
              <div>
                <CardTitle className="child-text-title">
                  {childId ? "Edit Child Profile" : "Create Child Profile"}
                </CardTitle>
                <CardDescription className="child-text-body">
                  Fill in the details to customize the experience for your child
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="child-text-subtitle flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name" className="child-text-body">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter child's name"
                    className="text-lg"
                    data-testid="input-child-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gender" className="child-text-body">
                    Gender
                  </Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                  >
                    <SelectTrigger id="gender" data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="birthday" className="child-text-body">
                    Birthday
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday || ""}
                    onChange={(e) => {
                      const birthday = e.target.value;
                      const age = birthday ? calculateAgeFromBirthday(birthday) : undefined;
                      setFormData({ ...formData, birthday, age });
                    }}
                    className="text-lg"
                    data-testid="input-birthday"
                  />
                </div>
                
                <div>
                  <Label htmlFor="age" className="child-text-body">
                    Age {formData.birthday && formData.age && "(auto-calculated)"}
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                    placeholder="Enter age"
                    className="text-lg"
                    min="1"
                    max="18"
                    disabled={!!formData.birthday}
                    data-testid="input-age"
                  />
                </div>
              </div>
            </div>
            
            {/* Avatar Color */}
            <div className="space-y-4">
              <h3 className="child-text-subtitle flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Avatar Color
              </h3>
              
              <div className="flex flex-wrap gap-3">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, avatarColor: color })}
                    className={`w-16 h-16 rounded-full border-4 transition-all ${
                      formData.avatarColor === color 
                        ? "border-primary scale-110 shadow-lg" 
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    data-testid={`button-avatar-color-${color}`}
                  >
                    {formData.avatarColor === color && (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="child-text-subtitle flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Preferences
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="favoriteColor" className="child-text-body">
                    Favorite Color
                  </Label>
                  <Select
                    value={formData.favoriteColor || ""}
                    onValueChange={(value) => setFormData({ ...formData, favoriteColor: value })}
                  >
                    <SelectTrigger id="favoriteColor" data-testid="select-favorite-color">
                      <SelectValue placeholder="Select favorite color" />
                    </SelectTrigger>
                    <SelectContent>
                      {FAVORITE_COLORS.map((color) => (
                        <SelectItem key={color} value={color.toLowerCase()}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="favoriteAnimal" className="child-text-body">
                    Favorite Animal
                  </Label>
                  <Select
                    value={formData.favoriteAnimal || ""}
                    onValueChange={(value) => setFormData({ ...formData, favoriteAnimal: value })}
                  >
                    <SelectTrigger id="favoriteAnimal" data-testid="select-favorite-animal">
                      <SelectValue placeholder="Select favorite animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {FAVORITE_ANIMALS.map((animal) => (
                        <SelectItem key={animal} value={animal.toLowerCase()}>
                          {animal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="interests" className="child-text-body">
                  Interests & Hobbies
                </Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="interests"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest"
                    onKeyPress={(e) => e.key === "Enter" && handleAddInterest()}
                    data-testid="input-new-interest"
                  />
                  <Button
                    type="button"
                    onClick={handleAddInterest}
                    size="icon"
                    data-testid="button-add-interest"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.interests?.map((interest, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm py-1 px-3"
                    >
                      {interest}
                      <button
                        onClick={() => handleRemoveInterest(index)}
                        className="ml-2 hover:text-destructive"
                        data-testid={`button-remove-interest-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setLocation("/parent-dashboard")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                <Save className="w-5 h-5 mr-2" />
                {saveMutation.isPending ? "Saving..." : (childId ? "Update Profile" : "Create Profile")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}