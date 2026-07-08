# RVA Now — Preview & App Store

## 1. See changes on your iPhone (right now)

Use **Expo Go** — no Xcode needed for development.

1. Start the dev server (if it is not already running):

   ```bash
   cd apps/mobile
   npm run start:lan
   ```

2. Open **`connect.html`** in your browser (double-click the file).

3. Scan the QR code with your iPhone **Camera** app, then tap the banner to open in **Expo Go**.

4. iPhone and PC must be on the **same Wi‑Fi**. If the QR fails, in Expo Go tap **Enter URL manually** and paste:

   ```
   exp://100.100.181.150:8081
   ```

5. After you edit code, shake the phone (or pull down in Expo Go) and tap **Reload** to see updates.

Your Supabase env vars load from `apps/mobile/.env` automatically.

---

## 2. Put it on the App Store (Xcode path)

Expo manages the JavaScript app; Apple requires a **native iOS project** for App Store submission. You generate that on a **Mac**, then open it in Xcode.

### One-time setup on your Mac

1. Copy the whole `rva-now` folder to your Mac (USB, cloud drive, etc.).

2. Install tools:

   ```bash
   # Xcode from Mac App Store (required)
   # Node.js 20+ from nodejs.org or nvm
   cd apps/mobile
   npm install
   ```

3. Generate the native iOS project (**must run on macOS**):

   ```bash
   npm run prebuild:ios
   ```

   This creates `apps/mobile/ios/`. That folder is gitignored — regenerate it whenever you add native Expo plugins.

4. Install CocoaPods dependencies:

   ```bash
   cd ios
   pod install
   cd ..
   ```

5. Open in Xcode:

   ```bash
   open ios/RVANow.xcworkspace
   ```

   Always open the **`.xcworkspace`** file, not `.xcodeproj`.

### App Store Connect setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → New App.
2. Bundle ID: **`com.rvanow.app`** (must match `app.json`).
3. In Xcode → **Signing & Capabilities**:
   - Select your **Team** (Apple Developer account, $99/year).
   - Enable **Automatically manage signing**.
4. Set version in `app.json` (`version` + `ios.buildNumber`) before each release.

### Archive and upload

1. In Xcode, select target **Any iOS Device (arm64)** (not a simulator).
2. **Product → Archive**.
3. When the Organizer opens: **Distribute App → App Store Connect → Upload**.
4. In App Store Connect, add screenshots, description, privacy policy, then submit for review.

### Production env vars

Create `apps/mobile/.env` on the Mac with the same Supabase values before archiving. Expo bakes `EXPO_PUBLIC_*` vars into the build at compile time.

---

## 3. Alternative: EAS Build (no local Xcode build)

If you prefer Expo’s cloud Mac builders instead of archiving locally:

```bash
npm install -g eas-cli
eas login
eas init          # links project, fills app.json extra.eas.projectId
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Update placeholder values in `eas.json` (`appleId`, `ascAppId`, `appleTeamId`) first.

EAS produces an `.ipa` you upload to App Store Connect without using Xcode’s Archive button — but you still need an Apple Developer account and App Store Connect listing.

---

## Quick reference

| Goal | What to use |
|------|-------------|
| See UI changes today | Expo Go + `connect.html` |
| Native Xcode project | `npm run prebuild:ios` on a **Mac** |
| Upload to App Store | Xcode Archive **or** `eas build` + `eas submit` |
