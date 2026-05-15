type CategoryIconName =
  | 'Belleza'
  | 'Moda'
  | 'Bienestar'
  | 'Hogar'
  | 'Alimentacion'
  | 'Educacion'
  | 'Servicios'
  | 'Mascotas'
  | 'Tecnologia'
  | 'Eventos'

interface CategoryIconProps {
  name: CategoryIconName
  size?: number
}

const ICON_STROKE_WIDTH = 1.8

export const CATEGORY_NAMES: CategoryIconName[] = [
  'Belleza',
  'Moda',
  'Bienestar',
  'Hogar',
  'Alimentacion',
  'Educacion',
  'Servicios',
  'Mascotas',
  'Tecnologia',
  'Eventos',
]

export default function CategoryIcon({ name, size = 28 }: CategoryIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 28 28',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: ICON_STROKE_WIDTH,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'Belleza':
      return (
        <svg {...common}>
          <path d="M14 5.5v17" />
          <path d="M5.5 14h17" />
          <path d="M8.5 8.5 19.5 19.5" />
          <path d="M19.5 8.5 8.5 19.5" />
        </svg>
      )
    case 'Moda':
      return (
        <svg {...common}>
          <path d="M9 10.5h10l1.4 11.5H7.6L9 10.5Z" />
          <path d="M11 10.5a3 3 0 0 1 6 0" />
        </svg>
      )
    case 'Bienestar':
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="2.2" />
          <path d="M14 4.5v4" />
          <path d="M14 19.5v4" />
          <path d="M4.5 14h4" />
          <path d="M19.5 14h4" />
          <path d="M7.3 7.3 10.1 10.1" />
          <path d="M17.9 17.9 20.7 20.7" />
          <path d="M20.7 7.3 17.9 10.1" />
          <path d="M10.1 17.9 7.3 20.7" />
        </svg>
      )
    case 'Hogar':
      return (
        <svg {...common}>
          <path d="M6.5 13.5 14 6l7.5 7.5" />
          <path d="M8.5 12v10h11V12" />
        </svg>
      )
    case 'Alimentacion':
      return (
        <svg {...common}>
          <path d="M6 17.5c.4-5 3.7-8 8-8s7.6 3 8 8" />
          <path d="M5.5 17.5h17l-1.5 4H7l-1.5-4Z" />
          <path d="M10.5 13.2c.8 1 1.2 2.2 1.1 3.7" />
          <path d="M15.5 12.4c.8 1.1 1.1 2.4.9 4.2" />
        </svg>
      )
    case 'Educacion':
      return (
        <svg {...common}>
          <path d="M4 10.5 14 6l10 4.5-10 4.5L4 10.5Z" />
          <path d="M8.5 12.6v4.2c2.8 2.1 8.2 2.1 11 0v-4.2" />
          <path d="M22 11v6" />
          <path d="M22 19.5v.5" />
        </svg>
      )
    case 'Servicios':
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="4.1" />
          <path d="M14 4.5v2.4" />
          <path d="M14 21.1v2.4" />
          <path d="M4.5 14h2.4" />
          <path d="M21.1 14h2.4" />
          <path d="M7.3 7.3 9 9" />
          <path d="M19 19 20.7 20.7" />
          <path d="M20.7 7.3 19 9" />
          <path d="M9 19 7.3 20.7" />
        </svg>
      )
    case 'Mascotas':
      return (
        <svg {...common}>
          <path d="M14 22s-8-4.9-8-11a4.2 4.2 0 0 1 7.2-3 4.2 4.2 0 0 1 7.2 3c0 6.1-6.4 10-6.4 10Z" />
        </svg>
      )
    case 'Tecnologia':
      return (
        <svg {...common}>
          <path d="M7 8.5h14v9H7v-9Z" />
          <path d="M4.5 21h19" />
          <path d="M11.5 17.5h5" />
        </svg>
      )
    case 'Eventos':
      return (
        <svg {...common}>
          <path d="M14 6v16" />
          <path d="M6 14h16" />
        </svg>
      )
  }
}
