import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isOrchestrateOSHost } from "@/lib/site";
import NotFound from "@/pages/NotFound";
import OrchestrateOS from "@/pages/OrchestrateOS";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

function MainSiteRouter() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/orchestrateos"} component={OrchestrateOS} />
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
  return isOrchestrateOSHost() ? <OrchestrateOSRouter /> : <MainSiteRouter />;
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
