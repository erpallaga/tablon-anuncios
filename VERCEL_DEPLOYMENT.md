# Vercel Deployment Guide - Step by Step

This guide will walk you through deploying your Tablón de Anuncios app to Vercel.

## Prerequisites

Before you start, make sure you have:
- ✅ Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- ✅ A Supabase project set up (see `SUPABASE_SETUP.md`)
- ✅ Your Supabase credentials ready:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_MASTER_PASSWORD` (optional)

## Step 1: Test Build Locally

First, let's make sure your app builds correctly:

```bash
npm run build
```

If this succeeds, you should see a `dist` folder created. You can test it locally with:

```bash
npm run preview
```

If everything works, you're ready to deploy!

---

## Step 2: Sign Up for Vercel

1. Go to **[https://vercel.com](https://vercel.com)**
2. Click **"Sign Up"** in the top right
3. Choose to sign up with:
   - **GitHub** (recommended - easiest if your code is on GitHub)
   - **GitLab**
   - **Bitbucket**
   - Or use email/password

---

## Step 3: Import Your Project

1. After signing up, you'll see the Vercel dashboard
2. Click **"Add New..."** → **"Project"**
3. If you signed up with GitHub/GitLab/Bitbucket, you'll see a list of your repositories
4. Find and click on **`tablon-anuncios`** (or your repository name)
5. If you don't see it, click **"Adjust GitHub App Permissions"** to grant access

---

## Step 4: Configure Project Settings

Vercel should automatically detect your Vite project, but let's verify:

1. **Framework Preset**: Should show "Vite" (auto-detected ✅)
2. **Root Directory**: Leave as `./` (default)
3. **Build Command**: Should show `npm run build` (auto-detected ✅)
4. **Output Directory**: Should show `dist` (auto-detected ✅)
5. **Install Command**: Should show `npm install` (auto-detected ✅)

**Everything should be auto-detected!** You don't need to change anything.

---

## Step 5: Add Environment Variables

This is the most important step! Before deploying, add your Supabase credentials:

1. Scroll down to the **"Environment Variables"** section
2. Click **"Add"** to add each variable:

   **Variable 1:**
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: `https://your-project-id.supabase.co` (from Supabase dashboard)
   - **Environments**: Check all (Production, Preview, Development)

   **Variable 2:**
   - **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Your anon key from Supabase (long string starting with `eyJ...`)
   - **Environments**: Check all (Production, Preview, Development)

   **Variable 3 (Optional):**
   - **Key**: `VITE_MASTER_PASSWORD`
   - **Value**: Your chosen master password for admin access
   - **Environments**: Check all (Production, Preview, Development)

3. Click **"Save"** after adding each variable

> **💡 Tip**: You can find your Supabase credentials in:
> Supabase Dashboard → **Settings** → **API** → Copy "Project URL" and "anon public" key

---

## Step 6: Deploy!

1. Click the big **"Deploy"** button at the bottom
2. Wait ~2-3 minutes while Vercel:
   - Installs dependencies
   - Builds your app
   - Deploys it to their CDN
3. You'll see a live build log - you can watch it happen!

---

## Step 7: Your Site is Live! 🎉

Once deployment completes:
- ✅ Your site is live at `https://tablon-anuncios.vercel.app` (or similar)
- ✅ You'll see a success page with your URL
- ✅ Click **"Visit"** to see your deployed app

---

## Step 8: Test Your Deployment

1. Open your deployed URL
2. Check the browser console (F12) for any errors
3. Try:
   - Viewing the grid
   - Opening a PDF
   - Creating a new announcement (if admin works)
   - Uploading a PDF (if admin works)

---

## Step 9: Automatic Deployments (Already Set Up!)

🎉 **Good news!** Vercel automatically:
- ✅ Deploys every time you push to your main branch
- ✅ Creates preview deployments for pull requests
- ✅ Updates production automatically

You don't need to do anything - just push code and it deploys!

---

## Step 10: Custom Domain (Optional)

Want to use your own domain (e.g., `anuncios.yourdomain.com`)?

1. In Vercel dashboard, go to your project
2. Click **"Settings"** tab
3. Click **"Domains"** in the sidebar
4. Enter your domain (e.g., `anuncios.yourdomain.com`)
5. Follow the DNS instructions:
   - Add a CNAME record pointing to Vercel
   - Or add an A record (if using root domain)
6. Vercel will automatically:
   - Provision SSL certificate (HTTPS)
   - Configure DNS
   - Usually takes 5-60 minutes

---

## Troubleshooting

### ❌ Build Fails

**Error**: Build command failed
- Check the build logs in Vercel dashboard
- Make sure `npm run build` works locally first
- Check for TypeScript errors: `npm run build` locally

**Error**: Missing dependencies
- Make sure all dependencies are in `package.json`
- Check that `node_modules` is in `.gitignore` (it should be)

### ❌ App Loads But Shows Errors

**Error**: "Missing Supabase environment variables"
- Go to Vercel → Your Project → **Settings** → **Environment Variables**
- Verify all three variables are set correctly
- Make sure they're enabled for "Production" environment
- After adding/editing, click **"Redeploy"** from the Deployments tab

**Error**: CORS errors or connection issues
- Check Supabase dashboard → **Settings** → **API**
- Verify your Supabase project URL is correct
- Check Supabase → **Settings** → **Auth** → **URL Configuration** for allowed URLs

### ❌ PDFs Don't Load

- Check that Supabase Storage bucket `pdfs` exists and is public
- Verify storage policies allow public reads
- Check browser console for specific error messages

### ❌ Changes Not Appearing

- Vercel auto-deploys on git push
- Check that you pushed to the correct branch
- Go to Vercel dashboard → **Deployments** to see deployment status
- Click **"Redeploy"** if needed

---

## Project Configuration Files

The following files help Vercel understand your project:

- ✅ `vercel.json` - Optional configuration (already created)
- ✅ `package.json` - Contains build scripts
- ✅ `vite.config.ts` - Vite configuration

You don't need to modify these - they're already set up correctly!

---

## Environment Variables Reference

| Variable | Required | Description | Where to Find |
|----------|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Your Supabase anon/public key | Supabase Dashboard → Settings → API |
| `VITE_MASTER_PASSWORD` | ⚠️ Optional | Admin panel password | You choose this (defaults to "admin123") |

---

## Next Steps

After successful deployment:

1. ✅ **Test everything** - Make sure all features work
2. ✅ **Set up custom domain** (optional)
3. ✅ **Bookmark your Vercel dashboard** - Easy access to logs and settings
4. ✅ **Share your URL** - Your app is live!

---

## Quick Reference: Vercel Dashboard

Your Vercel dashboard gives you:

- **Deployments** - See all deployments, logs, and redeploy
- **Analytics** - View traffic and performance (may require upgrade)
- **Settings** - Configure domain, environment variables, build settings
- **Functions** - Add serverless functions if needed later
- **Team** - Invite collaborators (if needed)

---

## Need Help?

- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: Available in dashboard
- **Community**: Vercel Discord and forums

---

**🎉 Congratulations!** Your app is now live on Vercel!

