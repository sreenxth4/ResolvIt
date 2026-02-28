import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Shield, Phone, CreditCard, Trash2, MapPin, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ManageAuthorities = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [mandalId, setMandalId] = useState("");
  const [deptId, setDeptId] = useState("");

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editAuthority, setEditAuthority] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editMandalId, setEditMandalId] = useState("");
  const [editDeptId, setEditDeptId] = useState("");

  useEffect(() => {
    supabase.from("departments").select("*").then(({ data }) => {
      if (data) setDepartments(data);
    });
    supabase.from("mandals").select("*").order("name").then(({ data }) => {
      if (data) setMandals(data);
    });
    fetchAuthorities();
  }, []);

  const fetchAuthorities = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("user_id, department_id, role")
      .eq("role", "authority");

    if (data && data.length > 0) {
      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, mobile_number, mandal_id")
        .in("id", userIds);

      const merged = data.map((r) => ({
        ...r,
        profile: profiles?.find((p) => p.id === r.user_id),
      }));
      setAuthorities(merged);
    } else {
      setAuthorities([]);
    }
    setLoading(false);
  };

  const handleDelete = async (userId: string, name: string) => {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      toast({ title: "Session invalid", description: "Please sign out and sign in again", variant: "destructive" });
      return;
    }
    const accessToken = refreshed.session?.access_token;
    if (!accessToken) {
      toast({ title: "Session expired", description: "Please sign in again", variant: "destructive" });
      return;
    }
    supabase.functions.setAuth(accessToken);

    const { data, error } = await supabase.functions.invoke("delete-authority", {
      body: { user_id: userId },
    });

    if (error || data?.error) {
      let message = data?.error || error?.message || "Request failed";
      const functionErrorContext = (error as any)?.context;
      if (functionErrorContext) {
        try {
          const errPayload = await functionErrorContext.json();
          if (errPayload?.error) message = errPayload.error;
        } catch {}
      }
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    } else {
      toast({ title: `Authority "${name}" deleted successfully` });
      fetchAuthorities();
    }
  };

  const openEditDialog = (authority: any) => {
    setEditAuthority(authority);
    setEditName(authority.profile?.name || "");
    setEditMobile(authority.profile?.mobile_number || "");
    setEditMandalId(authority.profile?.mandal_id || "");
    setEditDeptId(authority.department_id || "");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editAuthority) return;

    if (editName.trim().length === 0) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (editMobile && !/^\d{10}$/.test(editMobile)) {
      toast({ title: "Invalid mobile", description: "Must be exactly 10 digits", variant: "destructive" });
      return;
    }
    if (!editMandalId) {
      toast({ title: "Select mandal", variant: "destructive" });
      return;
    }
    if (!editDeptId) {
      toast({ title: "Select department", variant: "destructive" });
      return;
    }

    setEditLoading(true);
    const userId = editAuthority.user_id;

    // Update profiles table
    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .update({
        name: editName.trim(),
        mobile_number: editMobile || null,
        mandal_id: editMandalId,
        department_id: editDeptId,
      })
      .eq("id", userId)
      .select();

    if (profileErr) {
      console.error("Profile update error:", profileErr);
      toast({ title: "Failed to update profile", description: profileErr.message, variant: "destructive" });
      setEditLoading(false);
      return;
    }
    if (!profileData || profileData.length === 0) {
      toast({ title: "Profile update blocked", description: "No rows updated — check RLS policies allow admin to update profiles.", variant: "destructive" });
      setEditLoading(false);
      return;
    }

    // Update user_roles table
    const { data: roleData, error: roleErr } = await supabase
      .from("user_roles")
      .update({
        department_id: editDeptId,
        mandal_id: editMandalId,
      })
      .eq("user_id", userId)
      .select();

    if (roleErr) {
      console.error("Role update error:", roleErr);
      toast({ title: "Failed to update role", description: roleErr.message, variant: "destructive" });
      setEditLoading(false);
      return;
    }
    if (!roleData || roleData.length === 0) {
      toast({ title: "Role update blocked", description: "No rows updated — check RLS policies allow admin to update user_roles.", variant: "destructive" });
      setEditLoading(false);
      return;
    }

    toast({ title: `Authority "${editName.trim()}" updated successfully` });
    setEditOpen(false);
    setEditAuthority(null);
    fetchAuthorities();
    setEditLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(mobile)) {
      toast({ title: "Invalid mobile", description: "Must be exactly 10 digits", variant: "destructive" });
      return;
    }
    if (!/^\d{12}$/.test(aadhaar)) {
      toast({ title: "Invalid Aadhaar", description: "Must be exactly 12 digits", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (!mandalId) {
      toast({ title: "Select mandal", variant: "destructive" });
      return;
    }
    if (!deptId) {
      toast({ title: "Select department", variant: "destructive" });
      return;
    }

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      toast({ title: "Session invalid", description: "Please sign out and sign in again", variant: "destructive" });
      return;
    }

    const accessToken = refreshed.session?.access_token;
    if (!accessToken) {
      toast({ title: "Session expired", description: "Please sign in again", variant: "destructive" });
      return;
    }

    supabase.functions.setAuth(accessToken);

    setFormLoading(true);
    const { data, error } = await supabase.functions.invoke("create-authority", {
      body: { name, email, password, mobile_number: mobile, aadhaar_number: aadhaar, mandal_id: mandalId, department_id: deptId },
    });

    if (error || data?.error) {
      let message = data?.error || error?.message || "Request failed";

      const functionErrorContext = (error as any)?.context;
      if (functionErrorContext) {
        try {
          const errPayload = await functionErrorContext.json();
          if (errPayload?.error) message = errPayload.error;
          else if (errPayload?.message) message = errPayload.message;
        } catch {
          // keep existing message fallback
        }
      }

      console.error("create-authority failed", { error, data, message });
      toast({
        title: "Failed",
        description: message.includes("Unauthorized") ? "Not authorized. Sign out and sign in with admin account again." : message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Authority account created successfully!" });

      // Send welcome email via EmailJS
      const deptName = departments.find((d) => d.id === deptId)?.name || "Unknown";
      const mandalName = mandals.find((m) => m.id === mandalId)?.name || "Unknown";
      try {
        const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: "service_7doyo2r",
            template_id: "template_095z66c",
            user_id: "0Tmp_VxA-2-rfWzHw",
            template_params: {
              to_name: name,
              to_email: email,
              authority_email: email,
              authority_password: password,
              mandal_name: mandalName,
              department_name: deptName,
            },
          }),
        });
        if (emailRes.ok) {
          toast({ title: "Welcome email sent!", description: `Credentials emailed to ${email}` });
        } else {
          console.error("EmailJS error:", await emailRes.text());
          toast({ title: "Account created, but email failed", description: "Please share credentials manually", variant: "destructive" });
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }

      setName(""); setEmail(""); setPassword(""); setMobile(""); setAadhaar(""); setMandalId(""); setDeptId("");
      fetchAuthorities();
    }
    setFormLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">Manage Authorities</h1>

        <Card className="gradient-border overflow-hidden animate-fade-in stagger-1">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><UserPlus className="h-5 w-5 text-primary" /></div>
              Create Authority Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="auth-name" className="text-sm font-semibold">Full Name</Label>
                <Input id="auth-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Officer name" className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-email" className="text-sm font-semibold">Email</Label>
                <Input id="auth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="officer@gov.in" className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-pwd" className="text-sm font-semibold">Password</Label>
                <Input id="auth-pwd" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-mob" className="flex items-center gap-1.5 text-sm font-semibold"><Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number</Label>
                <Input id="auth-mob" type="tel" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} required placeholder="10-digit mobile" maxLength={10} className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-aadh" className="flex items-center gap-1.5 text-sm font-semibold"><CreditCard className="h-3.5 w-3.5 text-primary" /> Aadhaar Number</Label>
                <Input id="auth-aadh" type="password" value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))} required placeholder="12-digit Aadhaar" maxLength={12} className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-3.5 w-3.5 text-primary" /> Mandal</Label>
                <Select value={mandalId} onValueChange={setMandalId}>
                  <SelectTrigger className="h-11 transition-all duration-300 hover:border-primary/50"><SelectValue placeholder="Select mandal" /></SelectTrigger>
                  <SelectContent>
                    {mandals.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Department</Label>
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger className="h-11 transition-all duration-300 hover:border-primary/50"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={formLoading} className="h-11 px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {formLoading ? "Creating..." : "Create Authority Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-2">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
              Existing Authorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 shimmer-bg rounded-xl" />)}</div>
            ) : authorities.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground">No authority accounts yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {authorities.map((a, idx) => (
                  <div key={a.user_id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-primary/5 hover:border-primary/30 hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                        {(a.profile?.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{a.profile?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {a.profile?.mobile_number ? `📱 ${a.profile.mobile_number}` : "No mobile"}{" • "}
                          {mandals.find(m => m.id === a.profile?.mandal_id)?.name || "No mandal"}{" • "}
                          {departments.find(d => d.id === a.department_id)?.name || "No dept"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => openEditDialog(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Authority</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{a.profile?.name || "this authority"}</strong>? This will permanently remove their account, profile, and role. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(a.user_id, a.profile?.name || "Unknown")}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Authority Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Authority</DialogTitle>
            <DialogDescription>
              Update details for {editAuthority?.profile?.name || "this authority"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-semibold">Full Name</Label>
              <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Officer name" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mobile" className="flex items-center gap-1.5 text-sm font-semibold"><Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number</Label>
              <Input id="edit-mobile" type="tel" value={editMobile} onChange={e => setEditMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" maxLength={10} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-3.5 w-3.5 text-primary" /> Mandal</Label>
              <Select value={editMandalId} onValueChange={setEditMandalId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select mandal" /></SelectTrigger>
                <SelectContent>
                  {mandals.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Department</Label>
              <Select value={editDeptId} onValueChange={setEditDeptId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editLoading} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white">
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ManageAuthorities;
