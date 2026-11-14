import { redirect } from 'next/navigation';
import { CampaignWorkspace } from '@/features/campaign/campaign-workspace';
import { createSupabaseAuthClient, isSupabaseConfigured, LOCAL_WORKSPACE_USER } from '@/server/providers/supabase-auth';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <CampaignWorkspace
        userEmail={LOCAL_WORKSPACE_USER.email}
        userId={LOCAL_WORKSPACE_USER.id}
        signOutError={query.error === 'signout'}
      />
    );
  }

  const supabase = await createSupabaseAuthClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect('/login');
  const email = typeof data.claims.email === 'string' ? data.claims.email : '';
  return <CampaignWorkspace userEmail={email} userId={data.claims.sub} signOutError={query.error === 'signout'} />;
}
