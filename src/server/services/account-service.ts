import 'server-only';

import { accountProfileSchema, emptyAddress, emptyProfile, type AccountProfile } from '@/features/account/domain';
import { createSupabaseAuthClient, isSupabaseConfigured, LOCAL_WORKSPACE_USER } from '@/server/providers/supabase-auth';
import { sendPasswordReset } from '@/server/services/auth-service';

const localProfiles = new Map<string, AccountProfile>();

export async function getAccount() {
  if (!isSupabaseConfigured()) {
    const profile = localProfiles.get(LOCAL_WORKSPACE_USER.id) ?? {
      ...emptyProfile,
      displayName: 'Local Merchant',
    };
    return {
      userId: LOCAL_WORKSPACE_USER.id,
      email: LOCAL_WORKSPACE_USER.email,
      profile,
      providers: ['local'],
    };
  }

  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;
  const rawProfile = user.user_metadata?.account_profile;
  const stored = accountProfileSchema.safeParse(
    rawProfile && typeof rawProfile === 'object' && typeof rawProfile.address === 'string'
      ? { ...rawProfile, address: { ...emptyAddress, line1: rawProfile.address } }
      : rawProfile
  );
  const profile = stored.success
    ? stored.data
    : {
        ...emptyProfile,
        displayName:
          typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
            ? user.user_metadata.full_name.trim().slice(0, 80)
            : user.email?.split('@')[0] || 'Account',
      };
  const configuredProviders = Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : [];
  const providers = [
    ...new Set(
      [...configuredProviders, ...(user.identities?.map((identity) => identity.provider) || [])].filter(
        (provider): provider is string => typeof provider === 'string'
      )
    ),
  ];
  return { userId: user.id, email: user.email || '', profile, providers };
}

export async function saveAccountProfile(profile: AccountProfile) {
  if (!isSupabaseConfigured()) {
    localProfiles.set(LOCAL_WORKSPACE_USER.id, profile);
    return null;
  }

  const supabase = await createSupabaseAuthClient();
  const { data: current, error: currentError } = await supabase.auth.getUser();
  if (currentError || !current.user) return 'Your session has expired. Sign in again, then retry.';
  const { error } = await supabase.auth.updateUser({ data: { account_profile: profile } });
  return error ? 'We could not save your profile. Check your connection and try again.' : null;
}

export async function requestAccountPasswordChange() {
  if (!isSupabaseConfigured()) {
    return 'Password reset emails require Supabase Auth configuration.';
  }
  const account = await getAccount();
  if (!account?.email) return 'Your session has expired. Sign in again, then retry.';
  const result = await sendPasswordReset(account.email);
  if (result.ok) return null;
  if (result.reason === 'email_rate_limit') return 'Too many emails were requested. Wait a few minutes and try again.';
  if (result.reason === 'email_delivery') return 'Email delivery is unavailable. Contact support or try again later.';
  return 'We could not send a password link. Try again later.';
}
