import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { PriorityBadge } from "@/components/issues/PriorityBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Clock, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { differenceInHours } from "date-fns";
import { Link } from "react-router-dom";

const AuthorityDashboard = () => {
  const { departmentId, role } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, escalated: 0, avgTime: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = role === "admin";
  const effectiveDeptId = isAdmin ? (deptFilter !== "all" ? deptFilter : null) : departmentId;

  useEffect(() => {
    supabase.from("departments").select("*").then(({ data }) => {
      if (data) setDepartments(data);
    });
  }, []);

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      let query = supabase.from("issues").select("*").order("priority_score", { ascending: false });
      if (effectiveDeptId) query = query.eq("department_id", effectiveDeptId);
      if (filter !== "all") query = query.eq("status", filter as any);
      const { data } = await query;
      setIssues(data || []);

      // Stats query (unfiltered by status)
      let statsQuery = supabase.from("issues").select("*");
      if (effectiveDeptId) statsQuery = statsQuery.eq("department_id", effectiveDeptId);
      const { data: allData } = await statsQuery;
      if (allData) {
        const resolved = allData.filter((i) => i.status === "resolved");
        setStats({
          total: allData.length,
          resolved: resolved.length,
          escalated: allData.filter((i) => i.status === "escalated").length,
          avgTime: resolved.length > 0 ? Math.round(resolved.reduce((sum, i) => sum + differenceInHours(new Date(i.updated_at), new Date(i.created_at)), 0) / resolved.length) : 0,
        });
      }
      setLoading(false);
    };
    fetchIssues();
  }, [effectiveDeptId, filter, refreshKey]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channelFilter = effectiveDeptId
      ? { event: '*' as const, schema: 'public', table: 'issues', filter: `department_id=eq.${effectiveDeptId}` }
      : { event: '*' as const, schema: 'public', table: 'issues' };

    const channel = supabase
      .channel('authority-dashboard-realtime')
      .on('postgres_changes', channelFilter, () => {
        setRefreshKey((k) => k + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveDeptId]);

  const sla = effectiveDeptId ? (departments.find((d) => d.id === effectiveDeptId)?.sla_hours || 48) : 48;

  const updateStatus = async (issueId: string, newStatus: string) => {
    const { error } = await supabase.from("issues").update({ status: newStatus as any }).eq("id", issueId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">Authority Dashboard</h1>
          {isAdmin && (
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-48 rounded-xl border-2 hover:border-primary/50 transition-all duration-300"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <GradientStatCard icon={<Clock />} label="Total Issues" value={stats.total} gradient="from-blue-500 to-indigo-500" delay={0} />
          <GradientStatCard icon={<CheckCircle />} label="Resolved" value={stats.resolved} gradient="from-emerald-500 to-teal-400" delay={80} />
          <GradientStatCard icon={<AlertTriangle />} label="Escalated" value={stats.escalated} gradient="from-red-500 to-pink-500" delay={160} />
          <GradientStatCard icon={<BarChart3 />} label="Avg Resolution" value={`${stats.avgTime}h`} gradient="from-amber-500 to-orange-400" delay={240} />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Priority Issue Queue</h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44 rounded-xl border-2 hover:border-primary/50 transition-all duration-300"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={`h-24 shimmer-bg rounded-xl stagger-${i}`} />)}</div>
        ) : issues.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-3">\u2705</div>
            <p className="text-lg text-muted-foreground">No issues found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, idx) => {
              const hoursElapsed = differenceInHours(new Date(), new Date(issue.created_at));
              const remaining = sla - hoursElapsed;
              const isOverdue = remaining <= 0 && issue.status !== "resolved";

              return (
                <Card key={issue.id} className={`group hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden animate-fade-in ${isOverdue ? "border-destructive/50 bg-gradient-to-r from-destructive/5 to-transparent" : "hover:border-primary/30 gradient-border"}`} style={{ animationDelay: `${idx * 50}ms` }}>
                  <CardContent className="p-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-start justify-between gap-4 relative">
                      <Link to={`/authority/issues/${issue.id}`} className="flex-1 min-w-0">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize mt-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                          {issue.category.replace("_", " ")}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <StatusBadge status={issue.status} />
                          <PriorityBadge score={issue.priority_score} />
                          {isOverdue ? (
                            <span className="text-xs text-destructive font-semibold animate-pulse">\u26a0 SLA Overdue by {Math.abs(remaining)}h</span>
                          ) : issue.status !== "resolved" ? (
                            <span className="text-xs text-muted-foreground">{remaining}h remaining</span>
                          ) : null}
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        {issue.status === "open" && (
                          <Button size="sm" variant="outline" className="hover:bg-primary/10 hover:border-primary/50 active:scale-95 transition-all duration-300" onClick={() => updateStatus(issue.id, "in_progress")}>
                            Start Work
                          </Button>
                        )}
                        {(issue.status === "in_progress" || issue.status === "open") && (
                          <Button size="sm" className="bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-300" onClick={() => updateStatus(issue.id, "resolved")}>
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const GradientStatCard = ({ icon, label, value, gradient, delay = 0 }: { icon: React.ReactNode; label: string; value: any; gradient: string; delay?: number }) => (
  <Card className="group hover:shadow-xl hover:scale-105 active:scale-[0.98] transition-all duration-300 overflow-hidden gradient-border animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
    <CardContent className="p-4 flex items-center gap-4 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className={`relative p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        {icon}
      </div>
      <div className="relative">
        <p className="text-3xl font-bold tracking-tight stat-value">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default AuthorityDashboard;
