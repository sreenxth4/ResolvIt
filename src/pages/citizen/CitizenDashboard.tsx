import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { IssueCard } from "@/components/issues/IssueCard";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const CitizenDashboard = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, escalated: 0 });
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [allRes, recentRes] = await Promise.all([
        supabase.from("issues").select("status").eq("reporter_id", user.id),
        supabase.from("issues").select("*").eq("reporter_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (allRes.data) {
        setStats({
          total: allRes.data.length,
          resolved: allRes.data.filter((i) => i.status === "resolved").length,
          inProgress: allRes.data.filter((i) => i.status === "in_progress").length,
          escalated: allRes.data.filter((i) => i.status === "escalated").length,
        });
      }
      if (recentRes.data) setRecentIssues(recentRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
              {t("dashboard.welcome", { name: profile?.name || "Citizen" })}
            </h1>
            <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
          </div>
          <Link to="/citizen/submit">
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-105 active:scale-95 transition-all duration-300 rounded-xl">
              <PlusCircle className="h-4 w-4 mr-2" />{t("dashboard.reportIssue")}
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GradientStatCard icon={<Clock />} label={t("dashboard.totalIssues")} value={stats.total} gradient="from-blue-500 to-indigo-500" delay={0} />
          <GradientStatCard icon={<TrendingUp />} label={t("dashboard.inProgress")} value={stats.inProgress} gradient="from-amber-500 to-orange-400" delay={1} />
          <GradientStatCard icon={<CheckCircle />} label={t("dashboard.resolved")} value={stats.resolved} gradient="from-emerald-500 to-teal-400" delay={2} />
          <GradientStatCard icon={<Award />} label={t("dashboard.civicPoints")} value={profile?.points_total || 0} gradient="from-violet-500 to-purple-500" delay={3} />
        </div>

        {/* Escalation Warning */}
        {stats.escalated > 0 && (
          <Card className="border-destructive/50 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent animate-fade-in overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent animate-pulse" />
            <CardContent className="p-4 flex items-center gap-3 relative z-10">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive animate-bounce-subtle" />
              </div>
              <span className="text-sm font-medium">{t("dashboard.escalatedWarning", { count: String(stats.escalated) })}</span>
            </CardContent>
          </Card>
        )}

        {/* Recent Issues */}
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-gradient-to-r from-primary to-secondary" />
            {t("dashboard.recentIssues")}
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl shimmer-bg" />
              ))}
            </div>
          ) : recentIssues.length === 0 ? (
            <Card className="gradient-border">
              <CardContent className="p-12 text-center">
                <div className="inline-flex p-4 rounded-2xl bg-muted/50 mb-4">
                  <PlusCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t("dashboard.noIssues")}</p>
                <Link to="/citizen/submit" className="text-primary hover:text-secondary transition-colors font-medium underline underline-offset-4 decoration-primary/30 hover:decoration-primary">
                  {t("dashboard.submitFirst")}
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentIssues.map((issue, index) => (
                <div key={issue.id} className="animate-fade-in" style={{ animationDelay: `${0.35 + index * 0.05}s` }}>
                  <IssueCard issue={issue} linkPrefix="/citizen" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

const GradientStatCard = ({ icon, label, value, gradient, delay = 0 }: { icon: React.ReactNode; label: string; value: number; gradient: string; delay?: number }) => (
  <Card className="group hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 overflow-hidden gradient-border animate-fade-in relative" style={{ animationDelay: `${delay * 0.08}s` }}>
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <CardContent className="p-5 flex items-center gap-4 relative z-10">
      <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:shadow-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight stat-value">{value}</p>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default CitizenDashboard;
