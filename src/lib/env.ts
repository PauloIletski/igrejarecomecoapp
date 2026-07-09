const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseProjectId = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const cloudinaryCloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL ?? '';

export const env = {
  supabaseUrl,
  supabaseProjectId,
  supabasePublishableKey,
  cloudinaryCloudName,
  siteUrl,
  isSupabaseConfigured: Boolean(supabaseUrl && supabasePublishableKey),
  isCloudinaryConfigured: Boolean(cloudinaryCloudName),
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
