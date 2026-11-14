import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Store } from 'lucide-react';
import { AccountProfileForm } from '@/features/account/components/account-forms';
import { getAccount } from '@/server/services/account-service';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const account = await getAccount();
  if (!account) redirect('/login?next=/account');

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <div className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Store size={17} aria-hidden="true" /></span>Brochure2Campaign</div>
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft size={16} aria-hidden="true" />Back to workspace</Link>
    </div></header>
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <h1 className="mb-7 text-3xl font-semibold tracking-tight">Account settings</h1>
      <AccountProfileForm userId={account.userId} profile={account.profile} email={account.email} providers={account.providers} />
    </div>
  </main>;
}
