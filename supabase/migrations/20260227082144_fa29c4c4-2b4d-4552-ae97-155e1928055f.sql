
CREATE OR REPLACE FUNCTION public._hash_aadhaar(_user_id UUID, _aadhaar TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles
  SET aadhaar_hash = crypt(_aadhaar, gen_salt('bf'))
  WHERE id = _user_id;
END;
$$;
