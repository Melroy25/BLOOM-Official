# 🌱 BLOOM — Mindful Student Growth & Wellness Platform

> **Grow at your own pace.**

BLOOM is a student wellness, productivity, emotional self-care, and global community mobile application built with **React Native**, **Expo SDK 58**, **Expo Router**, and **TypeScript**.

Official Repository: [https://github.com/Melroy25/BLOOM-Official.git](https://github.com/Melroy25/BLOOM-Official.git)

---

## ✨ Features & Architecture

### 1. 🔐 Authentication & Personalized Onboarding
- **Firebase Authentication**: Email & password authentication, Google Sign-In with popup/credential integration, password reset, and session persistence via AsyncStorage.
- **Onboarding Flow**: Guided multi-step emotional and academic survey syncing directly to Firestore user profiles.

### 2. 🏠 Mindful Dashboard & Daily Goals
- **Personalized Header**: Dynamic time-based greetings (*"Good morning / afternoon / evening"*), clean profile display, settings shortcut, and daily botanical quotes.
- **Today's Overview**: 4 interactive snapshot cards (Tasks Done, In-App Screen Time, SOS Signal, Wellness Reports).
- **Quick Access**: Fast shortcuts to Heal Bubble, AI Companion, Journal, and Focus Mode.
- **Daily Goals & Habits**: Live Firestore-backed to-do checklist with optimistic updates, completion progress bar, task creation, editing, and deletion.

### 3. 🌿 Heal Zone & Heal Bubble
- **Heal Bubble**: Guided breathing sphere, relaxation timer, and thought-release exercise with bursted thought reflections.
- **Emotional Mood Logger**: 8 mood check-ins (*Happy, Excited, Calm, Neutral, Tired, Anxious, Sad, Stressed*) with notes and timestamps.
- **SVG Mood Trends Chart**: Dynamic Catmull-Rom Bezier line graph comparing 7-day and 30-day emotional wellness trajectories.

### 4. 🎵 Music Therapy & Persistent Player
- **Soundscapes & Frequencies**: Ambient nature sounds, singing bowl, wind chimes, lo-fi beats, and focus frequencies.
- **Persistent Bottom Player**: Uninterrupted audio playback across the entire app with play/pause, scrub bar, and track controls.
- **Custom Playlists**: Create, edit, and organize custom playlists stored locally and persisted cross-platform (Web & Native via `userMusicStorage`).
- **Audio Uploads**: Upload and listen to personal relaxation audio files directly in the app.

### 5. 👥 Bloom Circle & Global Community
- **Global Trends**: Discover trending wellness challenges, community reflections, and global posts with likes and comment threads.
- **Friends & Circles**: Peer connection system with friend requests and private chats.
- **Challenges Hub**: Join public wellness challenges, track consecutive check-in streaks, view participant leaderboards, and create new challenges.

### 6. ✨ AI Mindful Companion
- **Adaptive Persona**: Mindful conversational assistant with emotion detection (comforting, encouraging, reflective).
- **Conversation Persistence**: Multi-session conversation history stored securely in Cloud Firestore with Cloudflare Worker proxy integration.

### 7. 🛡️ Safety & Productivity Tools
- **🚨 SOS Emergency Signal**: Rapid access to verified crisis hotlines, emergency contact notifications, and GPS location fetching.
- **⏱️ Focus Mode & Screen Time**: Customizable focus timers, session logging, and native/in-app screen time usage metrics.
- **📝 Mindful Journal**: Private diary for thought processing with emotion tags and instant search.
- **📊 Wellness Reports**: Comprehensive progress summaries, consistency statistics, and shareable growth metrics.
- **📁 Documents**: Document organization system with rich text formatting, categories, and pinning.
- **🎮 Mindful Games**: Destress mini-games including *Memory Match* and *Word Detective* with difficulty selectors.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [React Native 0.88](https://reactnative.dev/) & [Expo SDK 58](https://expo.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled) |
| **Navigation** | [Expo Router v58](https://docs.expo.dev/router/introduction/) (File-based routing) |
| **Backend & Database** | [Firebase v13](https://firebase.google.com/) (Auth, Cloud Firestore, Cloud Storage) |
| **Audio Engine** | [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/) & [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) |
| **Design & UI** | Custom design tokens (Colors, Typography, Spacing, Shadows), [Lucide Icons](https://lucide.dev/), [React Native SVG](https://github.com/software-mansion/react-native-svg) |
| **Storage** | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Expo Go](https://expo.dev/go) app installed on your physical mobile device (iOS/Android), or an Android Emulator / iOS Simulator.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Melroy25/BLOOM-Official.git
   cd BLOOM-Official
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment template to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase credentials in `.env` (or use defaults in `services/firebase.ts` for development):
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Running the App

- **Start Metro Development Server:**
  ```bash
  npx expo start
  ```
- **Run on Android Emulator / Device:**
  ```bash
  npm run android
  ```
- **Run on iOS Simulator:**
  ```bash
  npm run ios
  ```
- **Run in Web Browser:**
  ```bash
  npm run web
  ```

---

## 🧪 Code Quality & Validation

- **Typecheck:**
  ```bash
  npx tsc --noEmit
  ```
- **Project Health:**
  ```bash
  npx expo-doctor
  ```

---

## 🔒 Security & Privacy

- Client configurations are safely scoped via `.env.example` and `services/firebase.ts`.
- Firebase security rules (`firestore.rules`) enforce granular user ownership and authenticated read/write boundaries across all collections.
- Secrets, credentials, and local `.env` files are strictly excluded via `.gitignore`.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
