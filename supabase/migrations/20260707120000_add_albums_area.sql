INSERT INTO public.admin_permissions (key, label, group_label, sort_order)
VALUES ('albums.manage', 'Gerenciar álbuns', 'Conteúdo do site', 125)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

INSERT INTO public.site_section_visibility (section_key, label, is_visible, sort_order)
VALUES ('albums', 'Álbuns', true, 75)
ON CONFLICT (section_key) DO UPDATE SET
  label = excluded.label,
  sort_order = excluded.sort_order;
