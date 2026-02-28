import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-secondary/5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="text-center animate-scale-in relative z-10">
        <h1 className="text-9xl font-extrabold animate-gradient-x bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8 animate-fade-in stagger-2">Oops! Page not found</p>
        <Link to="/auth">
          <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/25 active:scale-95 transition-all animate-fade-in stagger-3 gap-2">
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
