import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, languageLabels, Language } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Shield, MapPin, Users, KeyRound, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";

const AUTH_INTENT_KEY = "auth_intent_role";

const Auth = () => {
  const { user, role, loading, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !role) return;

    const intentRole = sessionStorage.getItem(AUTH_INTENT_KEY);
    if (!intentRole) return;

    if (intentRole !== role) {
      signOut().finally(() => {
        sessionStorage.removeItem(AUTH_INTENT_KEY);
        toast({
          title: t("intent.denied"),
          description: t("intent.mismatch", { role, intent: intentRole }),
          variant: "destructive",
        });
      });
      return;
    }

    sessionStorage.removeItem(AUTH_INTENT_KEY);
  }, [user?.id, role]);

  if (loading) return null;
  if (user && role) {
    const intentRole = sessionStorage.getItem(AUTH_INTENT_KEY);
    if (intentRole && intentRole !== role) return null;

    const redirectMap: Record<string, string> = { citizen: "/citizen", authority: "/authority", admin: "/admin" };
    return <Navigate to={redirectMap[role] || "/citizen"} replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-secondary to-primary flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
        {/* Floating decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-white/5 animate-float" />
        <div className="absolute bottom-32 left-16 w-24 h-24 rounded-full bg-white/8 animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-white/5 animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-1/4 right-16 w-2 h-2 rounded-full bg-white/40 animate-pulse" />
        <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="max-w-md space-y-8 relative z-10 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md shadow-2xl animate-pulse-glow">
              <Shield className="h-12 w-12" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">ResolvIt</h1>
          </div>
          <p className="text-xl opacity-90 leading-relaxed">{t("brand.tagline")}</p>
          <div className="space-y-5 pt-6">
            <Feature icon={<MapPin className="h-5 w-5" />} text={t("brand.feature1")} delay={0} />
            <Feature icon={<Users className="h-5 w-5" />} text={t("brand.feature2")} delay={100} />
            <Feature icon={<Shield className="h-5 w-5" />} text={t("brand.feature3")} delay={200} />
          </div>
        </div>
      </div>

      {/* Right panel - auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-muted/30 relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-secondary/3 blur-3xl" />
        </div>

        {/* Language switcher & theme toggle - top right corner */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <ThemeToggle />
          <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
            <SelectTrigger className="w-[130px] h-9 text-sm rounded-xl border-2 hover:border-primary/50 transition-all duration-300 bg-background/80 backdrop-blur-sm">
              <Globe className="h-4 w-4 mr-1.5 opacity-60" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(languageLabels) as [Language, string][]).map(([code, label]) => (
                <SelectItem key={code} value={code}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="w-full max-w-md shadow-2xl gradient-border overflow-hidden relative z-10 animate-scale-in">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 lg:hidden mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ResolvIt</span>
            </div>
            <CardTitle className="text-2xl">{t("auth.welcome")}</CardTitle>
            <CardDescription className="text-base">{t("auth.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-4 h-11 p-1 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:shadow-sm transition-all duration-300">{t("auth.signIn")}</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:shadow-sm transition-all duration-300">{t("auth.signUp")}</TabsTrigger>
                <TabsTrigger value="authority" className="data-[state=active]:shadow-sm transition-all duration-300">{t("auth.authority")}</TabsTrigger>
                <TabsTrigger value="admin" className="data-[state=active]:shadow-sm transition-all duration-300">{t("auth.admin")}</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="animate-fade-in">
                <LoginForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
              </TabsContent>
              <TabsContent value="signup" className="animate-fade-in">
                <SignupForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
              </TabsContent>
              <TabsContent value="authority" className="animate-fade-in">
                <AuthorityLoginForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
              </TabsContent>
              <TabsContent value="admin" className="animate-fade-in">
                <AdminLoginForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AdminLoginForm = ({ isSubmitting, setIsSubmitting }: { isSubmitting: boolean; setIsSubmitting: (v: boolean) => void }) => {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== "admin123456") {
      toast({ title: t("admin.denied"), description: t("admin.invalidPwd"), variant: "destructive" });
      return;
    }
    sessionStorage.setItem(AUTH_INTENT_KEY, "admin");
    setIsSubmitting(true);
    const { error } = await signIn("admin@resolvit.com", password);
    if (error) {
      sessionStorage.removeItem(AUTH_INTENT_KEY);
      toast({ title: t("admin.failed"), description: error.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-muted-foreground mb-3">
        {t("admin.info")}
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password" className="text-sm font-semibold">{t("admin.password")}</Label>
        <Input
          id="admin-password"
          type="password"
          placeholder={t("admin.passwordPlaceholder")}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:scale-[1.01]"
        />
      </div>
      <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" disabled={isSubmitting}>
        <KeyRound className="h-4 w-4 mr-2" />
        {isSubmitting ? t("auth.signingIn") : t("admin.submit")}
      </Button>
    </form>
  );
};

const Feature = ({ icon, text, delay = 0 }: { icon: React.ReactNode; text: string; delay?: number }) => (
  <div className="flex items-center gap-3 opacity-90 hover:opacity-100 hover:translate-x-2 transition-all duration-300 animate-fade-in-left" style={{ animationDelay: `${delay}ms` }}>
    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg">{icon}</div>
    <span className="text-lg">{text}</span>
  </div>
);

const LoginForm = ({ isSubmitting, setIsSubmitting }: { isSubmitting: boolean; setIsSubmitting: (v: boolean) => void }) => {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.removeItem(AUTH_INTENT_KEY);
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: t("login.failed"), description: error.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 mt-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-sm font-semibold">{t("login.email")}</Label>
          <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:scale-[1.01]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-sm font-semibold">{t("login.password")}</Label>
          <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:scale-[1.01]" />
        </div>
        <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" disabled={isSubmitting}>
          {isSubmitting ? t("auth.signingIn") : t("login.submit")}
        </Button>
      </form>
      <div className="flex justify-end -mt-2">
        <ForgotPasswordDialog />
      </div>
    </div>
  );
};

const SignupForm = ({ isSubmitting, setIsSubmitting }: { isSubmitting: boolean; setIsSubmitting: (v: boolean) => void }) => {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.removeItem(AUTH_INTENT_KEY);
    if (password.length < 6) {
      toast({ title: t("signup.passwordShort"), description: t("signup.passwordMin"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await signUp(email, password, name);
    if (error) {
      toast({ title: t("signup.failed"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("signup.checkEmail"), description: t("signup.confirmLink") });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name" className="text-sm font-semibold">{t("signup.name")}</Label>
        <Input id="signup-name" value={name} onChange={e => setName(e.target.value)} required className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:scale-[1.01]" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-sm font-semibold">{t("signup.email")}</Label>
        <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:scale-[1.01]" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-sm font-semibold">{t("signup.password")}</Label>
        <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:scale-[1.01]" />
      </div>
      <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" disabled={isSubmitting}>
        {isSubmitting ? t("auth.creatingAccount") : t("signup.submit")}
      </Button>
    </form>
  );
};

const AuthorityLoginForm = ({ isSubmitting, setIsSubmitting }: { isSubmitting: boolean; setIsSubmitting: (v: boolean) => void }) => {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem(AUTH_INTENT_KEY, "authority");
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      sessionStorage.removeItem(AUTH_INTENT_KEY);
      toast({ title: t("login.failed"), description: error.message || "Invalid credentials", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-muted-foreground mb-3">
        {t("authority.info")}
      </div>
      <div className="space-y-2">
        <Label htmlFor="auth-email" className="text-sm font-semibold">{t("authority.email")}</Label>
        <Input
          id="auth-email"
          type="email"
          placeholder={t("authority.emailPlaceholder")}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:scale-[1.01]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="auth-password" className="text-sm font-semibold">{t("authority.password")}</Label>
        <Input
          id="auth-password"
          type="password"
          placeholder={t("authority.passwordPlaceholder")}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:scale-[1.01]"
        />
      </div>
      <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" disabled={isSubmitting}>
        {isSubmitting ? t("auth.signingIn") : t("authority.submit")}
      </Button>
    </form>
  );
};

export default Auth;
