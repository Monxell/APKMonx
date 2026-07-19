"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Download, Calendar, Package, HardDrive, Crown, ArrowLeft, ChevronRight, Zap, Info, Server, Star } from "lucide-react"
import { App, Category } from "@/types"
import { formatDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { AppCard } from "@/components/ui/AppCard"
import FavoriteButton from "@/components/FavoriteButton"
import { toast } from "sonner"

interface Props {
  app: App
  relatedApps: App[]
}

export function AppDetailClient({ app, relatedApps }: Props) {
  const [user, setUser] = useState<any>(null)
  const [isVip, setIsVip] = useState(false)
  const [showVipModal, setShowVipModal] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [category, setCategory] = useState<Category | null>(null)
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

    const getCategory = async () => {
      if (app.category_id) {
        const { data } = await supabase.from("categories").select("*").eq("id", app.category_id).single()
        setCategory(data)
      }
    }

    getUser()
    getCategory()
  }, [])

  const handleDownload = async () => {
    const downloadUrl = app.free_url
    if (!downloadUrl) {
      toast.error("Download link is not available")
      return
    }

    if (user) {
      await supabase.from("downloads").insert({
        user_id: user.id,
        app_id: app.id,
        app_name: app.name,
        download_url: downloadUrl,
        is_vip: false,
      })
    }

    window.open(downloadUrl, "_blank")
    toast.success("Download started!")
  }

  const handleVipDownload = async () => {
    if (!user) {
      toast.error("Please log in first")
      return
    }
    if (!isVip) {
      setShowVipModal(true)
      return
    }
    await supabase.from("downloads").insert({
      user_id: user.id,
      app_id: app.id,
      app_name: app.name,
      download_url: app.vip_url,
      is_vip: true,
    })
    window.open(app.vip_url!, "_blank")
    toast.success("VIP Download started!")
  }

  return (
    <main className="w-full max-w-2xl mx-auto py-6 space-y-4">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold hover:text-neo-cyan dark:hover:text-neo-purple transition-colors mx-1">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* 1. Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-1 neo-card bg-white dark:bg-neo-gray-dark p-5"
      >
        <div className="flex items-center gap-4">
          {/* Icon App */}
          <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-neo-cyan/20 dark:bg-neo-purple/20 border-3 border-neo-black rounded-2xl flex items-center justify-center overflow-hidden shadow-neo">
            {app.icon_url ? (
              <img
                src={app.icon_url}
                alt={app.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `<span class="text-3xl font-bold text-neo-cyan dark:text-neo-purple">${app.name.charAt(0)}</span>`
                  }
                }}
              />
            ) : (
              <span className="text-3xl font-bold text-neo-cyan dark:text-neo-purple">{app.name.charAt(0)}</span>
            )}
          </div>

         {/* Info App */}
<div className="flex-1 min-w-0 flex flex-col justify-center">
  <h1 className="text-lg md:text-xl font-black truncate leading-none">{app.name}</h1>

  {/* VERSION + CATEGORY + FAVORITE */}
  <div className="flex items-center justify-between gap-2 -mt-1">
    <div className="flex items-center gap-2 text-sm font-bold min-w-0">
      <span className="text-neo-cyan dark:text-neo-purple">v{app.version}</span>
      {category && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400 truncate">{category.name}</span>
        </>
      )}
    </div>
    <div className="flex-shrink-0">
      <FavoriteButton appId={app.id} isVip={isVip} userId={user?.id} />
    </div>
  </div>

  {/* RATING + DOWNLOAD */}
  <div className="flex items-center gap-3 text-sm -mt-1">
    <span className="flex items-center gap-1">
      <Star className="w-4 h-4 fill-neo-yellow text-neo-yellow" />
      <span className="font-bold">{app.rating || "4.5"}</span>
    </span>
    <span className="flex items-center gap-1">
      <Download className="w-4 h-4 text-gray-400" />
      <span className="font-bold">{(app.download_count || 0).toLocaleString()}</span>
    </span>
  </div>
