-- AI Chat History table
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL DEFAULT gen_random_uuid()::text,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  model text DEFAULT 'GLM-4.7',
  tokens_used integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history" ON public.ai_chat_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat" ON public.ai_chat_history
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all chat history" ON public.ai_chat_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access chat history" ON public.ai_chat_history
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- SEO Metadata table
CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL DEFAULT 'page',
  page_id uuid,
  meta_title text,
  meta_description text,
  keywords text[] DEFAULT '{}',
  og_title text,
  og_description text,
  suggestions jsonb DEFAULT '[]',
  generated_by text DEFAULT 'z.ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo_metadata" ON public.seo_metadata
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SEO metadata readable by everyone" ON public.seo_metadata
  FOR SELECT USING (true);

CREATE POLICY "Service role full access seo_metadata" ON public.seo_metadata
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Generated Images table
CREATE TABLE IF NOT EXISTS public.generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  image_url text,
  model text DEFAULT 'GLM-4.7',
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage generated_images" ON public.generated_images
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access generated_images" ON public.generated_images
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');