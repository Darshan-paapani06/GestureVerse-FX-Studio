# GestureVerse FX Studio

**Created by Darshan Paapani**

GestureVerse FX Studio is an offline-capable, real-time cinematic VFX application controlled by hand gestures and upper-body motion. It ships as a React web/PWA project and a Capacitor Android project using the same codebase.

## What is included

- Hand tracking for up to two hands
- Upper-body pose tracking
- Optional face tracking with glowing eyes, energy mask, and crown/aura
- Hybrid gesture engine: landmark geometry + temporal motion history + hold/release states
- 15 procedural VFX across Superhero, Anime, Magic, and Elements
- Gesture mapper and effect colour customization
- Real, blurred, or uploaded camera backgrounds
- Built-in ambient audio, uploaded music, and procedural sound effects
- Screenshot vault and composed canvas recording
- Landscape, portrait, and square stage modes
- Eco, Balanced, and Cinematic performance profiles
- Mirrored camera by default with normal-orientation toggle
- Offline PWA service worker and locally bundled AI runtimes/models
- Android 10+ project with native save/share export flow
- No account, cloud API, or paid service required

## Headline gestures

| Gesture | Default power |
|---|---|
| Swipe left/right | Energy Slash |
| Both fists held | Power Aura Charge; open hands to release |
| Crossed hands | Energy Shield |

Additional recognizers include palm thrust, raised fist, downward punch, hands together then push, fast double swipe, circular motion, pinch hold, pinch rotate, arms opened, cupped hands, two open palms, and two-hand circular motion.

## 15 VFX powers

**Superhero:** Energy Shield, Repulsor Blast, Thunder Strike, Ground Shockwave  
**Anime:** Power Aura Charge, Energy Slash, Ultimate Energy Beam, Teleport Afterimage  
**Magic:** Mystic Portal, Magic Rune Circle, Phoenix Energy Bird, Telekinetic Orb  
**Elements:** Fireball, Ice Blast, Wind Vortex

## Requirements

### Website/PWA

- Node.js 22 recommended
- Current Chrome or Edge
- Webcam

### Android APK

- Android Studio with Android SDK 36 installed
- JDK 21
- Android device or emulator running Android 10 (API 29) or newer
- USB debugging enabled when installing directly on a phone

## Run the website

```bash
npm install
npm run dev
```

Open the local address printed in the terminal, normally `http://localhost:5173`.

Camera access works on `localhost` during development. A deployed website must use HTTPS.

## Create the production web build

```bash
npm run build
npm run preview
```

The deployable output is generated in `dist/`.

The `dist` folder can be deployed to Cloudflare Pages, Vercel, Netlify, GitHub Pages with SPA configuration, or any static HTTPS host.

## Install as an offline PWA

1. Build and deploy the `dist` folder over HTTPS, or run the production preview locally.
2. Open the site in Chrome or Edge.
3. Choose **Install GestureVerse FX Studio** from the browser install button/menu.
4. Launch it once while online/local assets are available. The application shell and bundled AI resources are then available offline.

The first offline cache is large because the hand, pose, face, and WebAssembly assets are included locally rather than loaded from a CDN.

## Build the Android APK

### Recommended: Android Studio

```bash
npm install
npm run cap:sync
npx cap open android
```

In Android Studio:

1. Allow Gradle sync to finish.
2. Connect an Android 10+ phone or start an emulator.
3. Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Android Studio shows a link to the generated APK.

Default APK path:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Command-line build

```bash
npm run android:apk
```

On Windows PowerShell, when running Gradle directly:

```powershell
cd android
.\gradlew.bat assembleDebug
```

## Android export behaviour

The recorder checks supported formats in this order:

1. MP4 with H.264/AAC
2. MP4
3. WebM VP9/Opus
4. WebM VP8/Opus
5. Generic WebM

Therefore, Android produces MP4 when the installed Android System WebView exposes MP4 MediaRecorder support; otherwise it safely records WebM. Android exports use the native share/save sheet. Website exports use normal browser downloads.

## Suggested demonstration sequence

1. Start in **Balanced** mode and allow camera access.
2. Stand far enough back to keep both hands and shoulders visible.
3. Cross both hands to summon the Energy Shield.
4. Hold both fists to charge the Power Aura, then open them to release it.
5. Swipe sharply left or right to trigger the directional Energy Slash.
6. Preview a portal, fireball, phoenix, and wind vortex from the effect library.
7. Enable glowing eyes or the face aura.
8. Switch the background to Blur or upload an image.
9. Record a short sequence, stop it, and export it from the Capture Vault.
10. Switch between landscape and portrait layouts.

## Performance guidance

- **Eco:** older or integrated-GPU laptops; reduced detection cadence; face effects disabled
- **Balanced:** recommended default for most laptops
- **Cinematic:** higher tracking cadence and denser effects for stronger hardware

For best recognition, use even front lighting, keep the full hand inside the frame, avoid a cluttered background, and make motion gestures deliberately.

## Architecture

```text
src/
├── components/       Studio UI, landing page, controls, tutorial, gallery
├── data/             15 effect definitions and default mappings
├── gestures/         Hybrid static + temporal gesture state machine
├── hooks/            Camera lifecycle and device selection
├── lib/              Audio engine, math helpers, local settings
├── recording/        Canvas recorder and web/native export
├── types/            Shared TypeScript domain types
├── vfx/              Procedural particle and effect renderer
└── vision/           Local MediaPipe hands, pose, face pipelines

public/
├── audio/            Built-in original ambient track
├── icons/            PWA identity
└── mediapipe/        Offline AI runtime and model assets

android/              Capacitor Android 10+ project
branding/             Logo and Android splash source/preview assets
```

## Privacy

Camera frames are processed on the device. The application does not include a login, analytics tracker, remote AI API, or upload service. Preferences are stored in browser local storage. Captures remain in memory until downloaded/exported or the page is closed.

## Important limitations

- Gesture accuracy depends on lighting, camera quality, framing, and device speed.
- Browser and Android recording codecs depend on the browser/System WebView implementation.
- Uploaded backgrounds are stored as local data in settings; use compressed images below 8 MB.
- The capture vault is session-based. Export important captures before closing or refreshing the application.
- AI background removal is not included; Blur and uploaded-background compositing use the pose segmentation mask.

## Useful commands

```bash
npm run dev          # Development server
npm run build        # Type-check + production build
npm run preview      # Preview production build
npm run cap:sync     # Build web app and sync Android assets/plugins
npm run android:open # Sync and open Android Studio
npm run android:apk  # Sync and build debug APK with local Android toolchain
```

## Branding

Project title: **GestureVerse FX Studio**  
Creator credit displayed in the application: **Darshan Paapani**

## Publish through GitHub Pages

This repository includes `.github/workflows/deploy.yml`. Every push to `main` validates, builds, and deploys the app. The workflow automatically sets Vite's base path from the repository name, so public assets, MediaPipe models, audio, and the PWA work under `https://USERNAME.github.io/REPOSITORY/`.

After pushing the repository, open **Settings → Pages** and choose **GitHub Actions** as the publishing source. The public URL appears in the completed deployment workflow and in the Pages settings.
