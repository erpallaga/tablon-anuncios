# Deployment Guide - Tablón de Anuncios

This guide compares free hosting options for deploying your React + Vite application. Since your app uses Supabase for the backend, you only need to deploy the static frontend.

## Quick Comparison

| Platform | Setup Difficulty | Build Speed | Free Tier Limits | Best For |
|----------|-----------------|-------------|------------------|----------|
| **Vercel** | ⭐ Very Easy | Fast | Generous | React apps, quick deployment |
| **Netlify** | ⭐ Very Easy | Fast | Generous | Simple static sites |
| **Cloudflare Pages** | ⭐⭐ Easy | Very Fast | Very Generous | Global performance |
| **GitHub Pages** | ⭐⭐ Easy | Medium | Basic | GitHub projects |
| **Render** | ⭐⭐ Easy | Medium | Limited | Full-stack apps |

---

## Option 1: Vercel (⭐ Recommended for React Apps)

### Pros ✅
- **Zero configuration** for React/Vite projects - detects automatically
- **Automatic deployments** from Git (GitHub, GitLab, Bitbucket)
- **Preview deployments** for every branch/PR
- **Fast global CDN** - excellent performance worldwide
- **Free HTTPS** - automatic SSL certificates
- **Custom domains** - easy to set up
- **Environment variables** - simple management in dashboard
- **Build logs** - easy debugging
- **Free tier**: 100GB bandwidth/month, unlimited builds
- **Great documentation** and community support

### Cons ❌
- Free tier requires connecting a Git repository (no manual uploads)
- Build timeout: 60 seconds (usually enough for small projects)
- Serverless functions have execution time limits

### Setup Steps
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub/GitLab/Bitbucket
3. Click "Add New Project"
4. Import your repository
5. Vercel auto-detects Vite - no config needed!
6. Add environment variables (VITE_SUPABASE_URL, etc.)
7. Click "Deploy"
8. Done! Your site is live in ~2 minutes

### Configuration File (Optional)
You can create `vercel.json` for advanced config, but it's not required:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## Option 2: Netlify

### Pros ✅
- **Drag-and-drop** deployment option (no Git required)
- **Netlify Drop** - instant deployment from dist folder
- **Automatic deployments** from Git
- **Forms handling** built-in (if you need it later)
- **Split testing** - A/B testing features
- **Free tier**: 100GB bandwidth/month, 300 build minutes/month
- **Netlify CLI** - deploy from command line easily
- **Environment variables** management
- **Preview deployments** for branches

### Cons ❌
- Slightly slower builds than Vercel
- Interface can feel more complex than Vercel
- Free tier build minutes can run out with heavy usage

### Setup Steps
1. Go to [netlify.com](https://netlify.com)
2. Sign up (free)
3. Option A - Drag & Drop:
   - Run `npm run build` locally
   - Drag the `dist` folder to Netlify dashboard
   - Done!
4. Option B - Git Integration:
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables
   - Deploy!

---

## Option 3: Cloudflare Pages (⭐ Best Performance)

### Pros ✅
- **Fastest global CDN** - Cloudflare's edge network
- **Very generous free tier** - unlimited bandwidth and builds
- **No build time limits** - unlimited build minutes
- **Automatic HTTPS** and custom domains
- **Preview deployments** for branches
- **Git integration** (GitHub, GitLab, Bitbucket)
- **Workers integration** - can add serverless functions later
- **Free forever** - most generous free tier

### Cons ❌
- Slightly more complex setup than Vercel/Netlify
- Less React-specific optimizations than Vercel
- Documentation not as beginner-friendly

### Setup Steps
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Sign up with Cloudflare (free account)
3. Click "Create a project"
4. Connect your Git repository
5. Build settings:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Add environment variables
7. Deploy!

---

## Option 4: GitHub Pages

### Pros ✅
- **Completely free** - included with GitHub
- **Simple** if you're already using GitHub
- **No third-party account** needed
- **Private repositories** supported (with GitHub Pro)

### Cons ❌
- **No automatic builds** - need GitHub Actions (extra setup)
- **No preview deployments** - only main branch deploys
- **Custom domains** require manual DNS setup
- **Jekyll default** - may interfere with React routing
- **Slower** than other CDNs
- **No environment variables** - need to use GitHub Actions secrets

### Setup Steps (with GitHub Actions)
1. Create `.github/workflows/deploy.yml` (see example below)
2. Enable GitHub Pages in repository settings
3. Push to main branch
4. GitHub Actions will build and deploy automatically

**Note**: Requires additional setup for environment variables and routing.

---

## Option 5: Render

### Pros ✅
- **Simple dashboard** - easy to navigate
- **Free SSL** certificates
- **Automatic deployments** from Git
- **Environment variables** management
- **Build logs** with good UI

### Cons ❌
- **Limited free tier** - spins down after inactivity (15 min)
- **Slower cold starts** - first request after inactivity can be slow
- **Build timeout**: 20 minutes (should be fine)
- Less optimized for static sites than others

### Setup Steps
1. Go to [render.com](https://render.com)
2. Sign up (free)
3. Click "New" → "Static Site"
4. Connect your repository
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables
7. Deploy!

---

## My Recommendation

### 🥇 **First Choice: Vercel**
- Best balance of simplicity and features
- Perfect for React/Vite apps
- Zero configuration needed
- Excellent for non-professional admins

### 🥈 **Second Choice: Netlify**
- If you want drag-and-drop option (no Git required)
- Good alternative to Vercel
- Slightly more features in free tier

### 🥉 **Third Choice: Cloudflare Pages**
- If you want the most generous free tier
- Best global performance
- Great if you might need more resources later

---

## Common Setup Steps (Regardless of Platform)

### 1. Build Configuration Check
Your `vite.config.ts` should have the correct base path:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // For custom domains, or '/your-repo-name/' for GitHub Pages
})
```

### 2. Environment Variables
All platforms require you to set these environment variables in their dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MASTER_PASSWORD` (optional)

### 3. Routing Configuration
For single-page applications, you may need a redirect rule:

**Vercel**: Automatically handles React Router
**Netlify**: Create `public/_redirects`:
```
/*    /index.html   200
```

**Cloudflare Pages**: Automatically handles routing
**GitHub Pages**: Requires `404.html` workaround or base path configuration

---

## Next Steps

1. **Choose your platform** based on the pros/cons above
2. **Test locally first**: Run `npm run build` to ensure it builds correctly
3. **Follow platform-specific setup** from this guide
4. **Add environment variables** in the platform dashboard
5. **Deploy and test!**

---

## Troubleshooting

### Build fails
- Check build logs in platform dashboard
- Ensure all dependencies are in `package.json` (not just devDependencies needed for build)
- Verify Node.js version compatibility

### Environment variables not working
- Make sure variable names start with `VITE_` (required for Vite)
- Restart/redeploy after adding variables
- Check for typos in variable names

### Routing doesn't work (404 errors)
- Set up redirect rules (see routing configuration above)
- Verify base path in `vite.config.ts`

### Supabase connection issues
- Check CORS settings in Supabase dashboard
- Verify environment variables are set correctly
- Check browser console for specific error messages

