import { createClient } from "@/lib/supabase/server"
import { AlertTriangle } from "lucide-react"

export default async function MaintenancePage() {
  const supabase = createClient()
  
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "maintenance_message")
    .single()

  const message = data?.value || "We are currently performing scheduled maintenance. Please check back later."

  return (
    <main className="min-h-screen bg-neo-gray-light dark:bg-neo-black flex items-center justify-center px-4">
      <div className="neo-card bg-white dark:bg-neo-gray-dark border-3 border-neo-black p-8 md:p-12 max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 border-3 border-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-neo-black dark:text-white mb-3">
            Under Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
            {message}
          </p>
        </div>
        <div className="p-3 bg-neo-yellow/10 border-2 border-neo-yellow rounded-lg">
          <p className="text-xs font-bold text-neo-yellow-dark">
            We will be back shortly. Thank you for your patience!
          </p>
        </div>
      </div>
    </main>
  )
}
