import Link from 'next/link';
import { AuthDivider, AuthFeedback, AuthShell } from '@/features/auth/components/auth-shell';
import { GoogleSignInForm, SignInForm } from '@/features/auth/components/auth-forms';

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const query = await searchParams;
  return <AuthShell
    title="Welcome to Brochure2Campaign"
    description=""
    centeredTitle
  >
    <div className="space-y-4">
      <AuthFeedback error={query.error} message={query.message} />
      <GoogleSignInForm />
      <AuthDivider />
      <SignInForm />
      <p className="text-center text-sm text-muted-foreground">New to Brochure2Campaign? <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link></p>
    </div>
  </AuthShell>;
}
