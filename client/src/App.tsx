import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const Schedules = lazy(() => import("./pages/Schedules"));
const Menus = lazy(() => import("./pages/Menus"));
const Members = lazy(() => import("./pages/Members"));
const Records = lazy(() => import("./pages/Records"));
const Absences = lazy(() => import("./pages/Absences"));
const MemberDetail = lazy(() => import("./pages/MemberDetail"));
const BattingStats = lazy(() => import("./pages/BattingStats"));
const PitchingStats = lazy(() => import("./pages/PitchingStats"));
const VelocityData = lazy(() => import("./pages/VelocityData"));
const PhysicalData = lazy(() => import("./pages/PhysicalData"));
const GameResults = lazy(() => import("./pages/GameResults"));
const CompareMembers = lazy(() => import("./pages/CompareMembers"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex items-center gap-3">
        <span className="accent-square animate-pulse" />
        <span className="text-sm text-muted-foreground font-medium">読み込み中...</span>
      </div>
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
          <Route path="/batting" component={BattingStats} />
          <Route path="/pitching" component={PitchingStats} />
          <Route path="/velocity" component={VelocityData} />
          <Route path="/physical" component={PhysicalData} />
          <Route path="/games" component={GameResults} />
          <Route path="/compare" component={CompareMembers} />
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
