---
name: deployment
description: "[WORKFLOW] Deploy to production (Vercel + Convex) with pre-flight checks and environment validation"
when_to_use: When deploying from local development to production, or when ci-cd agent handles session-end deployment
version: 1.0.0
type: workflow
---

# Deployment Skill

**Purpose**: Provide reliable deployment workflow for Vercel (Next.js) + Convex stack with pre-flight validation.

---

## Deployment Stack

### Production Environment
- **Frontend**: Vercel (Next.js 15, React Server Components)
- **Backend**: Convex (serverless functions, realtime database)
- **Auth**: Clerk (authentication, user management)
- **Domain**: whiteglovelabs.ai (configured in Vercel)

### Environment Differences

| Aspect | Local Development | Production |
|--------|------------------|------------|
| Auth | `SKIP_AUTH=true` (middleware bypass) | `SKIP_AUTH=false` or unset (auth required) |
| Convex | Local dev deployment | Production deployment |
| Next.js | `npm run dev` on port 8765 | Vercel serverless |
| Environment | `.env.local` | Vercel environment variables |

---

## Pre-Deployment Checklist

### 1. Code Quality

```bash
# TypeScript compilation
npx tsc --noEmit
# Must show: 0 errors

# Run tests
npm test
# All tests must pass

# Lint check
npm run lint
# Should have 0 errors (warnings acceptable)

# Build locally
npm run build
# Must succeed without errors
```

**If any fail**: Fix before deploying. DO NOT deploy broken code.

---

### 2. Environment Variables

**Required variables** (must be set in Vercel dashboard):

#### Convex
- `CONVEX_DEPLOYMENT` - Production deployment URL
- `NEXT_PUBLIC_CONVEX_URL` - Public Convex URL

#### Clerk Auth
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Public key
- `CLERK_SECRET_KEY` - Secret key
- `CLERK_WEBHOOK_SECRET` - Webhook signature verification

#### AI Services
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Claude API access (if used)

#### Monitoring (optional)
- `LANGCHAIN_API_KEY` - LangSmith observability
- `LANGCHAIN_PROJECT` - Project name

**Verification**:
```bash
# Check local .env.local for reference
cat .env.local

# Compare with Vercel dashboard
# Settings → Environment Variables → Production
```

---

### 3. Auth Configuration

**CRITICAL**: Remove `SKIP_AUTH` for production.

```typescript
// middleware.ts
const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

// Local: SKIP_AUTH=true in .env.local
// Production: Do NOT set SKIP_AUTH (defaults to false)
```

**Verification**:
1. Check `.env.local` has `SKIP_AUTH=true`
2. Check Vercel dashboard does NOT have `SKIP_AUTH` variable
3. Test admin routes require auth in production

---

### 4. Package Dependencies

**Before deploying**, verify package.json is clean:

```bash
# Check for dev dependencies in dependencies section
# (Should only be in devDependencies)

# Verify no wildcards or local paths
grep -E '"\*"|"file:|"link:' package.json
# Should return nothing

# Check lock file exists
ls package-lock.json
# Must exist for reproducible builds
```

---

## Deployment Process

### Step 1: Update Convex Production

**Deploy backend first** (Convex functions):

```bash
# Deploy to Convex production
npx convex deploy --prod

# Verify deployment
# Check Convex dashboard: https://dashboard.convex.dev
# Ensure functions deployed successfully
```

**What this does**:
- Compiles TypeScript functions
- Validates schema
- Deploys to production backend
- Updates `CONVEX_DEPLOYMENT` URL

---

### Step 2: Deploy to Vercel

**Option A: Git Push (Recommended)**

```bash
# Commit changes
git add .
git commit -m "feat: [description]"

# Push to main branch
git push origin main

# Vercel auto-deploys from main branch
```

**Option B: Manual Deploy**

```bash
# Install Vercel CLI (if needed)
npm i -g vercel

# Deploy to production
vercel --prod

# Follow prompts to confirm deployment
```

---

### Step 3: Verify Deployment

#### Frontend Verification

```bash
# Check production URL
curl -I https://whiteglovelabs.ai
# Should return: 200 OK

# Check key pages
curl -I https://whiteglovelabs.ai/models
curl -I https://whiteglovelabs.ai/admin/pricing
# Both should return 200 (or 401 if auth required)
```

#### Backend Verification

```bash
# Check Convex dashboard
# https://dashboard.convex.dev/[your-project]

# Verify:
# - Latest deployment shows "Success"
# - Functions list matches local
# - No errors in logs
```

#### Auth Verification

```bash
# Navigate to admin route
# https://whiteglovelabs.ai/admin/pricing

# Should redirect to Clerk sign-in
# (NOT bypass like local dev)
```

---

## Post-Deployment

### Monitor Logs

**Vercel Logs**:
```bash
# View real-time logs
vercel logs --follow

# Or check dashboard:
# https://vercel.com/[your-team]/whiteglovelabs/logs
```

