"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, Users, Tags, ArrowLeft, Shield,
  Plus, Pencil, Trash2, Search, Crown, UserCheck, UserX,
  Image as ImageIcon, BarChart3, TrendingUp,
  Download, X, Star, Link as LinkIcon, Trash,
  CreditCard, Tag, AlertTriangle, Loader2, ChevronUp, ChevronDown,
  Check, ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { App } from "@/types"
import { toast } from "sonner"
import { generateSlug, formatDate } from "@/lib/utils"

type Tab = "dashboard" | "apps" | "users" | "categories" | "membership"

const tabs = [
  { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
  { id: "apps" as Tab, label: "Apps", icon: Package },
  { id: "users" as Tab, label: "Users", icon: Users },
  { id: "categories" as Tab, label: "Categories", icon: Tags },
  { id: "membership" as Tab, label: "Membership", icon: CreditCard },
]

const PERIOD_OPTIONS = [
  { value: "1 week", label: "1 Week (7 days)" },
  { value: "1 month", label: "1 Month (30 days)" },
  { value: "3 months", label: "3 Months (90 days)" },
  { value: "6 months", label: "6 Months (180 days)" },
  { value: "1 year", label: "1 Year (365 days)" },
  { value: "lifetime", label: "Lifetime (Forever)" },
]

const EMPTY_PLAN = {
  name: "",
  price: "",
  original_price: null as string | null,
  period: "",
  description: "",
  features: [] as string[],
  accent: "cyan",
  popular: false,
  is_active: true,
  sort_order: 0,
  info_gangguan: null as string | null,
  discount_percent: null as number | null,
  is_free: false,
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { window.location.href = "/auth/login"; return }
      setUser(authUser)
      const { data: profile } = await supabase.from("users").select("role").eq("id", authUser.id).single()
      if (profile?.role !== "admin") { window.location.href = "/"; return }
      setIsAdmin(true); setChecking(false)
    }
    checkAdmin()
  }, [supabase])

  if (checking) return (
    <div className="min-h-screen bg-neo-gray-light dark:bg-neo-black flex items-center justify-center">
      <div className="neo-card bg-white dark:bg-neo-gray-dark p-8 text-center">
        <div className="w-12 h-12 border-4 border-neo-cyan dark:border-neo-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-bold">Checking admin access...</p>
      </div>
    </div>
  )
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-neo-gray-light dark:bg-neo-black">
      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neo-gray-dark border-r-2 border-neo-black min-h-screen p-6 hidden lg:block sticky top-0">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-neo-cyan dark:bg-neo-purple border-2 border-neo-black rounded-lg shadow-neo flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg">APKMonza</span>
          </Link>
          <div className="flex items-center gap-2 mb-6 px-4 py-2 bg-neo-yellow/20 border-2 border-neo-black rounded-lg">
            <Shield className="w-4 h-4 text-neo-yellow-dark" />
            <span className="text-xs font-bold text-neo-yellow-dark">ADMIN PANEL</span>
          </div>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all text-left ${
                    isActive ? "bg-neo-cyan dark:bg-neo-purple text-white border-2 border-neo-black shadow-neo"
                      : "hover:bg-neo-cyan/10 dark:hover:bg-neo-purple/20 border-2 border-transparent"
                  }`}>
                  <Icon className="w-5 h-5" /> {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neo-gray-dark border-b-2 border-neo-black p-2 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 neo-button px-3 py-2 text-xs font-bold flex items-center gap-1 ${
                  activeTab === tab.id ? "bg-neo-cyan dark:bg-neo-purple text-white" : "bg-white dark:bg-neo-gray-dark"
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

        <main className="flex-1 p-6 lg:p-8 lg:pt-8 pt-20">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === "dashboard" && <DashboardTab />}
              {activeTab === "apps" && <AppsTab />}
              {activeTab === "users" && <UsersTab />}
              {activeTab === "categories" && <CategoriesTab />}
              {activeTab === "membership" && <MembershipTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

/* ─────────────── DASHBOARD ─────────────── */
function DashboardTab() {
  const [stats, setStats] = useState({ apps: 0, users: 0, downloads: 0, vip: 0 })
  const [recentDownloads, setRecentDownloads] = useState<any[]>([])
  const [maintenance, setMaintenance] = useState(false)
  const [maintenanceMsg, setMaintenanceMsg] = useState("")
  const [loadingMaintenance, setLoadingMaintenance] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const { count: apps } = await supabase.from("apps").select("*", { count: "exact", head: true })
      const { count: users } = await supabase.from("users").select("*", { count: "exact", head: true })
      const { count: downloads } = await supabase.from("downloads").select("*", { count: "exact", head: true })
      const { count: vip } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("is_vip", true)
      setStats({ apps: apps || 0, users: users || 0, downloads: downloads || 0, vip: vip || 0 })
      const { data: recent } = await supabase.from("downloads").select("*").order("created_at", { ascending: false }).limit(10)
      setRecentDownloads(recent || [])
    }

    const fetchMaintenance = async () => {
      const res = await fetch("/api/maintenance")
      const data = await res.json()
      setMaintenance(data.maintenance)
      setMaintenanceMsg(data.message)
    }

    fetchStats()
    fetchMaintenance()
  }, [supabase])

  const toggleMaintenance = async () => {
    setLoadingMaintenance(true)
    const newValue = !maintenance

    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: newValue, message: maintenanceMsg }),
    })

    if (res.ok) {
      setMaintenance(newValue)
      toast.success(newValue ? "Maintenance mode ON" : "Maintenance mode OFF")
    } else {
      toast.error("Failed to update maintenance mode")
    }
    setLoadingMaintenance(false)
  }

  const saveMessage = async () => {
    setLoadingMaintenance(true)
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: maintenance, message: maintenanceMsg }),
    })

    if (res.ok) {
      toast.success("Maintenance message updated!")
    } else {
      toast.error("Failed to update message")
    }
    setLoadingMaintenance(false)
  }

  const statCards = [
    { label: "Total Apps", value: stats.apps, icon: Package, color: "bg-neo-cyan" },
    { label: "Total Users", value: stats.users, icon: Users, color: "bg-neo-purple" },
    { label: "Downloads", value: stats.downloads, icon: Download, color: "bg-neo-yellow" },
    { label: "VIP Users", value: stats.vip, icon: Crown, color: "bg-green-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-neo-cyan dark:text-neo-purple" /> Dashboard
        </h1>
        
        <button
          onClick={() => setShowMaintenanceModal(true)}
          className={`neo-button px-4 py-2 font-bold text-sm flex items-center gap-2 transition-all ${
            maintenance 
              ? "bg-red-500 text-white border-2 border-neo-black shadow-neo" 
              : "bg-green-500 text-white border-2 border-neo-black shadow-neo"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {maintenance ? "Maintenance ON" : "Maintenance OFF"}
        </button>
      </div>

      {maintenance && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="neo-card bg-red-100 dark:bg-red-900/20 border-2 border-red-500 p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-600 dark:text-red-400">Maintenance Mode Active</p>
            <p className="text-xs text-red-500 dark:text-red-300 line-clamp-1">{maintenanceMsg}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="neo-card bg-white dark:bg-neo-gray-dark p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} border-2 border-neo-black rounded-lg flex items-center justify-center shadow-neo`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-black">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="neo-card bg-white dark:bg-neo-gray-dark p-6">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-neo-cyan dark:text-neo-purple" /> Recent Downloads
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-neo-black">
                <th className="text-left py-2 text-xs font-black">App</th>
                <th className="text-left py-2 text-xs font-black">Date</th>
                <th className="text-left py-2 text-xs font-black-black">Type</th>
              </tr>
            </thead>
            <tbody>
              {recentDownloads.map((dl) => (
                <tr key={dl.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 text-sm font-bold">{dl.app_name}</td>
                  <td className="py-2 text-xs text-gray-500">{formatDate(dl.created_at)}</td>
                  <td className="py-2">
                    {dl.is_vip ? <span className="neo-badge bg-neo-yellow text-xs">VIP</span> : <span className="text-xs text-gray-500">Free</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAINTENANCE MODAL */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="neo-card bg-white dark:bg-neo-gray-dark p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Maintenance Settings
              </h2>
              <button onClick={() => setShowMaintenanceModal(false)} className="neo-button p-2 bg-gray-300 dark:bg-gray-600 text-neo-black dark:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-3 border-2 border-neo-black rounded-lg bg-neo-gray-light dark:bg-neo-gray-dark">
                <div>
                  <p className="font-bold text-sm">Maintenance Mode</p>
                  <p className="text-xs text-gray-500">{maintenance ? "Site is currently down" : "Site is running normally"}</p>
                </div>
                <button
                  onClick={toggleMaintenance}
                  disabled={loadingMaintenance}
                  className={`relative w-14 h-8 rounded-full border-2 border-neo-black transition-colors ${
                    maintenance ? "bg-red-500" : "bg-green-500"
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white border-2 border-neo-black rounded-full transition-transform ${
                    maintenance ? "translate-x-7" : "translate-x-1"
                  }`} />
                </button>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block font-bold text-sm mb-1">Maintenance Message</label>
                <textarea
                  value={maintenanceMsg}
                  onChange={(e) => setMaintenanceMsg(e.target.value)}
                  rows={3}
                  className="neo-input w-full px-3 py-2 text-sm"
                  placeholder="Enter message for users..."
                />
                <p className="text-xs text-gray-500 mt-1">This message will be shown to all users during maintenance.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowMaintenanceModal(false)} className="neo-button flex-1 py-2 bg-gray-400 dark:bg-gray-600 text-white font-bold">
                  Close
                </button>
                <button 
                  onClick={saveMessage} 
                  disabled={loadingMaintenance}
                  className="neo-button flex-1 py-2 bg-neo-cyan text-white font-bold"
                >
                  {loadingMaintenance ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Message"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/* ─────────────── APPS ─────────────── */
function AppsTab() {
  const [apps, setApps] = useState<App[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const supabase = createClient()

  const emptyApp: Partial<App> = {
    name: "", slug: "", version: "", developer: "",
    mod_feature: "", mod_feature_full: "", description: "",
    package_name: "", size: "", free_url: "", direct_url: "", vip_url: "",
    category_id: "", icon_url: "", screenshots: [], is_recommended: false,
    rating: 4.5, download_count: 0,
  }
  const [formData, setFormData] = useState<Partial<App>>(emptyApp)

  useEffect(() => { fetchApps(); fetchCategories() }, [])

  const fetchApps = async () => {
    const { data, error } = await supabase.from("apps").select("*").order("created_at", { ascending: false })
    if (error) { toast.error("Failed to load apps: " + error.message); return }
    setApps(data || [])
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*")
    setCategories(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const slug = formData.slug || generateSlug(formData.name || "")
    const dataToSend = { ...formData, slug }
    if (editingApp) {
      const { error } = await supabase.from("apps").update(dataToSend).eq("id", editingApp.id)
      if (error) { toast.error("Failed to update: " + error.message); return }
      toast.success("App updated!")
    } else {
      const { error } = await supabase.from("apps").insert(dataToSend)
      if (error) { toast.error("Failed to create: " + error.message); return }
      toast.success("App created!")
    }
    setShowModal(false); setEditingApp(null); setFormData(emptyApp); setScreenshotUrl(""); fetchApps()
  }

  const handleCopyUrl = (url: string, label: string) => {
    navigator.clipboard.writeText(url)
    toast.success(`${label} copied to clipboard!`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this app?")) return
    const { error } = await supabase.from("apps").delete().eq("id", id)
    if (error) { toast.error("Failed to delete: " + error.message); return }
    toast.success("App deleted!"); fetchApps()
  }

  const toggleRecommended = async (app: App) => {
    const newValue = !app.is_recommended
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, is_recommended: newValue } : a))
    const { error } = await supabase.from("apps").update({ is_recommended: newValue }).eq("id", app.id)
    if (error) {
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, is_recommended: app.is_recommended } : a))
      toast.error("Failed to update: " + error.message)
      return
    }
    toast.success(newValue ? "Added to recommendations" : "Removed from recommendations!")
    fetchApps()
  }

  const openEdit = (app: App) => { setEditingApp(app); setFormData(app); setShowModal(true) }
  const openCreate = () => { setEditingApp(null); setFormData(emptyApp); setScreenshotUrl(""); setShowModal(true) }

  const addScreenshot = () => {
    if (!screenshotUrl.trim()) { toast.error("Please enter a screenshot URL"); return }
    if (!screenshotUrl.match(/^https?:\/\/.+/)) { toast.error("Please enter a valid URL"); return }
    const currentScreenshots = formData.screenshots || []
    if (currentScreenshots.includes(screenshotUrl.trim())) { toast.error("This screenshot URL already exists"); return }
    setFormData({ ...formData, screenshots: [...currentScreenshots, screenshotUrl.trim()] })
    setScreenshotUrl(""); toast.success("Screenshot added!")
  }

  const removeScreenshot = (index: number) => {
    const newScreenshots = (formData.screenshots || []).filter((_, i) => i !== index)
    setFormData({ ...formData, screenshots: newScreenshots })
    toast.success("Screenshot removed!")
  }

  const filtered = apps.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black flex items-center gap-2"><Package className="w-8 h-8 text-neo-cyan dark:text-neo-purple" /> Manage Apps</h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openCreate} className="neo-button px-4 py-2 bg-neo-cyan dark:bg-neo-purple text-white font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add App</motion.button>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search apps..." className="neo-input w-full pl-12 pr-4 py-3" />
      </div>
      <div className="neo-card bg-white dark:bg-neo-gray-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-neo-black bg-neo-gray-light dark:bg-neo-gray-dark">
                <th className="text-left px-4 py-3 font-black text-sm">App</th>
                <th className="text-left px-4 py-3 font-black text-sm hidden md:table-cell">Version</th>
                <th className="text-left px-4 py-3 font-black text-sm hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-black text-sm">Rec</th>
                <th className="text-left px-4 py-3 font-black text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-neo-cyan/5 dark:hover:bg-neo-purple/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neo-cyan/20 rounded-lg border border-neo-black flex items-center justify-center">
                        {app.icon_url ? <img src={app.icon_url} alt="" className="w-full h-full rounded-lg object-cover" /> : <ImageIcon className="w-4 h-4" />}
                      </div>
                      <div><p className="font-bold text-sm">{app.name}</p><p className="text-xs text-gray-500">{app.developer}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">{app.version}</td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">{categories.find((c) => c.id === app.category_id)?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleRecommended(app)} className={`neo-button p-1.5 ${app.is_recommended ? "bg-neo-yellow text-neo-black" : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300"}`}>
                      <Star className={`w-4 h-4 ${app.is_recommended ? "fill-current" : ""}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => openEdit(app)} className="neo-button p-2 bg-neo-yellow text-neo-black" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleCopyUrl(`https://apkmonza.vercel.app/app/${app.slug}`, "App URL")} className="neo-button p-2 bg-neo-cyan text-white" title="Copy App URL"><LinkIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleCopyUrl(`https://apkmonza.vercel.app/download/${app.slug}`, "Download URL")} className="neo-button p-2 bg-neo-purple text-white" title="Copy Download URL"><ExternalLink className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(app.id)} className="neo-button p-2 bg-red-500 text-white" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="neo-card bg-white dark:bg-neo-gray-dark p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">{editingApp ? "Edit App" : "Add New App"}</h2>
              <button onClick={() => setShowModal(false)} className="neo-button p-2 bg-gray-300 dark:bg-gray-600 text-neo-black dark:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block font-bold text-sm mb-1">Name *</label><input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="App Name" /></div>
                <div><label className="block font-bold text-sm mb-1">Slug</label><input value={formData.slug || ""} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="auto-generated" /></div>
                <div><label className="block font-bold text-sm mb-1">Version *</label><input required value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="1.0.0" /></div>
                <div><label className="block font-bold text-sm mb-1">Developer *</label><input required value={formData.developer} onChange={(e) => setFormData({ ...formData, developer: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="Developer Name" /></div>
                <div><label className="block font-bold text-sm mb-1">Category</label><select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="neo-input w-full px-3 py-2"><option value="">Select Category</option>{categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></div>
                <div><label className="block font-bold text-sm mb-1">Package Name</label><input value={formData.package_name || ""} onChange={(e) => setFormData({ ...formData, package_name: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="com.example.app" /></div>
                <div><label className="block font-bold text-sm mb-1">Size</label><input value={formData.size || ""} onChange={(e) => setFormData({ ...formData, size: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="50 MB" /></div>
                <div><label className="block font-bold text-sm mb-1">Icon URL</label><input value={formData.icon_url || ""} onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="https://..." /></div>
                <div><label className="block font-bold text-sm mb-1 flex items-center gap-1"><Star className="w-3 h-3 text-neo-yellow fill-neo-yellow" /> Rating</label><input type="number" step="0.1" min="0" max="5" value={formData.rating ?? 4.5} onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })} className="neo-input w-full px-3 py-2" placeholder="4.5" /></div>
                <div><label className="block font-bold text-sm mb-1 flex items-center gap-1"><Download className="w-3 h-3 text-neo-cyan" /> Download Count</label><input type="number" min="0" value={formData.download_count ?? 0} onChange={(e) => setFormData({ ...formData, download_count: parseInt(e.target.value) })} className="neo-input w-full px-3 py-2" placeholder="0" /></div>
              </div>

              <div className="border-2 border-neo-black rounded-lg p-4 bg-neo-gray-light dark:bg-neo-gray-dark space-y-3">
                <label className="block font-bold text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4 text-neo-cyan dark:text-neo-purple" /> Screenshots</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={screenshotUrl} onChange={(e) => setScreenshotUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addScreenshot())} placeholder="Paste image URL (e.g. https://i.ibb.co/...)" className="neo-input w-full pl-10 pr-3 py-2 text-sm" />
                  </div>
                  <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={addScreenshot} className="neo-button px-4 py-2 bg-neo-cyan dark:bg-neo-purple text-white text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Add</motion.button>
                </div>
                {formData.screenshots && formData.screenshots.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formData.screenshots.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-[9/16] rounded-lg border-2 border-neo-black overflow-hidden bg-white dark:bg-neo-gray-dark">
                          <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3EBroken Link%3C/text%3E%3C/svg%3E" }} />
                        </div>
                        <button type="button" onClick={() => removeScreenshot(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full border-2 border-neo-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-neo"><Trash className="w-3 h-3" /></button>
                        <p className="text-xs text-gray-500 mt-1 truncate px-1">Screenshot {index + 1}</p>
                      </div>
                    ))}
                  </div>
                )}
                {(!formData.screenshots || formData.screenshots.length === 0) && (
                  <div className="text-center py-6 text-gray-500 text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"><ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />No screenshots added yet.</div>
                )}
              </div>

              <div><label className="block font-bold text-sm mb-1">Mod Feature (Short)</label><input value={formData.mod_feature || ""} onChange={(e) => setFormData({ ...formData, mod_feature: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="Unlimited Money" /></div>
              <div><label className="block font-bold text-sm mb-1">Mod Feature (Full)</label><input value={formData.mod_feature_full || ""} onChange={(e) => setFormData({ ...formData, mod_feature_full: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="Full mod description" /></div>
              <div><label className="block font-bold text-sm mb-1">Description</label><textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="neo-input w-full px-3 py-2" placeholder="App description..." /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block font-bold text-sm mb-1">Free Download URL</label><input value={formData.free_url || ""} onChange={(e) => setFormData({ ...formData, free_url: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="https://..." /></div>
                <div><label className="block font-bold text-sm mb-1">Direct Link Non-VIP</label><input value={formData.direct_url || ""} onChange={(e) => setFormData({ ...formData, direct_url: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="https://..." /></div>
                <div><label className="block font-bold text-sm mb-1">VIP Download URL</label><input value={formData.vip_url || ""} onChange={(e) => setFormData({ ...formData, vip_url: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="https://..." /></div>
              </div>
              <div className="flex items-center gap-3 p-3 border-2 border-neo-black rounded-lg bg-neo-gray-light dark:bg-neo-gray-dark">
                <input type="checkbox" id="is_recommended" checked={formData.is_recommended || false} onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })} className="w-5 h-5 border-2 border-neo-black rounded cursor-pointer" />
                <label htmlFor="is_recommended" className="font-bold text-sm cursor-pointer flex items-center gap-2"><Star className="w-4 h-4 text-neo-yellow" /> Show in Recommendations</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="neo-button flex-1 py-2 bg-gray-400 dark:bg-gray-600 text-white font-bold">Cancel</button>
                <button type="submit" className="neo-button flex-1 py-2 bg-neo-cyan dark:bg-neo-purple text-white font-bold">{editingApp ? "Update" : "Create"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/* ─────────────── USERS ─────────────── */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showVipModal, setShowVipModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const supabase = createClient()

  useEffect(() => { fetchUsers(); fetchPlans() }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })
    if (error) { toast.error("Failed to load users"); return }
    setUsers(data || [])
  }

  const fetchPlans = async () => {
    const { data } = await supabase.from("membership_plans").select("*").eq("is_active", true).eq("is_free", false).order("sort_order")
    setPlans(data || [])
  }

  const openVipModal = (user: any) => {
    setSelectedUser(user)
    setSelectedPlanId(plans[0]?.id || "")
    setShowVipModal(true)
  }

  const handleMakeVip = async () => {
    if (!selectedUser || !selectedPlanId) return
    const plan = plans.find(p => p.id === selectedPlanId)
    if (!plan) return

    let days = 30
    const periodStr = (plan.period || "").toLowerCase()
    const nameStr = (plan.name || "").toLowerCase()
    const match = periodStr.match(/(\d+)\s*(week|month|year)/)
    if (match) {
      const num = parseInt(match[1])
      const unit = match[2]
      if (unit === "week") days = num * 7
      else if (unit === "month") days = num * 30
      else if (unit === "year") days = num * 365
    } else if (periodStr.includes("lifetime") || nameStr.includes("lifetime")) {
      days = 36500
    }

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from("users").update({ 
      is_vip: true, vip_plan_id: selectedPlanId, vip_expires_at: expiresAt 
    }).eq("id", selectedUser.id)

    if (error) { toast.error("Failed to activate VIP"); return }
    toast.success(`VIP ${plan.name} activated! (${days} days)`)
    setShowVipModal(false); fetchUsers()
  }

  const handleRemoveVip = async (id: string) => {
    const { error } = await supabase.from("users").update({ 
      is_vip: false, vip_plan_id: null, vip_expires_at: null 
    }).eq("id", id)
    if (error) { toast.error("Failed to remove VIP"); return }
    toast.success("VIP removed!"); fetchUsers()
  }

  const toggleAdmin = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin"
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", id)
    if (error) { toast.error("Failed"); return }
    toast.success(`Role: ${newRole}`); fetchUsers()
  }

  const getPlanName = (planId: string | null) => {
    if (!planId) return ""
    return plans.find(p => p.id === planId)?.name || ""
  }

  const filtered = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
        <Users className="w-7 h-7 md:w-8 md:h-8 text-neo-cyan dark:text-neo-purple" /> Manage Users
      </h1>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search users..." className="neo-input w-full pl-12 pr-4 py-3 text-sm md:text-base" />
      </div>

      <div className="hidden md:block neo-card bg-white dark:bg-neo-gray-dark overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-neo-black bg-neo-gray-light dark:bg-neo-gray-dark">
              <th className="text-left px-4 py-3 font-black text-sm">User</th>
              <th className="text-left px-4 py-3 font-black text-sm">Role</th>
              <th className="text-left px-4 py-3 font-black text-sm">VIP Plan</th>
              <th className="text-left px-4 py-3 font-black text-sm">Expires</th>
              <th className="text-left px-4 py-3 font-black text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-neo-cyan/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neo-cyan/20 rounded-full border-2 border-neo-black flex items-center justify-center">
                      <span className="font-bold text-sm">{user.username?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{user.username || "-"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`neo-badge text-xs ${user.role === "admin" ? "bg-neo-purple text-white" : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200"}`}>{user.role}</span>
                </td>
                <td className="px-4 py-3">
                  {user.is_vip ? (
                    <span className="neo-badge bg-neo-yellow text-neo-black text-xs flex items-center gap-1">
                      <Crown className="w-3 h-3" /> {getPlanName(user.vip_plan_id) || "VIP"}
                    </span>
                  ) : <span className="text-xs text-gray-500">Free</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{user.vip_expires_at ? formatDate(user.vip_expires_at) : "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {user.is_vip ? (
                      <button onClick={() => handleRemoveVip(user.id)} className="neo-button px-3 py-1.5 text-xs font-bold bg-red-500 text-white">
                        <UserX className="w-3 h-3 inline" /> Remove
                      </button>
                    ) : (
                      <button onClick={() => openVipModal(user)} className="neo-button px-3 py-1.5 text-xs font-bold bg-neo-yellow text-neo-black">
                        <UserCheck className="w-3 h-3 inline" /> Make VIP
                      </button>
                    )}
                    <button onClick={() => toggleAdmin(user.id, user.role)} className={`neo-button px-3 py-1.5 text-xs font-bold ${user.role === "admin" ? "bg-orange-500 text-white" : "bg-neo-cyan text-white"}`}>
                      <Shield className="w-3 h-3 inline" /> {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(user => (
          <div key={user.id} className="neo-card bg-white dark:bg-neo-gray-dark p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-neo-cyan/20 rounded-full border-2 border-neo-black flex items-center justify-center">
                <span className="font-bold text-lg">{user.username?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold">{user.username || "-"}</p>
                  {user.role === "admin" && <span className="neo-badge text-xs bg-neo-purple text-white">admin</span>}
                  {user.is_vip && <span className="neo-badge text-xs bg-neo-yellow text-neo-black flex items-center gap-1"><Crown className="w-3 h-3" /> {getPlanName(user.vip_plan_id)}</span>}
                </div>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.vip_expires_at && <p className="text-xs text-gray-400">Expires: {formatDate(user.vip_expires_at)}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {user.is_vip ? (
                <button onClick={() => handleRemoveVip(user.id)} className="neo-button py-2.5 text-sm font-bold bg-red-500 text-white">
                  <UserX className="w-4 h-4 inline" /> Remove VIP
                </button>
              ) : (
                <button onClick={() => openVipModal(user)} className="neo-button py-2.5 text-sm font-bold bg-neo-yellow text-neo-black">
                  <UserCheck className="w-4 h-4 inline" /> Make VIP
                </button>
              )}
              <button onClick={() => toggleAdmin(user.id, user.role)} className={`neo-button py-2.5 text-sm font-bold ${user.role === "admin" ? "bg-orange-500 text-white" : "bg-neo-cyan text-white"}`}>
                <Shield className="w-4 h-4 inline" /> {user.role === "admin" ? "Remove Admin" : "Make Admin"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showVipModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="neo-card bg-white dark:bg-neo-gray-dark w-full max-w-md border-3 border-neo-black p-6">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Crown className="w-5 h-5 text-neo-yellow" /> Activate VIP</h2>
            <p className="text-sm text-gray-500 mb-4">User: <span className="font-bold">{selectedUser.username || selectedUser.email}</span></p>
            <div className="space-y-2 mb-4">
              {plans.map(plan => (
                <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full neo-card p-3 flex items-center gap-3 border-2 ${selectedPlanId === plan.id ? "border-neo-cyan bg-neo-cyan/5" : "border-neo-black"}`}>
                  <div className={`w-8 h-8 rounded-lg border-2 border-neo-black flex items-center justify-center ${plan.accent === 'yellow' ? 'bg-neo-yellow' : plan.accent === 'purple' ? 'bg-neo-purple' : 'bg-neo-cyan'}`}>
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm">{plan.name}</p>
                    <p className="text-xs text-gray-500">{plan.price} / {plan.period}</p>
                  </div>
                  {selectedPlanId === plan.id && <Check className="w-5 h-5 text-neo-cyan" />}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowVipModal(false)} className="flex-1 neo-button py-3 bg-gray-400 dark:bg-gray-600 text-white text-sm font-bold">Cancel</button>
              <button onClick={handleMakeVip} className="flex-1 neo-button py-3 bg-neo-yellow text-neo-black text-sm font-bold">
                <Crown className="w-4 h-4 inline" /> Activate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/* ─────────────── CATEGORIES ─────────────── */
function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState<any>(null)
  const [formData, setFormData] = useState({ name: "", slug: "", icon: "", color: "#06b6d4" })
  const supabase = createClient()

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name")
    if (error) { toast.error("Failed to load categories: " + error.message); return }
    setCategories(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCat) {
      const { error } = await supabase.from("categories").update(formData).eq("id", editingCat.id)
      if (error) { toast.error("Failed to update: " + error.message); return }
      toast.success("Category updated!")
    } else {
      const { error } = await supabase.from("categories").insert({ ...formData, slug: formData.name.toLowerCase().replace(/\s+/g, "-") })
      if (error) { toast.error("Failed to create: " + error.message); return }
      toast.success("Category created!")
    }
    setShowModal(false); setEditingCat(null); setFormData({ name: "", slug: "", icon: "", color: "#06b6d4" }); fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) { toast.error("Failed to delete: " + error.message); return }
    toast.success("Category deleted!"); fetchCategories()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black flex items-center gap-2"><Tags className="w-8 h-8 text-neo-cyan dark:text-neo-purple" /> Manage Categories</h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingCat(null); setFormData({ name: "", slug: "", icon: "", color: "#06b6d4" }); setShowModal(true) }} className="neo-button px-4 py-2 bg-neo-cyan dark:bg-neo-purple text-white font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Category</motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <motion.div key={cat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="neo-card bg-white dark:bg-neo-gray-dark p-4">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg border-2 border-neo-black flex items-center justify-center" style={{ backgroundColor: cat.color }}><span className="text-white font-bold text-sm">{cat.name.charAt(0)}</span></div><div><p className="font-bold">{cat.name}</p><p className="text-xs text-gray-500">{cat.slug}</p></div></div>
            <div className="flex gap-2"><button onClick={() => { setEditingCat(cat); setFormData(cat); setShowModal(true) }} className="neo-button p-2 bg-neo-yellow text-neo-black flex-1 flex items-center justify-center gap-1 text-xs font-bold"><Pencil className="w-3 h-3" /> Edit</button><button onClick={() => handleDelete(cat.id)} className="neo-button p-2 bg-red-500 text-white flex-1 flex items-center justify-center gap-1 text-xs font-bold"><Trash2 className="w-3 h-3" /> Delete</button></div>
          </motion.div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="neo-card bg-white dark:bg-neo-gray-dark p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-black">{editingCat ? "Edit" : "Add"} Category</h2><button onClick={() => setShowModal(false)} className="neo-button p-2 bg-gray-300 dark:bg-gray-600 text-neo-black dark:text-white"><X className="w-4 h-4" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block font-bold text-sm mb-1">Name</label><input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="neo-input w-full px-3 py-2" /></div>
              <div><label className="block font-bold text-sm mb-1">Icon (lucide name)</label><input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="neo-input w-full px-3 py-2" placeholder="gamepad2" /></div>
              <div><label className="block font-bold text-sm mb-1">Color</label><div className="flex gap-2"><input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-12 h-10 border-2 border-neo-black rounded-lg cursor-pointer" /><input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="neo-input flex-1 px-3 py-2" /></div></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowModal(false)} className="neo-button flex-1 py-2 bg-gray-400 dark:bg-gray-600 text-white font-bold">Cancel</button><button type="submit" className="neo-button flex-1 py-2 bg-neo-cyan dark:bg-neo-purple text-white font-bold">Save</button></div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/* ─────────────── MEMBERSHIP ─────────────── */
function MembershipTab() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const supabase = createClient()

  const fetchPlans = async () => {
    const { data } = await supabase.from("membership_plans").select("*").order("sort_order")
    setPlans(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPlans() }, [])

  const handleSave = async () => {
    if (!editingPlan) return
    if (editingPlan.id) {
      await supabase.from("membership_plans").update(editingPlan).eq("id", editingPlan.id)
      toast.success("Updated")
    } else {
      await supabase.from("membership_plans").insert(editingPlan)
      toast.success("Created")
    }
    setIsModalOpen(false)
    fetchPlans()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return
    await supabase.from("membership_plans").delete().eq("id", id)
    toast.success("Deleted")
    fetchPlans()
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-neo-cyan" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2"><Crown className="w-6 h-6 text-neo-yellow" /> Membership Plans</h1>
        <button onClick={() => { setEditingPlan({ ...EMPTY_PLAN, sort_order: plans.length }); setIsModalOpen(true) }}
          className="neo-button px-4 py-2 bg-neo-cyan text-white font-bold text-sm">
          <Plus className="w-4 h-4 inline" /> Add
        </button>
      </div>

      <div className="md:hidden space-y-3">
        {plans.map(plan => (
          <div key={plan.id} className={`neo-card overflow-hidden border-2 border-neo-black ${plan.is_active ? "bg-white dark:bg-neo-gray-dark" : "opacity-60"}`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg border-2 border-neo-black flex items-center justify-center ${plan.accent === 'yellow' ? 'bg-neo-yellow' : plan.accent === 'purple' ? 'bg-neo-purple' : 'bg-neo-cyan'}`}>
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black">{plan.name}</h3>
                    {plan.popular && <span className="px-2 py-0.5 bg-neo-yellow text-xs font-black rounded-full border border-neo-black">POPULAR</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold">{plan.price}</span>
                    {plan.original_price && <span className="text-gray-400 line-through text-sm">{plan.original_price}</span>}
                    {plan.discount_percent > 0 && <span className="px-1.5 bg-red-100 text-red-600 text-xs font-black rounded border border-red-400">-{plan.discount_percent}%</span>}
                  </div>
                  {plan.info_gangguan && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-red-600">{plan.info_gangguan}</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                className="w-full mt-3 text-xs font-bold text-gray-500 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1">
                {expandedPlan === plan.id ? <><ChevronUp className="w-4 h-4" /> Less</> : <><ChevronDown className="w-4 h-4" /> More</>}
              </button>
            </div>
            {expandedPlan === plan.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                <div className="space-y-1">
                  {plan.features?.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm"><Tag className="w-3 h-3 text-gray-400" /><span className="text-gray-600 dark:text-gray-400">{f}</span></div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingPlan({...plan}); setIsModalOpen(true) }} className="flex-1 neo-button py-2 bg-neo-yellow text-neo-black text-sm font-bold">
                    <Pencil className="w-3 h-3 inline" /> Edit
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="neo-button p-2 bg-red-100 text-red-600 border-2 border-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block space-y-3">
        {plans.map(plan => (
          <div key={plan.id} className={`neo-card p-4 flex items-center gap-4 border-2 border-neo-black ${plan.is_active ? "bg-white dark:bg-neo-gray-dark" : "opacity-60"}`}>
            <div className={`w-10 h-10 rounded-lg border-2 border-neo-black flex items-center justify-center ${plan.accent === 'yellow' ? 'bg-neo-yellow' : plan.accent === 'purple' ? 'bg-neo-purple' : 'bg-neo-cyan'}`}>
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black">{plan.name}</h3>
                {plan.popular && <span className="px-2 py-0.5 bg-neo-yellow text-xs font-black rounded-full border border-neo-black">POPULAR</span>}
                {plan.info_gangguan && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full border border-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{plan.info_gangguan}</span>}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold">{plan.price}</span>
                {plan.original_price && <span className="text-gray-400 line-through">{plan.original_price}</span>}
                {plan.discount_percent > 0 && <span className="px-1.5 bg-red-100 text-red-600 text-xs font-black rounded border border-red-400">-{plan.discount_percent}%</span>}
                <span className="text-gray-500">{plan.period}</span>
                <span className="text-gray-500">{plan.description}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingPlan({...plan}); setIsModalOpen(true) }} className="neo-button px-3 py-2 bg-neo-yellow text-neo-black text-xs font-bold">Edit</button>
              <button onClick={() => handleDelete(plan.id)} className="neo-button p-2 bg-red-100 text-red-600 border-2 border-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="neo-card bg-white dark:bg-neo-gray-dark w-full max-w-lg border-3 border-neo-black p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-4">{editingPlan.id ? "Edit" : "New"} Plan</h2>
            <div className="space-y-3">
              <input value={editingPlan.name || ""} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} placeholder="Name" className="neo-input w-full p-2" />
              <div className="grid grid-cols-3 gap-3">
                <input value={editingPlan.price || ""} onChange={e => setEditingPlan({...editingPlan, price: e.target.value})} placeholder="Price" className="neo-input w-full p-2" />
                <input value={editingPlan.original_price || ""} onChange={e => setEditingPlan({...editingPlan, original_price: e.target.value || null})} placeholder="Original Price" className="neo-input w-full p-2" />
                <input type="number" min="0" max="100" value={editingPlan.discount_percent || ""} onChange={e => setEditingPlan({...editingPlan, discount_percent: e.target.value ? parseInt(e.target.value) : null})} placeholder="Discount %" className="neo-input w-full p-2" />
              </div>

              <div>
                <label className="block font-bold text-sm mb-1">Period *</label>
                <select
                  value={editingPlan.period || ""}
                  onChange={e => setEditingPlan({...editingPlan, period: e.target.value})}
                  className="neo-input w-full p-2"
                >
                  <option value="">Select period...</option>
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Determines how long VIP stays active for users.</p>
              </div>

              <input value={editingPlan.description || ""} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} placeholder="Description" className="neo-input w-full p-2" />
              <input value={editingPlan.info_gangguan || ""} onChange={e => setEditingPlan({...editingPlan, info_gangguan: e.target.value || null})} placeholder="Service Notice" className="neo-input w-full p-2 border-red-400" />
              <div className="grid grid-cols-2 gap-3">
                <select value={editingPlan.accent || "cyan"} onChange={e => setEditingPlan({...editingPlan, accent: e.target.value})} className="neo-input w-full p-2">
                  <option value="cyan">Cyan</option>
                  <option value="yellow">Yellow</option>
                  <option value="purple">Purple</option>
                </select>
                <input type="number" value={editingPlan.sort_order || 0} onChange={e => setEditingPlan({...editingPlan, sort_order: parseInt(e.target.value)})} placeholder="Sort Order" className="neo-input w-full p-2" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><input type="checkbox" checked={editingPlan.popular || false} onChange={e => setEditingPlan({...editingPlan, popular: e.target.checked})} /> Popular</label>
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><input type="checkbox" checked={editingPlan.is_active !== false} onChange={e => setEditingPlan({...editingPlan, is_active: e.target.checked})} /> Active</label>
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><input type="checkbox" checked={editingPlan.is_free || false} onChange={e => setEditingPlan({...editingPlan, is_free: e.target.checked})} /> Free</label>
              </div>
              <div className="space-y-2">
                {(editingPlan.features || []).map((f: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <input value={f} onChange={e => { const nf = [...(editingPlan.features || [])]; nf[i] = e.target.value; setEditingPlan({...editingPlan, features: nf}) }} className="flex-1 neo-input p-2" />
                    <button onClick={() => setEditingPlan({...editingPlan, features: (editingPlan.features || []).filter((_:any, ii:number) => ii !== i)})} className="neo-button p-2 bg-red-100 text-red-600 border-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setEditingPlan({...editingPlan, features: [...(editingPlan.features || []), ""]})} className="neo-button w-full py-2 bg-neo-purple/20 dark:bg-neo-purple/40 text-neo-purple dark:text-neo-purple font-bold border-neo-purple">
                  <Plus className="w-4 h-4 inline mr-1" /> Add Feature
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 neo-button py-2 bg-gray-400 dark:bg-gray-600 text-white font-bold">Cancel</button>
                <button onClick={handleSave} className="flex-1 neo-button py-2 bg-neo-cyan text-white font-bold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
