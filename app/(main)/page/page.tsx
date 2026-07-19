import { Suspense } from "react"
import { SearchBar } from "@/components/ui/SearchBar"
import { CategoryList } from "@/components/ui/CategoryList"
import { AppCard } from "@/components/ui/AppCard"
import { SkeletonGrid } from "@/components/ui/SkeletonCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { createClient } from "@/lib/supabase/server"
import { App, Category } from "@/types"

async function getCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data } = await supabase.from("categories").select("*").order("name")
  return data || []
}

async function getRecommendedApps(): Promise<App[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("apps")
    .select("*")
    .eq("is_recommended", true)   // <-- FIX: filter hanya yang direkomendasikan
    .order("rating", { ascending: false })
    .limit(6)
  return data || []
}

async function getLatestApps(): Promise<App[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("apps")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12)
  return data || []
}

export default async function HomePage() {
  const [categories, recommendedApps, latestApps] = await Promise.all([
    getCategories(),
    getRecommendedApps(),
    getLatestApps(),
  ])

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Search Section */}
      <section>
        <h1 className="text-3xl md:text-4xl font-black mb-4">
          <span className="text-neo-cyan dark:text-neo-purple">Discover</span>{" "}
          <span className="text-neo-yellow">Useful</span>{" "}
          <span className="text-neo-black dark:text-white">APKs</span>
        </h1>
        <SearchBar />
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-neo-cyan dark:bg-neo-purple rounded-full" />
          Categories
        </h2>
        {categories.length > 0 ? (
          <CategoryList categories={categories} />
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <SkeletonGrid count={4} />
          </div>
        )}
      </section>

      {/* Recommended */}
      <section>
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-neo-yellow rounded-full" />
          Recommended
        </h2>
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedApps.length > 0 ? (
              recommendedApps.map((app, i) => (
                <AppCard key={app.id} app={app} index={i} />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState title="No recommendations yet" />
              </div>
            )}
          </div>
        </Suspense>
      </section>

      {/* Latest */}
      <section>
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-neo-purple dark:bg-neo-cyan rounded-full" />
          Recently Uploaded
        </h2>
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestApps.length > 0 ? (
              latestApps.map((app, i) => (
                <AppCard key={app.id} app={app} index={i} />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState title="No apps available yet" />
              </div>
            )}
          </div>
        </Suspense>
      </section>
    </main>
  )
        }
