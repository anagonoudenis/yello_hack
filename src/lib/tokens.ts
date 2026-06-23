export const colors = {
  brand: {
    yellow: '#FFCB00', yellowHover: '#EDBA00', yellowActive: '#D4A800',
    yellowLight: '#FFFAE6', yellowSubtle: '#FFF5CC',
    black: '#1A1A1A', blackSoft: '#242424',
  },
  surface: {
    page: '#F4F4F5', card: '#FFFFFF', cardHover: '#FAFAFA',
    overlay: '#00000080', input: '#FAFAFA', sidebar: '#111111',
  },
  border: {
    default: '#E4E4E7', strong: '#D4D4D8', focus: '#FFCB00', card: '#E4E4E7',
  },
  text: {
    primary: '#09090B', secondary: '#52525B', tertiary: '#A1A1AA',
    inverse: '#FFFFFF', brand: '#FFCB00', mono: '#09090B',
  },
  status: {
    successFg: '#166534', successBg: '#F0FDF4', successBdr: '#BBF7D0',
    warningFg: '#92400E', warningBg: '#FFFBEB', warningBdr: '#FDE68A',
    dangerFg: '#991B1B', dangerBg: '#FEF2F2', dangerBdr: '#FECACA',
    infoFg: '#1E40AF', infoBg: '#EFF6FF', infoBdr: '#BFDBFE',
  },
} as const

export const geometry = {
  radius: { xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '20px', full: '9999px' },
  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.05)',
    sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
    lg: '0 10px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    focus: '0 0 0 3px rgba(255,203,0,0.30)',
    card: '0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)',
  },
  duration: { micro: '80ms', fast: '150ms', normal: '220ms', slow: '350ms' },
  easing: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const
