'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home, LogOut, Menu, MessageCircle, Plus, Sparkles, Store, UserRound, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { MAX_FILES, type PreviewTab } from '@/features/campaign/domain';
import type { RecentDraft } from '@/features/campaign/local-workspace-store';
import { signOutAction } from '@/features/auth/actions';

type Props = {
  userEmail: string;
  collapsed: boolean;
  mobileOpen: boolean;
  view: 'home' | 'chat';
  activeRecent: boolean;
  fileCount: number;
  productCount: number;
  currentTitle: string;
  hasCurrentDraft: boolean;
  recentDrafts: RecentDraft[];
  changingDraft: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onMobileClose: () => void;
  onMobileOpen: () => void;
  onHome: () => void;
  onNewChat: () => void;
  onOpenCampaign: () => void;
  onOpenRecent: (id: string) => void;
  onPanelOpen: (tab: PreviewTab) => void;
};

export function AppSidebar(props: Props) {
  const {
    userEmail,
    collapsed, mobileOpen, view, activeRecent, fileCount, productCount, currentTitle, hasCurrentDraft, recentDrafts, changingDraft,
    onCollapse, onExpand, onMobileClose, onMobileOpen, onHome, onNewChat,
    onOpenCampaign, onOpenRecent, onPanelOpen,
  } = props;
  const brand = <>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Store size={17} /></span>
    {!collapsed && <span className="truncate text-sm font-semibold tracking-tight text-foreground">Brochure<span className="text-primary">2</span>Campaign</span>}
  </>;

  return <>
    <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-surface transition-[width,transform] duration-200 md:relative md:translate-x-0 ${collapsed ? 'w-[76px]' : 'w-[260px]'} ${mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'}`}>
      <div className={`relative flex h-16 shrink-0 items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {view === 'home'
          ? <div className={`flex min-w-0 items-center gap-2 ${collapsed ? 'px-0' : 'px-1'}`} aria-label="Brochure2Campaign">{brand}</div>
          : <Button onClick={onHome} variant="ghost" className={`h-auto min-w-0 justify-start gap-2 rounded-lg text-left ${collapsed ? 'px-0' : 'px-1'}`} aria-label="Go to Home">{brand}</Button>}
        {!collapsed && <Button onClick={onCollapse} variant="ghost" size="icon" className="hidden h-8 w-8 md:inline-flex" aria-label="Collapse left panel" aria-expanded="true"><ChevronLeft size={17} /></Button>}
        {collapsed && <Button onClick={onExpand} variant="outline" size="icon" className="absolute right-1 top-[68px] hidden h-7 w-7 md:inline-flex" aria-label="Expand left panel" aria-expanded="false"><ChevronRight size={15} /></Button>}
        <Button onClick={onMobileClose} variant="ghost" size="icon" className="md:hidden" aria-label="Close navigation"><X size={18} /></Button>
      </div>

      <div className="space-y-1 px-3 pt-2">
        <Button onClick={onNewChat} disabled={changingDraft} variant="ghost" className={`w-full justify-start ${collapsed ? 'justify-center px-0' : ''}`} title={collapsed ? 'New chat' : undefined} aria-label="New chat"><Plus size={18} className="shrink-0" />{!collapsed && 'New chat'}</Button>
        <Button onClick={onHome} variant={view === 'home' ? 'primary' : 'ghost'} className={`w-full justify-start ${collapsed ? 'justify-center px-0' : ''}`} title={collapsed ? 'Home' : undefined}><Home size={18} className="shrink-0" />{!collapsed && 'Home'}</Button>
      </div>

      {!collapsed && <>
        <div className="mx-4 mt-7 flex items-center justify-between border-t border-border pt-5"><span className="text-xs font-semibold text-subtle">Campaign</span><Button onClick={onNewChat} disabled={changingDraft} variant="ghost" size="icon" className="h-7 w-7" aria-label="Start campaign chat"><Plus size={15} /></Button></div>
        {hasCurrentDraft && <div className="px-3 pt-2"><Button onClick={onOpenCampaign} variant={activeRecent && view === 'chat' ? 'secondary' : 'ghost'} className="h-auto w-full justify-start px-3 py-2.5 text-left"><span className="flex items-center gap-2"><MessageCircle size={15} className="shrink-0 text-subtle" /><span className="truncate text-sm font-medium">{currentTitle}</span></span><span className="mt-1 block truncate pl-[23px] text-xs text-subtle">Current draft</span></Button></div>}
        {(fileCount > 0 || productCount > 0) && <>
        <div className="mx-4 mt-5 border-t border-border pt-4">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[.12em] text-subtle">Campaign steps</p>
          <div className="space-y-1">
            <Button onClick={() => onPanelOpen('source')} variant="ghost" size="sm" className="w-full justify-start px-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary-strong">1</span><span className="flex-1 text-left">Brochure files</span><span className="text-[10px] text-subtle">{fileCount}/{MAX_FILES}</span></Button>
            <Button onClick={onOpenCampaign} variant="ghost" size="sm" className="w-full justify-start px-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-subtle">2</span><span className="flex-1 text-left">Review draft items</span><span className="text-[10px] text-subtle">{productCount}</span></Button>
            <Button onClick={() => onPanelOpen('campaign')} variant="ghost" size="sm" className="w-full justify-start px-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-subtle">3</span><span className="flex-1 text-left">Shopper page preview</span></Button>
            <div title="Review product facts, offers, dates and merchant details before approval" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-subtle"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">4</span><span className="flex-1">Publish</span><Badge>Locked</Badge></div>
          </div>
        </div>
        </>}
        {recentDrafts.length > 0 && <div className="mx-4 mt-7 border-t border-border pt-5"><div className="mb-2 flex items-center justify-between px-1"><span className="text-xs font-semibold text-subtle">Recent</span></div><div className="max-h-44 space-y-1 overflow-y-auto">{recentDrafts.map((item) => <Button key={item.id} onClick={() => onOpenRecent(item.id)} disabled={changingDraft} variant="ghost" className="h-auto w-full justify-start px-3 py-2.5 text-left text-muted-foreground"><span className="block truncate">{item.title}</span></Button>)}</div></div>}
      </>}
      {collapsed && <div className="mt-6 flex flex-col items-center gap-2 border-t border-border px-2 pt-4">{hasCurrentDraft && <Button onClick={onOpenCampaign} variant="ghost" size="icon" title={currentTitle} aria-label="Open current campaign"><MessageCircle size={17} /></Button>}<Button onClick={() => onPanelOpen('campaign')} variant="ghost" size="icon" title="Campaign preview" aria-label="Open campaign preview"><Sparkles size={17} /></Button></div>}
      <div className={`mt-auto border-t border-border p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <ThemeToggle compact={collapsed} />
        <Link href="/account" onClick={onMobileClose} className={`mt-2 inline-flex min-h-10 w-full items-center gap-2 rounded-control px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${collapsed ? 'justify-center' : ''}`} aria-label="Account" title={collapsed ? 'Account' : undefined}><UserRound size={18} aria-hidden="true" />{!collapsed && 'Account'}</Link>
        <div className={`mt-1 flex w-full items-center ${collapsed ? 'flex-col gap-1' : 'gap-1'}`}>
          <div className={`flex min-w-0 items-center ${collapsed ? 'justify-center' : 'flex-1 gap-2 px-2'}`} title={userEmail}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{userEmail.slice(0, 1).toUpperCase() || 'U'}</span>
            {!collapsed && <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium text-foreground">{userEmail.split('@')[0] || 'Account'}</span><span className="block truncate text-xs text-subtle">{userEmail}</span></span>}
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out" title="Sign out"><LogOut size={17} /></Button>
          </form>
        </div>
      </div>
    </aside>
    {mobileOpen && <Button variant="ghost" aria-label="Close navigation overlay" onClick={onMobileClose} className="fixed inset-0 z-20 h-auto rounded-none bg-foreground/20 p-0 md:hidden" />}
    <Button onClick={onMobileOpen} variant="outline" size="icon" className="fixed left-3 top-3 z-10 md:hidden" aria-label="Open navigation"><Menu size={18} /></Button>
  </>;
}
