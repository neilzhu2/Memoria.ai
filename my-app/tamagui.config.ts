import { createTamagui } from 'tamagui'

const tokens = {
  color: { background: 'white', color: 'black', primary: '#7c5cff' },
  radius: { 1: 6, 2: 10, 3: 16 },
  space: { 1: 6, 2: 10, 3: 16, 4: 24, true: 10 },
  size: { 1: 32, 2: 40, 3: 48, true: 40 },
  zIndex: { 0: 0, 1: 100, 2: 200, 3: 300 },
}

const fonts = {
  body: {
    family: 'System',
    size: { 1: 12, 2: 14, 3: 16, 4: 20 },
    lineHeight: { 1: 16, 2: 20, 3: 24, 4: 28 },
    weight: { 4: '400', 6: '600' },
    letterSpacing: { 1: 0, 2: 0.25, 3: 0.5, 4: 0.75 },
  },
}

export default createTamagui({
  tokens,
  themes: {
    modern:  { background: '#0b0f14', color: '#e6e9ef', primary: '#7c5cff' },
    classic: { background: '#f7f5f0', color: '#2b2b2b', primary: '#355c7d' },
  },
  fonts,
})
