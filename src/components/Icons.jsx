import React from 'react'

/**
 * One icon per destination. All 20×20, 1.5 stroke, drawn to sit together.
 * Every icon takes { active, size } and colours itself from the theme, so the
 * same component works in the tab bar and the drawer with no emoji fallback.
 */

const col = (active) => (active ? 'var(--accent)' : 'var(--text-muted)')

const wrap = (size, children) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)

export function HomeIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <rect x="2" y="2" width="7" height="7" rx="2" fill={c} />
    <rect x="11" y="2" width="7" height="7" rx="2" fill={c} opacity="0.5" />
    <rect x="2" y="11" width="7" height="7" rx="2" fill={c} opacity="0.5" />
    <rect x="11" y="11" width="7" height="7" rx="2" fill={c} opacity="0.5" />
  </>)
}

export function WeekIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <rect x="2" y="4" width="16" height="13" rx="2" stroke={c} strokeWidth="1.5" />
    <line x1="2" y1="8" x2="18" y2="8" stroke={c} strokeWidth="1.5" />
    <line x1="7" y1="2" x2="7" y2="6" stroke={c} strokeWidth="1.5" />
    <line x1="13" y1="2" x2="13" y2="6" stroke={c} strokeWidth="1.5" />
  </>)
}

export function TasksIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <circle cx="5" cy="6" r="1.5" fill={c} />
    <line x1="8" y1="6" x2="18" y2="6" stroke={c} strokeWidth="1.5" />
    <circle cx="5" cy="10" r="1.5" fill={c} opacity="0.6" />
    <line x1="8" y1="10" x2="15" y2="10" stroke={c} strokeWidth="1.5" opacity="0.6" />
    <circle cx="5" cy="14" r="1.5" fill={c} opacity="0.4" />
    <line x1="8" y1="14" x2="13" y2="14" stroke={c} strokeWidth="1.5" opacity="0.4" />
  </>)
}

export function SectorsIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <rect x="2" y="2" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7" />
    <rect x="2" y="11" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7" />
    <rect x="11" y="11" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.4" />
  </>)
}

export function HabitsIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.5" />
    <polyline points="7,10 9,12 13,8" stroke={c} strokeWidth="1.5" />
  </>)
}

export function ProjectsIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <rect x="4" y="3.5" width="12" height="14.5" rx="2" stroke={c} strokeWidth="1.5" />
    <rect x="7.5" y="1.8" width="5" height="3.2" rx="1.2" stroke={c} strokeWidth="1.5" />
    <line x1="7.2" y1="9.5" x2="12.8" y2="9.5" stroke={c} strokeWidth="1.5" opacity="0.75" />
    <line x1="7.2" y1="13" x2="10.8" y2="13" stroke={c} strokeWidth="1.5" opacity="0.5" />
  </>)
}

export function NotesIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <path d="M11 2.5H6A1.5 1.5 0 0 0 4.5 4v12A1.5 1.5 0 0 0 6 17.5h8a1.5 1.5 0 0 0 1.5-1.5V7L11 2.5Z" stroke={c} strokeWidth="1.5" />
    <path d="M11 2.5V7h4.5" stroke={c} strokeWidth="1.5" opacity="0.7" />
    <line x1="7.5" y1="11" x2="12.5" y2="11" stroke={c} strokeWidth="1.5" opacity="0.6" />
    <line x1="7.5" y1="14" x2="10.5" y2="14" stroke={c} strokeWidth="1.5" opacity="0.4" />
  </>)
}

export function JournalIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <rect x="4" y="2.5" width="12" height="15" rx="1.8" stroke={c} strokeWidth="1.5" />
    <line x1="7.4" y1="2.5" x2="7.4" y2="17.5" stroke={c} strokeWidth="1.5" opacity="0.7" />
    <line x1="10" y1="7" x2="13.2" y2="7" stroke={c} strokeWidth="1.5" opacity="0.6" />
    <line x1="10" y1="10.2" x2="13.2" y2="10.2" stroke={c} strokeWidth="1.5" opacity="0.4" />
  </>)
}

