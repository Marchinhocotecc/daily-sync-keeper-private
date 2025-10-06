import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4f3c008e74bb4a68a50f25e03e9e29fd',
  appName: 'LifeSync',
  webDir: 'dist',
  server: {
    url: 'https://4f3c008e-74bb-4a68-a50f-25e03e9e29fd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#005f99',
      showSpinner: false
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#005f99'
    },
    Preferences: {}, // Ensure Preferences plugin is enabled
    LocalNotifications: {} // Enable Local Notifications plugin
  }
};

export default config;