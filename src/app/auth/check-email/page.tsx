import Link from 'next/link';
import { AuthFeedback, AuthShell } from '@/features/auth/components/auth-shell';
import { ResendConfirmationForm } from '@/features/auth/components/auth-forms';

type Props = { searchParams: Promise<{ flow?: string; error?: string; sent?: string; verified?: string }> };

export default async function CheckEmailPage({ searchParams }: Props) {
  const query = await searchParams;
  const isSignup = query.flow !== 'recovery';
  const isVerified = query.verified === '1';
  const title = isVerified ? 'Email verified' : 'Check your email';
  const description = isVerified
    ? 'Your email address is confirmed. You can sign in to continue.'
    : isSignup ? 'Use the confirmation link in your email to activate your account.' : 'If an account matches that email, a password reset link is on its way.';
  return <AuthShell title={title} description={description}>
    <div className="space-y-4">
      <AuthFeedback error={query.error} message={isVerified ? 'email-verified' : query.sent === '1' ? 'confirmation_sent' : undefined} />
      {isVerified
        ? <p className="text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">Continue to sign in</Link></p>
        : isSignup && <ResendConfirmationForm />}
      {!isVerified && <p className="text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">Return to sign in</Link></p>}
    </div>
  </AuthShell>;
}
