'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme/theme-provider';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  const Icon = theme === 'light' ? Moon : Sun;
  return <Button variant="ghost" size={compact ? 'icon' : 'sm'} onClick={toggleTheme} aria-label={`Switch to ${nextTheme} theme`} title={`Switch to ${nextTheme} theme`}><Icon size={15} />{!compact && (theme === 'light' ? 'Dark theme' : 'Light theme')}</Button>;
}
