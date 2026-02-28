import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { PriorityBadge } from "@/components/issues/PriorityBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { differenceInHours } from "date-fns";
import { Link } from "react-router-dom";

const AuthorityQueue = () => {
  const { departmentId, role } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<any[]>([]);
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
      .channel('authority-queue-realtime')
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
          <h1 className="text-3xl font-bold animate-gradient-x bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent">Issue Queue</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-48 rounded-xl border-2 focus:border-primary/50 transition-colors"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 rounded-xl border-2 focus:border-primary/50 transition-colors"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shimmer-bg rounded-xl h-24" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <span className="text-5xl block mb-3">📋</span>
            <p className="text-muted-foreground text-lg">No issues in queue.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, idx) => {
              const hoursElapsed = differenceInHours(new Date(), new Date(issue.created_at));
              const remaining = sla - hoursElapsed;
              const isOverdue = remaining <= 0 && issue.status !== "resolved";

              return (
                <Card key={issue.id} className={`group gradient-border hover:shadow-xl transition-all duration-300 animate-fade-in ${isOverdue ? "border-destructive/50 bg-destructive/5" : "hover:border-primary/30"}`} style={{ animationDelay: `${idx * 0.06}s` }}>
                  <CardContent className="p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <Link to={`/authority/issues/${issue.id}`} className="flex-1 min-w-0">
                        <h3 className="font-medium group-hover:text-primary transition-colors">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary/60" />
                          <span className="capitalize">{issue.category.replace("_", " ")}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <StatusBadge status={issue.status} />
                          <PriorityBadge score={issue.priority_score} />
                          {isOverdue ? (
                            <span className="text-xs text-destructive font-medium animate-pulse">⚠ SLA Overdue by {Math.abs(remaining)}h</span>
                          ) : issue.status !== "resolved" ? (
                            <span className="text-xs text-muted-foreground">{remaining}h remaining</span>
                          ) : null}
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        {issue.status === "open" && (
                          <Button size="sm" variant="outline" className="hover:bg-primary/10 active:scale-95 transition-all" onClick={() => updateStatus(issue.id, "in_progress")}>
                            Start Work
                          </Button>
                        )}
                        {(issue.status === "in_progress" || issue.status === "open") && (
                          <Button size="sm" className="bg-gradient-to-r from-secondary to-primary hover:opacity-90 shadow-lg shadow-primary/20 active:scale-95 transition-all" onClick={() => updateStatus(issue.id, "resolved")}>
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

export default AuthorityQueue;