export function GoalsIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.5" />
    <circle cx="10" cy="10" r="4" stroke={c} strokeWidth="1.5" opacity="0.6" />
    <circle cx="10" cy="10" r="1.4" fill={c} />
  </>)
}

export function FocusIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <circle cx="10" cy="11.2" r="6.6" stroke={c} strokeWidth="1.5" />
    <line x1="10" y1="11.2" x2="10" y2="7.6" stroke={c} strokeWidth="1.5" />
    <line x1="7.9" y1="2.3" x2="12.1" y2="2.3" stroke={c} strokeWidth="1.5" />
    <line x1="10" y1="2.3" x2="10" y2="4.6" stroke={c} strokeWidth="1.5" opacity="0.7" />
  </>)
}

export function FinanceIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <rect x="2.3" y="5" width="15.4" height="11" rx="2.2" stroke={c} strokeWidth="1.5" />
    <line x1="2.3" y1="8.6" x2="17.7" y2="8.6" stroke={c} strokeWidth="1.5" opacity="0.65" />
    <circle cx="14.2" cy="12.4" r="1.15" fill={c} />
  </>)
}

export function GroceryIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <path d="M2.4 3h2.1l2.3 9.4h8.3l1.9-6.6H6.2" stroke={c} strokeWidth="1.5" />
    <circle cx="8" cy="16.2" r="1.3" stroke={c} strokeWidth="1.5" />
    <circle cx="14.2" cy="16.2" r="1.3" stroke={c} strokeWidth="1.5" />
  </>)
}

export function SettingsIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <circle cx="10" cy="10" r="2.7" stroke={c} strokeWidth="1.5" />
    <path d="M10 2.3v2.2M10 15.5v2.2M17.7 10h-2.2M4.5 10H2.3M15.45 4.55l-1.55 1.55M6.1 13.9l-1.55 1.55M15.45 15.45L13.9 13.9M6.1 6.1L4.55 4.55"
      stroke={c} strokeWidth="1.5" opacity="0.8" />
  </>)
}


export function HeartIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <path d="M10 16.5S3 12 3 7.3a3.3 3.3 0 0 1 6.2-1.6L10 7l0.8-1.3A3.3 3.3 0 0 1 17 7.3C17 12 10 16.5 10 16.5Z" stroke={c} strokeWidth="1.5" />)
}
export function PeopleIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <circle cx="7" cy="6.5" r="2.6" stroke={c} strokeWidth="1.5" />
    <circle cx="13.5" cy="7.5" r="2.1" stroke={c} strokeWidth="1.5" opacity="0.7" />
    <path d="M2.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke={c} strokeWidth="1.5" />
    <path d="M12.5 12.2c2.2 0.1 4 1.4 4 3.8" stroke={c} strokeWidth="1.5" opacity="0.7" />
  </>)
}
export function PaletteIcon({ active, size = 20 }) {
  const c = col(active)
  return wrap(size, <>
    <path d="M10 2.5c-4.2 0-7.5 3-7.5 7 0 2.4 1.9 3.6 3.6 3.6 1 0 1.7 0.7 1.7 1.6 0 0.5-.2.8-.2 1.3 0 0.8 0.6 1.5 1.6 1.5 4 0 7.8-3.2 7.8-7.4 0-4.3-3.4-7.6-7-7.6Z" stroke={c} strokeWidth="1.5" />
    <circle cx="6.5" cy="8" r="1" fill={c} />
    <circle cx="10" cy="6" r="1" fill={c} />
    <circle cx="13.5" cy="8" r="1" fill={c} />
  </>)
}

/* Sector name -> drawn icon. Falls back to null so a user's custom emoji wins. */