</div>

      {/* 2. Screenshots */}
      {app.screenshots && app.screenshots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-1 neo-card bg-white dark:bg-neo-gray-dark p-6"
        >
          <h2 className="text-xl font-black mb-4">Screenshots</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {app.screenshots.map((screenshot, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`flex-shrink-0 w-48 h-80 rounded-xl border-3 overflow-hidden transition-all ${
                  activeImage === i ? "border-neo-cyan dark:border-neo-purple shadow-neo-cyan" : "border-neo-black"
                }`}
              >
                <img
                  src={screenshot}
                  alt={`Screenshot ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">Failed to load</div>'
                    }
                  }}
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3. Mod Features */}
      {app.mod_feature_full && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-1 neo-card bg-white dark:bg-neo-gray-dark p-6"
        >
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neo-cyan dark:text-neo-purple" />
            Mod Features
          </h2>
          <div className="space-y-2">
            {app.mod_feature_full.split("\n").map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-neo-cyan dark:bg-neo-purple flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 4. Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-1 neo-card bg-white dark:bg-neo-gray-dark p-6"
      >
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-neo-cyan dark:text-neo-purple" />
          More info
        </h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{app.description}</p>
      </motion.div>

      {/* 5. Tech Specs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mx-1 neo-card bg-white dark:bg-neo-gray-dark p-6"
      >
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-neo-cyan dark:text-neo-purple" />
          Tech Specs
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <InfoItem icon={<ChevronRight className="w-5 h-5" />} label="Version" value={app.version} />
          <InfoItem icon={<HardDrive className="w-5 h-5" />} label="Size" value={app.size} />
          <InfoItem icon={<Package className="w-5 h-5" />} label="Package" value={app.package_name} />
          <InfoItem icon={<Calendar className="w-5 h-5" />} label="Updated" value={formatDate(app.upload_date)} />
        </div>
      </motion.div>

      {/* 6. Download Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mx-1 neo-card bg-white dark:bg-neo-gray-dark p-6"
      >
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-neo-cyan dark:text-neo-purple" />
          Download Link
        </h2>
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="w-full neo-button px-6 py-4 bg-neo-cyan dark:bg-neo-purple text-white font-black text-lg flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download APK {app.size && `(${app.size})`}
          </motion.button>

          {app.vip_url && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleVipDownload}
                className={`w-full neo-button px-6 py-4 font-black text-lg flex items-center justify-center gap-2 ${
                  isVip
                    ? "bg-neo-yellow text-neo-black"
                    : "bg-neo-yellow/30 text-neo-black border-dashed"
                }`}
              >
                <Crown className="w-5 h-5" />
                {isVip ? "Download VIP (Direct)" : "Download VIP 🔒"}
              </motion.button>

              <div className="flex items-center gap-2 p-3 border-2 border-neo-black rounded-lg bg-neo-yellow/10">
                <Crown className="w-4 h-4 text-neo-yellow flex-shrink-0" />
                <p className="text-sm font-bold">
                  <span className="text-neo-yellow">VIP</span> users get direct download links without redirects
                </p>
              </div>
            </>
          )}

          {!user && (
            <Link
              href="/auth/login"
              className="w-full neo-button px-4 py-3 bg-white dark:bg-neo-gray-dark text-sm font-bold flex items-center justify-center gap-2"
            >
              Log in and subscribe to VIP
            </Link>
          )}
        </div>
      </motion.div>

      {/* 7. Related Apps */}
      {relatedApps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mx-1"
        >
          <h2 className="text-xl font-black mb-4">Similar Apps</h2>
          <div className="grid grid-cols-1 gap-4">
            {relatedApps.map((relatedApp, i) => (
              <AppCard key={relatedApp.id} app={relatedApp} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* VIP Modal */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="neo-card bg-white dark:bg-neo-gray-dark p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-neo-yellow/20 border-2 border-neo-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-neo-yellow" />
            </div>
            <h2 className="text-2xl font-black mb-2">Upgrade to VIP</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get VIP download links with high speed and no ads. Upgrade now!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowVipModal(false)}
                className="flex-1 neo-button px-4 py-3 bg-gray-400 dark:bg-gray-600 text-white text-sm font-bold"
              >
                Later
              </button>
              <Link
                href="/membership"
                onClick={() => setShowVipModal(false)}
                className="flex-1 neo-button px-4 py-3 bg-neo-yellow text-neo-black text-sm font-bold"
              >
                Upgrade VIP
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="w-full p-3 border-2 border-neo-black rounded-lg bg-neo-gray-light dark:bg-neo-gray-dark">
      <div className="text-neo-cyan dark:text-neo-purple mb-1">{icon}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-bold text-sm truncate">{value}</p>
    </div>
  )
}
