import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Schedules from "./pages/Schedules";
import Menus from "./pages/Menus";
import Members from "./pages/Members";
import Records from "./pages/Records";
import Absences from "./pages/Absences";
import MemberDetail from "./pages/MemberDetail";

function Router() {
  return (
    <DashboardLayout>
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
