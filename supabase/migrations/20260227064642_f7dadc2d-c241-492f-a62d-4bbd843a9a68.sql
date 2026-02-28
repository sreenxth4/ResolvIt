
-- =============================================
-- ResolvIt Database Schema
-- =============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('citizen', 'authority', 'admin');
CREATE TYPE public.issue_status AS ENUM ('open', 'in_progress', 'resolved', 'escalated');
CREATE TYPE public.issue_category AS ENUM ('roads', 'water', 'electricity', 'sanitation', 'public_safety', 'parks', 'other');
CREATE TYPE public.notification_type AS ENUM ('issue_assigned', 'issue_escalated', 'issue_resolved', 'upvote_milestone', 'status_change', 'new_report');

-- 2. BASE TABLES
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sla_hours INT NOT NULL DEFAULT 48,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  points_total INT NOT NULL DEFAULT 0,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'citizen',
  department_id UUID REFERENCES public.departments(id),
  UNIQUE(user_id, role)
);

CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.issue_category NOT NULL DEFAULT 'other',
  severity INT NOT NULL DEFAULT 3 CHECK (severity >= 1 AND severity <= 5),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  priority_score INT NOT NULL DEFAULT 0,
  status public.issue_status NOT NULL DEFAULT 'open',
  department_id UUID REFERENCES public.departments(id),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_authority_id UUID REFERENCES auth.users(id),
  image_url TEXT,
  report_count INT NOT NULL DEFAULT 1,
  upvote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  old_status public.issue_status,
  new_status public.issue_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  points INT NOT NULL,
  reason TEXT NOT NULL,
  issue_id UUID REFERENCES public.issues(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, issue_id)
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  type public.notification_type NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  issue_id UUID REFERENCES public.issues(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX idx_issues_department ON public.issues(department_id);
CREATE INDEX idx_issues_reporter ON public.issues(reporter_id);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_priority ON public.issues(priority_score DESC);
CREATE INDEX idx_issues_location ON public.issues(lat, lng);
CREATE INDEX idx_issue_reports_issue ON public.issue_reports(issue_id);
CREATE INDEX idx_status_logs_issue ON public.status_logs(issue_id);
CREATE INDEX idx_points_ledger_user ON public.points_ledger(user_id);
CREATE INDEX idx_upvotes_issue ON public.upvotes(issue_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = false;
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- 4. SECURITY DEFINER HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_department_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.user_roles
  WHERE user_id = _user_id AND role = 'authority'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 5. TRIGGERS

-- Auto-create profile + citizen role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-log status changes
CREATE OR REPLACE FUNCTION public.log_issue_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.status_logs (issue_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_issue_status_change
  AFTER UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.log_issue_status_change();

-- Auto-update upvote_count on issues
CREATE OR REPLACE FUNCTION public.update_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.issues SET upvote_count = upvote_count + 1 WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.issues SET upvote_count = upvote_count - 1 WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_upvote_change
  AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW EXECUTE FUNCTION public.update_upvote_count();

-- Auto-update points_total on profiles
CREATE OR REPLACE FUNCTION public.update_points_total()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET points_total = points_total + NEW.points
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_points_earned
  AFTER INSERT ON public.points_ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_points_total();

-- 6. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES

-- profiles
CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "System creates profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- departments
CREATE POLICY "Anyone can read departments"
  ON public.departments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System creates roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- issues
CREATE POLICY "Authenticated users can view all issues"
  ON public.issues FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Citizens can create issues"
  ON public.issues FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reporter or authority can update issues"
  ON public.issues FOR UPDATE TO authenticated
  USING (
    reporter_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'authority') AND department_id = public.get_user_department_id(auth.uid()))
  );

CREATE POLICY "Admins can delete issues"
  ON public.issues FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- issue_reports
CREATE POLICY "View reports for visible issues"
  ON public.issue_reports FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Citizens can add reports"
  ON public.issue_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- status_logs
CREATE POLICY "View status logs"
  ON public.status_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System inserts status logs"
  ON public.status_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- points_ledger
CREATE POLICY "Users see own points"
  ON public.points_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System awards points"
  ON public.points_ledger FOR INSERT TO authenticated
  WITH CHECK (true);

-- upvotes
CREATE POLICY "View upvotes"
  ON public.upvotes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Citizens can upvote"
  ON public.upvotes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own upvote"
  ON public.upvotes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- notifications
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users mark own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System creates notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- 8. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;

-- 9. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('issue-images', 'issue-images', true);

CREATE POLICY "Authenticated users can upload issue images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'issue-images');

CREATE POLICY "Anyone can view issue images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-images');

-- 10. PRIORITY SCORE FUNCTION
CREATE OR REPLACE FUNCTION public.calculate_priority_score(
  _report_count INT,
  _severity INT,
  _created_at TIMESTAMPTZ,
  _upvote_count INT
)
RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT (_report_count * 2) + _severity + GREATEST(EXTRACT(DAY FROM (now() - _created_at))::INT, 0) + _upvote_count
$$;

-- 11. RECALCULATE ALL PRIORITIES FUNCTION
CREATE OR REPLACE FUNCTION public.recalculate_all_priorities()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.issues
  SET priority_score = public.calculate_priority_score(report_count, severity, created_at, upvote_count)
  WHERE status != 'resolved';
END;
$$;
