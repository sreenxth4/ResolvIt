
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles ADD COLUMN mobile_number TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN aadhaar_hash TEXT;

CREATE OR REPLACE FUNCTION public.verify_authority_credentials(
  _mobile TEXT, _aadhaar TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id UUID;
  _stored_hash TEXT;
BEGIN
  SELECT p.id, p.aadhaar_hash INTO _user_id, _stored_hash
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.mobile_number = _mobile AND ur.role = 'authority';
  
  IF _user_id IS NULL THEN RETURN NULL; END IF;
  IF _stored_hash = crypt(_aadhaar, _stored_hash) THEN
    RETURN _user_id;
  END IF;
  RETURN NULL;
END;
$$;
