import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { initializeDatabase } from './lib/database.refactor';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Permitir orientación libre para mejorar la responsividad
    async function setupApp() {
      try {
        // Initialize database first
        await initializeDatabase();
        await ScreenOrientation.unlockAsync();
      } catch (err) {
        console.warn('Failed to setup app:', err);
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    }
    
    setupApp();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
