import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isOrchestrateOSProductSite, orchestrateOSUrl } from "@/lib/site";
import NotFound from "@/pages/NotFound";
import OrchestrateOS from "@/pages/OrchestrateOS";
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
    <Switch>
      <Route path={"/"} component={OrchestrateOS} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
