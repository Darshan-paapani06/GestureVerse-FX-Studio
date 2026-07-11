import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.darshanpaapani.gestureverse',
  appName: 'GestureVerse FX Studio',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false }
}

export default config
