import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Award, Star } from "lucide-react";

const Leaderboard = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, points_total, avatar_url")
        .order("points_total", { ascending: false })
        .limit(10);
      if (data) setLeaders(data);
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-warning/15 animate-float">
            <Trophy className="h-7 w-7 text-warning" />
          </div>
          <span className="bg-gradient-to-r from-warning via-primary to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
            {t("leaderboard.title")}
          </span>
        </h1>

        {profile && (
          <Card className="gradient-border overflow-hidden animate-fade-in stagger-1">
            <CardContent className="p-5 flex items-center gap-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
              <div className="relative p-3 rounded-full bg-primary/10">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div className="relative">
                <p className="font-bold text-lg">{t("leaderboard.yourPoints", { points: String(profile.points_total) })}</p>
                <p className="text-sm text-muted-foreground">{t("leaderboard.keepReporting")}</p>
              </div>
              <Star className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 text-primary/10 animate-float" />
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden animate-fade-in stagger-2">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="text-lg">{t("leaderboard.top10")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 font-semibold">{t("leaderboard.rank")}</TableHead>
                  <TableHead className="font-semibold">{t("leaderboard.name")}</TableHead>
                  <TableHead className="text-right font-semibold">{t("leaderboard.points")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaders.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-12">{t("leaderboard.noData")}</TableCell></TableRow>
                ) : (
                  leaders.map((l, i) => (
                    <TableRow
                      key={l.id}
                      className={`transition-all duration-300 hover:bg-primary/5 animate-fade-in ${l.id === user?.id ? "bg-primary/8 border-l-2 border-l-primary" : ""} ${i < 3 ? "font-medium" : ""}`}
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <TableCell className="font-bold text-lg">
                        {i === 0 ? <span className="inline-block animate-bounce-subtle">🥇</span> : i === 1 ? <span className="inline-block animate-bounce-subtle" style={{ animationDelay: "0.3s" }}>🥈</span> : i === 2 ? <span className="inline-block animate-bounce-subtle" style={{ animationDelay: "0.6s" }}>🥉</span> : <span className="text-muted-foreground">#{i + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary stat-value">{l.points_total}</span>
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

export default Leaderboard;
