-- AI Conversations
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid,
  module_type text NOT NULL,
  title text NOT NULL DEFAULT 'New chat',
  is_pinned boolean NOT NULL DEFAULT false,
  is_favorite boolean NOT NULL DEFAULT false,
  is_shared boolean NOT NULL DEFAULT false,
  share_slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_conversations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations" ON public.ai_conversations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view shared conversations" ON public.ai_conversations
  FOR SELECT TO anon, authenticated USING (is_shared = true);

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ai_conversations_user_module ON public.ai_conversations(user_id, module_type, updated_at DESC);
CREATE INDEX idx_ai_conversations_workspace ON public.ai_conversations(workspace_id) WHERE workspace_id IS NOT NULL;

-- Conversation Messages
CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.conversation_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_messages TO authenticated;
GRANT ALL ON public.conversation_messages TO service_role;

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage messages in own conversations" ON public.conversation_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_messages.conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_messages.conversation_id AND c.user_id = auth.uid()));

CREATE POLICY "Public can view messages of shared conversations" ON public.conversation_messages
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_messages.conversation_id AND c.is_shared = true));

CREATE INDEX idx_conversation_messages_conversation ON public.conversation_messages(conversation_id, created_at ASC);

-- Idea Notes
CREATE TABLE public.idea_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled note',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.idea_notes TO authenticated;
GRANT ALL ON public.idea_notes TO service_role;

ALTER TABLE public.idea_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes" ON public.idea_notes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_idea_notes_updated_at
  BEFORE UPDATE ON public.idea_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_idea_notes_workspace ON public.idea_notes(workspace_id, updated_at DESC);