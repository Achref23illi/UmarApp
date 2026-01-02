const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env file explicitly
const envPath = path.resolve(__dirname, '../../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Starting migration...');

  // SQL to add columns if they don't exist
  // Note: 'gender' will store 'male' or 'female'
  const sql = `
    ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS age INTEGER,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS phone_number TEXT;
    
    -- Create Posts table if not exists
    CREATE TABLE IF NOT EXISTS public.posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        content TEXT,
        image_url TEXT,
        type TEXT DEFAULT 'standard', -- 'standard' or 'janaza'
        metadata JSONB DEFAULT '{}'::jsonb, -- Stores janaza details
        created_at TIMESTAMPTZ DEFAULT NOW(),
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0
    );

    -- Create Likes table
    CREATE TABLE IF NOT EXISTS public.likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, post_id)
    );

    -- Create Comments table
    CREATE TABLE IF NOT EXISTS public.comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS (Optional but good practice, though we are using service role key in backend so it bypasses RLS)
    ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
    
    -- Policies (Open for now for simplicity of this script, but backend uses service role)
    CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
  `;

  // We can't execute raw SQL easily with just js client unless we use a function or rely on the dashboard.
  // BUT, since we are in `backend/` and have `server.js`, we can just ensure the columns are there using the JS API?
  // No, JS API doesn't do DDL.
  // Workaround: We will print this SQL and ask the user to run it OR assume the user has a way.
  // WAIT, I can use the `postgres` package if I had the connection string, but I only have the API URL.
  // actually, supabase-js doesn't support raw SQL query execution from the client directly for DDL usually.
  // However, I can try to use a Remote Procedure Call (RPC) if one exists, but I can't create one.
  
  // Alternative: We will try to rely on the fact that I can't run DDL here.
  // I will create this file as `backend/db_schema.sql` instead and ask the user to run it in their Supabase SQL Editor.
  // This is safer.
}

console.log('Migration script is actually just a SQL file generation.');
