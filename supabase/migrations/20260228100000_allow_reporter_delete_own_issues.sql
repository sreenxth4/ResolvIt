-- Allow reporters to delete their own issues (open or in_progress only)
CREATE POLICY "Reporters can delete own issues"
  ON public.issues FOR DELETE TO authenticated
  USING (
    reporter_id = auth.uid()
    AND status IN ('open', 'in_progress')
  );
