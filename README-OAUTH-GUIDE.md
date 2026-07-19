# Developer Guide: Setting up OAuth API Keys

ClipScheduler allows users to connect their social accounts (YouTube, Instagram, TikTok, etc.) via OAuth. To make this work, you must create Developer Applications on each platform and populate your `.env` file with the respective `CLIENT_ID` and `CLIENT_SECRET`.

> [!NOTE]
> Since you are running a SaaS, you (the admin) only need to do this **once**. Your users will simply click "Connect" and authorize the app using the keys you configured below.

---

## 1. YouTube (Google Cloud Console)

To post YouTube Shorts, you need the **YouTube Data API v3**.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project (e.g., "ClipScheduler").
3. In the sidebar, go to **APIs & Services > Library** and search for **YouTube Data API v3**. Click **Enable**.
4. Go to **OAuth consent screen**.
   - Choose **External** (if you want any user to connect) or **Internal** (if only your Google Workspace can connect).
   - Fill in the App name ("ClipScheduler"), User support email, and Developer contact information.
   - Under Scopes, add `.../auth/youtube.upload`.
   - Add yourself as a Test User if your app is still in "Testing" mode.
5. Go to **Credentials > Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Authorized redirect URIs: Add your backend callback URL (e.g., `http://localhost:8000/api/v1/accounts/oauth/youtube/callback` for local dev, and your production URL).
6. Copy the **Client ID** and **Client Secret** into your `.env` file:
   ```env
   YOUTUBE_CLIENT_ID=your-client-id
   YOUTUBE_CLIENT_SECRET=your-client-secret
   ```

---

## 2. Instagram & Facebook (Meta for Developers)

To post Instagram Reels or Facebook Reels, you use the Meta Graph API.

1. Go to [Meta for Developers](https://developers.facebook.com/) and click **My Apps > Create App**.
2. Select **Business** or **Allow people to log in with their Facebook account** depending on your exact Graph API needs.
3. Fill in the App Name and Contact Email.
4. Once the app is created, go to **App Settings > Basic** to find your **App ID** and **App Secret**.
5. Add the **Instagram Graph API** and **Facebook Login** products to your app.
6. In **Facebook Login > Settings**, add your Valid OAuth Redirect URIs:
   - `http://localhost:8000/api/v1/accounts/oauth/instagram/callback`
   - `http://localhost:8000/api/v1/accounts/oauth/facebook/callback`
7. Note: For users to connect Instagram, their Instagram account *must* be a Professional/Creator account linked to a Facebook Page.
8. Copy the keys to your `.env` file:
   ```env
   INSTAGRAM_CLIENT_ID=your-app-id
   INSTAGRAM_CLIENT_SECRET=your-app-secret
   ```

---

## 3. TikTok (TikTok for Developers)

1. Go to the [TikTok Developer Portal](https://developers.tiktok.com/).
2. Click **My Apps > Create App**.
3. Choose **Web App**.
4. Fill in the App Name, Description, and upload an App Icon.
5. In the **Redirect Domain** section, add your domain (for local dev, you might need to use a tunneling service like ngrok if `localhost` is rejected, or check their current localhost policy).
6. Request the **Video Publishing** scope.
7. Once approved/created, copy your **Client Key** and **Client Secret** to your `.env` file:
   ```env
   TIKTOK_CLIENT_KEY=your-client-key
   TIKTOK_CLIENT_SECRET=your-client-secret
   ```

---

## 4. X (Twitter Developer Portal)

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/).
2. Create a Project and an App.
3. In the App settings, set up **User authentication settings**.
   - Select **OAuth 2.0**.
   - Type of App: **Web App**.
   - Callback URI: `http://localhost:8000/api/v1/accounts/oauth/x/callback`.
4. Request scopes: `tweet.write`, `tweet.read`, `users.read`, `offline.access`.
5. Save the **Client ID** and **Client Secret** (OAuth 2.0 Client ID) to your `.env` file:
   ```env
   X_API_KEY=your-client-id
   X_API_SECRET=your-client-secret
   ```

> [!WARNING]
> **Production Readiness:** Remember to update the OAuth Redirect URIs in all developer portals (Google, Meta, TikTok, X) when you deploy your app to production (e.g., replacing `localhost:8000` with `https://api.clipscheduler.com`).
