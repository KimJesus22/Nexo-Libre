'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function NavegacionGlobal() {
  const pathname = usePathname()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const links = [
    { href: '/panel', label: 'Panel' },
    { href: '/chat', label: 'Chat' },
    { href: '/ajustes', label: 'Ajustes' },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex w-full items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <span className="text-accent font-bold">N</span>
              </div>
              <span className="text-lg font-bold text-foreground">NexoLibre</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 min-h-[44px] flex items-center rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 min-h-[44px] min-w-[44px] rounded-md text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black flex items-center justify-center"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuAbierto(false)}
            aria-hidden="true"
          />
          {/* Drawer Content */}
          <div className="relative flex w-3/4 max-w-sm flex-col bg-surface border-l border-border h-full ml-auto p-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-bold text-foreground">Menú</span>
              <button
                onClick={() => setMenuAbierto(false)}
                className="p-2 min-h-[44px] min-w-[44px] rounded-md text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black flex items-center justify-center"
                aria-label="Cerrar menú"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuAbierto(false)}
                  className={`px-4 py-3 min-h-[44px] flex items-center rounded-md text-base font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
