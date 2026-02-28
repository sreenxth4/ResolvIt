import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { differenceInHours } from "date-fns";
import { Building2 } from "lucide-react";

const AdminDepartments = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("departments").select("*"),
      supabase.from("issues").select("*"),
    ]).then(([deptsRes, issuesRes]) => {
      setDepartments(deptsRes.data || []);
      setIssues(issuesRes.data || []);
      setLoading(false);
    });
  }, []);

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

  if (loading) return <AppLayout><div className="space-y-6"><div className="h-8 w-48 shimmer-bg rounded-lg" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-48 shimmer-bg rounded-xl" />)}</div></div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          Departments
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deptStats.map((d, idx) => (
            <Card key={d.id} className="group hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border-l-4 border-l-primary gradient-border overflow-hidden animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{d.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{d.description || "No description"}</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-3xl font-bold stat-value">{d.total}</p>
                      <p className="text-sm text-muted-foreground">Total Issues</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-secondary stat-value">{d.resolved}</p>
                      <p className="text-sm text-muted-foreground">Resolved</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold stat-value">{d.avgTime}h</p>
                      <p className="text-sm text-muted-foreground">Avg Time</p>
                    </div>
                    <div>
                      <p className={`text-3xl font-bold stat-value ${d.slaCompliance >= 80 ? "text-secondary" : "text-destructive"}`}>{d.slaCompliance}%</p>
                      <p className="text-sm text-muted-foreground">SLA Compliance</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">SLA: {d.sla_hours}h</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in stagger-3">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent"><CardTitle>Detailed Comparison</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                  <TableHead className="text-right">SLA %</TableHead>
                  <TableHead className="text-right">SLA Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptStats.map((d) => (
                  <TableRow key={d.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-right">{d.total}</TableCell>
                    <TableCell className="text-right">{d.resolved}</TableCell>
                    <TableCell className="text-right">{d.avgTime}h</TableCell>
                    <TableCell className="text-right">{d.slaCompliance}%</TableCell>
                    <TableCell className="text-right">{d.sla_hours}h</TableCell>
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

export default AdminDepartments;
