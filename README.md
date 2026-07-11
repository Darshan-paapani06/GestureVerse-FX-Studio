<div align="center">

# ✨ GestureVerse FX Studio

### **AI-powered real-time cinematic VFX controlled by human motion**

Control energy shields, anime slashes, magic portals, elemental blasts, glowing eyes, power auras, and cinematic camera effects using only your webcam, hand gestures, and upper-body movement.

<br />

**Created by Darshan Paapani**

<br />

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0b1220)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-On--Device_AI-00A67E?style=for-the-badge&logo=google&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-Android_APK-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

<br />

> **GestureVerse FX Studio** transforms a normal webcam into a motion-driven visual effects stage. It combines hand landmark detection, upper-body pose tracking, optional face mesh overlays, gesture state machines, procedural particle animation, sound synchronization, local recording, and Android packaging into one futuristic creative studio.

<br />

[🚀 Features](#-features) • [🧠 AI Pipeline](#-ai--gesture-intelligence) • [🎬 Effects](#-cinematic-effect-library) • [⚙️ Workflow](#️-advanced-project-workflow) • [🌐 Deploy](#-deploy-to-github-pages) • [📱 Android](#-android-apk-build)

</div>

---

## 🌌 Project Vision

GestureVerse FX Studio is built as a **college final project with portfolio-grade presentation quality**. The goal is not just to detect gestures, but to create a complete cinematic studio where motion becomes an input language for real-time digital powers.

The application turns this simple idea:

```text
Webcam + Human Gesture → AI Tracking → Gesture Engine → Cinematic VFX + Sound + Recording
```

into a polished product experience:

```text
Enter Studio → Calibrate Camera → Perform Gesture → Trigger Power → Record Scene → Export Capture
```

---

## 🚀 Features

### 🎥 Real-time camera studio

- Live webcam stage with mirrored camera mode
- Normal-orientation toggle
- Responsive desktop layout
- Landscape, portrait, and square capture modes
- Full-screen presentation-friendly interface
- Camera permission and status feedback

### 🖐️ Motion and gesture control

- Hand tracking for gesture input
- Upper-body pose tracking for body-aware effects
- Optional face mesh tracking
- Static gesture detection
- Motion-based temporal gestures
- Gesture confidence scoring
- Hold/release gesture states
- Gesture cooldown system to prevent accidental spam

### 🧪 Cinematic effect laboratory

- 15 polished procedural VFX powers
- Superhero, Anime, Magic, and Elements categories
- Adjustable intensity
- Adjustable particle density
- Glow control
- Screen-shake toggle
- Custom effect colours
- Manual effect trigger for demonstration

### 🎵 Audio and motion feedback

- Built-in cinematic ambient soundtrack
- User-uploaded background music
- Procedural activation sounds
- Procedural impact sounds
- Audio reacts to gesture-triggered powers

### 🖼️ Background studio

- Real camera background
- Blur background mode
- Uploaded background images
- Dark cinematic presentation mode
- Local background persistence

### 📸 Capture vault

- Screenshot capture
- Composed video recording
- WebM recording support on the website
- MP4-compatible export path on Android when available
- Session-based capture gallery
- Local browser downloads
- Android-native save/share flow

### 📦 Offline and cross-platform

- Offline-capable PWA
- Locally bundled MediaPipe assets
- No mandatory login
- No paid cloud API
- No remote AI inference required
- Android APK project through Capacitor
- Android 10+ support

---

## 🧠 AI + Gesture Intelligence

GestureVerse uses a hybrid recognition model that combines multiple layers of motion understanding.

### 1. Landmark detection layer

The app reads body information from local MediaPipe pipelines:

```text
Camera Frame
   ↓
MediaPipe Hands
   ↓
MediaPipe Pose
   ↓
Optional MediaPipe Face Mesh
   ↓
Normalized Landmark Coordinates
```

### 2. Geometric gesture layer

Static poses are identified using distances, angles, and relative landmark positions.

Examples:

- Closed fist
- Open palm
- Crossed hands
- Raised fist
- Two open palms
- Arms opened outward
- Cupped hands

### 3. Temporal motion layer

Motion gestures are recognized from recent movement history rather than one frame alone.

Examples:

- Swipe left
- Swipe right
- Fast double swipe
- Circular hand movement
- Downward punch
- Hands together then push
- Pinch and rotate

### 4. State machine layer

Some powers need beginning, holding, charging, release, and cooldown states.

Example: **Power Aura Charge**

```text
Both fists detected
   ↓
Start aura
   ↓
Hold fists
   ↓
Charge meter increases
   ↓
Open hands
   ↓
Ultimate release burst
   ↓
Cooldown
```

This makes the experience feel intentional, cinematic, and interactive rather than random.

---

## 🎬 Cinematic Effect Library

### 🦸 Superhero powers

| Power | Gesture | Motion Feeling |
|---|---|---|
| Energy Shield | Crossed hands | Defensive force-field lock |
| Repulsor Blast | Palm thrust | Forward energy impact |
| Thunder Strike | Raised fist | Sky-to-ground lightning strike |
| Ground Shockwave | Downward punch | Radial impact wave |

### ⚡ Anime powers

| Power | Gesture | Motion Feeling |
|---|---|---|
| Power Aura Charge | Both fists | Charging energy aura |
| Energy Slash | Swipe left/right | Directional blade trail |
| Ultimate Energy Beam | Hands together then push | Focused beam release |
| Teleport Afterimage | Fast double swipe | Speed clone / afterimage trail |

### 🔮 Magic powers

| Power | Gesture | Motion Feeling |
|---|---|---|
| Mystic Portal | Circular hand motion | Portal ring opening |
| Magic Rune Circle | Pinch and rotate | Arcane symbol formation |
| Phoenix Energy Bird | Arms opened outward | Flying energy creature |
| Telekinetic Orb | Pinch and hold | Floating controllable energy ball |

### 🌊 Elemental powers

| Power | Gesture | Motion Feeling |
|---|---|---|
| Fireball | Cupped hands | Flame orb build-up |
| Ice Blast | Two open palms | Cold burst and shards |
| Wind Vortex | Two-hand circular motion | Spinning air tunnel |

### 😎 Face effects

Face effects are optional and disabled automatically in Eco mode.

- Glowing eyes
- Energy face mask
- Head-following crown/aura

---

## 🎞️ Motion Design System

GestureVerse uses a futuristic cinematic interface inspired by holographic control rooms, energy fields, and high-contrast sci-fi dashboards.

### Visual language

- Deep black and dark navy base
- Electric cyan highlights
- Violet secondary glow
- Fire and danger accents for elemental effects
- Glassmorphism panels
- Holographic HUD rings
- Particle trails
- Radial glow fields
- Smooth transitions
- Animated landing energy disc

### Interface motion

- Floating logo mark
- Rotating energy rings
- Pulsing hand aura
- Hover-reactive effect cards
- Confidence meter animation
- Charge meter animation
- Toast entry animation
- Modal fade and blur transitions
- Camera-stage screen shake during impact powers

---

## 🏗️ System Architecture

```text
GestureVerse FX Studio
│
├── Camera Layer
│   ├── Webcam permission
│   ├── Device selection
│   ├── Mirrored preview
│   └── Orientation modes
│
├── Vision Layer
│   ├── MediaPipe Hands
│   ├── MediaPipe Pose
│   └── MediaPipe Face Mesh
│
├── Gesture Intelligence Layer
│   ├── Landmark geometry
│   ├── Temporal motion history
│   ├── Hold/release states
│   ├── Confidence smoothing
│   └── Cooldown control
│
├── VFX Layer
│   ├── Canvas compositing
│   ├── Procedural particles
│   ├── Energy trails
│   ├── Shockwaves
│   ├── Portals
│   ├── Face overlays
│   └── Screen shake
│
├── Audio Layer
│   ├── Ambient track
│   ├── Uploaded music
│   ├── Activation sounds
│   └── Impact sounds
│
├── Capture Layer
│   ├── Screenshot engine
│   ├── Video recorder
│   ├── Capture gallery
│   └── Local export
│
├── Storage Layer
│   ├── Local settings
│   ├── Effect preferences
│   └── Background preferences
│
├── PWA Layer
│   ├── Manifest
│   ├── Service worker
│   └── Offline asset cache
│
└── Android Layer
    ├── Capacitor wrapper
    ├── Android 10+ configuration
    ├── Native save/share
    └── APK build pipeline
```

---

## 🛠️ Technology Stack

| Area | Technology |
|---|---|
| Frontend | React 19 |
| Language | TypeScript 5.9 |
| Build tool | Vite 8 |
| Styling | CSS custom properties + responsive CSS |
| Icons | Lucide React |
| Hand tracking | MediaPipe Hands |
| Pose tracking | MediaPipe Pose |
| Face tracking | MediaPipe Face Mesh |
| Visual effects | Canvas 2D procedural rendering |
| Audio | Web Audio API + HTML audio |
| Recording | MediaRecorder API |
| Storage | LocalStorage |
| PWA | Vite PWA plugin |
| Android wrapper | Capacitor |
| Android target | Android 10+ |
| Deployment | GitHub Pages + GitHub Actions |

---

## 📁 Project Structure

```text
GestureVerse-FX-Studio/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── android/
│   └── Capacitor Android project
│
├── branding/
│   └── Logo and splash assets
│
├── public/
│   ├── audio/
│   │   └── ambient.wav
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── mediapipe/
│       ├── hands/
│       ├── pose/
│       └── face_mesh/
│
├── src/
│   ├── components/
│   │   ├── ControlsPanel.tsx
│   │   ├── EffectsPanel.tsx
│   │   ├── GalleryModal.tsx
│   │   ├── Landing.tsx
│   │   ├── LogoMark.tsx
│   │   ├── StudioCanvas.tsx
│   │   └── TutorialModal.tsx
│   │
│   ├── data/
│   │   └── effects.ts
│   │
│   ├── gestures/
│   │   └── GestureEngine.ts
│   │
│   ├── hooks/
│   │   └── useCamera.ts
│   │
│   ├── lib/
│   │   ├── assets.ts
│   │   ├── AudioEngine.ts
│   │   ├── math.ts
│   │   └── storage.ts
│   │
│   ├── recording/
│   │   └── StudioRecorder.ts
│   │
│   ├── styles/
│   │   └── index.css
│   │
│   ├── types/
│   │   └── studio.ts
│   │
│   ├── vfx/
│   │   └── EffectEngine.ts
│   │
│   ├── vision/
│   │   └── VisionEngine.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── capacitor.config.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Advanced Project Workflow

### Development workflow

```text
Install dependencies
   ↓
Start Vite development server
   ↓
Allow camera access
   ↓
Test gestures in live studio
   ↓
Tune effect settings
   ↓
Create production build
```

### Gesture-to-effect workflow

```text
Camera frame captured
   ↓
MediaPipe detects landmarks
   ↓
Gesture engine analyzes geometry + motion
   ↓
Gesture confidence is calculated
   ↓
Matching effect is selected
   ↓
Effect engine triggers animation
   ↓
Audio engine plays synchronized sound
   ↓
Recorder captures composed result
```

### Deployment workflow

```text
Push source code to GitHub main branch
   ↓
GitHub Actions starts deploy.yml
   ↓
Node.js 22 environment is prepared
   ↓
Dependencies are installed
   ↓
Lint validation runs
   ↓
Vite builds production assets
   ↓
GitHub Pages artifact is uploaded
   ↓
Public website is updated
```

### Android workflow

```text
Build web application
   ↓
Capacitor sync copies web assets
   ↓
Android Studio opens native project
   ↓
Gradle builds debug APK
   ↓
APK installs on Android 10+ device
```

---

## 💻 Run Locally

### Requirements

- Node.js 22 or newer
- Chrome or Edge browser
- Webcam

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

Open the URL printed in the terminal, usually:

```text
http://localhost:5173
```

---

## 🧪 Useful Commands

```bash
npm run dev          # Start local development server
npm run lint         # Run ESLint validation
npm run build        # Type-check and create production build
npm run preview      # Preview production build locally
npm run check        # Run lint + production build
npm run cap:sync     # Build and sync web assets into Android
npm run android:open # Open Android project in Android Studio
npm run android:apk  # Build debug APK using local Android toolchain
```

---

## 🌐 Deploy to GitHub Pages

This project includes a ready-made GitHub Actions workflow:

```text
.github/workflows/deploy.yml
```

After the repository is published to GitHub:

1. Open the repository on GitHub.
2. Go to **Settings**.
3. Open **Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Push to the `main` branch.
6. Open the **Actions** tab and wait for the deployment to turn green.
7. Go back to **Settings → Pages** and open the live website URL.

Expected public URL format:

```text
https://YOUR-GITHUB-USERNAME.github.io/GestureVerse-FX-Studio/
```

---

## 📱 Android APK Build

### Requirements

- Android Studio
- Android SDK installed
- JDK 21
- Android 10/API 29 or newer device
- USB debugging enabled for direct phone install

### Build steps

```bash
npm install
npm run cap:sync
npx cap open android
```

Inside Android Studio:

```text
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

Default APK output path:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎮 Demo Flow

For the best college demonstration, follow this sequence:

1. Launch the app.
2. Enter **FX Studio**.
3. Allow camera permission.
4. Select **Balanced** mode.
5. Show the hand skeleton and tracking status.
6. Cross hands to trigger **Energy Shield**.
7. Hold both fists to charge **Power Aura**.
8. Release fists to show the ultimate burst.
9. Swipe left/right to trigger **Energy Slash**.
10. Enable glowing eyes.
11. Change background to Blur mode.
12. Record a short scene.
13. Open Capture Vault.
14. Download/export the result.
15. Mention that the same source can run as website, PWA, and Android APK.

---

## 🚦 Performance Modes

| Mode | Best For | Behaviour |
|---|---|---|
| Eco | Older laptops | Lower detection load, reduced particles, face effects off |
| Balanced | Most laptops | Recommended default for smooth demos |
| Cinematic | Stronger devices | Higher visual density and stronger effects |

### Recognition tips

- Use bright front lighting.
- Keep both hands inside the camera frame.
- Avoid a very cluttered background.
- Stand far enough back for shoulders to be visible.
- Perform motion gestures clearly and deliberately.

---

## 🔐 Privacy-first Design

GestureVerse is built with a local-first philosophy.

- No login required
- No cloud AI API
- No remote video upload
- No analytics tracker
- Camera frames are processed on the device
- Settings are stored locally
- Captures remain local unless the user exports them

---

## 🧩 Important Notes

- Webcam access requires `localhost` during development or HTTPS after deployment.
- Gesture accuracy depends on lighting, camera quality, and device performance.
- Recording format depends on browser or Android WebView codec support.
- Android MP4 export is attempted when supported; WebM is used as a fallback.
- The capture vault is session-based, so export important captures before closing the app.

---

## 🛣️ Future Scope

- Custom gesture training
- AI background removal
- Multiplayer gesture battles
- Timeline-based cinematic editor
- Cloud gallery with optional login
- Voice-command effect activation
- More advanced shader-style effects
- Mobile-optimized gesture presets
- Creator mode for custom effect packs
- Leaderboard or challenge mode

---

## 🏆 Why This Project Stands Out

Most webcam gesture projects stop at detection. GestureVerse goes further by combining:

- Real-time AI tracking
- Gesture state machines
- Cinematic animation design
- Audio-reactive feedback
- Local recording
- Offline PWA support
- Android APK packaging
- GitHub Pages deployment
- Futuristic UI/UX
- Privacy-first local processing

That makes it more than a demo. It becomes a complete interactive motion-powered creative studio.

---

## 👤 Creator

**Darshan Paapani**

---

<div align="center">

## ✨ GestureVerse FX Studio

### **Control the impossible. Record the cinematic. Own the motion.**

</div>