export function FolderIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <path d="M2.5 5.5a1 1 0 0 1 1-1h3.2l1.3 1.6H16.5a1 1 0 0 1 1 1v7.4a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V5.5Z" stroke={cc} strokeWidth="1.5" />)
}
export function StarIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <path d="M10 2.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L3.3 7.8l5-.7L10 2.5Z" stroke={cc} strokeWidth="1.5" />)
}
export function FlagIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M5 2.5v15" stroke={cc} strokeWidth="1.5" /><path d="M5 3.5h9l-1.6 3L14 9.5H5" stroke={cc} strokeWidth="1.5" /></>)
}
export function BriefcaseIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><rect x="2.8" y="6" width="14.4" height="10" rx="1.4" stroke={cc} strokeWidth="1.5" /><path d="M7 6V4.6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V6" stroke={cc} strokeWidth="1.5" /><path d="M2.8 10.5h14.4" stroke={cc} strokeWidth="1.5" /></>)
}
export function BookIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <path d="M4 3.5h8a2 2 0 0 1 2 2v11H6a2 2 0 0 1-2-2v-11Zm10 2a2 2 0 0 1 2-2v11" stroke={cc} strokeWidth="1.5" />)
}
export function DollarIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M10 3v14" stroke={cc} strokeWidth="1.5" /><path d="M13 6.2c-.8-.9-1.9-1.2-3-1.2-1.7 0-3 .9-3 2.4 0 3.4 6.2 1.6 6.2 5 0 1.6-1.5 2.6-3.2 2.6-1.3 0-2.5-.4-3.3-1.4" stroke={cc} strokeWidth="1.5" /></>)
}
export function DumbbellIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M6.5 10h7" stroke={cc} strokeWidth="1.5" /><rect x="3" y="7.5" width="2.4" height="5" rx="0.8" stroke={cc} strokeWidth="1.5" /><rect x="14.6" y="7.5" width="2.4" height="5" rx="0.8" stroke={cc} strokeWidth="1.5" /></>)
}
export function CarIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M3 12.5v-1.6L4.8 6.5a1.4 1.4 0 0 1 1.3-.9h7.8a1.4 1.4 0 0 1 1.3.9L17 10.9v1.6" stroke={cc} strokeWidth="1.5" /><path d="M3 12.5h14v2.2a.8.8 0 0 1-.8.8h-1.4a.8.8 0 0 1-.8-.8v-.9H6v.9a.8.8 0 0 1-.8.8H3.8a.8.8 0 0 1-.8-.8v-2.2Z" stroke={cc} strokeWidth="1.5" /></>)
}
export function BulbIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M7 12.5a4.5 4.5 0 1 1 6 0c-.6.5-1 1-1.1 1.8H8.1c-.1-.8-.5-1.3-1.1-1.8Z" stroke={cc} strokeWidth="1.5" /><path d="M8 16.5h4M8.5 18h3" stroke={cc} strokeWidth="1.5" /></>)
}
export function BellIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M5.5 8a4.5 4.5 0 1 1 9 0c0 4 1.5 5 1.5 5H4s1.5-1 1.5-5Z" stroke={cc} strokeWidth="1.5" /><path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke={cc} strokeWidth="1.5" /></>)
}
export function CameraIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><rect x="2.5" y="6" width="15" height="10.5" rx="1.6" stroke={cc} strokeWidth="1.5" /><path d="M7 6l1-2h4l1 2" stroke={cc} strokeWidth="1.5" /><circle cx="10" cy="11.2" r="2.6" stroke={cc} strokeWidth="1.5" /></>)
}
export function MusicIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M7 14.5V5l8-1.5V13" stroke={cc} strokeWidth="1.5" /><circle cx="5.3" cy="14.5" r="1.8" stroke={cc} strokeWidth="1.5" /><circle cx="13.3" cy="13" r="1.8" stroke={cc} strokeWidth="1.5" /></>)
}
export function PlaneIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <path d="M17 3l-6.5 6.5M17 3l-4.5 14-2.5-6L4 8.5 17 3Z" stroke={cc} strokeWidth="1.5" />)
}
export function GiftIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><rect x="3.5" y="8" width="13" height="8.5" rx="1" stroke={cc} strokeWidth="1.5" /><path d="M2.8 5.5h14.4V8H2.8zM10 5.5v11" stroke={cc} strokeWidth="1.5" /><path d="M10 5.5C10 5.5 8.5 2.8 6.8 3.5 5.6 4 6.5 5.5 7.5 5.5H10Zm0 0c0 0 1.5-2.7 3.2-2 1.2.5.3 2-.7 2H10Z" stroke={cc} strokeWidth="1.5" /></>)
}
export function PhoneIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <path d="M6.5 3.5c.4 0 .8.3 1 .7l1 2.3c.2.5 0 1-.3 1.3l-1 .9a9 9 0 0 0 4 4l.9-1c.3-.4.9-.5 1.3-.3l2.3 1c.4.2.7.6.7 1v2.4c0 .7-.6 1.3-1.3 1.2C9.5 17.4 4.6 12.5 3.9 5.9a1.2 1.2 0 0 1 1.2-1.3h1.4Z" stroke={cc} strokeWidth="1.5" />)
}
export function MailIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><rect x="2.8" y="4.8" width="14.4" height="10.4" rx="1.4" stroke={cc} strokeWidth="1.5" /><path d="M3.2 5.8l6.8 5 6.8-5" stroke={cc} strokeWidth="1.5" /></>)
}
export function ClockIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><circle cx="10" cy="10" r="7" stroke={cc} strokeWidth="1.5" /><path d="M10 6v4.2l2.8 1.6" stroke={cc} strokeWidth="1.5" /></>)
}
export function PinIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M10 17.5s5.5-4.7 5.5-8.5a5.5 5.5 0 0 0-11 0c0 3.8 5.5 8.5 5.5 8.5Z" stroke={cc} strokeWidth="1.5" /><circle cx="10" cy="9" r="2" stroke={cc} strokeWidth="1.5" /></>)
}
export function CartIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M2.5 3.5h1.8l1.9 9.2h8l1.6-6.8H5.2" stroke={cc} strokeWidth="1.5" /><circle cx="7.5" cy="16" r="1.2" stroke={cc} strokeWidth="1.5" /><circle cx="14" cy="16" r="1.2" stroke={cc} strokeWidth="1.5" /></>)
}
export function LeafIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M4 16c0-7 5-12 13-12 0 8-5 13-11 13-.8 0-1.4-.1-2-.3" stroke={cc} strokeWidth="1.5" /><path d="M4 16c2-4 5-7 9-8.5" stroke={cc} strokeWidth="1.5" /></>)
}
export function FireIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <path d="M10 2.5s5 3.5 5 8.5a5 5 0 0 1-10 0c0-1.6.8-3 1.7-4 .2 1 .8 1.8 1.6 2 0-2.3.6-4.8 1.7-6.5Z" stroke={cc} strokeWidth="1.5" />)
}
export function TrophyIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M6 3.5h8v4a4 4 0 0 1-8 0v-4Z" stroke={cc} strokeWidth="1.5" /><path d="M6 5H3.8v1.2A2.2 2.2 0 0 0 6 8.4M14 5h2.2v1.2A2.2 2.2 0 0 1 14 8.4M8.5 11.5h3M8 16.5h4M10 11.5v2.5" stroke={cc} strokeWidth="1.5" /></>)
}
export function RocketIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <><path d="M10 2.5c3 1.5 4.5 4.5 4.5 8l-2 2h-5l-2-2c0-3.5 1.5-6.5 4.5-8Z" stroke={cc} strokeWidth="1.5" /><circle cx="10" cy="8" r="1.5" stroke={cc} strokeWidth="1.5" /><path d="M7.5 14.5l-1.5 3M12.5 14.5l1.5 3M10 14.5v3" stroke={cc} strokeWidth="1.5" /></>)
}
export function BrainIcon({ active, size = 20 }) {
  const cc = col(active)
  return wrap(size, <path d="M10 4.5a2.5 2.5 0 0 0-4.6 1.3A2.3 2.3 0 0 0 4 9.5a2.3 2.3 0 0 0 1.2 3.5 2.3 2.3 0 0 0 4.3 1V4.5Zm0 0a2.5 2.5 0 0 1 4.6 1.3A2.3 2.3 0 0 1 16 9.5a2.3 2.3 0 0 1-1.2 3.5 2.3 2.3 0 0 1-4.3 1" stroke={cc} strokeWidth="1.5" />)
}

