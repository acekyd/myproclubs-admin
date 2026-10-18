export type NavItem = {
  label: string
  to: string
  icon: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const adminNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/', icon: 'i-lucide-gauge' }
    ]
  },
  {
    label: 'People',
    items: [
      { label: 'Users', to: '/users', icon: 'i-lucide-users' },
      { label: 'Clubs', to: '/clubs', icon: 'i-lucide-shield' }
    ]
  },
  {
    label: 'Content',
    items: [
      { label: 'Announcements', to: '/announcements', icon: 'i-lucide-megaphone' },
      { label: 'Media', to: '/media', icon: 'i-lucide-image' },
      { label: 'Recruitment', to: '/recruitments', icon: 'i-lucide-user-plus' }
    ]
  },
  {
    label: 'Competitions',
    items: [
      { label: 'Tournaments', to: '/tournaments', icon: 'i-lucide-trophy' }
    ]
  },
  {
    label: 'Match data',
    items: [
      { label: 'Seasons', to: '/seasons', icon: 'i-lucide-calendar-range' },
      { label: 'Fixtures', to: '/fixtures', icon: 'i-lucide-calendar' },
      { label: 'Records', to: '/records', icon: 'i-lucide-clipboard-list' },
      { label: 'Player stats', to: '/player-stats', icon: 'i-lucide-activity' }
    ]
  },
  {
    label: 'Insights',
    items: [
      { label: 'Journeys', to: '/insights/journeys', icon: 'i-lucide-route' },
      { label: 'Events', to: '/insights/events', icon: 'i-lucide-radar' },
      { label: 'Funnels', to: '/insights/funnels', icon: 'i-lucide-filter' }
    ]
  },

  {
    label: 'Operations',
    items: [
      { label: 'Support', to: '/operations', icon: 'i-lucide-wrench' },
      { label: 'Audit log', to: '/audit', icon: 'i-lucide-scroll-text' }
    ]
  }
]
