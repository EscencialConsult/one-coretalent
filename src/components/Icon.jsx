// Set de íconos del panel — porteado 1:1 del sprite real de Plataforma ONE (superadmin/Icons.jsx).
const PATHS = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></>,
  build: <><path d="M4 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" /><path d="M13 9h6a1 1 0 0 1 1 1v11" /><path d="M7 8h3M7 12h3M7 16h3M16 13h1M16 17h1" /><path d="M3 21h18" /></>,
  layers: <><path d="M12 3l8 4-8 4-8-4 8-4z" /><path d="M4 12l8 4 8-4" /><path d="M4 16.5l8 4 8-4" /></>,
  cog: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M16 5.3a3.2 3.2 0 0 1 0 6" /><path d="M21 19c0-2.3-1.6-4-4-4.6" /></>,
  doc: <><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h5" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  logout: <><path d="M14 4h-3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M16 12H8" /><path d="M13 9l3 3-3 3" /></>,
  chevL: <path d="M14 6l-6 6 6 6" />,
  chevR: <path d="M10 6l6 6-6 6" />,
  trash: <><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M10 11v6M14 11v6" /></>,
  edit: <><path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z" /><path d="M14.5 6.5l3 3" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.2" /><path d="M4 7l8 6 8-6" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  send: <><path d="M21 4L3 11l6 2.5L11.5 20 21 4z" /><path d="M9 13.5L21 4" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
  file: <><path d="M4 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" /><path d="M13 6l4 4" /></>,
  map: <><path d="M9 4l6 2.5L21 4v14l-6 2.5L9 18l-6 2.5v-14L9 4z" /><path d="M9 4v14M15 6.5v14" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
}

export default function Icon({ name, className = "w-5 h-5", style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] || null}
    </svg>
  )
}