export function SectorGlyph({ name, emoji, size = 24, active = true }) {
  // A user-chosen icon from our set, stored as "icon:<key>"
  if (emoji && typeof emoji === 'string' && emoji.startsWith('icon:')) {
    const Chosen = ICON_REGISTRY[emoji.slice(5)]
    if (Chosen) return <Chosen active={active} size={size} />
  }
  const key = (name || '').toLowerCase()
  const map = {
    'real estate': HomeIcon,
    'app development': FocusIcon,
    'personal growth': GoalsIcon,
    'health': HabitsIcon,
    'family': HeartIcon,
    'relationship': PeopleIcon,
    'finance': FinanceIcon,
    'finance / wealth management': FinanceIcon,
    'hobbies': PaletteIcon,
  }
  const Icon = map[key]
  // A known sector shows its drawn icon, UNLESS the user deliberately set a
  // non-default emoji (then their choice wins). Unknown/custom sectors show
  // whatever emoji they carry, falling back to a folder.
  const userPickedEmoji = emoji && !DEFAULT_EMOJIS.has(emoji)
  if (userPickedEmoji) return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>
  if (Icon) return <Icon active={active} size={size} />
  return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji || '📁'}</span>
}

// Emojis we shipped as sector defaults — if the stored emoji is one of these,
// it's not a deliberate user choice, so the drawn icon can take over.
const DEFAULT_EMOJIS = new Set(['🏠','📱','🎨','🏃','🏃\u200d♂️','❤️','❤','💗','💰','💵','📁','🗂️','💪','🎯','🔁'])


