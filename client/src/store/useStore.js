import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      theme: 'dark',
      language: 'en',

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      updateCurrency: (currency) =>
        set((state) => ({ user: { ...state.user, currency } })),
      setLanguage: (language) => {
        set({ language })
        document.documentElement.lang = language
      },
      logout: () => set({ user: null, accessToken: null }),

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        if (next === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
    }),
    {
      name: 'expense-tracker-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)

export default useStore
