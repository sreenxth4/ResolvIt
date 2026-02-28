import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { PriorityBadge } from "@/components/issues/PriorityBadge";
import { toast } from "@/hooks/use-toast";
import { ThumbsUp, Clock, MapPin, User, MessageSquare, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const categories = [
  { value: "roads", label: "Roads & Transport" },
  { value: "water", label: "Water Supply" },
  { value: "electricity", label: "Electricity" },
  { value: "sanitation", label: "Sanitation" },
  { value: "public_safety", label: "Public Safety" },
  { value: "parks", label: "Parks & Recreation" },
  { value: "other", label: "Other" },
];

const IssueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<any>(null);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSeverity, setEditSeverity] = useState("3");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user && issue && issue.reporter_id === user.id;
  const canModify = isOwner && (issue?.status === "open" || issue?.status === "in_progress");

  useEffect(() => {
    if (!id || !user) return;
    const fetch = async () => {
      const [issueRes, logsRes, upvoteRes] = await Promise.all([
        supabase.from("issues").select("*").eq("id", id).single(),
        supabase.from("status_logs").select("*").eq("issue_id", id).order("created_at", { ascending: true }),
        supabase.from("upvotes").select("id").eq("issue_id", id).eq("user_id", user.id).maybeSingle(),
      ]);
      if (issueRes.data) setIssue(issueRes.data);
      if (logsRes.data) setStatusLogs(logsRes.data);
      setHasUpvoted(!!upvoteRes.data);
      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const handleUpvote = async () => {
    if (!user || !id) return;
    if (hasUpvoted) {
      await supabase.from("upvotes").delete().eq("user_id", user.id).eq("issue_id", id);
      setHasUpvoted(false);
      setIssue((prev: any) => prev ? { ...prev, upvote_count: prev.upvote_count - 1 } : prev);
      toast({ title: t("issue.upvoteRemoved") });
    } else {
      const { error } = await supabase.from("upvotes").insert({ user_id: user.id, issue_id: id });
      if (error) {
        toast({ title: t("issue.upvoteFailed"), description: error.message, variant: "destructive" });
        return;
      }
      setHasUpvoted(true);
      setIssue((prev: any) => prev ? { ...prev, upvote_count: prev.upvote_count + 1 } : prev);
      toast({ title: t("issue.upvoted") });
    }
  };

  const openEditDialog = () => {
    if (!issue) return;
    setEditTitle(issue.title);
    setEditDescription(issue.description);
    setEditCategory(issue.category);
    setEditSeverity(String(issue.severity));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("issues").update({
        title: editTitle,
        description: editDescription,
        category: editCategory as any,
        severity: parseInt(editSeverity),
      }).eq("id", id);
      if (error) throw error;
      setIssue((prev: any) => prev ? { ...prev, title: editTitle, description: editDescription, category: editCategory, severity: parseInt(editSeverity) } : prev);
      setEditOpen(false);
      toast({ title: "Issue updated successfully" });
    } catch (err: any) {
      toast({ title: "Failed to update issue", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    setDeleting(true);
    try {
      // Delete dependent rows first to avoid FK constraint errors
      await Promise.all([
        supabase.from("points_ledger").delete().eq("issue_id", id),
        supabase.from("notifications").delete().eq("issue_id", id),
        supabase.from("upvotes").delete().eq("issue_id", id),
        supabase.from("status_logs").delete().eq("issue_id", id),
        supabase.from("issue_reports").delete().eq("issue_id", id),
      ]);
      const { data, error } = await supabase
        .from("issues")
        .delete()
        .eq("id", id)
        .eq("reporter_id", user.id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Could not delete this issue. It may have already been processed.");
      toast({ title: "Issue deleted successfully" });
      navigate("/citizen/issues");
    } catch (err: any) {
      toast({ title: "Failed to delete issue", description: err.message, variant: "destructive" });
      setDeleting(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-2/3 shimmer-bg rounded-lg" />
        <div className="h-48 shimmer-bg rounded-xl" />
        <div className="h-32 shimmer-bg rounded-xl" />
      </div>
    </AppLayout>
  );
  if (!issue) return <AppLayout><p className="text-muted-foreground text-center py-16 animate-fade-in">{t("issue.notFound")}</p></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-bold">{issue.title}</h1>
            {canModify && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={openEditDialog}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1.5" disabled={deleting}>
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this issue?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone. The issue and all associated data will be permanently removed.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <StatusBadge status={issue.status} />
            <PriorityBadge score={issue.priority_score} />
            <span className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
              {t(`cat.${issue.category}`)}
            </span>
          </div>
        </div>

        <Card className="overflow-hidden gradient-border animate-fade-in stagger-1">
          <CardContent className="p-6">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{issue.description}</p>
            {issue.image_url && (
              <div className="mt-4 rounded-xl overflow-hidden group">
                <img src={issue.image_url} alt="Issue" className="w-full max-h-72 object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 flex-wrap animate-fade-in stagger-2">
          <Button
            variant={hasUpvoted ? "default" : "outline"}
            onClick={handleUpvote}
            disabled={issue.reporter_id === user?.id}
            className={`transition-all duration-300 ${hasUpvoted ? "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30" : "hover:border-primary/50"} active:scale-95`}
          >
            <ThumbsUp className={`h-4 w-4 mr-2 transition-transform ${hasUpvoted ? "scale-110" : ""}`} />
            {issue.upvote_count} {t("issue.upvotes")}
          </Button>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <MessageSquare className="h-4 w-4" /> {t("issue.reports", { count: String(issue.report_count) })}
            </span>
            <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <MapPin className="h-4 w-4" /> {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}
            </span>
            <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Clock className="h-4 w-4" /> {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <Card className="overflow-hidden animate-fade-in stagger-3">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="text-base font-semibold">{t("issue.statusTimeline")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {statusLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{t("issue.noStatusChanges")}</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10" />
                <div className="space-y-4">
                  {statusLogs.map((log, idx) => (
                    <div key={log.id} className="flex items-start gap-4 text-sm animate-fade-in-left relative" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-md shadow-primary/25 flex-shrink-0 mt-0.5 ring-4 ring-background" />
                      <div>
                        <p className="font-semibold capitalize">
                          {log.old_status ? `${log.old_status.replace("_", " ")} → ` : ""}{log.new_status.replace("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(log.created_at), "PPp")}</p>
                        {log.note && <p className="text-muted-foreground mt-1 bg-muted/50 rounded-lg p-2 text-xs">{log.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Issue</DialogTitle>
              <DialogDescription>Update the details of your reported issue.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={2000} rows={4} className="resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{t(`cat.${c.value}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={editSeverity} onValueChange={setEditSeverity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <SelectItem key={s} value={String(s)}>{s} - {t(`sev.${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editTitle.trim() || !editDescription.trim()}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default IssueDetail;
