import Link from 'next/link';
import { AuthFeedback, AuthShell } from '@/features/auth/components/auth-shell';
import { ForgotPasswordForm } from '@/features/auth/components/auth-forms';

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const query = await searchParams;
  return <AuthShell title="Reset your password" description="We’ll email you a secure link to choose a new password.">
    <div className="space-y-4">
      <AuthFeedback error={query.error} />
      <ForgotPasswordForm />
      <p className="text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
    </div>
  </AuthShell>;
}
