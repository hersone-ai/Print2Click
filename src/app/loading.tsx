import { PageState } from '@/components/layout/page-state';

export default function LoadingPage() {
  return <PageState title="Opening this page…" description="Please wait a moment." status="loading" />;
}
