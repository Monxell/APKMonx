"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { User, Crown, Download, LogOut, Edit3, Calendar, ArrowUpRight, Heart, Trash2, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { App } from "@/types"

type Tab = "overview" | "downloads" | "favorites"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [downloads, setDownloads] = useState<any[]>([])
  const [favorites, setFavorites] = useState<(App & { favorite_id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push("/auth/login")
        return
      }
      setUser(authUser)

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      setProfile(profileData)
      setUsername(profileData?.username || "")

      // Fetch downloads
      const { data: downloadData } = await supabase
        .from("downloads")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(10)
      setDownloads(downloadData || [])

      // Fetch favorites (khusus VIP)
      if (profileData?.is_vip) {
        const { data: favData } = await supabase
          .from("favorites")
          .select(`
            id,
            app:apps(*)
          `)
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })

        if (favData) {
          const flattened = favData.map((item: any) => ({
            ...item.app,
            favorite_id: item.id,
          }))
          setFavorites(flattened)
        }
      }

      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const handleUpdateProfile = async () => {
    if (!user) return
    const { error } = await supabase
      .from("users")
      .update({ username })
      .eq("id", user.id)

    if (error) {
      toast.error("Failed to update profile")
      return
    }

    setProfile({ ...profile, username })
    setIsEditing(false)
    toast.success("Profile updated!")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", favoriteId)
    if (error) {
      toast.error("Failed to remove")
      return
    }
    toast.success("Removed from favorites")
    setFavorites(prev => prev.filter(f => f.favorite_id !== favoriteId))
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="neo-card bg-white dark:bg-neo-gray-dark p-8 animate-pulse">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full border-2 border-neo-black mx-auto mb-4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto" />
        </div>
      </main>
    )
  }

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: User },
    { id: "downloads" as Tab, label: "Downloads", icon: Download },
    { id: "favorites" as Tab, label: "Favorites", icon: Heart },
  ]

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="neo-card bg-white dark:bg-neo-gray-dark p-6 md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-neo-cyan/20 dark:bg-neo-purple/20 border-3 border-neo-black rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-neo-cyan dark:text-neo-purple" />
              )}
            </div>
            {profile?.is_vip && (
              <div className="absolute -bottom-1 -right-1 bg-neo-yellow border-2 border-neo-black rounded-full p-1.5">
                <Crown className="w-4 h-4 text-neo-black" />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="w-full max-w-sm space-y-3">
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                className="neo-input w-full px-4 py-2 text-center" placeholder="Username" />
              <div className="flex gap-2 justify-center">
                <button onClick={handleUpdateProfile} className="neo-button px-4 py-2 bg-neo-cyan dark:bg-neo-purple text-white text-sm">Save</button>
                <button onClick={() => setIsEditing(false)} className="neo-button px-4 py-2 bg-gray-400 dark:bg-gray-600 text-white text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black mb-1">{profile?.username || user?.email?.split("@")[0]}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{user?.email}</p>

              <div className="flex items-center gap-3 mb-4">
                {profile?.is_vip ? (
                  <span className="neo-badge bg-neo-yellow text-neo-black flex items-center gap-1">
                    <Crown className="w-3 h-3" /> VIP Active
                  </span>
                ) : (
                  <span className="neo-badge bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">Free User</span>
                )}
                {profile?.role === "admin" && (
                  <span className="neo-badge bg-neo-purple text-white">Admin</span>
                )}
              </div>

              {profile?.vip_expires_at && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-4">
                  <Calendar className="w-3 h-3" />
                  VIP expires: {formatDate(profile.vip_expires_at)}
                </p>
              )}

              <div className="flex flex-wrap gap-2 justify-center">
                {!profile?.is_vip && (
                  <Link href="/membership"
                    className="neo-button px-4 py-2 bg-neo-yellow text-neo-black text-sm font-bold flex items-center gap-2">
                    <Crown className="w-4 h-4" /> Upgrade to VIP
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}

                <button onClick={() => setIsEditing(true)}
                  className="neo-button px-4 py-2 bg-white dark:bg-neo-gray-dark text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
                <button onClick={handleLogout}
                  className="neo-button px-4 py-2 bg-red-500 text-white text-sm flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`neo-button px-4 py-2 text-sm font-bold flex items-center gap-2 flex-shrink-0 ${
                isActive
                  ? "bg-neo-cyan dark:bg-neo-purple text-white border-2 border-neo-black shadow-neo"
                  : "bg-white dark:bg-neo-gray-dark text-gray-600 dark:text-gray-400"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="neo-card bg-white dark:bg-neo-gray-dark p-4 text-center">
              <Download className="w-6 h-6 text-neo-cyan mx-auto mb-2" />
              <p className="text-2xl font-black">{downloads.length}</p>
              <p className="text-xs text-gray-500">Downloads</p>
            </div>
            <div className="neo-card bg-white dark:bg-neo-gray-dark p-4 text-center">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-black">{favorites.length}</p>
              <p className="text-xs text-gray-500">Favorites</p>
            </div>
            <div className="neo-card bg-white dark:bg-neo-gray-dark p-4 text-center">
              <Crown className="w-6 h-6 text-neo-yellow mx-auto mb-2" />
              <p className="text-2xl font-black">{profile?.is_vip ? "Yes" : "No"}</p>
              <p className="text-xs text-gray-500">VIP Status</p>
            </div>
            <div className="neo-card bg-white dark:bg-neo-gray-dark p-4 text-center">
              <Calendar className="w-6 h-6 text-neo-purple mx-auto mb-2" />
              <p className="text-2xl font-black">{formatDate(profile?.created_at)}</p>
              <p className="text-xs text-gray-500">Joined</p>
            </div>
          </div>
        )}

        {/* DOWNLOADS TAB */}
        {activeTab === "downloads" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="neo-card bg-white dark:bg-neo-gray-dark p-6">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-neo-cyan dark:text-neo-purple" />
              Download History
            </h2>

            {downloads.length > 0 ? (
              <div className="space-y-3">
                {downloads.map((dl) => (
                  <div key={dl.id} className="flex items-center gap-3 p-3 border-2 border-neo-black rounded-lg bg-neo-gray-light dark:bg-neo-gray-dark">
                    <div className="w-10 h-10 bg-neo-cyan/20 dark:bg-neo-purple/20 rounded-lg border border-neo-black flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{dl.app_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(dl.created_at)}</p>
                    </div>
                    {dl.is_vip && <span className="neo-badge bg-neo-yellow text-xs">VIP</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No download history yet</p>
            )}
          </motion.div>
        )}

        {/* FAVORITES TAB */}
        {activeTab === "favorites" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {!profile?.is_vip ? (
              <div className="neo-card bg-neo-yellow/10 border-2 border-neo-yellow p-8 text-center">
                <Crown className="w-12 h-12 text-neo-yellow mx-auto mb-3" />
                <h3 className="font-black text-xl mb-2">VIP Feature</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upgrade to VIP to save your favorite apps.
                </p>
                <Link href="/membership" className="neo-button px-6 py-3 bg-neo-yellow text-neo-black font-bold">
                  Upgrade Now
                </Link>
              </div>
            ) : favorites.length === 0 ? (
              <div className="neo-card bg-white dark:bg-neo-gray-dark p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg">No Favorites Yet</h3>
                <p className="text-sm text-gray-500">Start adding apps you love!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((app, i) => (
                  <motion.div
                    key={app.favorite_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="neo-card bg-white dark:bg-neo-gray-dark p-4 border-2 border-neo-black flex items-center gap-3"
                  >
                    <Link href={`/app/${app.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-neo-cyan/20 rounded-lg border-2 border-neo-black flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {app.icon_url ? (
                          <img src={app.icon_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-neo-cyan">{app.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate">{app.name}</h4>
                        <p className="text-xs text-gray-500">{app.developer}</p>
                        <span className="text-xs text-neo-cyan font-bold">{app.version}</span>
                      </div>
                    </Link>
                    
                    <button
                      onClick={() => removeFavorite(app.favorite_id)}
                      className="neo-button p-2 bg-red-100 text-red-600 border-2 border-red-400 flex-shrink-0"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </main>
  )
}