**Convex Logs**:
```
# Dashboard → Logs tab
# Watch for errors in first 5 minutes
```

---

### Smoke Test Checklist

After deployment, verify:

- [ ] Homepage loads: https://whiteglovelabs.ai
- [ ] Public catalog works: https://whiteglovelabs.ai/models
- [ ] Model detail pages load
- [ ] Admin routes require auth
- [ ] No console errors in browser DevTools
- [ ] Convex queries returning data
- [ ] No 500 errors in Vercel logs

**If ANY fail**: Rollback immediately.

---

## Rollback Procedure

### Vercel Rollback

```bash
# In Vercel dashboard:
# 1. Go to Deployments tab
# 2. Find last working deployment
# 3. Click "..." → "Promote to Production"

# Or CLI:
vercel rollback
```

### Convex Rollback

```bash
# Convex doesn't have built-in rollback
# Must re-deploy previous version:

git checkout [previous-commit]
npx convex deploy --prod
git checkout main
```

---

## Common Issues

### Issue 1: Build Fails on Vercel

**Symptoms**: Deployment fails with TypeScript or build errors

**Causes**:
- Local build succeeded but used cached types
- Environment variables missing
- Dependencies version mismatch

**Fix**:
```bash
# Locally, do clean build
rm -rf .next node_modules package-lock.json
npm install
npm run build

# If succeeds locally, check Vercel build logs for specific error
```

---

### Issue 2: Environment Variables Not Set

**Symptoms**: App loads but features broken (auth, Convex queries fail)

**Fix**:
1. Vercel dashboard → Settings → Environment Variables
2. Add missing variables
3. Redeploy (variables only apply on new deploys)

---

### Issue 3: Auth Loop (Redirect Loop)

**Symptoms**: Admin pages redirect infinitely

**Causes**:
- `SKIP_AUTH` set to `true` in production
- Clerk keys mismatched

**Fix**:
1. Remove `SKIP_AUTH` from Vercel environment variables
2. Verify `CLERK_SECRET_KEY` matches dashboard
3. Redeploy

---

### Issue 4: Convex Functions Not Found

**Symptoms**: Frontend loads but Convex queries return errors

**Causes**:
- Convex not deployed to production
- Frontend pointing to dev deployment

**Fix**:
```bash
# Deploy Convex to production
npx convex deploy --prod

# Verify NEXT_PUBLIC_CONVEX_URL in Vercel matches production
# Should be: https://[your-project].convex.cloud
```

---

## Deployment Frequency

**Recommended**:
- **Feature complete**: Deploy to production after full feature validation
- **Hotfix**: Deploy critical fixes immediately
- **Regular updates**: Weekly deployment cycle for non-critical changes

**NOT recommended**:
- Deploying every commit (use preview deployments instead)
- Deploying without local testing
- Deploying on Friday afternoons (can't monitor over weekend)

---

## Preview Deployments

Vercel automatically creates preview deployments for non-main branches:

```bash
# Create feature branch
git checkout -b feature/new-catalog-ui

# Push to GitHub
git push origin feature/new-catalog-ui

# Vercel creates preview URL:
# https://whiteglovelabs-[hash].vercel.app
```

**Use preview deployments**:
- Test in production-like environment
- Share with stakeholders for review
- Validate before merging to main

---

## Security Checklist

Before deploying:

- [ ] No API keys in code (only in environment variables)
- [ ] No `.env.local` committed to git
- [ ] `SKIP_AUTH` NOT set in production
- [ ] Clerk webhook secret configured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (if applicable)

---

## Integration with ci-cd Agent

When ci-cd agent handles deployment:

```markdown
Task: ci-cd
  Action: deploy-to-production
  Branch: main
  Pre-flight: run quality checks

Agent will:
1. Run pre-deployment checklist
2. Deploy Convex to production
3. Push to main (triggers Vercel deploy)
4. Verify deployment
5. Run smoke tests
6. Report status
```

---

## Example: Complete Deployment

```bash
# 1. Pre-flight checks
npx tsc --noEmit          # ✓ 0 errors
npm test                  # ✓ All passing
npm run build             # ✓ Build succeeds

# 2. Deploy Convex
npx convex deploy --prod
# ✓ Deployment successful

# 3. Deploy Vercel
git add .
git commit -m "feat(catalog): Improve model catalog UX"
git push origin main
# ✓ Vercel auto-deploys

# 4. Verify
curl -I https://whiteglovelabs.ai          # ✓ 200
curl -I https://whiteglovelabs.ai/models   # ✓ 200

# 5. Smoke test
# Navigate to site, check catalog, test admin auth
# ✓ All working

# ✅ Deployment complete
```

---

**Last Updated**: 2025-11-03
**Status**: Production ready
**Related Skills**: server-management, pre-completion-verification
**Related Agents**: ci-cd
