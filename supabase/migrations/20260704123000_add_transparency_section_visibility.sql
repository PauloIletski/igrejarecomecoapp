INSERT INTO public.site_section_visibility (section_key, label, is_visible, sort_order)
VALUES ('transparency', 'Transparência', false, 115)
ON CONFLICT (section_key) DO UPDATE SET
  label = excluded.label,
  is_visible = false,
  sort_order = excluded.sort_order;