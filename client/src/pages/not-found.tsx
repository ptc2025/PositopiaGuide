import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center storybook-background relative">
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <Card className="w-full max-w-md mx-4 storybook-card relative z-10">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h1 className="child-text-large font-bold text-gray-900">Oops! Page Not Found</h1>
            <p className="child-text-body text-gray-600">
              It seems you've wandered off the path!
            </p>
            <Link href="/">
              <Button size="lg" className="child-text-body" data-testid="button-home-404">
                <Home className="w-5 h-5 mr-2" />
                Go Back Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
