CREATE OR REPLACE FUNCTION public._hash_aadhaar(_user_id uuid, _aadhaar text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  UPDATE profiles
  SET aadhaar_hash = extensions.crypt(_aadhaar, extensions.gen_salt('bf'))
  WHERE id = _user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_authority_credentials(_mobile text, _aadhaar text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _user_id UUID;
  _stored_hash TEXT;
BEGIN
  SELECT p.id, p.aadhaar_hash INTO _user_id, _stored_hash
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.mobile_number = _mobile AND ur.role = 'authority';
  
  IF _user_id IS NULL THEN RETURN NULL; END IF;
  IF _stored_hash = extensions.crypt(_aadhaar, _stored_hash) THEN
    RETURN _user_id;
  END IF;
  RETURN NULL;
END;
$function$;