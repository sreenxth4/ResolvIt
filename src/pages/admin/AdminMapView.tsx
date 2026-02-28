import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IssueMap } from "@/components/map/IssueMap";

const AdminMapView = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("issues").select("*").order("priority_score", { ascending: false }).then(({ data }) => {
      setIssues(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <AppLayout><div className="space-y-4"><div className="h-8 w-48 shimmer-bg rounded-lg" /><div className="h-[600px] shimmer-bg rounded-xl" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">Issue Map</h1>
        <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden gradient-border">
          <CardContent className="p-0">
            <IssueMap issues={issues} height="600px" showHeatmap />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminMapView;
