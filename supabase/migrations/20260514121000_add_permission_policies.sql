CREATE POLICY "Permission manage agenda" ON public.agenda_items
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'agenda.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'agenda.manage'));

CREATE POLICY "Permission manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'events.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'events.manage'));

CREATE POLICY "Permission manage event registrations" ON public.event_registrations
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'events.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'events.manage'));

CREATE POLICY "Permission manage campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'campaigns.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'campaigns.manage'));

CREATE POLICY "Permission manage prayers" ON public.prayer_requests
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'prayers.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'prayers.manage'));

CREATE POLICY "Permission manage donation items" ON public.donation_items
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'donations.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'donations.manage'));

CREATE POLICY "Permission manage donation pledges" ON public.donation_pledges
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'donations.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'donations.manage'));

CREATE POLICY "Permission manage donation responsibles" ON public.donation_responsibles
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'donations.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'donations.manage'));

CREATE POLICY "Permission manage donation notifications" ON public.donation_notifications
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'donations.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'donations.manage'));

CREATE POLICY "Permission manage tithes offerings" ON public.tithes_offerings_methods
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'tithes.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'tithes.manage'));

CREATE POLICY "Permission manage home visit responsibles" ON public.home_visit_responsibles
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'visits.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'visits.manage'));

CREATE POLICY "Permission manage home visit requests" ON public.home_visit_requests
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'visits.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'visits.manage'));

CREATE POLICY "Permission manage home visit settings" ON public.home_visit_settings
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'visits.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'visits.manage'));

CREATE POLICY "Permission manage home visit blocked dates" ON public.home_visit_blocked_dates
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'visits.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'visits.manage'));

CREATE POLICY "Permission manage pastors" ON public.pastors
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'pastors.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'pastors.manage'));

CREATE POLICY "Permission manage public ministries" ON public.ministries
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'ministries.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'ministries.manage'));

CREATE POLICY "Permission manage locations" ON public.church_locations
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'locations.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'locations.manage'));

CREATE POLICY "Permission manage hero settings" ON public.site_hero_settings
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'hero.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hero.manage'));

CREATE POLICY "Permission manage footer settings" ON public.site_footer_settings
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'footer.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'footer.manage'));
