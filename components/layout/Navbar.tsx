"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Sun, Moon, Menu, X, Package, Crown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isVip, setIsVip] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from("users").select("is_vip").eq("id", user.id).single()
        setIsVip(data?.is_vip || false)
      }
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-neo-black bg-white dark:bg-neo-purple-darker shadow-neo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-neo-cyan dark:bg-neo-purple border-2 border-neo-black rounded-lg shadow-neo flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">
              <span className="text-neo-cyan dark:text-neo-purple">APK</span>
              <span className="text-neo-yellow">Monx</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="neo-button px-4 py-2 bg-white dark:bg-neo-gray-dark text-sm hover:bg-neo-cyan/10 dark:hover:bg-neo-purple/20">Home</Link>
            <Link href="/search" className="neo-button px-4 py-2 bg-white dark:bg-neo-gray-dark text-sm hover:bg-neo-cyan/10 dark:hover:bg-neo-purple/20">Search</Link>
            {user ? (
              <div className="flex items-center gap-2">
                {isVip && <span className="neo-badge bg-neo-yellow text-neo-black flex items-center gap-1"><Crown className="w-3 h-3" /> VIP</span>}
                <Link href="/profile" className="neo-button px-4 py-2 bg-neo-cyan dark:bg-neo-purple text-white text-sm">Profile</Link>
                <button onClick={handleLogout} className="neo-button px-4 py-2 bg-red-500 text-white text-sm">Logout</button>
              </div>
            ) : (
              <Link href="/auth/login" className="neo-button px-4 py-2 bg-neo-cyan dark:bg-neo-purple text-white text-sm">Login</Link>
            )}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="neo-button p-2 bg-neo-yellow dark:bg-neo-purple-dark" title="Toggle Dark Mode">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="neo-button p-2 bg-neo-yellow dark:bg-neo-purple-dark" title="Toggle Dark Mode">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="neo-button p-2 bg-white dark:bg-neo-gray-dark">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden border-t-2 border-neo-black bg-white dark:bg-neo-purple-darker overflow-hidden">
            <div className="px-4 py-4 space-y-2">
              <Link href="/" className="block neo-button px-4 py-3 bg-white dark:bg-neo-gray-dark text-center" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/search" className="block neo-button px-4 py-3 bg-white dark:bg-neo-gray-dark text-center" onClick={() => setIsMenuOpen(false)}>Search</Link>
              {user ? (
                <>
                  <Link href="/profile" className="block neo-button px-4 py-3 bg-neo-cyan dark:bg-neo-purple text-white text-center" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                  <button onClick={handleLogout} className="w-full neo-button px-4 py-3 bg-red-500 text-white text-center">Logout</button>
                </>
              ) : (
                <Link href="/auth/login" className="block neo-button px-4 py-3 bg-neo-cyan dark:bg-neo-purple text-white text-center" onClick={() => setIsMenuOpen(false)}>Login</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
