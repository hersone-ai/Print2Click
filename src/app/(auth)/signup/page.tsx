import Link from 'next/link';
import { AuthDivider, AuthFeedback, AuthShell } from '@/features/auth/components/auth-shell';
import { GoogleSignInForm, SignUpForm } from '@/features/auth/components/auth-forms';

type Props = { searchParams: Promise<{ error?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  const query = await searchParams;
  return <AuthShell title="Create your account" description="Set up access to your campaign workspace.">
    <div className="space-y-4">
      <AuthFeedback error={query.error} />
      <GoogleSignInForm />
      <AuthDivider />
      <SignUpForm />
      <p className="pt-2 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
    </div>
  </AuthShell>;
}
