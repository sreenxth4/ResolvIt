import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export const getPriorityLabel = (score: number) => {
  if (score >= 16) return "critical";
  if (score >= 11) return "high";
  if (score >= 6) return "medium";
  return "low";
};

const priorityConfig: Record<string, string> = {
  low: "bg-muted/80 text-muted-foreground border border-muted-foreground/10",
  medium: "bg-warning/10 text-warning border border-warning/20",
  high: "bg-warning/90 text-warning-foreground border border-warning shadow-sm shadow-warning/20",
  critical: "bg-critical text-critical-foreground border border-critical shadow-md shadow-critical/30 animate-pulse",
};

export const PriorityBadge = ({ score }: { score: number }) => {
  const { t } = useLanguage();
  const key = getPriorityLabel(score);
  return (
    <Badge className={cn("rounded-full text-xs font-semibold px-2.5 py-0.5 transition-all duration-200 hover:scale-105", priorityConfig[key])}>
      {t(`priority.${key}`)} ({score})
    </Badge>
  );
};
