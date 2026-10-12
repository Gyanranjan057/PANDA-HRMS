import React, { useEffect, useState } from 'react'

export const useStore = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore localStorage write errors
    }
  }, [key, value])

  return [value, setValue]
}

const PATHS = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 12l3 3 5-6',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19 12c0-.4 0-.8-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 21h4l.6-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  clipboard: 'M9 3h6v3H9z M7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a2 2 0 0 0 3.4 0',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  filter: 'M3 4h18l-7 8v6l-4 2v-8z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z M9 12l2 2 4-4',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  plus: 'M12 5v14 M5 12h14',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  arrowLeft: 'M19 12H5 M12 19l-7-7 7-7',
  arrowRight: 'M5 12h14 M12 5l7 7-7 7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.3-1 .4-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10z M7.5 11h.01 M10 7.5h.01 M14.5 7.5h.01 M17 11h.01',
  cloud: 'M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H7z',
  building: 'M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16 M14 10h5a1 1 0 0 1 1 1v10 M3 21h18 M8 8h2 M8 12h2 M8 16h2'
}

export const Icon = ({ name, className = 'h-5 w-5' }) => {
  const iconPath = PATHS[name] || PATHS.grid

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={iconPath} />
    </svg>
  )
}

export const Avatar = ({ name = '', src, size = 'h-9 w-9' }) => {
  const [hasError, setHasError] = useState(false)

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className={`${size} shrink-0 rounded-full object-cover ring-2 ring-brand/40`}
      />
    )
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand`}>
      {initials}
    </span>
  )
}

export const Modal = ({ title, onClose, children, wide = false }) => {
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`panel w-full p-6 ${wide ? 'max-w-xl' : 'max-w-md'}`}
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-mute hover:text-main">
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

export const Field = ({ label, children }) => (
  <label className="mb-3 block text-sm">
    {label && <span className="mb-1 block text-mute">{label}</span>}
    {children}
  </label>
)

export const Stat = ({ label, value, sub, color = 'text-main' }) => (
  <div className="panel p-5">
    <p className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</p>
    <p className={`my-2 text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-sm text-mute">{sub}</p>
  </div>
)