import Link from 'next/link';
import { AuthFeedback, AuthShell } from '@/features/auth/components/auth-shell';
import { UpdatePasswordForm } from '@/features/auth/components/auth-forms';

type Props = { searchParams: Promise<{ error?: string }> };

export default async function UpdatePasswordPage({ searchParams }: Props) {
  const query = await searchParams;
  return <AuthShell title="Choose a new password" description="Your reset link is verified. Set a new password for your account.">
    <div className="space-y-4">
      <AuthFeedback error={query.error} />
      <UpdatePasswordForm />
      <p className="text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
    </div>
  </AuthShell>;
}
