import type { GameColorTheme } from '../../../../stores/game_settings.store';

export interface GameDashboardThemeTokens {
  isLight: boolean
  shellClass: string
  frame: string
  frameDeep: string
  sectionTitle: string
  secondaryText: string
  primaryText: string
  navActive: string
  navIdle: string
  navIconActive: string
  navIconIdle: string
  headerDivider: string
  modalPanel: string
  modalBackdrop: string
  sidebarSection: string
  sidebarSectionTitle: string
  sidebarInset: string
  sidebarLink: string
  scrollArea: string
}

export function getGameDashboardTheme(theme: GameColorTheme): GameDashboardThemeTokens {
  if (theme === 'light') {
    return {
      isLight: true,
      shellClass: '!bg-gradient-to-br !from-slate-100 !via-white !to-emerald-50 text-slate-900',
      frame:
        'rounded-[32px] border border-slate-200/80 bg-white/85 shadow-xl shadow-slate-300/40 ring-1 ring-slate-200/80 backdrop-blur-xl',
      frameDeep:
        'rounded-[32px] border border-slate-200/90 bg-white/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] ring-1 ring-slate-200/80 backdrop-blur-xl',
      sectionTitle: 'mb-2 text-sm font-bold uppercase tracking-wider text-slate-800',
      secondaryText: 'text-slate-600',
      primaryText: 'text-slate-900',
      navActive:
        'border-emerald-500/45 bg-emerald-500/14 text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]',
      navIdle:
        'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm shadow-slate-200/40 hover:border-emerald-400/30 hover:bg-white hover:text-emerald-800',
      navIconActive: 'bg-emerald-500/18 text-emerald-700',
      navIconIdle: 'bg-slate-100 text-slate-500 group-hover:text-emerald-700',
      headerDivider: 'bg-slate-200/80',
      modalPanel: 'border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-300/50',
      modalBackdrop: 'bg-slate-900/35',
      sidebarSection:
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-3',
      sidebarSectionTitle: 'text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600',
      sidebarInset: 'overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50',
      sidebarLink:
        'shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 transition hover:text-emerald-900',
      scrollArea: 'game-scrollbar-light',
    }
  }

  return {
    isLight: false,
    shellClass: '!bg-gradient-to-br !from-slate-900 !via-slate-900 !to-emerald-950 text-slate-100',
    frame:
      'rounded-[32px] border border-slate-700/50 bg-slate-900/70 shadow-2xl shadow-black/50 ring-1 ring-slate-700/30 backdrop-blur-xl',
    frameDeep:
      'rounded-[32px] border border-slate-700/50 bg-slate-900/75 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.75),0_0_48px_rgba(16,185,129,0.1)] ring-1 ring-slate-600/40 backdrop-blur-xl',
    sectionTitle: 'mb-2 text-sm font-bold uppercase tracking-wider text-white',
    secondaryText: 'text-slate-400',
    primaryText: 'text-white',
    navActive:
      'border-emerald-400/45 bg-emerald-500/16 text-emerald-200 shadow-[inset_0_1px_0_rgba(167,243,208,0.18)]',
    navIdle:
      'border-slate-700/50 bg-slate-800/60 text-slate-400 shadow-sm shadow-black/25 hover:border-emerald-400/25 hover:bg-slate-800/90 hover:text-emerald-100',
    navIconActive: 'bg-emerald-400/18 text-emerald-300',
    navIconIdle: 'bg-slate-900/80 text-slate-400 group-hover:text-emerald-300',
    headerDivider: 'bg-slate-700/50',
    modalPanel: 'border-slate-600/50 bg-slate-900 text-white shadow-2xl shadow-black/60',
    modalBackdrop: 'bg-black/65',
    sidebarSection:
      'overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/65 p-3',
    sidebarSectionTitle: 'text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400',
    sidebarInset:
      'overflow-hidden rounded-xl border border-slate-600/30 bg-[#0c1218]/90',
    sidebarLink:
      'shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400 transition hover:text-emerald-300',
    scrollArea: 'game-scrollbar',
  }
}
