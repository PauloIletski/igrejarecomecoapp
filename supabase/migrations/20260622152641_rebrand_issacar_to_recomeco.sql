UPDATE public.site_footer_settings
SET
  brand_name = replace(brand_name, 'Issacar Church', 'Igreja Recomeço'),
  description = replace(description, 'Issacar Church', 'Igreja Recomeço'),
  email = replace(email, 'issacarchurch', 'recomecochurch'),
  copyright_text = replace(copyright_text, 'Issacar Church', 'Igreja Recomeço')
WHERE
  brand_name ILIKE '%Issacar Church%'
  OR description ILIKE '%Issacar Church%'
  OR email ILIKE '%issacarchurch%'
  OR copyright_text ILIKE '%Issacar Church%';

UPDATE public.site_hero_settings
SET
  image_alt = replace(image_alt, 'Issacar Church', 'Igreja Recomeço'),
  image_title = replace(image_title, 'Issacar Church', 'Igreja Recomeço')
WHERE image_alt ILIKE '%Issacar Church%' OR image_title ILIKE '%Issacar Church%';

UPDATE public.pastors
SET bio = replace(bio, 'Issacar Church', 'Igreja Recomeço')
WHERE bio ILIKE '%Issacar Church%';

UPDATE public.tithes_offerings_methods
SET
  recipient_name = replace(recipient_name, 'Issacar Church', 'Igreja Recomeço'),
  pix_key = replace(pix_key, 'issacarchurch', 'recomecochurch')
WHERE recipient_name ILIKE '%Issacar Church%' OR pix_key ILIKE '%issacarchurch%';

UPDATE public.church_locations
SET
  unit_name = replace(unit_name, 'Issacar Church', 'Igreja Recomeço'),
  email = replace(email, 'issacarchurch', 'recomecochurch')
WHERE unit_name ILIKE '%Issacar Church%' OR email ILIKE '%issacarchurch%';
