const publicEnv = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseProjectId: process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID ?? '',
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? '',
};

export const env = {
  ...publicEnv,
  isSupabaseConfigured: Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey),
  isCloudinaryConfigured: Boolean(publicEnv.cloudinaryCloudName),
};

export function getRequiredSupabaseEnv() {
  if (!env.isSupabaseConfigured) {
    throw new Error('Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }

  return {
    url: env.supabaseUrl,
    projectId: env.supabaseProjectId,
    publishableKey: env.supabasePublishableKey,
  };
}
