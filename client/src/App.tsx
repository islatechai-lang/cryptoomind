import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Chat from "@/pages/Chat";
import AdminDashboard from "@/pages/AdminDashboard";
import WebhookTester from "@/pages/WebhookTester";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import RiskDisclosure from "@/pages/RiskDisclosure";
import UpgradeAnnouncementModal from "@/components/UpgradeAnnouncementModal";

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/webhook-tester" component={WebhookTester} />
      <Route path="/experiences/:experienceId" component={Chat} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/risk" component={RiskDisclosure} />
      <Route path="/" component={Chat} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="flex h-screen w-full">
            <Router />
          </div>
          <Toaster />
          <UpgradeAnnouncementModal />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export { whopIframeSdk };

export default App;
