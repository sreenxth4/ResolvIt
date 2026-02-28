import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

const AdminLeaderboard = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("id, name, points_total").order("points_total", { ascending: false }).limit(20).then(({ data }) => {
      setLeaders(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <AppLayout><div className="max-w-3xl mx-auto space-y-4"><div className="h-8 w-48 shimmer-bg rounded-lg" /><div className="h-96 shimmer-bg rounded-xl" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 via-primary to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x flex items-center gap-3">
          <div className="p-2 rounded-xl bg-warning/15 animate-float">
            <Trophy className="h-7 w-7 text-amber-500" />
          </div>
          Top Citizens
        </h1>

        <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaders.map((l, i) => (
                  <TableRow key={l.id} className="hover:bg-primary/5 transition-all duration-200 group animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <TableCell className="font-bold text-lg">
                      {i === 0 ? <span className="animate-bounce-subtle inline-block">🥇</span> : i === 1 ? <span className="animate-bounce-subtle inline-block" style={{ animationDelay: "0.3s" }}>🥈</span> : i === 2 ? <span className="animate-bounce-subtle inline-block" style={{ animationDelay: "0.6s" }}>🥉</span> : <span className="text-muted-foreground">#{i + 1}</span>}
                    </TableCell>
                    <TableCell className="font-medium group-hover:text-primary transition-colors">{l.name}</TableCell>
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

export default AdminLeaderboard;
