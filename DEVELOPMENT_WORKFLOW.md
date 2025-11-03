# Development Workflow Guide

This guide explains how to continue developing your app locally while having production deployed on Vercel.

---

## 🎯 Understanding Your Setup

### **Branch Strategy**
- **`master`** branch = **Production** (auto-deploys to Vercel)
- **Feature branches** = Development & Testing (get preview deployments)

### **Current Situation**
- ✅ `master` branch is deployed to production
- ✅ Every push to `master` auto-deploys to production
- ✅ Local development continues normally

---

## 🔄 Recommended Development Workflow

### **Step 1: Start a Feature Branch**

Never develop directly on `master`! Always create a new branch:

```bash
# Make sure you're on master and it's up to date
git checkout master
git pull origin master

# Create a new feature branch
git checkout -b feature/my-new-feature

# Or use descriptive names:
git checkout -b fix/announcement-bug
git checkout -b feature/add-search
```

### **Step 2: Develop Locally**

Work on your feature branch as usual:

```bash
# Start development server
npm run dev

# Make your changes
# Test everything works
# Build to check for errors
npm run build
```

### **Step 3: Commit and Push Your Feature Branch**

```bash
# Stage your changes
git add .

# Commit
git commit -m "Add search functionality"

# Push feature branch (NOT master!)
git push origin feature/my-new-feature
```

### **Step 4: Get a Preview Deployment**

🎉 **Automatic!** Vercel will:
- Detect your push to the feature branch
- Create a **preview deployment**
- Give you a unique URL like: `https://tablon-anuncios-git-feature-my-new-feature.vercel.app`

You'll see the preview URL in:
- Vercel dashboard → Deployments tab
- GitHub PR (if you create one)
- Your email (if notifications enabled)

### **Step 5: Test on Preview URL**

- Open the preview URL
- Test your changes in a production-like environment
- Share with others for testing

### **Step 6: Merge to Master (When Ready)**

**Option A: Via Pull Request (Recommended)**
```bash
# On GitHub:
# 1. Create Pull Request: feature/my-new-feature → master
# 2. Review changes
# 3. Merge PR
```

