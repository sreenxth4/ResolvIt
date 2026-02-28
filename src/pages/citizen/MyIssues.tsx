import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { IssueCard } from "@/components/issues/IssueCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const categories = [
  { value: "roads", label: "Roads & Transport" },
  { value: "water", label: "Water Supply" },
  { value: "electricity", label: "Electricity" },
  { value: "sanitation", label: "Sanitation" },
  { value: "public_safety", label: "Public Safety" },
  { value: "parks", label: "Parks & Recreation" },
  { value: "other", label: "Other" },
];

const MyIssues = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editIssue, setEditIssue] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSeverity, setEditSeverity] = useState("3");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIssue, setDeleteIssue] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchIssues = async () => {
      let query = supabase.from("issues").select("*").eq("reporter_id", user.id).order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter as any);
      const { data } = await query;
      setIssues(data || []);
      setLoading(false);
    };
    fetchIssues();
  }, [user, filter]);

  const handleEdit = (issue: any) => {
    setEditIssue(issue);
    setEditTitle(issue.title);
    setEditDescription(issue.description);
    setEditCategory(issue.category);
    setEditSeverity(String(issue.severity));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editIssue) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("issues").update({
        title: editTitle,
        description: editDescription,
        category: editCategory as any,
        severity: parseInt(editSeverity),
      }).eq("id", editIssue.id);
      if (error) throw error;
      setIssues((prev) => prev.map((i) => i.id === editIssue.id ? { ...i, title: editTitle, description: editDescription, category: editCategory, severity: parseInt(editSeverity) } : i));
      setEditOpen(false);
      toast({ title: "Issue updated successfully" });
    } catch (err: any) {
      toast({ title: "Failed to update issue", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (issue: any) => {
    setDeleteIssue(issue);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteIssue || !user) return;
    setDeleting(true);
    try {
      // Delete dependent rows first to avoid FK constraint errors
      await Promise.all([
        supabase.from("points_ledger").delete().eq("issue_id", deleteIssue.id),
        supabase.from("notifications").delete().eq("issue_id", deleteIssue.id),
        supabase.from("upvotes").delete().eq("issue_id", deleteIssue.id),
        supabase.from("status_logs").delete().eq("issue_id", deleteIssue.id),
        supabase.from("issue_reports").delete().eq("issue_id", deleteIssue.id),
      ]);
      const { data, error } = await supabase
        .from("issues")
        .delete()
        .eq("id", deleteIssue.id)
        .eq("reporter_id", user.id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Could not delete this issue. It may have already been processed.");
      setIssues((prev) => prev.filter((i) => i.id !== deleteIssue.id));
      setDeleteOpen(false);
      toast({ title: "Issue deleted successfully" });
    } catch (err: any) {
      toast({ title: "Failed to delete issue", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
            {t("myIssues.title")}
          </h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44 h-10 rounded-xl border-2 hover:border-primary/50 transition-all duration-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("myIssues.all")}</SelectItem>
              <SelectItem value="open">{t("myIssues.open")}</SelectItem>
              <SelectItem value="in_progress">{t("myIssues.inProgress")}</SelectItem>
              <SelectItem value="resolved">{t("myIssues.resolved")}</SelectItem>
              <SelectItem value="escalated">{t("myIssues.escalated")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-24 rounded-xl shimmer-bg stagger-${i}`} />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg text-muted-foreground">{t("myIssues.noIssues")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, idx) => (
              <div key={issue.id} className="animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                <IssueCard issue={issue} onEdit={handleEdit} onDelete={handleDeleteClick} />
              </div>
            ))}
          </div>
        )}

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

        {/* Delete Confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this issue?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. The issue and all associated data will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default MyIssues;
