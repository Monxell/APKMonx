"use client"

import { useState, useEffect } from "react"
import { Heart, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface FavoriteButtonProps {
  appId: string
  isVip: boolean
  userId?: string
}

export default function FavoriteButton({ appId, isVip, userId }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId || !isVip) {
      setLoading(false)
      return
    }

    const checkFavorite = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("app_id", appId)
        .single()

      setIsFavorite(!!data)
      setLoading(false)
    }

    checkFavorite()
  }, [appId, userId, isVip, supabase])

  const toggleFavorite = async () => {
    if (!isVip) {
      toast.error("This feature is only available for VIP members!")
      return
    }
    if (!userId) {
      toast.error("Please login first")
      return
    }

    setLoading(true)

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("app_id", appId)

      if (error) {
        toast.error("Failed to remove from favorites")
      } else {
        setIsFavorite(false)
        toast.success("Removed from favorites")
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: userId, app_id: appId })

      if (error) {
        toast.error("Failed to add to favorites")
      } else {
        setIsFavorite(true)
        toast.success("Added to favorites!")
      }
    }

    setLoading(false)
  }

  if (!isVip) {
    return (
      <button
        onClick={() => toast.error("Upgrade to VIP to use favorites!")}
        className="neo-button p-2.5 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-2 border-neo-black opacity-50 cursor-not-allowed"
        title="VIP Only"
      >
        <Heart className="w-5 h-5" />
      </button>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={toggleFavorite}
      disabled={loading}
      className={`neo-button p-2.5 border-2 border-neo-black transition-colors ${
        isFavorite
          ? "bg-red-500 text-white shadow-neo"
          : "bg-white dark:bg-neo-gray-dark text-gray-400 dark:text-gray-500 hover:text-red-500"
      }`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <Loader2 key="loading" className="w-5 h-5 animate-spin" />
        ) : (
          <motion.div
            key={isFavorite ? "filled" : "empty"}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
