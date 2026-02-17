# UmarApp 🕌

An Islamic app built with [Expo](https://expo.dev) using a development build.

## Backend Shared Setup

The backend is now shared at:

- `/Users/achrafarabi/Dev/project/Umarapp-platform/backend`

Mobile app and dashboard both use this same backend.

Run backend from `Umarapp-platform`:

```bash
npm run dev:backend
```

or from this folder:

```bash
npm run backend:dev
```

> ⚠️ **Important:** This app requires a **development build** and does **NOT** work with Expo Go. It is currently built for **iOS only**.

## Prerequisites

- macOS with Xcode installed
- iOS Simulator (iPhone)
- Node.js and npm

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Install iOS pods

   ```bash
   cd ios && pod install && cd ..
   ```

3. Build and run the development build on iOS Simulator

   ```bash
   npx expo run:ios
   ```

   Or start the development server and press `i` to open in iOS Simulator:

   ```bash
   npx expo start --dev-client
   ```

## Platform Support

| Platform | Status |
|----------|--------|
| iOS      | ✅ Supported |
| Android  | ❌ Not supported |

> **Note:** This app uses native modules that require a development build. Expo Go is not supported.

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
