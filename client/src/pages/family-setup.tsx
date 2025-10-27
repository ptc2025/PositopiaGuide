import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Lock, UserPlus, Home, Shield } from "lucide-react";
import duneImage from "@assets/dune-with-pinwheel-241x300_1760364974212.jpg";

export default function FamilySetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Create Family State
  const [familyName, setFamilyName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  // Join Family State
  const [joinFamilyCode, setJoinFamilyCode] = useState("");
  const [joinPin, setJoinPin] = useState("");
  
  // Parent Login State
  const [isParentDialogOpen, setIsParentDialogOpen] = useState(false);
  const [parentFamilyName, setParentFamilyName] = useState("");
  const [parentPin, setParentPin] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateFamily = async () => {
    if (!familyName || !familyCode || !newPin) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    if (newPin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "PINs do not match",
        variant: "destructive"
      });
      return;
    }
    
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4-6 digits",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("[Frontend] Sending family creation request:", {
        familyName,
        familyCode,
        pinLength: newPin.length
      });
      
      const res = await apiRequest("POST", "/api/families", {
        familyName,
        familyCode,
        pin: newPin
      });
      
      console.log("[Frontend] Response status:", res.status);
      const response: any = await res.json();
      console.log("[Frontend] Response body:", response);
      
      // Session is already established by the server
      // Clear localStorage as we're using server sessions
      localStorage.clear();
      
      toast({
        title: "Family Created!",
        description: "Your family account has been set up successfully"
      });
      
      // Navigate to profile selection page
      setLocation("/select-profile");
    } catch (error: any) {
      console.error("[Frontend] Family creation error:", error);
      
      // Try to get more error details
      let errorMessage = error.message || "Failed to create family";
      if (error.details) {
        console.error("[Frontend] Error details:", error.details);
        errorMessage += `: ${JSON.stringify(error.details)}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinFamilyCode || !joinPin) {
      toast({
        title: "Missing Information",
        description: "Please enter family code and PIN",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/families/validate-pin", {
        familyCode: joinFamilyCode,
        pin: joinPin
      });
      const response: any = await res.json();
      
      if (!response.isValid) {
        toast({
          title: "Invalid Credentials",
          description: "Family code or PIN is incorrect",
          variant: "destructive"
        });
        return;
      }
      
      // Session is established by the server
      // Clear localStorage as we're using server sessions
      localStorage.clear();
      
      // Navigate to profile selection page
      setLocation("/select-profile");
      
      toast({
        title: "Welcome Back!",
        description: "Successfully logged into family account"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to validate PIN",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleParentLogin = async () => {
    if (!parentFamilyName || !parentPin) {
      toast({
        title: "Missing Information",
        description: "Please enter family name and PIN",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/parents/login", {
        familyName: parentFamilyName,
        pin: parentPin
      });
      const response: any = await res.json();
      
      if (!response.success) {
        toast({
          title: "Invalid Credentials",
          description: response.error || "Family name or PIN is incorrect",
          variant: "destructive"
        });
        return;
      }
      
      // Session is established by the server
      // Clear localStorage as we're using server sessions
      localStorage.clear();
      
      setIsParentDialogOpen(false);
      toast({
        title: "Welcome Back!",
        description: "Successfully logged into parent dashboard"
      });
      
      // Navigate to parent dashboard
      setLocation("/parent-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-children flex items-center justify-center p-4">
      {/* Floating clouds */}
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className="cloud absolute opacity-30"
          style={{
            top: `${20 + i * 30}%`,
            left: `${-20 + i * 40}%`,
            animationDelay: `${i * 3}s`,
            animationDuration: `${30 + i * 10}s`
          }}
        />
      ))}
      
      <Card className="storybook-card max-w-2xl w-full mx-auto relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={duneImage} 
              alt="Dune the Bunny" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="child-text-title">Welcome to Positopia!</CardTitle>
          <CardDescription className="child-text-body text-lg">
            Let's set up your family account to get started
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="join" className="child-text-body">
                <Home className="w-5 h-5 mr-2" />
                Join Family
              </TabsTrigger>
              <TabsTrigger value="create" className="child-text-body">
                <UserPlus className="w-5 h-5 mr-2" />
                Create Family
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="join" className="space-y-6">
              <div className="text-center mb-6">
                <Users className="w-16 h-16 mx-auto mb-2 text-primary" />
                <p className="child-text-body">
                  Enter your family code and PIN to access your profiles
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="join-code" className="child-text-body">
                    Family Code
                  </Label>
                  <Input
                    id="join-code"
                    placeholder="Enter your family code"
                    value={joinFamilyCode}
                    onChange={(e) => setJoinFamilyCode(e.target.value)}
                    className="text-lg p-6"
                    data-testid="input-join-family-code"
                  />
                </div>
                
                <div>
                  <Label htmlFor="join-pin" className="child-text-body">
                    PIN (4-6 digits)
                  </Label>
                  <Input
                    id="join-pin"
                    type="password"
                    placeholder="Enter PIN"
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value)}
                    className="text-lg p-6"
                    maxLength={6}
                    pattern="[0-9]*"
                    data-testid="input-join-pin"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleJoinFamily}
                disabled={isLoading}
                className="w-full text-lg py-6"
                size="lg"
                data-testid="button-join-family"
              >
                <Lock className="w-5 h-5 mr-2" />
                {isLoading ? "Joining..." : "Join Family"}
              </Button>
            </TabsContent>
            
            <TabsContent value="create" className="space-y-6">
              <div className="text-center mb-6">
                <UserPlus className="w-16 h-16 mx-auto mb-2 text-primary" />
                <p className="child-text-body">
                  Create a new family account to manage your children's profiles
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="family-name" className="child-text-body">
                    Family Name
                  </Label>
                  <Input
                    id="family-name"
                    placeholder="e.g., The Smith Family"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="text-lg p-6"
                    data-testid="input-family-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="family-code" className="child-text-body">
                    Choose a Family Code
                  </Label>
                  <Input
                    id="family-code"
                    placeholder="e.g., SMITH2025"
                    value={familyCode}
                    onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                    className="text-lg p-6"
                    data-testid="input-family-code"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This code will be used to identify your family
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="new-pin" className="child-text-body">
                    Create PIN (4-6 digits)
                  </Label>
                  <Input
                    id="new-pin"
                    type="password"
                    placeholder="Enter 4-6 digit PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="text-lg p-6"
                    maxLength={6}
                    pattern="[0-9]*"
                    data-testid="input-new-pin"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm-pin" className="child-text-body">
                    Confirm PIN
                  </Label>
                  <Input
                    id="confirm-pin"
                    type="password"
                    placeholder="Re-enter PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="text-lg p-6"
                    maxLength={6}
                    pattern="[0-9]*"
                    data-testid="input-confirm-pin"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleCreateFamily}
                disabled={isLoading}
                className="w-full text-lg py-6"
                size="lg"
                data-testid="button-create-family"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {isLoading ? "Creating..." : "Create Family"}
              </Button>
            </TabsContent>
          </Tabs>
          
          {/* Parent Login Section */}
          <div className="border-t pt-6 mt-6">
            <div className="text-center">
              <p className="child-text-body text-muted-foreground mb-3">
                Are you a parent? Access your dashboard here
              </p>
              <Button
                variant="outline"
                onClick={() => setIsParentDialogOpen(true)}
                className="gap-2"
                data-testid="button-parent-login"
              >
                <Shield className="w-4 h-4" />
                Parent Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Parent Login Dialog */}
      <Dialog open={isParentDialogOpen} onOpenChange={setIsParentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parent Login</DialogTitle>
            <DialogDescription>
              Enter your family name and PIN to access the parent dashboard
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="parent-family" className="child-text-body">
                Family Name
              </Label>
              <Input
                id="parent-family"
                placeholder="Enter your family name"
                value={parentFamilyName}
                onChange={(e) => setParentFamilyName(e.target.value)}
                data-testid="input-parent-family-name"
              />
            </div>
            
            <div>
              <Label htmlFor="parent-pin" className="child-text-body">
                PIN
              </Label>
              <Input
                id="parent-pin"
                type="password"
                placeholder="Enter your PIN"
                value={parentPin}
                onChange={(e) => setParentPin(e.target.value)}
                maxLength={6}
                data-testid="input-parent-pin"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsParentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleParentLogin}
              disabled={isLoading}
              data-testid="button-submit-parent-login"
            >
              {isLoading ? "Logging in..." : "Login as Parent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}