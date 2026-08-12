-- Fix the connections INSERT policy to be more secure
-- Connections should only be created when a connection request is accepted
DROP POLICY IF EXISTS "System can create connections" ON public.connections;

-- Create a function to handle connection creation (called when request is accepted)
CREATE OR REPLACE FUNCTION public.accept_connection_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  user_a_id uuid;
  user_b_id uuid;
BEGIN
  -- Get the request
  SELECT * INTO req FROM public.connection_requests WHERE id = request_id;
  
  IF req IS NULL THEN
    RAISE EXCEPTION 'Connection request not found';
  END IF;
  
  IF req.receiver_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to accept this request';
  END IF;
  
  IF req.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;
  
  -- Ensure consistent ordering (user_a < user_b)
  IF req.sender_id < req.receiver_id THEN
    user_a_id := req.sender_id;
    user_b_id := req.receiver_id;
  ELSE
    user_a_id := req.receiver_id;
    user_b_id := req.sender_id;
  END IF;
  
  -- Create the connection
  INSERT INTO public.connections (user_a, user_b) 
  VALUES (user_a_id, user_b_id)
  ON CONFLICT (user_a, user_b) DO NOTHING;
  
  -- Update request status
  UPDATE public.connection_requests SET status = 'accepted', updated_at = now() 
  WHERE id = request_id;
  
  -- Create notifications for both users
  INSERT INTO public.notifications (user_id, type, title, message, actor_id, target_type, target_id)
  VALUES 
    (req.sender_id, 'connection_accepted', 'Connection Accepted', 
     'Your connection request was accepted', req.receiver_id, 'connection', request_id);
END;
$$;