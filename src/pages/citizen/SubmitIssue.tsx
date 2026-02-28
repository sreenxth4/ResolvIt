import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { LocationPicker } from "@/components/map/LocationPicker";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, Camera, MapPinned } from "lucide-react";

const categories = [
  { value: "roads", label: "Roads & Transport" },
  { value: "water", label: "Water Supply" },
  { value: "electricity", label: "Electricity" },
  { value: "sanitation", label: "Sanitation" },
  { value: "public_safety", label: "Public Safety" },
  { value: "parks", label: "Parks & Recreation" },
  { value: "other", label: "Other" },
];

const SubmitIssue = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("3");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // const [analyzing, setAnalyzing] = useState(false);

  // const fileToBase64 = (file: File): Promise<string> => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       const result = reader.result as string;
  //       // Remove the data:image/...;base64, prefix
  //       resolve(result.split(",")[1]);
  //     };
  //     reader.onerror = reject;
  //     reader.readAsDataURL(file);
  //   });
  // };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!location) {
      toast({ title: t("submit.locationRequired"), description: t("submit.locationRequired"), variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: t("submit.categoryRequired"), variant: "destructive" });
      return;
    }
    if (!imageFile) {
      toast({ title: t("submit.photoRequired"), description: t("submit.photoRequired"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("issue-images").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("issue-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      let submittedWithFunction = false;
      try {
        const { data, error } = await supabase.functions.invoke("submit-issue", {
          body: {
            title,
            description,
            category,
            severity: parseInt(severity),
            lat: location.lat,
            lng: location.lng,
            image_url: imageUrl,
          },
        });

        if (error) throw error;
        submittedWithFunction = true;

        if (data?.duplicate) {
          toast({
            title: t("submit.duplicate"),
            description: t("submit.duplicateDesc"),
          });
        } else {
          toast({ title: t("submit.success"), description: t("submit.successDesc") });
        }
      } catch {
        const severityNum = parseInt(severity, 10);
        const fallbackPriority = 2 + severityNum;

        // Look up department by category
        const categoryToDept: Record<string, string> = {
          roads: "Roads & Infrastructure",
          water: "Water & Sanitation",
          sanitation: "Water & Sanitation",
          electricity: "Electricity & Power",
          public_safety: "Public Safety",
          parks: "Parks & Recreation",
        };
        const deptName = categoryToDept[category];
        let departmentId: string | null = null;
        if (deptName) {
          const { data: dept } = await supabase
            .from("departments")
            .select("id")
            .eq("name", deptName)
            .single();
          departmentId = dept?.id || null;
        }

        const { error: insertError } = await supabase.from("issues").insert({
          title,
          description,
          category: category as any,
          severity: severityNum,
          lat: location.lat,
          lng: location.lng,
          image_url: imageUrl,
          reporter_id: user.id,
          priority_score: fallbackPriority,
          department_id: departmentId,
        });

        if (insertError) throw insertError;
      }

      if (!submittedWithFunction) {
        toast({
          title: t("submit.fallback"),
          description: t("submit.fallbackDesc"),
        });
      }

      navigate("/citizen/issues");
    } catch (err: any) {
      toast({ title: t("submit.failed"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
          {t("submit.title")}
        </h1>
        <Card className="gradient-border overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 animate-fade-in stagger-1">
                <Label htmlFor="title" className="text-sm font-semibold tracking-wide">{t("submit.issueTitle")}</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("submit.titlePlaceholder")} required maxLength={200} className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10" />
              </div>

              <div className="space-y-2 animate-fade-in stagger-2">
                <Label htmlFor="image" className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  {t("submit.photo")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="h-11 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all duration-300"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 5 * 1024 * 1024) {
                        toast({ title: t("submit.fileTooLarge"), description: t("submit.maxSize"), variant: "destructive" });
                        return;
                      }
                      setImageFile(file || null);
                    }}
                  />
                  {imageFile && (
                    <p className="text-xs text-muted-foreground mt-1 animate-fade-in">{imageFile.name}</p>
                  )}
                </div>
                {/* AI auto-describe button removed */}
              </div>

              <div className="space-y-2 animate-fade-in stagger-3">
                <Label htmlFor="description" className="text-sm font-semibold tracking-wide">{t("submit.description")}</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("submit.descPlaceholder")} required maxLength={2000} rows={4} className="transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4 animate-fade-in stagger-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold tracking-wide">{t("submit.category")}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 transition-all duration-300 hover:border-primary/50"><SelectValue placeholder={t("submit.selectCategory")} /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{t(`cat.${c.value}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold tracking-wide">{t("submit.severity")}</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="h-11 transition-all duration-300 hover:border-primary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <SelectItem key={s} value={String(s)}>{s} - {t(`sev.${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 animate-fade-in stagger-5">
                <Label className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-primary" />
                  {t("submit.location")}
                </Label>
                <div className="rounded-xl overflow-hidden border-2 border-border/50 hover:border-primary/30 transition-colors duration-300">
                  <LocationPicker value={location} onChange={setLocation} height="300px" />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-300 animate-fade-in stagger-6" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{t("submit.submitting")}</>
                ) : (
                  <><Send className="h-5 w-5 mr-2" />{t("submit.submitBtn")}</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SubmitIssue;
