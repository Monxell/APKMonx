# 🎨 APKMonx - Neo Brutalism APK/Game Downloader

Website modern untuk download APK dan Game dengan design Neo Brutalism yang colorful, responsive, dan mobile-friendly.

## ⚠️ PENTING: Setup Supabase (WAJIB!)

### Step 1: Copy .env.local
```bash
cp .env.local.example .env.local
```
Isi dengan data dari Supabase Dashboard → Project Settings → API:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 2: Jalankan SQL Setup
Buka Supabase Dashboard → SQL Editor → New Query → paste isi file `supabase-setup.sql` → Run.

Atau jalankan query ini satu per satu:

```sql
-- 1. Buat tabel
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'zap', color TEXT DEFAULT '#06b6d4',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  icon_url TEXT, version TEXT NOT NULL, developer TEXT NOT NULL,
  mod_feature TEXT, mod_feature_full TEXT, description TEXT,
  package_name TEXT, size TEXT, upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  free_url TEXT, vip_url TEXT, screenshots TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id),
  rating NUMERIC DEFAULT 0, download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL, username TEXT, avatar_url TEXT,
  is_vip BOOLEAN DEFAULT FALSE, vip_expires_at TIMESTAMP WITH TIME ZONE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id), app_id UUID REFERENCES apps(id),
  app_name TEXT NOT NULL, download_url TEXT NOT NULL,
  is_vip BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DISABLE RLS (agar admin panel bisa CRUD tanpa restriction)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE apps DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE downloads DISABLE ROW LEVEL SECURITY;

-- 3. Auto-create profile saat signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, is_vip, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), FALSE, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Default categories
INSERT INTO categories (name, slug, icon, color) VALUES
  ('Games', 'games', 'gamepad2', '#ef4444'),
  ('Tools', 'tools', 'wrench', '#06b6d4'),
  ('Social', 'social', 'users', '#8b5cf6'),
  ('Entertainment', 'entertainment', 'music', '#eab308'),
  ('Productivity', 'productivity', 'briefcase', '#22c55e'),
  ('Photography', 'photography', 'camera', '#f97316')
ON CONFLICT (slug) DO NOTHING;

-- 5. Jadikan admin (ganti email!)
-- UPDATE users SET role = 'admin' WHERE email = 'email-kamu@gmail.com';
```

### Step 3: Enable Auth Provider
Supabase Dashboard → Authentication → Providers → Email → Enable "Confirm email" (optional, disable kalau mau langsung aktif).

### Step 4: Run Local
```bash
npm install
npm run dev
```

### Step 5: Deploy ke Vercel
```bash
vercel --prod
```

## 🛡️ Cara Akses Admin Panel

1. **Daftar akun** di `/auth/register`
2. **Login** di `/auth/login`
3. **Jadikan admin** via SQL:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'email-kamu@gmail.com';
   ```
4. **Buka admin panel** di `/admin`

## 📁 Project Structure

```
├── app/
│   ├── (main)/           # Home, Search, Profile, App Detail
│   ├── auth/             # Login, Register, Forgot Password
│   ├── admin/            # Admin Panel (all-in-one)
│   ├── api/              # API routes
│   ├── layout.tsx
│   ├── globals.css
│   └── sitemap.ts
├── components/
│   ├── layout/           # Navbar, BottomNav
│   └── ui/               # AppCard, SearchBar, dll
├── lib/supabase/         # Supabase clients
├── types/                # TypeScript types
├── supabase-setup.sql    # SQL setup file
└── README.md
```

## 🎨 Design System

- **Light Mode**: Cyan + Yellow dominan
- **Dark Mode**: Purple + Dark dominan
- Neo Brutalism: Border 2px, Shadow 4px, Radius 12px

## 🚀 Tech Stack

Next.js 14 + TypeScript + TailwindCSS + Framer Motion + Supabase + Lucide Icons
