# Vercel Deployment - Quick Start 🚀

## ✅ Pre-Deployment Checklist

- [x] Code builds successfully (`npm run build`)
- [x] TypeScript errors fixed
- [x] Configuration files ready
- [ ] Supabase credentials ready
- [ ] Git repository pushed

---

## 🎯 5-Minute Deployment Steps

### 1. Create Pull Request (Recommended) ✅

Since you're on `deployment-setup` branch, merge it to `master`:

**Option A: Via GitHub (Recommended)**
1. Go to your repository on GitHub
2. You should see a banner suggesting to create a PR for `deployment-setup`
3. Click **"Compare & pull request"**
4. Add a title: `Add Vercel deployment configuration`
5. Click **"Create pull request"**
6. Review the changes, then click **"Merge pull request"**

**Option B: Deploy from current branch first**
- You can deploy from `deployment-setup` to test, then merge later
- Vercel will create preview deployments for this branch

### 2. Sign Up for Vercel
👉 **[https://vercel.com](https://vercel.com)** → Click "Sign Up" → Use GitHub

### 3. Import Project
- Click **"Add New..."** → **"Project"**
- Find **`tablon-anuncios`** repository
- Click **"Import"**
- **Production Branch**: Select `master` (or keep default)

### 4. Add Environment Variables
Before clicking Deploy, scroll down and add:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ... (your key)
VITE_MASTER_PASSWORD = your_password (optional)
```

**Enable for**: Production, Preview, Development ✅

### 5. Deploy!
- Click **"Deploy"** button
- Wait 2-3 minutes
- 🎉 Your site is live!

---

## 📍 Find Your Credentials

**Supabase Dashboard** → **Settings** → **API**:
- **Project URL** = `VITE_SUPABASE_URL`
- **anon public key** = `VITE_SUPABASE_ANON_KEY`

---

## 🔗 After Deployment

- **Production URL**: `https://tablon-anuncios.vercel.app`
- **Automatic Deploys**: Every push to `master` branch
- **Preview Deploys**: Every pull request and feature branch

---

## ❓ Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally

**App loads but errors?**
- Go to **Settings** → **Environment Variables**
- Verify all 3 variables are set
- Click **"Redeploy"** after adding/editing

**Still need help?**
- See full guide: `VERCEL_DEPLOYMENT.md`

---

**That's it! You're ready to deploy! 🎉**

