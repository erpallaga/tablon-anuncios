# Vercel Deployment Controls & Options

This guide covers all the controls and options available for managing your deployment on Vercel.

---

## 📍 Main Dashboard Areas

### 1. **Deployments Tab**
Control your deployments and see deployment history.

**What you can do:**
- ✅ View all deployments (production, preview, development)
- ✅ See build logs and deployment status
- ✅ **Redeploy** any previous deployment
- ✅ **Cancel** running deployments
- ✅ **Promote** preview deployments to production
- ✅ View deployment details (build time, file sizes, etc.)
- ✅ Copy deployment URLs

**How to access:**
- Go to your project → **"Deployments"** tab

---

### 2. **Settings Tab**

The main control center for your project.

#### **General Settings**
- **Project Name** - Rename your project
- **Framework Preset** - Change build framework (auto-detected, usually correct)
- **Root Directory** - Change project root (default: `./`)
- **Build & Development Settings:**
  - **Build Command** - Customize build command (default: `npm run build`)
  - **Output Directory** - Change output folder (default: `dist`)
  - **Install Command** - Change package manager command
  - **Development Command** - Change dev server command
  - **Node.js Version** - Select specific Node.js version

#### **Environment Variables** 🔐
**Most important for your app!**

**What you can do:**
- ✅ Add/Edit/Delete environment variables
- ✅ Set different values for different environments:
  - **Production** - Live site
  - **Preview** - PR/branch deployments
  - **Development** - Local dev with `vercel dev`
- ✅ Encrypt sensitive values
- ✅ Import/Export variables

