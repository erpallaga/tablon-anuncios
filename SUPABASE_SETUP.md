# Supabase Setup Guide

This guide will help you set up Supabase for your Tablón de Anuncios application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `tablon-anuncios` (or any name you prefer)
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
5. Click "Create new project" and wait for it to be ready (~2 minutes)

## Step 2: Set Up Database Tables

1. In your Supabase project, go to the **SQL Editor**
2. Copy and paste the contents of `supabase-setup.sql`
3. Click "Run" to execute the SQL script
4. This will create:
   - `grid_items` table for PDF items
   - `announcements` table for text announcements
   - Indexes for better performance
   - Row Level Security policies

## Step 3: Set Up Storage Bucket

1. In your Supabase project, go to **Storage**
2. Click "Create a new bucket"
3. Configure the bucket:
   - Name: `pdfs`
   - Public bucket: **Enabled** (checked)
   - File size limit: Set as needed (e.g., 10MB)
   - Allowed MIME types: `application/pdf`
4. Click "Create bucket"

### Configure Storage Policies (Optional but Recommended)

1. Click on the `pdfs` bucket you just created
2. Click the **"Policies"** tab (next to "Files" and "Settings")
3. Click **"New Policy"** button
4. Create a policy for public read access:
   - **Policy name**: `Public read access`
   - **Allowed operation**: Select `SELECT` from the dropdown
   - **Target roles**: Select `public`
   - **USING expression**: Enter `true`
   - Click **"Review"** then **"Save policy"**

5. Create a policy for uploads (click **"New Policy"** again):
   - **Policy name**: `Public upload access`
   - **Allowed operation**: Select `INSERT` from the dropdown
   - **Target roles**: Select `public`
   - **WITH CHECK expression**: Enter `true`
   - Click **"Review"** then **"Save policy"`

   **Note**: For better security, consider restricting uploads to authenticated users or using a backend service.

**Where to find this:**
- Navigate: **Storage** → **Buckets** → Click on `pdfs` bucket → **Policies** tab → **New Policy** button

## Step 4: Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. You'll find:
   - **Project URL**: Copy this value
   - **anon/public key**: Copy this value
3. Keep these safe - you'll need them for your `.env` file

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_MASTER_PASSWORD=your_master_password_here
   ```

3. **Important**: Add `.env` to your `.gitignore` file to avoid committing secrets

## Step 6: Master Password

The master password is used to protect the admin panel. You can set it via:
- Environment variable `VITE_MASTER_PASSWORD`
- If not set, it defaults to `admin123`

**Security Note**: Since this is a frontend-only app, the master password check happens in the browser. For production use, consider implementing a proper backend authentication system.

## Step 7: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The app should connect to Supabase and load data from your database
3. Try creating a new grid item with a PDF upload
4. Try creating a new announcement

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure your `.env` file is in the project root
- Check that variable names start with `VITE_`
- Restart your dev server after changing `.env`

### Error: "Failed to fetch" or network errors
- Check that your Supabase project URL is correct
- Verify your anon key is correct
- Check that your browser's CORS settings allow the connection

### Error: "Row Level Security policy violation"
- Make sure you ran the SQL setup script completely
- Check that RLS policies are created correctly in the Supabase dashboard

### PDF upload fails
- Verify the storage bucket `pdfs` exists and is public
- Check that storage policies allow public uploads
- Verify file size is within limits

## Next Steps

- Consider implementing proper user authentication for production
- Set up backup strategies for your database
- Configure appropriate RLS policies for your use case
- Consider using a backend service for admin operations

