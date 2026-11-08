import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "@/lib/theme";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import AgentRuns from "@/pages/AgentRuns";
import AgentRunDetail from "@/pages/AgentRunDetail";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Incidents from "@/pages/Incidents";
import Deployments from "@/pages/Deployments";
import Approvals from "@/pages/Approvals";
import Infrastructure from "@/pages/Infrastructure";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Toaster } from "./components/ui/sonner";
// Add page imports here

const AuthenticatedApp = () => {
  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/runs" element={<AgentRuns />} />
        <Route path="/runs/:runId" element={<AgentRunDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/deployments" element={<Deployments />} />
        <Route path="/infrastructure" element={<Infrastructure />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Toaster />
          <AuthenticatedApp />
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
