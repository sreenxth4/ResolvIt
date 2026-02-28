import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import { differenceInHours } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(210, 70%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(152, 60%, 40%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 55%)",
  "hsl(180, 60%, 40%)",
];

interface AuthorityInfo {
  id: string;
  name: string;
  departmentName: string;
  departmentId: string | null;
}

interface AuthorityStat {
  authority: AuthorityInfo;
  totalIssues: number;
  resolved: number;
  open: number;
  inProgress: number;
  escalated: number;
  resolutionRate: number;
  avgResolutionHours: number;
}

const AdminPerformance = () => {
  const [authorities, setAuthorities] = useState<AuthorityStat[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Global aggregates
  const [allIssues, setAllIssues] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // 1. Load departments
    const { data: depts } = await supabase.from("departments").select("*");
    setDepartments(depts || []);
    const deptMap = new Map((depts || []).map((d: any) => [d.id, d.name]));

    // 2. Load all authority user_roles
    const { data: authorityRoles } = await supabase
      .from("user_roles")
      .select("user_id, department_id")
      .eq("role", "authority");

    if (!authorityRoles || authorityRoles.length === 0) {
      setLoading(false);
      return;
    }

    const userIds = authorityRoles.map((r: any) => r.user_id);
    const roleDeptMap = new Map(authorityRoles.map((r: any) => [r.user_id, r.department_id]));

    // 3. Load profiles for authority users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    const authorityInfoMap = new Map<string, AuthorityInfo>();
    (profiles || []).forEach((p: any) => {
      const deptId = roleDeptMap.get(p.id);
      authorityInfoMap.set(p.id, {
        id: p.id,
        name: p.name || "Unknown",
        departmentId: deptId || null,
        departmentName: deptId ? (deptMap.get(deptId) || "Unknown") : "Unassigned",
      });
    });

    // 4. Load ALL issues
    const { data: allIssuesData } = await supabase.from("issues").select("*");
    setAllIssues(allIssuesData || []);

    // 5. Group issues by authority's department (so unassigned issues still count)
    //    If an issue is directly assigned to an authority, it counts for that authority.
    //    Otherwise, match by department_id or fall back to category→department name.
    const categoryToDeptName: Record<string, string> = {
      roads: "Roads & Infrastructure",
      water: "Water & Sanitation",
      sanitation: "Water & Sanitation",
      electricity: "Electricity & Power",
      public_safety: "Public Safety",
      parks: "Parks & Recreation",
    };
    // Build reverse map: department name → department id
    const deptNameToId = new Map((depts || []).map((d: any) => [d.name, d.id]));

    const issuesByAuthority = new Map<string, any[]>();
    for (const uid of userIds) {
      issuesByAuthority.set(uid, []);
    }

    (allIssuesData || []).forEach((issue: any) => {
      if (issue.assigned_authority_id && issuesByAuthority.has(issue.assigned_authority_id)) {
        // Directly assigned → count for that authority
        issuesByAuthority.get(issue.assigned_authority_id)!.push(issue);
      } else {
        // Determine effective department: use department_id if set, otherwise map from category
        let effectiveDeptId = issue.department_id;
        if (!effectiveDeptId && issue.category) {
          const mappedName = categoryToDeptName[issue.category];
          if (mappedName) effectiveDeptId = deptNameToId.get(mappedName) || null;
        }
        if (effectiveDeptId) {
          for (const [uid, info] of authorityInfoMap.entries()) {
            if (info.departmentId === effectiveDeptId) {
              issuesByAuthority.get(uid)!.push(issue);
            }
          }
        }
      }
    });

    // 6. Compute stats per authority
    const stats: AuthorityStat[] = [];
    for (const [uid, authIssues] of issuesByAuthority.entries()) {
      const info = authorityInfoMap.get(uid);
      if (!info) continue;

      const resolved = authIssues.filter((i: any) => i.status === "resolved");
      const open = authIssues.filter((i: any) => i.status === "open");
      const inProgress = authIssues.filter((i: any) => i.status === "in_progress");
      const escalated = authIssues.filter((i: any) => i.status === "escalated");

      const avgHours =
        resolved.length > 0
          ? Math.round(
              resolved.reduce(
                (sum: number, i: any) =>
                  sum + differenceInHours(new Date(i.updated_at), new Date(i.created_at)),
                0,
              ) / resolved.length,
            )
          : 0;

      stats.push({
        authority: info,
        totalIssues: authIssues.length,
        resolved: resolved.length,
        open: open.length,
        inProgress: inProgress.length,
        escalated: escalated.length,
        resolutionRate: authIssues.length > 0 ? Math.round((resolved.length / authIssues.length) * 100) : 0,
        avgResolutionHours: avgHours,
      });
    }

    // Sort by total issues desc
    stats.sort((a, b) => b.totalIssues - a.totalIssues);
    setAuthorities(stats);
    setLoading(false);
  };

  // Filter by department
  const filtered =
    deptFilter === "all"
      ? authorities
      : authorities.filter((a) => a.authority.departmentId === deptFilter);

  // Global totals — based on ALL issues system-wide (filtered by dept if selected)
  const globalIssues =
    deptFilter === "all"
      ? allIssues
      : allIssues.filter((i) => i.department_id === deptFilter);

  const totalIssuesCount = globalIssues.length;
  const totalResolved = globalIssues.filter((i) => i.status === "resolved").length;
  const totalEscalated = globalIssues.filter((i) => i.status === "escalated").length;
  const totalAssigned = filtered.reduce((s, a) => s + a.totalIssues, 0);
  const overallRate = totalIssuesCount > 0 ? Math.round((totalResolved / totalIssuesCount) * 100) : 0;

  const resolvedGlobal = globalIssues.filter((i) => i.status === "resolved");
  const avgOverallHours =
    resolvedGlobal.length > 0
      ? Math.round(
          resolvedGlobal.reduce(
            (sum, i) => sum + differenceInHours(new Date(i.updated_at), new Date(i.created_at)),
            0,
          ) / resolvedGlobal.length,
        )
      : 0;

  // Charts data
  const barData = filtered.map((a) => ({
    name: a.authority.name.split(" ").slice(0, 2).join(" "),
    Resolved: a.resolved,
    Open: a.open,
    "In Progress": a.inProgress,
    Escalated: a.escalated,
  }));

  const statusTotals = [
    { name: "Open", value: globalIssues.filter((i) => i.status === "open").length },
    { name: "In Progress", value: globalIssues.filter((i) => i.status === "in_progress").length },
    { name: "Resolved", value: totalResolved },
    { name: "Escalated", value: totalEscalated },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="h-8 w-72 shimmer-bg rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-24 shimmer-bg rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 shimmer-bg rounded-xl" />
            <div className="h-72 shimmer-bg rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            Authority Performance
          </h1>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-52 rounded-xl border-2 hover:border-primary/50 transition-all duration-300">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <GradientStatCard
            icon={<Users className="h-5 w-5" />}
            label="Authorities"
            value={filtered.length}
            gradient="from-indigo-500 to-purple-400"
          />
          <GradientStatCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="Total Issues"
            value={totalIssuesCount}
            gradient="from-blue-500 to-cyan-400"
          />
          <GradientStatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Resolution Rate"
            value={`${overallRate}%`}
            gradient="from-emerald-500 to-green-400"
          />
          <GradientStatCard
            icon={<Clock className="h-5 w-5" />}
            label="Avg Resolution"
            value={`${avgOverallHours}h`}
            gradient="from-amber-500 to-yellow-400"
          />
          <GradientStatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Escalated"
            value={totalEscalated}
            gradient="from-red-500 to-rose-400"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status distribution pie */}
          <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in stagger-2">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
              <CardTitle>Overall Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statusTotals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusTotals}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusTotals.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Issues per authority bar chart */}
          <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in stagger-3">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
              <CardTitle>Issues per Authority</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No authorities found</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Resolved" stackId="a" fill="hsl(152, 60%, 40%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="In Progress" stackId="a" fill="hsl(38, 92%, 50%)" />
                    <Bar dataKey="Open" stackId="a" fill="hsl(210, 70%, 55%)" />
                    <Bar dataKey="Escalated" stackId="a" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-authority cards */}
        <h2 className="text-xl font-semibold mt-2 animate-fade-in stagger-4">Individual Authority Stats</h2>
        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No authorities found for this department.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((a, idx) => (
              <Card key={a.authority.id} className="group hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-l-4 border-l-primary/60 gradient-border overflow-hidden animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                <CardContent className="p-5 space-y-3 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center justify-between relative">
                    <div>
                      <p className="font-semibold text-lg">{a.authority.name}</p>
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {a.authority.departmentName}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary stat-value">{a.resolutionRate}%</p>
                      <p className="text-sm text-muted-foreground">Resolution</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    <div>
                      <p className="text-lg font-bold">{a.totalIssues}</p>
                      <p className="text-[11px] text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-600">{a.resolved}</p>
                      <p className="text-[11px] text-muted-foreground">Resolved</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{a.avgResolutionHours}h</p>
                      <p className="text-[11px] text-muted-foreground">Avg Time</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">{a.escalated}</p>
                      <p className="text-[11px] text-muted-foreground">Escalated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detailed comparison table */}
        <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in stagger-5">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle>Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Authority</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Issues</TableHead>
                  <TableHead className="text-center">Resolved</TableHead>
                  <TableHead className="text-center">In Progress</TableHead>
                  <TableHead className="text-center">Escalated</TableHead>
                  <TableHead className="text-center">Avg Time</TableHead>
                  <TableHead className="text-center">Resolution %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                      No authorities found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.authority.id}>
                      <TableCell className="font-medium">{a.authority.name}</TableCell>
                      <TableCell>{a.authority.departmentName}</TableCell>
                      <TableCell className="text-center">{a.totalIssues}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">
                        {a.resolved}
                      </TableCell>
                      <TableCell className="text-center text-amber-600">{a.inProgress}</TableCell>
                      <TableCell className="text-center text-red-600">{a.escalated}</TableCell>
                      <TableCell className="text-center">{a.avgResolutionHours}h</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            a.resolutionRate >= 80
                              ? "text-emerald-600 font-bold"
                              : a.resolutionRate >= 50
                                ? "text-amber-600 font-bold"
                                : "text-red-600 font-bold"
                          }
                        >
                          {a.resolutionRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

const GradientStatCard = ({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: any;
  gradient: string;
}) => (
  <Card className="group hover:shadow-xl hover:scale-105 active:scale-[0.98] transition-all duration-300 overflow-hidden gradient-border">
    <CardContent className="p-4 flex items-center gap-4 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div
        className={`relative p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
      >
        {icon}
      </div>
      <div className="relative">
        <p className="text-3xl font-bold stat-value">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default AdminPerformance;
