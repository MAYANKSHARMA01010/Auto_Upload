# Complete Step-by-Step Environment Setup Guide for ClipScheduler

This guide provides step-by-step instructions on how to create and retrieve every API key and OAuth credential required for your `backend/.env` file.

---

## 🚀 ngrok Permanent Domain Setup

**Your permanent ngrok domain:** `playgroup-pesticide-passport.ngrok-free.dev`

Run these two commands every time you start development:
```bash
# Terminal 1 — Start the app
pnpm run dev

# Terminal 2 — Start the tunnel
ngrok http --url=playgroup-pesticide-passport.ngrok-free.dev 3000
```

Your full app will be live at: **`https://playgroup-pesticide-passport.ngrok-free.dev`**

---

## ⚠️ Redirect URI Update Checklist (All 5 Platforms)

Every time you want to use OAuth login, make sure the following redirect URIs are set in **each platform's developer dashboard**. These are already saved in `backend/.env` — you just need to match them in the dashboards.

> **Base URL:** `https://playgroup-pesticide-passport.ngrok-free.dev`

### 1. YouTube — Google Cloud Console
- Go to: [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials** → Click your OAuth 2.0 Client ID
- Under **Authorized redirect URIs**, add:
  ```
  https://playgroup-pesticide-passport.ngrok-free.dev/api/v1/accounts/oauth/youtube/callback
  ```
- Click **Save**. ✅

### 2. Instagram — Meta for Developers (`ClipScheduler I-IG`)
- Go to: [developers.facebook.com](https://developers.facebook.com) → App `ClipScheduler I-IG`
- **Use cases** → **Customize** → **Settings** (Instagram API)
- Under **Redirect Callback URLs**, add:
  ```
  https://playgroup-pesticide-passport.ngrok-free.dev/api/v1/accounts/oauth/instagram/callback
  ```
- Click **Save**. ✅

### 3. Facebook — Meta for Developers (`ClipScheduler F`)
- Go to: [developers.facebook.com](https://developers.facebook.com) → App `ClipScheduler F`
- **Use cases** → **Facebook Login for Business** → **Settings**
- Under **Valid OAuth Redirect URIs**, add:
  ```
  https://playgroup-pesticide-passport.ngrok-free.dev/api/v1/accounts/oauth/facebook/callback
  ```
- Click **Save Changes**. ✅

### 4. Threads — Meta for Developers (`ClipScheduler Threads`)
- Go to: [developers.facebook.com](https://developers.facebook.com) → App `ClipScheduler Threads`
- **Use cases** → **Customize** → **Settings** (Threads API)
- Under **Redirect Callback URL**, add:
  ```
  https://playgroup-pesticide-passport.ngrok-free.dev/api/v1/accounts/oauth/threads/callback
  ```
- Click **Save**. ✅

### 5. Twitter / X — Twitter Developer Portal
- Go to: [developer.twitter.com](https://developer.twitter.com) → Your App → **User authentication settings** → **Edit**
- Under **Callback URI / Redirect URL**, add:
  ```
  https://playgroup-pesticide-passport.ngrok-free.dev/api/v1/accounts/oauth/x/callback
  ```
- Click **Save**. ✅

---


## Social Media Platform Overview

| # | Social Platform | Developer App / Portal | Environment Variables | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **YouTube Shorts** | Google Cloud Console | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI` | ✅ Configured in `.env` |
| **2** | **Instagram Reels** | Meta for Developers (`ClipScheduler I-IG`) | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI` | ✅ Configured in `.env` |
| **3** | **Facebook Reels** | Meta for Developers (`ClipScheduler F`) | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_REDIRECT_URI` | ✅ Configured in `.env` |
| **4** | **Threads** | Meta for Developers (`ClipScheduler Threads`) | `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`, `THREADS_REDIRECT_URI` | ✅ Configured in `.env` |
| **5** | **Twitter / X** | Twitter Developer Portal | `X_API_KEY`, `X_API_SECRET`, `X_REDIRECT_URI` | ✅ Configured in `.env` |
| **6** | **Snapchat** | Snap Kit Developer Portal | `SNAPCHAT_CLIENT_ID`, `SNAPCHAT_CLIENT_SECRET`, `SNAPCHAT_REDIRECT_URI` | ⏳ Pending Setup |
| **7** | **TikTok** | TikTok Developer Portal | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` | ⏳ Pending Setup |

---

## Table of Contents
1. [YouTube Shorts (Google Cloud Console)](#1-youtube-shorts-google-cloud-console)
2. [Instagram Reels (Meta for Developers)](#2-instagram-reels-meta-for-developers)
3. [Facebook Reels (Meta for Developers)](#3-facebook-reels-meta-for-developers)
4. [Threads (Meta for Developers)](#4-threads-meta-for-developers)
5. [Twitter / X (Twitter Developer Portal)](#5-twitter--x-twitter-developer-portal)
6. [Snapchat (Snap Kit Developer Portal)](#6-snapchat-snap-kit-developer-portal)
7. [TikTok (TikTok Developer Portal)](#7-tiktok-tiktok-developer-portal)
8. [Google Gemini AI & Pexels Stock APIs](#8-google-gemini-ai--pexels-stock-apis)
9. [Cloudflare R2 Video Storage (S3 Compatible)](#9-cloudflare-r2-video-storage-s3-compatible)
10. [Gmail SMTP Email Credentials](#10-gmail-smtp-email-credentials)

---

## 1. YouTube Shorts (Google Cloud Console)

### Environment Variables:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/youtube/callback`

### Step-by-Step Instructions:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create project `ClipScheduler` -> Enable **YouTube Data API v3**.
3. **Google Auth Platform**: Set up OAuth Consent screen (External) -> Publish app to production.
4. **Create Credentials**: Go to **Clients** -> **Create Client** -> Web application -> Name: `ClipScheduler Client`.
   - Authorized redirect URI: `http://localhost:8000/api/v1/accounts/oauth/youtube/callback`.
5. Copy generated **Client ID** and **Client Secret** into your `backend/.env`.

---

## 2. Instagram Reels (Meta for Developers)

### Environment Variables:
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/instagram/callback`

### Step-by-Step Instructions:
1. Go to [Meta for Developers Portal](https://developers.facebook.com/).
2. Click **My Apps** → **Create App** → Select **"Manage messaging & content on Instagram"** use case → Name: `ClipScheduler I-IG`.
3. **App Settings → Basic**:
   - Set **Privacy Policy URL** (generate one at [privacypolicygenerator.info](https://www.privacypolicygenerator.info/)).
   - Upload an **App Icon** (1024×1024 PNG).
   - Click **Save Changes**.
4. **Use Cases → Customize → Settings** (Instagram API):
   - Under **Redirect Callback URLs**, add:
     ```
     http://localhost:8000/api/v1/accounts/oauth/instagram/callback
     https://playgroup-pesticide-passport.ngrok-free.dev/api/v1/accounts/oauth/instagram/callback
     ```
   - Enable permissions:
     - `Business Asset User Profile Access` ← Click **`+ Add`** (Top item on Permissions & Features page — required for reading real `@username` & profile picture)
     - `instagram_business_basic` ← required for account access
     - `instagram_business_content_publish` ← Click **`+ Add`** (required for posting Reels)
     - `instagram_business_manage_comments` ← optional
     - `instagram_business_manage_messages` ← optional
   - Click **Save**.
5. Copy **App ID** and **App Secret** into your `backend/.env`.
6. **IMPORTANT — Publish App for All Users**:
   - Left sidebar → **Publish** → Review use cases → Click the blue **Publish** button.
   - Your app will show **"Published"** badge → any Instagram Business/Creator account can now log in.
   - > ⚠️ If you skip this step, only accounts added under **Testing → Testers** can connect (max 25).

### ⚠️ "Insufficient Developer Role" Error?
This means your Meta App is still in **Development Mode**. Fix by:
- **Option A (instant):** Left sidebar → **Testing** → Add the Instagram account as a Tester.
- **Option B (permanent):** Left sidebar → **Publish** → Click **Publish** button → all users can log in.

### ⚠️ "Instagram Account Not Supported" or Auth Fails?
Instagram OAuth (`instagram_business_basic`) only works with **Business** or **Creator** accounts.
Personal accounts must be switched first:
> Instagram App → **Settings → Account → Switch to Professional Account → Creator or Business**

---


## 3. Facebook Reels (Meta for Developers)

### Environment Variables:
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_REDIRECT_URI` = `https://localhost:8000/api/v1/accounts/oauth/facebook/callback`

### Step-by-Step Instructions:
1. Go to [Meta for Developers Portal](https://developers.facebook.com/).
2. Create App -> Select **Authenticate and request data from users with Facebook Login** -> Name: `ClipScheduler Facebook`.
3. **App Settings -> Basic**:
   - Set **Privacy Policy URL**.
   - Leave **App domains** empty.
   - Save Changes.
4. **Facebook Login for Business -> Settings**:
   - Valid OAuth Redirect URIs: `https://localhost:8000/api/v1/accounts/oauth/facebook/callback`.
   - Save Changes.
5. Copy **App ID** and **App Secret** into your `backend/.env`.

---

## 4. Threads (Meta for Developers)

### Environment Variables:
- `THREADS_CLIENT_ID`
- `THREADS_CLIENT_SECRET`
- `THREADS_REDIRECT_URI` = `https://localhost:8000/api/v1/accounts/oauth/threads/callback`

### Step-by-Step Instructions:
1. Go to [Meta for Developers Portal](https://developers.facebook.com/).
2. Create App -> Select **Access the Threads API** -> Name: `ClipScheduler Threads`.
3. **App Settings -> Basic**:
   - Set **Privacy Policy URL**.
   - Save Changes.
4. **Use cases -> Customize -> Settings** (Access the Threads API):
   - Redirect Callback URL: `https://localhost:8000/api/v1/accounts/oauth/threads/callback`.
   - Uninstall Callback URL: `https://localhost:8000/api/v1/accounts/oauth/threads/uninstall`.
   - Delete Callback URL: `https://localhost:8000/api/v1/accounts/oauth/threads/delete`.
   - Save.
5. Copy **Threads App ID** and **Threads App Secret** into your `backend/.env`.

---

## 5. Twitter / X (Twitter Developer Portal)

### Environment Variables:
- `X_API_KEY`
- `X_API_SECRET`
- `X_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/x/callback`

### Step-by-Step Instructions:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard).
2. Create App `ClipScheduler` -> Set up **User authentication settings**:
   - Permissions: Read and write.
   - Type of App: Web App, Automated App or Bot.
   - Callback URL: `http://localhost:8000/api/v1/accounts/oauth/x/callback`.
   - Website URL: `https://twitter.com`.
3. Save Changes and copy **OAuth 2.0 Client ID** & **Client Secret** into your `backend/.env`.

---

## 6. Snapchat (Snap Kit Developer Portal)

### Environment Variables:
- `SNAPCHAT_CLIENT_ID`
- `SNAPCHAT_CLIENT_SECRET`
- `SNAPCHAT_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/snapchat/callback`

### Step-by-Step Instructions:
1. Go to [Snap Kit Developer Portal](https://kit.snapchat.com/portal/).
2. Click **+ Add App** -> Name it `ClipScheduler`.
3. Under **Development Environment**:
   - Redirect URI: `http://localhost:8000/api/v1/accounts/oauth/snapchat/callback`.
4. Enable **Creative Kit** & **Login Kit**.
5. Copy **OAuth Client ID** and **Client Secret** into your `backend/.env`.

---

## 7. TikTok (TikTok Developer Portal)

### Environment Variables:
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/tiktok/callback`

### Step-by-Step Instructions:
1. Go to [TikTok Developer Portal](https://developers.tiktok.com/).
2. Click **My Apps** -> **Create an App** -> Name: `ClipScheduler`.
3. Add Redirect URI: `http://localhost:8000/api/v1/accounts/oauth/tiktok/callback`.
4. Enable scopes: `user.info.basic`, `video.upload`, `video.publish`.
5. Submit and copy **Client Key** and **Client Secret** into your `backend/.env`.

---

## 8. Google Gemini AI & Pexels Stock APIs

### Environment Variables:
- `GEMINI_API_KEY`
- `PEXELS_API_KEY`

### Instructions for Gemini AI:
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API Key** -> **Create API Key in new project**.
3. Copy the key into `GEMINI_API_KEY` in `backend/.env`.

### Instructions for Pexels API:
1. Go to [Pexels API Portal](https://www.pexels.com/api/).
2. Request API Key -> Copy key into `PEXELS_API_KEY` in `backend/.env`.

---

## 9. Cloudflare R2 Video Storage (S3 Compatible)

*(Optional for local development — local storage `/uploads` used if omitted)*

### Environment Variables:
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT_URL`
- `R2_BUCKET_NAME` = `clipscheduler-videos`
- `R2_PUBLIC_URL`

### Instructions:
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **R2 Storage** -> Create bucket `clipscheduler-videos`.
3. Obtain API tokens with Read & Write permissions and save into `backend/.env`.

---

## 10. Gmail SMTP Email Credentials

*(Used for account verification & transactional notifications)*

### Environment Variables:
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM` = `noreply@clipscheduler.io`
