export const colors = {
  sand: '#f6f3ee',
  ink: '#101010',
  sage: '#2f5d50',
  sky: '#7aa6b8',
  peach: '#f1d6c4',
  stone: '#1b1b1b',
  card: '#fffaf5',
  border: 'rgba(16, 16, 16, 0.12)',
  muted: 'rgba(16, 16, 16, 0.6)',
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
}

export const text = {
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase' as const,
    color: 'rgba(16, 16, 16, 0.55)',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.ink,
  },
  serifHeading: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: colors.ink,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(16,16,16,0.6)',
  },
  muted: {
    color: 'rgba(16,16,16,0.6)',
  },
}

export const shadows = {
  soft: {
    shadowColor: '#101010',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
}
