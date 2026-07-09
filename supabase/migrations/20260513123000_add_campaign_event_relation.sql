ALTER TABLE public.campaigns
ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
