import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { ThumbsUp, MapPin, Clock, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface Issue {
  id: string;
  title: string;
  category: string;
  status: string;
  priority_score: number;
  report_count: number;
  upvote_count: number;
  created_at: string;
  lat: number;
  lng: number;
}

interface IssueCardProps {
  issue: Issue;
  linkPrefix?: string;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issue: Issue) => void;
}

export const IssueCard = ({ issue, linkPrefix = "/citizen", onEdit, onDelete }: IssueCardProps) => {
  const { t } = useLanguage();
  const canModify = (onEdit || onDelete) && (issue.status === "open" || issue.status === "in_progress");

  return (
    <Link to={`${linkPrefix}/issues/${issue.id}`}>
      <Card className="group hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.015] active:scale-[0.99] transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary gradient-border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-300">{issue.title}</h3>
              <p className="text-sm text-muted-foreground capitalize mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                {t(`cat.${issue.category}`)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={issue.status} />
              <PriorityBadge score={issue.priority_score} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 group-hover:text-foreground/70 transition-colors">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1 group-hover:text-foreground/70 transition-colors">
                <ThumbsUp className="h-3 w-3" />
                {issue.upvote_count}
              </span>
              <span className="flex items-center gap-1 group-hover:text-foreground/70 transition-colors">
                <MessageSquare className="h-3 w-3" />
                {t("issue.reports", { count: String(issue.report_count) })}
              </span>
              <span className="flex items-center gap-1 group-hover:text-foreground/70 transition-colors">
                <MapPin className="h-3 w-3" />
                {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}
              </span>
            </div>
            {canModify && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(issue); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(issue); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
