import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type T = 'modern' | 'classic'
type State = { theme: T; setTheme: (t: T) => void }

export const useSettings = create<State>()(
  persist(
    (set) => ({ theme: 'modern', setTheme: (t) => set({ theme: t }) }),
    { name: 'settings' }
  )
)
