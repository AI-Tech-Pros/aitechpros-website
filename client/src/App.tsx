import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isOrchestrateOSProductSite, orchestrateOSUrl } from "@/lib/site";
import NotFound from "@/pages/NotFound";
import OrchestrateOS from "@/pages/OrchestrateOS";
import OrchestrateOSCompare from "@/pages/OrchestrateOSCompare";
import OrchestrateOSCompliance from "@/pages/OrchestrateOSCompliance";
import OrchestrateOSGovernance from "@/pages/OrchestrateOSGovernance";
import OrchestrateOSProduction from "@/pages/OrchestrateOSProduction";
import OrchestrateOSInstall from "@/pages/OrchestrateOSInstall";
import OrchestrateOSLogin from "@/pages/OrchestrateOSLogin";
import OrchestrateOSAuthVerify from "@/pages/OrchestrateOSAuthVerify";
import OrchestrateOSPartnerDashboard from "@/pages/OrchestrateOSPartnerDashboard";
import OrchestrateOSAdminCapture from "@/pages/OrchestrateOSAdminCapture";
import OrchestrateOSAdminPartners from "@/pages/OrchestrateOSAdminPartners";
import OrchestrateOSAdminOutcomes from "@/pages/OrchestrateOSAdminOutcomes";
import OrchestrateOSOnboarding from "@/pages/OrchestrateOSOnboarding";
import { SessionProvider } from "@/contexts/SessionContext";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

function OrchestrateOSRedirect() {
  useEffect(() => {
    window.location.replace(orchestrateOSUrl());
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center text-white/50 text-sm font-[Montserrat]">
      Redirecting to OrchestrateOS…
    </div>
  );
}

function MainSiteRouter() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/orchestrateos"} component={OrchestrateOSRedirect} />
      <Route path={"/orchestrateos/*"} component={OrchestrateOSRedirect} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OrchestrateOSRouter() {
  return (
    <SessionProvider>
      <Switch>
        <Route path={"/"} component={OrchestrateOS} />
        <Route path={"/governance"} component={OrchestrateOSGovernance} />
        <Route path={"/production"} component={OrchestrateOSProduction} />
        <Route path={"/compliance"} component={OrchestrateOSCompliance} />
        <Route path={"/install"} component={OrchestrateOSInstall} />
        <Route path={"/compare"} component={OrchestrateOSCompare} />
        <Route path={"/login"} component={OrchestrateOSLogin} />
        <Route path={"/onboarding"} component={OrchestrateOSOnboarding} />
        <Route path={"/auth/verify"} component={OrchestrateOSAuthVerify} />
        <Route path={"/partner/dashboard"} component={OrchestrateOSPartnerDashboard} />
        <Route path={"/admin/capture"} component={OrchestrateOSAdminCapture} />
        <Route path={"/admin/partners"} component={OrchestrateOSAdminPartners} />
        <Route path={"/admin/outcomes"} component={OrchestrateOSAdminOutcomes} />
        <Route path={"/privacy"} component={PrivacyPolicy} />
        <Route path={"/terms"} component={TermsOfService} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </SessionProvider>
  );
}

function Router() {
  return isOrchestrateOSProductSite() ? <OrchestrateOSRouter /> : <MainSiteRouter />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
