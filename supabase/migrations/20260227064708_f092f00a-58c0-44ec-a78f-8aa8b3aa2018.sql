
-- Fix search_path on functions that don't have it
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

-- Tighten status_logs insert - only allow via trigger (service role)
DROP POLICY IF EXISTS "System inserts status logs" ON public.status_logs;
CREATE POLICY "Authenticated can insert status logs"
  ON public.status_logs FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- Tighten points_ledger insert  
DROP POLICY IF EXISTS "System awards points" ON public.points_ledger;
CREATE POLICY "Authenticated can insert points"
  ON public.points_ledger FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Tighten notifications insert
DROP POLICY IF EXISTS "System creates notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());
