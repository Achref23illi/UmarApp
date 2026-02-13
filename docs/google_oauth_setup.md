# Google OAuth Setup Guide for Supabase + Expo

Follow these steps to configure Google OAuth for your UmarApp.

## 1. Google Cloud Platform (GCP) Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "UmarApp").
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
    *   Select **External** (unless you are in an organization).
    *   Fill in the App Name ("UmarApp"), Support Email, and Developer Contact Info.
    *   Click **Save and Continue**.
4.  Navigate to **Credentials**.
5.  Click **Create Credentials** > **OAuth client ID**.
6.  Select **Web application** (even for mobile, as we use Supabase as the intermediary).
7.  Name it "Supabase Auth".
8.  Under **Authorized redirect URIs**, add your Supabase project's callback URL:
    *   `https://uafazbhhadgvdxsranqy.supabase.co/auth/v1/callback`
9.  Click **Create**.
10. Copy the **Client ID** and **Client Secret**.

## 2. Supabase Configuration

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/uafazbhhadgvdxsranqy).
2.  Navigate to **Authentication** > **Providers**.
3.  Select **Google**.
4.  Toggle **Enable Sign in with Google**.
5.  Paste the **Client ID** and **Client Secret** you copied from GCP.
6.  Click **Save**.
7.  Navigate to **Authentication** > **URL Configuration**.
8.  **Important for physical device:** Set **Site URL** to `umarapp://` (or another non-localhost URL). If Site URL is `http://localhost:...`, after Google sign-in the browser will redirect to localhost and the device cannot open it (connection error / timeout).
9.  Under **Redirect URLs**, add:
    *   `umarapp://google-auth` (required for development build on device)
    *   `umarapp://**` (optional wildcard for the scheme)
    *   For Expo Go on device only: add your tunnel URL, e.g. `exp://xxx.ngrok.io/--/google-auth` (do not use `exp://localhost:8081` on a real device)

## 3. Implementation in Code

You will use `supabase.auth.signInWithOAuth` in your application via `expo-web-browser`.

Example:

```typescript
import { supabase } from '@/lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-linking'

WebBrowser.maybeCompleteAuthSession() // Handle redirect on web

const signInWithGoogle = async () => {
    const redirectUrl = makeRedirectUri({
        scheme: 'umarapp',
        path: 'google-auth',
    })

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false, // Use browser for auth flow
        },
    })

    if (error) console.error(error)
    // The WebBrowser will handle the opening of the URL
}
```

## Note for iOS/Android Deployment
When building for production, ensure you add the reverse DNS client ID or configure the URL schemes properly in `app.json` if using native Google login libraries, but the above "Web" flow works universally with Supabase.
