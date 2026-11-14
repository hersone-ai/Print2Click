'use client';

import { Button } from '@/components/ui/button';
import { PageState } from '@/components/layout/page-state';
import './globals.css';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body>
    <PageState eyebrow="Something went wrong" title="The app could not open" description="Please try again. If the problem continues, come back later." status="error">
      <Button variant="primary" onClick={reset}>Try again</Button>
    </PageState>
  </body></html>;
}