/* ── Named registry: lets icons be chosen by the user and stored by key ────── */
export const ICON_REGISTRY = {
  home: HomeIcon,
  week: WeekIcon,
  tasks: TasksIcon,
  sectors: SectorsIcon,
  habits: HabitsIcon,
  projects: ProjectsIcon,
  notes: NotesIcon,
  journal: JournalIcon,
  goals: GoalsIcon,
  focus: FocusIcon,
  finance: FinanceIcon,
  grocery: GroceryIcon,
  settings: SettingsIcon,
  heart: HeartIcon,
  people: PeopleIcon,
  palette: PaletteIcon,
  folder: FolderIcon,
  star: StarIcon,
  flag: FlagIcon,
  briefcase: BriefcaseIcon,
  book: BookIcon,
  dollar: DollarIcon,
  dumbbell: DumbbellIcon,
  car: CarIcon,
  bulb: BulbIcon,
  bell: BellIcon,
  camera: CameraIcon,
  music: MusicIcon,
  plane: PlaneIcon,
  gift: GiftIcon,
  phone: PhoneIcon,
  mail: MailIcon,
  clock: ClockIcon,
  pin: PinIcon,
  cart: CartIcon,
  leaf: LeafIcon,
  fire: FireIcon,
  trophy: TrophyIcon,
  rocket: RocketIcon,
  brain: BrainIcon,
}

// friendly labels for the picker (search/tooltip)
export const ICON_LABELS = {
  home: 'Home', week: 'Calendar', tasks: 'Tasks', sectors: 'Grid',
  habits: 'Habits', projects: 'Projects', notes: 'Notes', journal: 'Journal',
  goals: 'Goals / Target', focus: 'Focus / Timer', finance: 'Finance',
  grocery: 'Grocery / Cart', settings: 'Settings', heart: 'Heart',
  people: 'People', palette: 'Creative',
  folder: 'Folder', star: 'Star', flag: 'Flag', briefcase: 'Work',
  book: 'Book', dollar: 'Money', dumbbell: 'Fitness', car: 'Car',
  bulb: 'Idea', bell: 'Reminder', camera: 'Photo', music: 'Music',
  plane: 'Travel', gift: 'Gift', phone: 'Call', mail: 'Mail',
  clock: 'Time', pin: 'Location', cart: 'Shopping', leaf: 'Nature',
  fire: 'Streak', trophy: 'Win', rocket: 'Launch', brain: 'Mind',
}
