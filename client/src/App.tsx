import { Switch, Route, useLocation } from "wouter";
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
import { whopIframeSdk } from "./lib/whop-iframe";
import { useEffect, useState, useRef } from "react";
import UpgradeAnnouncementModal from "@/components/UpgradeAnnouncementModal";

function Router() {
  const [location, setLocation] = useLocation();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    // Only check once on initial load
    if (checkedRef.current) return;
    checkedRef.current = true;

    // If already on a non-root route like /admin, /terms, etc., do not redirect
    if (location !== "/" && !location.startsWith("/experiences/")) {
      setInitialCheckDone(true);
      return;
    }

    try {
      const searchParams = new URLSearchParams(window.location.search);
      let hashParams: URLSearchParams | null = null;
      if (window.location.hash) {
        hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      }

      const experienceId =
        searchParams.get("experienceId") ||
        searchParams.get("experience_id") ||
        hashParams?.get("experienceId") ||
        hashParams?.get("experience_id");

      const companyId =
        searchParams.get("companyId") ||
        searchParams.get("company_id") ||
        hashParams?.get("companyId") ||
        hashParams?.get("company_id");

      const expMatch = location.match(/^\/experiences\/([^/?#]+)/);
      const pathExperienceId = expMatch ? expMatch[1] : null;

      const resourceId = companyId || experienceId || pathExperienceId || "default";

      fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resourceId }),
      })
        .then((res) => (res.ok ? res.json() : { isAdmin: false }))
        .then((data) => {
          if (data?.isAdmin) {
            setLocation("/admin");
          }
        })
        .catch((err) => {
          console.debug("[App] Initial admin check error:", err);
        })
        .finally(() => {
          setInitialCheckDone(true);
        });
    } catch {
      setInitialCheckDone(true);
    }
  }, [location, setLocation]);

  if (!initialCheckDone && (location === "/" || location.startsWith("/experiences/"))) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

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
