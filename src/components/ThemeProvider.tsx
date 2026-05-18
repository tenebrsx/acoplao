'use client'

import { createContext, useContext, useEffect, useState, Context } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

// Prevent HMR from re-creating the context object during hot reloads
const ThemeProviderContext = (typeof window !== 'undefined' && (window as any).__themeContext
  ? (window as any).__themeContext
  : (() => {
      const ctx = createContext<ThemeProviderState | undefined>(undefined)
      if (typeof window !== 'undefined') (window as any).__themeContext = ctx
      return ctx
    })()) as Context<ThemeProviderState | undefined>

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'aura-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let resolved: 'dark' | 'light'
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolved = theme
    }

    root.classList.add(resolved)
    setResolvedTheme(resolved)
  }, [theme])

  useEffect(() => {
    if (theme === 'system') {
      const listener = (e: MediaQueryListEvent) => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(e.matches ? 'dark' : 'light')
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener)
      return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
