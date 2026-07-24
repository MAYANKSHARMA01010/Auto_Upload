# Complete Step-by-Step Environment Setup Guide for ClipScheduler

This guide provides exact step-by-step instructions on how to create and retrieve every API key and OAuth credential required in your `backend/.env` file.

---

## Table of Contents
1. [YouTube Shorts (Google Cloud Console)](#1-youtube-shorts-google-cloud-console)
2. [Instagram Reels & Facebook Reels (Meta for Developers)](#2-instagram-reels--facebook-reels-meta-for-developers)
3. [TikTok (TikTok Developer Portal)](#3-tiktok-tiktok-developer-portal)
4. [Twitter / X (Twitter Developer Portal)](#4-twitter--x-twitter-developer-portal)
5. [Snapchat (Snap Kit Developer Portal)](#5-snapchat-snap-kit-developer-portal)
6. [Threads (Meta for Developers)](#6-threads-meta-for-developers)
7. [Google Gemini AI & Pexels Stock APIs](#7-google-gemini-ai--pexels-stock-apis)
8. [Cloudflare R2 Video Storage (S3 Compatible)](#8-cloudflare-r2-video-storage-s3-compatible)
9. [Gmail SMTP Email Credentials](#9-gmail-smtp-email-credentials)

---

## 1. YouTube Shorts (Google Cloud Console)

### Keys Needed:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/youtube/callback`

### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a Project** at the top bar -> **New Project**. Name it `ClipScheduler` and click **Create**.
3. In the left sidebar, click **APIs & Services** -> **Library**.
4. Search for **YouTube Data API v3**, click it, and click **Enable**.
5. Go to **APIs & Services** -> **OAuth consent screen**:
   - Choose **External** -> Click **Create**.
   - Fill in **App Name** (`ClipScheduler`) and your email address.
   - Click **Save and Continue** through Scopes.
   - Under **Test Users**, add your personal Google email address so you can test authorization. Click **Save**.
6. Go to **APIs & Services** -> **Credentials**:
   - Click **+ Create Credentials** at the top -> **OAuth client ID**.
   - Select **Application type**: `Web application`.
   - **Name**: `ClipScheduler Web Client`.
   - Under **Authorized redirect URIs**, click **+ Add URI** and paste:
     `http://localhost:8000/api/v1/accounts/oauth/youtube/callback`
   - Click **Create**.
7. Copy the generated **Client ID** and **Client Secret** into your `backend/.env`.

---

## 2. Instagram Reels & Facebook Reels (Meta for Developers)

### Keys Needed:
- `INSTAGRAM_CLIENT_ID` (App ID)
- `INSTAGRAM_CLIENT_SECRET` (App Secret)
- `INSTAGRAM_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/instagram/callback`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/facebook/callback`

### Steps:
1. Go to [Meta for Developers](https://developers.facebook.com/) and log in with your Facebook account.
2. Click **My Apps** -> **Create App**.
3. Select **Other** -> **Business** (or **Consumer/Other**) -> Click **Next**.
4. App Name: `ClipScheduler`. Click **Create App**.
5. In the App Dashboard:
   - Find **Instagram Graph API** and click **Set Up**.
   - Find **Facebook Login for Business** and click **Set Up**.
6. Go to **App Settings** -> **Basic** (left sidebar):
   - Here you will find your **App ID** and **App Secret** (click **Show** to reveal).
   - Copy **App ID** to `FACEBOOK_APP_ID` (and `INSTAGRAM_CLIENT_ID`).
   - Copy **App Secret** to `FACEBOOK_APP_SECRET` (and `INSTAGRAM_CLIENT_SECRET`).
7. Under **Facebook Login** -> **Settings**:
   - Add `http://localhost:8000/api/v1/accounts/oauth/facebook/callback` to **Valid OAuth Redirect URIs**.
8. Under **Instagram** -> **Basic Display / API Settings**:
   - Add `http://localhost:8000/api/v1/accounts/oauth/instagram/callback` to **Valid OAuth Redirect URIs**.

---

## 3. TikTok (TikTok Developer Portal)

### Keys Needed:
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/tiktok/callback`

### Steps:
1. Go to [TikTok Developer Portal](https://developers.tiktok.com/) and log in.
2. Click **My Apps** -> **Manage Apps** -> **Create an App**.
3. App Name: `ClipScheduler`.
4. Under **App Specifications**:
   - Add **Redirect URI**: `http://localhost:8000/api/v1/accounts/oauth/tiktok/callback`
5. Under **Products / Scopes**, add:
   - `user.info.basic`
   - `video.upload`
   - `video.publish`
6. Click **Save** / **Submit**.
7. Copy the generated **Client Key** (`TIKTOK_CLIENT_KEY`) and **Client Secret** (`TIKTOK_CLIENT_SECRET`) into `backend/.env`.

---

## 4. Twitter / X (Twitter Developer Portal)

### Keys Needed:
- `X_API_KEY` (Client ID)
- `X_API_SECRET` (Client Secret)
- `X_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/x/callback`

### Steps:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) and log in.
2. Sign up for a Free Developer Account if prompted.
3. Click **+ Add Project** -> Name it `ClipScheduler`.
4. Create an App under the project named `ClipScheduler App`.
5. Under **App Settings** -> **User authentication settings**:
   - Click **Edit**.
   - **App permissions**: Select **Read and Write and Direct Messages** (or Read & Write).
   - **Type of App**: Select **Web App, Automated App or Bot**.
   - **Callback URI / Redirect URL**: Add `http://localhost:8000/api/v1/accounts/oauth/x/callback`.
   - **Website URL**: `http://localhost:3000`.
   - Click **Save**.
6. Under **Keys and Tokens**:
   - Copy **OAuth 2.0 Client ID** to `X_API_KEY`.
   - Copy **OAuth 2.0 Client Secret** to `X_API_SECRET`.

---

## 5. Snapchat (Snap Kit Developer Portal)

### Keys Needed:
- `SNAPCHAT_CLIENT_ID`
- `SNAPCHAT_CLIENT_SECRET`
- `SNAPCHAT_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/snapchat/callback`

### Steps:
1. Go to [Snap Kit Developer Portal](https://kit.snapchat.com/portal/) and log in with your Snapchat account.
2. Click **+ Add App** -> Name it `ClipScheduler`.
3. Under **Development Environment**:
   - Add **Redirect URI**: `http://localhost:8000/api/v1/accounts/oauth/snapchat/callback`.
4. Under **Permissions / Kits**:
   - Enable **Creative Kit** and **Login Kit**.
5. Copy the **OAuth Client ID** and **Client Secret** into your `backend/.env`.

---

## 6. Threads (Meta for Developers)

### Keys Needed:
- `THREADS_CLIENT_ID`
- `THREADS_CLIENT_SECRET`
- `THREADS_REDIRECT_URI` = `http://localhost:8000/api/v1/accounts/oauth/threads/callback`

### Steps:
1. Go to [Meta for Developers Dashboard](https://developers.facebook.com/).
2. Open your `ClipScheduler` Meta App (or create one).
3. Click **Add Product** -> Select **Threads API**.
4. Go to **Threads API Settings**:
   - Add **Redirect URI**: `http://localhost:8000/api/v1/accounts/oauth/threads/callback`.
5. Copy the **Threads App ID** (`THREADS_CLIENT_ID`) and **Threads App Secret** (`THREADS_CLIENT_SECRET`) into `backend/.env`.

---

## 7. Google Gemini AI & Pexels Stock APIs

### Keys Needed:
- `GEMINI_API_KEY`
- `PEXELS_API_KEY`

### Steps for Gemini AI Key:
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Log in with your Google account.
3. Click **Get API Key** at top left -> **Create API Key in new project**.
4. Copy the string starting with `AIzaSy...` and paste it into `GEMINI_API_KEY`.

### Steps for Pexels API Key:
1. Go to [Pexels API Portal](https://www.pexels.com/api/).
2. Sign up / log in to Pexels.
3. Click **Your API Key** -> **Request API Key**.
4. Describe your app as `Video Scheduler` and submit.
5. Copy the key and paste it into `PEXELS_API_KEY`.

---

## 8. Cloudflare R2 Video Storage (S3 Compatible)

*(Optional for local development — if left empty, local disk storage `/uploads` is used)*

### Keys Needed:
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT_URL`
- `R2_BUCKET_NAME` = `clipscheduler-videos`
- `R2_PUBLIC_URL`

### Steps:
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Click **R2 Storage** in the left navigation.
3. Click **Create Bucket** -> Name it `clipscheduler-videos` -> Click **Create Bucket**.
4. Under **Bucket Settings**:
   - Under **Public Access**, click **Connect Custom Domain** (or enable R2 dev domain) to get `R2_PUBLIC_URL` (e.g. `https://pub-xyz.r2.dev`).
5. On the main **R2 Overview** page:
   - Look at the right sidebar to find your **Account ID**.
   - Your `R2_ENDPOINT_URL` will be: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
6. Click **Manage R2 API Tokens** (top right) -> **Create API Token**:
   - Token Name: `ClipScheduler Token`.
   - Permissions: **Object Read & Write**.
   - Click **Create API Token**.
7. Copy **Access Key ID** to `R2_ACCESS_KEY_ID` and **Secret Access Key** to `R2_SECRET_ACCESS_KEY`.

---

## 9. Gmail SMTP Email Credentials

*(Used for sending email verification, password reset, and upload notifications)*

### Keys Needed:
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER` = `your-email@gmail.com`
- `SMTP_PASSWORD` = *(16-character Gmail App Password)*
- `SMTP_FROM` = `noreply@clipscheduler.io`

### Steps:
1. Go to your [Google Account Security Page](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. Search for **App Passwords** in the search bar at the top of Google Account.
4. **App Name**: Type `ClipScheduler` -> Click **Create**.
5. Google will display a **16-character passcode** (e.g. `abcd efgh ijkl mnop`).
6. Copy that 16-character code (without spaces) and paste it into `SMTP_PASSWORD`.
7. Set `SMTP_USER` to your Gmail address (e.g. `myname@gmail.com`).
