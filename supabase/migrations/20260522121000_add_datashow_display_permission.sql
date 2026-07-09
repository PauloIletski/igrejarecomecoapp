INSERT INTO public.admin_permissions (key, label, group_label, sort_order)
VALUES ('datashow.display', 'Exibir botão do datashow', 'Comunidade', 66)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;
