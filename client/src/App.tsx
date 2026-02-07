import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load non-critical pages for faster initial load
const Schedules = lazy(() => import("./pages/Schedules"));
const Menus = lazy(() => import("./pages/Menus"));
const Members = lazy(() => import("./pages/Members"));
const Records = lazy(() => import("./pages/Records"));
const Absences = lazy(() => import("./pages/Absences"));
const MemberDetail = lazy(() => import("./pages/MemberDetail"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/schedules" component={Schedules} />
          <Route path="/menus" component={Menus} />
          <Route path="/members" component={Members} />
          <Route path="/members/:id" component={MemberDetail} />
          <Route path="/records" component={Records} />
          <Route path="/absences" component={Absences} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