**Option B: Direct Merge (If you're working alone)**
```bash
# Switch to master
git checkout master

# Pull latest changes
git pull origin master

# Merge your feature
git merge feature/my-new-feature

# Push to master (this triggers production deployment!)
git push origin master
```

### **Step 7: Production Auto-Deploys**

🎉 When you push to `master`:
- Vercel automatically detects the push
- Builds your app
- Deploys to production
- Your live site is updated!

---

## 💻 Daily Development Routine

### **Starting Your Day**

```bash
# 1. Update master
git checkout master
git pull origin master

# 2. Create/switch to feature branch
git checkout -b feature/today-feature
# OR if branch exists:
git checkout feature/today-feature
git pull origin feature/today-feature
```

### **During Development**

```bash
# Start dev server
npm run dev

# Make changes, test locally
# When ready, commit
git add .
git commit -m "Descriptive commit message"

# Push to feature branch
git push origin feature/today-feature
```

### **Before Merging to Master**

Always test locally first:

```bash
# 1. Build to check for errors
npm run build

# 2. Test production build locally
npm run preview

# 3. Verify everything works
# 4. Then merge to master
```

---

## 🌿 Branch Management

### **Good Branch Names**

```
feature/add-user-authentication
fix/pdf-upload-error
refactor/admin-panel
style/improve-mobile-layout
docs/update-readme
```

### **Keep Branches Focused**

- ✅ One feature per branch
- ✅ Small, frequent commits
- ✅ Descriptive commit messages

### **Cleaning Up Branches**

After merging to master:

```bash
# Delete local branch
git checkout master
git branch -d feature/my-new-feature

# Delete remote branch (if not merged via PR)
git push origin --delete feature/my-new-feature
```

---

## 🧪 Testing Strategy

### **Local Testing (Before Push)**

```bash
# 1. Run dev server
npm run dev

# 2. Test in browser
# 3. Check for console errors
# 4. Test all features
```

### **Build Testing (Before Merge)**

```bash
# 1. Build production version
npm run build

# 2. Test production build
npm run preview

# 3. Verify everything works
# 4. Check for TypeScript errors
npm run build  # Shows TS errors
```

### **Preview Deployment Testing**

1. Push to feature branch
2. Wait for Vercel preview deployment
3. Test on preview URL
4. Check build logs in Vercel dashboard

### **Production Testing**

1. Merge to master
2. Wait for production deployment
3. Test on production URL
4. Monitor for errors

---

## 🔐 Environment Variables

### **Local Development**

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MASTER_PASSWORD=your-password
```

**Important**: `.env` is already in `.gitignore`, so it won't be committed.

### **Vercel Environments**

Vercel has separate environments:
- **Development** - Local with `vercel dev`
- **Preview** - Feature branch deployments
- **Production** - Master branch deployments

You can set different environment variables for each in:
**Vercel Dashboard → Settings → Environment Variables**

---

## 🚨 Important Reminders

### **Don't Push Broken Code to Master**

- Always test locally first
- Use feature branches
- Test preview deployments
- Only merge when everything works

### **Master Branch = Production**

- Every push to master deploys to production
- Users see changes immediately
- Be careful with breaking changes

### **Use Feature Branches**

- Develop on feature branches
- Test on preview deployments
- Merge when ready

---

## 📋 Quick Reference Commands

### **Creating a New Feature**

```bash
git checkout master
git pull origin master
git checkout -b feature/new-feature
npm run dev
```

### **Pushing Changes**

```bash
git add .
git commit -m "Your message"
git push origin feature/new-feature
```

### **Testing Before Merge**

```bash
npm run build
npm run preview
```

### **Merging to Master**

```bash
git checkout master
git pull origin master
git merge feature/new-feature
git push origin master
```

---

## 🎯 Typical Workflow Example

**Scenario**: Adding a new announcement feature

```bash
# 1. Start feature branch
git checkout master
git pull origin master
git checkout -b feature/add-announcement-form

# 2. Develop locally
npm run dev
# ... make changes ...

# 3. Test locally
npm run build  # Check for errors
npm run preview  # Test production build

# 4. Commit and push
git add .
git commit -m "Add announcement form component"
git push origin feature/add-announcement-form

# 5. Test preview deployment
# Vercel creates preview URL automatically
# Test on: https://tablon-anuncios-git-feature-add-announcement-form.vercel.app

# 6. Create PR on GitHub (recommended)
# OR merge directly:
git checkout master
git merge feature/add-announcement-form
git push origin master

# 7. Production auto-deploys! 🎉
```

---

## 🛠️ Troubleshooting

### **Local build fails but Vercel succeeds**

- Check Node.js version matches
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for OS-specific issues

### **Preview deployment shows errors**

- Check Vercel build logs
- Verify environment variables are set for Preview
- Check for differences between local and production

### **Production deployment fails**

- Check build logs in Vercel dashboard
- Verify environment variables are set for Production
- Test build locally: `npm run build`

### **Changes not appearing**

- Clear browser cache
- Check correct branch is deployed
- Verify deployment completed successfully

---

## 🎓 Best Practices Summary

1. ✅ **Always use feature branches** - Never develop directly on master
2. ✅ **Test locally first** - `npm run build` and `npm run preview`
3. ✅ **Test preview deployments** - Before merging to master
4. ✅ **Small, frequent commits** - Easier to debug and rollback
5. ✅ **Descriptive commit messages** - Helps understand changes
6. ✅ **Keep master clean** - Only merge working code
7. ✅ **Use pull requests** - Review changes before merging (especially in teams)

---

## 📚 Related Guides

- `VERCEL_DEPLOYMENT.md` - Full deployment guide
- `VERCEL_CONTROLS.md` - All Vercel controls explained
- `VERCEL_QUICK_START.md` - Quick reference

---

**Happy developing! 🚀**

Your production site stays stable on `master` while you develop new features on branches!

