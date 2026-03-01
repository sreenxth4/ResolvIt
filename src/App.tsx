import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import HomePage from "./pages/HomePage";
// import AuthorityPage from "./pages/AuthorityPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import SubmitIssue from "./pages/citizen/SubmitIssue";
import MyIssues from "./pages/citizen/MyIssues";
import IssueDetail from "./pages/citizen/IssueDetail";
import Leaderboard from "./pages/citizen/Leaderboard";
import AuthorityDashboard from "./pages/authority/AuthorityDashboard";
import AuthorityQueue from "./pages/authority/AuthorityQueue";
import AuthorityStats from "./pages/authority/AuthorityStats";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMapView from "./pages/admin/AdminMapView";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminEscalations from "./pages/admin/AdminEscalations";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import ManageAuthorities from "./pages/admin/ManageAuthorities";
import AdminPerformance from "./pages/admin/AdminPerformance";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Demo Home and Authority Pages for Vercel static hosting */}
              {/* Default route redirects to /auth */}
              <Route path="/" element={<Navigate to="/auth" replace />} />

            {/* Existing routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Citizen Routes */}
            <Route path="/citizen" element={<ProtectedRoute allowedRoles={["citizen"]}><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/citizen/submit" element={<ProtectedRoute allowedRoles={["citizen"]}><SubmitIssue /></ProtectedRoute>} />
            <Route path="/citizen/issues" element={<ProtectedRoute allowedRoles={["citizen"]}><MyIssues /></ProtectedRoute>} />
            <Route path="/citizen/issues/:id" element={<ProtectedRoute allowedRoles={["citizen"]}><IssueDetail /></ProtectedRoute>} />
            <Route path="/citizen/leaderboard" element={<ProtectedRoute allowedRoles={["citizen"]}><Leaderboard /></ProtectedRoute>} />

            {/* Authority Routes */}
            <Route path="/authority/dashboard" element={<ProtectedRoute allowedRoles={["authority", "admin"]}><AuthorityDashboard /></ProtectedRoute>} />
            <Route path="/authority/queue" element={<ProtectedRoute allowedRoles={["authority", "admin"]}><AuthorityQueue /></ProtectedRoute>} />
            <Route path="/authority/stats" element={<ProtectedRoute allowedRoles={["authority", "admin"]}><AuthorityStats /></ProtectedRoute>} />
            <Route path="/authority/issues/:id" element={<ProtectedRoute allowedRoles={["authority"]}><IssueDetail /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/map" element={<ProtectedRoute allowedRoles={["admin"]}><AdminMapView /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDepartments /></ProtectedRoute>} />
            <Route path="/admin/escalations" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEscalations /></ProtectedRoute>} />
            <Route path="/admin/leaderboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLeaderboard /></ProtectedRoute>} />
            <Route path="/admin/authorities" element={<ProtectedRoute allowedRoles={["admin"]}><ManageAuthorities /></ProtectedRoute>} />
            <Route path="/admin/performance" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPerformance /></ProtectedRoute>} />
            <Route path="/admin/issues/:id" element={<ProtectedRoute allowedRoles={["admin"]}><IssueDetail /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
