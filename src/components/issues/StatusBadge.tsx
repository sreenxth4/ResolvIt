import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const statusConfig: Record<string, { labelKey: string; className: string; dotColor: string }> = {
  open: { labelKey: "status.open", className: "bg-info/15 text-info-foreground border border-info/30", dotColor: "bg-info" },
  in_progress: { labelKey: "status.in_progress", className: "bg-warning/15 text-warning-foreground border border-warning/30", dotColor: "bg-warning animate-pulse" },
  resolved: { labelKey: "status.resolved", className: "bg-success/15 text-success-foreground border border-success/30", dotColor: "bg-success" },
  escalated: { labelKey: "status.escalated", className: "bg-critical/15 text-critical-foreground border border-critical/30", dotColor: "bg-critical animate-pulse" },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useLanguage();
  const config = statusConfig[status] || statusConfig.open;
  return (
    <Badge className={cn("gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full transition-all duration-200 hover:scale-105", config.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {t(config.labelKey)}
    </Badge>
  );
};
