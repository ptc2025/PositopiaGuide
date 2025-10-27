import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import ProfileSelect from "@/pages/profile-select";
import History from "@/pages/history";
import Dashboard from "@/pages/dashboard";
import Breathing from "@/pages/breathing";
import Calendar from "@/pages/calendar";
import FamilySetup from "@/pages/family-setup";
import ParentDashboard from "@/pages/parent-dashboard";
import ChildProfileEdit from "@/pages/child-profile-edit";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/family-setup" component={FamilySetup} />
      <Route path="/select-profile" component={ProfileSelect} />
      <Route path="/parent-dashboard" component={ParentDashboard} />
      <Route path="/child-profile-edit" component={ChildProfileEdit} />
      <Route path="/history" component={History} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/breathing" component={Breathing} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
