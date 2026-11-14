import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brochure2Campaign AI',
  description: 'Turn printed brochures into verified digital campaigns.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="light"><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}