**For your app, you need:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MASTER_PASSWORD` (optional)

**How to access:**
- Settings → **Environment Variables**

#### **Git Integration**
- **Connected Git Repository** - See connected repo
- **Production Branch** - Set which branch deploys to production (default: `master` or `main`)
- **Ignored Build Step** - Skip builds for certain commits
- **Deploy Hooks** - Create webhooks for manual deployments

#### **Domains** 🌐
**Add custom domains!**

**What you can do:**
- ✅ Add custom domain (e.g., `anuncios.yourdomain.com`)
- ✅ Add root domain (e.g., `yourdomain.com`)
- ✅ View DNS configuration instructions
- ✅ Automatic SSL/HTTPS certificates
- ✅ Redirect rules
- ✅ Remove domains

**How to add a domain:**
1. Settings → **Domains**
2. Click **"Add"** or **"Add Domain"**
3. Enter your domain
4. Follow DNS configuration steps
5. Vercel automatically provisions SSL (takes 5-60 minutes)

---

### 3. **Analytics Tab** (may require upgrade)
- View traffic metrics
- Performance insights
- User analytics (if enabled)

---

### 4. **Functions Tab**
- View serverless functions (if you add any)
- Function logs
- Runtime settings

---

### 5. **Storage Tab** (may require upgrade)
- Vercel KV (key-value storage)
- Vercel Blob (file storage)
- PostgreSQL databases

---

## 🎛️ Build & Deployment Controls

### **Manual Deployment Controls**

#### **Redeploy**
- **Where**: Deployments tab → Click on any deployment → **"Redeploy"**
- **Use case**: After changing environment variables or config
- **What it does**: Rebuilds and redeploys using the same code

#### **Cancel Deployment**
- **Where**: Deployments tab → Running deployment → **"Cancel"**
- **Use case**: Stop a deployment that's taking too long or has issues

#### **Promote to Production**
- **Where**: Deployments tab → Preview deployment → **"Promote to Production"**
- **Use case**: Make a preview deployment live without pushing new code

#### **Deploy from GitHub**
- **Where**: Deployments tab → **"Deploy"** button → Select branch/commit
- **Use case**: Deploy a specific branch or commit manually

---

## 🔧 Configuration Options

### **Project Configuration (vercel.json)**

You can customize deployment behavior with `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ]
}
```

**Available options:**
- `buildCommand` - Custom build command
- `outputDirectory` - Output folder
- `framework` - Framework preset
- `rewrites` - URL rewriting rules
- `redirects` - URL redirects
- `headers` - HTTP headers
- `cleanUrls` - Remove `.html` extensions
- `trailingSlash` - Force trailing slashes

**Your current `vercel.json` already includes rewrites for React Router support.**

---

## 🔐 Security & Access Controls

### **Team & Collaboration**
- **Settings → Team**
- Invite team members
- Set permissions (Admin, Developer, Viewer)
- Billing and usage limits

### **Deployment Protection**
- **Settings → Git → Protected Branches**
- Require approval before deploying to production
- Add deployment checks

### **Environment Variable Security**
- Variables are encrypted at rest
- Never exposed in client-side code (unless prefixed with `VITE_` or `NEXT_PUBLIC_`)
- Can be scoped to specific environments

---

## 🌍 Regional Controls

### **Edge Network**
- Vercel automatically deploys to edge locations worldwide
- Content is cached close to users
- No manual configuration needed

### **Serverless Functions Regions**
- If you add API routes, you can choose regions:
  - US East, US West
  - EU (Frankfurt, London)
  - Asia Pacific regions

---

## 📊 Monitoring & Logs

### **Build Logs**
- **Where**: Deployments → Click any deployment → **"Build Logs"**
- **What you see**: 
  - Build output
  - Errors and warnings
  - Build time and metrics
  - Dependency installation logs

### **Function Logs**
- **Where**: Functions tab → Click function → **"Logs"**
- **What you see**: Serverless function execution logs

### **Real-time Logs**
- **Where**: Project dashboard → **"Logs"** tab
- **What you see**: Real-time request logs (may require upgrade)

---

## 🚀 Performance Controls

### **Build Optimizations**
- Automatic code splitting
- Asset optimization
- Image optimization (with Vercel Image Optimization)

### **Caching**
- Automatic edge caching
- Static asset caching
- Custom cache headers (via `vercel.json`)

### **Speed Insights** (may require upgrade)
- Web Vitals monitoring
- Performance scores
- Real User Monitoring (RUM)

---

## 📝 Common Customization Tasks

### **Change Build Command**
1. Settings → General → **Build Command**
2. Change from `npm run build` to custom command
3. Save changes (auto-deploys)

### **Update Environment Variables**
1. Settings → **Environment Variables**
2. Click variable to edit or **"Add New"**
3. **Important**: After changing, go to Deployments → **"Redeploy"** latest deployment

### **Add Custom Domain**
1. Settings → **Domains** → **"Add"**
2. Enter domain name
3. Configure DNS (add CNAME or A record)
4. Wait for SSL certificate (automatic)

### **Change Production Branch**
1. Settings → Git → **Production Branch**
2. Select branch (default: `master` or `main`)
3. Save

### **Set Up Redirects**
Create/update `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/old",
      "destination": "/new",
      "permanent": 301
    }
  ]
}
```

---

## 🛑 Emergency Controls

### **Pause Auto-Deployments**
- Settings → Git → **Ignored Build Step**
- Add pattern to skip builds (e.g., `[skip deploy]` in commit message)

### **Rollback to Previous Version**
- Deployments → Find previous working deployment
- Click **"Promote to Production"**

### **Disable Project**
- Settings → **Danger Zone** → Delete or disable project

---

## 📋 Quick Reference: Where to Find Things

| What You Want to Do | Where to Go |
|---------------------|-------------|
| See live URL | Project dashboard (top) or Deployments → Latest → Visit |
| Change environment variables | Settings → Environment Variables |
| Add custom domain | Settings → Domains |
| View build logs | Deployments → Click deployment → Build Logs |
| Redeploy | Deployments → Latest deployment → Redeploy |
| Change build settings | Settings → General → Build & Development Settings |
| View analytics | Analytics tab (may require upgrade) |
| Add redirects | Edit `vercel.json` in your repo |
| Change production branch | Settings → Git → Production Branch |
| Invite team members | Settings → Team |

---

## 🎯 Most Important Controls for Your App

Based on your app setup, these are the controls you'll use most:

1. **Environment Variables** - Manage Supabase credentials
2. **Deployments** - View, redeploy, or rollback
3. **Domains** - Add custom domain when ready
4. **Build Logs** - Debug any build issues
5. **Redeploy** - After changing environment variables

---

## 💡 Pro Tips

1. **After changing environment variables, always redeploy** - Variables are injected at build time
2. **Use preview deployments to test** - Every PR gets a preview URL automatically
3. **Check build logs first** - Most issues are visible in build logs
4. **Custom domains are free** - SSL certificates are automatic
5. **You can have multiple domains** - Add as many as you need

---

## 🔗 Useful Links

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Your Project Settings**: Dashboard → Your Project → Settings

---

**Need help with a specific setting?** Check the full deployment guide in `VERCEL_DEPLOYMENT.md`

