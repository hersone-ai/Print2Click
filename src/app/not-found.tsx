import Link from 'next/link';
import { PageState } from '@/components/layout/page-state';

export default function NotFoundPage() {
  return <PageState eyebrow="Page not found" title="We could not find this page" description="Check the address or return to your workspace.">
    <Link href="/" className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm">Go to workspace</Link>
  </PageState>;
}
