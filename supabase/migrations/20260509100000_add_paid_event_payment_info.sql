ALTER TABLE public.events
ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN investment TEXT,
ADD COLUMN payment_methods TEXT;
