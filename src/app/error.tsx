'use client';

import { Button } from '@/components/ui/button';
import { PageState } from '@/components/layout/page-state';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageState eyebrow="Something went wrong" title="This page could not open" description="Try opening the page again. If you were editing a draft, check it after the workspace opens." status="error">
    <Button variant="primary" onClick={reset}>Try again</Button>
  </PageState>;
}
