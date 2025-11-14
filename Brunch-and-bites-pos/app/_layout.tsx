import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Permitir orientación libre para mejorar la responsividad
    async function setupApp() {
      try {
        await ScreenOrientation.unlockAsync();
      } catch (err) {
        console.warn('Failed to unlock orientation:', err);
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
