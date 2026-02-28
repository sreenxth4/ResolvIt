import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IssueMap } from "@/components/map/IssueMap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PriorityBadge } from "@/components/issues/PriorityBadge";
import { BarChart3, CheckCircle, AlertTriangle, Clock, Users } from "lucide-react";
import { differenceInHours } from "date-fns";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("issues").select("*").order("priority_score", { ascending: false }),
      supabase.from("departments").select("*"),
      supabase.from("profiles").select("id, name, points_total").order("points_total", { ascending: false }).limit(10),
    ]).then(([issuesRes, deptsRes, leadersRes]) => {
      if (issuesRes.data) setIssues(issuesRes.data);
      if (deptsRes.data) setDepartments(deptsRes.data);
      if (leadersRes.data) setLeaders(leadersRes.data);
      setLoading(false);
    });
  }, []);

  const totalIssues = issues.length;
  const resolved = issues.filter((i) => i.status === "resolved");
  const escalated = issues.filter((i) => i.status === "escalated");
  const resolvedPct = totalIssues > 0 ? Math.round((resolved.length / totalIssues) * 100) : 0;
  const avgResTime = resolved.length > 0
    ? Math.round(resolved.reduce((s, i) => s + differenceInHours(new Date(i.updated_at), new Date(i.created_at)), 0) / resolved.length)
    : 0;
  const escalationRate = totalIssues > 0 ? Math.round((escalated.length / totalIssues) * 100) : 0;

  const deptStats = departments.map((d) => {
    const dIssues = issues.filter((i) => i.department_id === d.id);
    const dResolved = dIssues.filter((i) => i.status === "resolved");
    const avgTime = dResolved.length > 0
      ? Math.round(dResolved.reduce((s, i) => s + differenceInHours(new Date(i.updated_at), new Date(i.created_at)), 0) / dResolved.length)
      : 0;
    const slaCompliance = dIssues.length > 0
      ? Math.round((dIssues.filter((i) => i.status !== "escalated").length / dIssues.length) * 100)
      : 100;
    return { ...d, total: dIssues.length, resolved: dResolved.length, avgTime, slaCompliance };
  });

  if (loading) return (
    <AppLayout>
      <div className="space-y-6">
        <div className="h-8 w-64 shimmer-bg rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 shimmer-bg rounded-xl" />)}
        </div>
        <div className="h-96 shimmer-bg rounded-xl" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
          Admin Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <GradientStatCard icon={<BarChart3 />} label="Total Issues" value={totalIssues} gradient="from-violet-500 to-purple-500" delay={0} href="/authority/queue" />
          <GradientStatCard icon={<CheckCircle />} label="Resolved %" value={`${resolvedPct}%`} gradient="from-emerald-500 to-teal-400" delay={80} />
          <GradientStatCard icon={<Clock />} label="Avg Resolution" value={`${avgResTime}h`} gradient="from-blue-500 to-cyan-400" delay={160} />
          <GradientStatCard icon={<AlertTriangle />} label="Escalation Rate" value={`${escalationRate}%`} gradient="from-red-500 to-rose-400" delay={240} />
          <GradientStatCard icon={<Users />} label="Active Citizens" value={leaders.length} gradient="from-amber-500 to-orange-400" delay={320} />
        </div>

        {/* Map */}
        <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden gradient-border animate-fade-in stagger-2">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent"><CardTitle>Issue Map</CardTitle></CardHeader>
          <CardContent>
            <IssueMap issues={issues} height="400px" showHeatmap />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Performance */}
          <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in stagger-3">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent"><CardTitle>Department Performance</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="text-right font-semibold">Issues</TableHead>
                    <TableHead className="text-right font-semibold">Resolved</TableHead>
                    <TableHead className="text-right font-semibold">Avg Time</TableHead>
                    <TableHead className="text-right font-semibold">SLA %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptStats.map((d, idx) => (
                    <TableRow key={d.id} className="hover:bg-primary/5 transition-all duration-200 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-right font-semibold">{d.total}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-semibold">{d.resolved}</TableCell>
                      <TableCell className="text-right">{d.avgTime}h</TableCell>
                      <TableCell className="text-right">
                        <span className={d.slaCompliance >= 80 ? "text-emerald-600 font-bold" : "text-destructive font-bold"}>{d.slaCompliance}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Escalated Issues */}
          <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in stagger-4">
            <CardHeader className="bg-gradient-to-r from-destructive/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                Escalated Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {escalated.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">\ud83c\udf89</div>
                  <p className="text-sm text-muted-foreground">No escalated issues!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {escalated.slice(0, 10).map((issue, idx) => (
                    <Link key={issue.id} to={`/admin/issues/${issue.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 hover:scale-[1.015] hover:shadow-md transition-all duration-300 cursor-pointer animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div>
                          <p className="font-medium text-sm">{issue.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{issue.category.replace("_", " ")}</p>
                        </div>
                        <PriorityBadge score={issue.priority_score} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in stagger-5">
          <CardHeader className="bg-gradient-to-r from-warning/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <span className="animate-float inline-block">\ud83c\udfc6</span> Top Citizens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 font-semibold">Rank</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="text-right font-semibold">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaders.map((l, i) => (
                  <TableRow key={l.id} className="hover:bg-primary/5 transition-all duration-200 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <TableCell className="font-bold text-lg">
                      {i === 0 ? <span className="animate-bounce-subtle inline-block">\ud83e\udd47</span> : i === 1 ? <span className="animate-bounce-subtle inline-block" style={{ animationDelay: "0.3s" }}>\ud83e\udd48</span> : i === 2 ? <span className="animate-bounce-subtle inline-block" style={{ animationDelay: "0.6s" }}>\ud83e\udd49</span> : <span className="text-muted-foreground">#{i + 1}</span>}
                    </TableCell>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-right font-bold text-primary stat-value">{l.points_total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

const GradientStatCard = ({ icon, label, value, gradient, delay = 0, href }: { icon: React.ReactNode; label: string; value: any; gradient: string; delay?: number; href?: string }) => {
  const card = (
    <Card className={`group hover:shadow-xl hover:scale-105 active:scale-[0.98] transition-all duration-300 overflow-hidden gradient-border animate-fade-in ${href ? "cursor-pointer" : ""}`} style={{ animationDelay: `${delay}ms` }}>
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
  return href ? <Link to={href}>{card}</Link> : card;
};

export default AdminDashboard;
