import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppColors, AppTheme } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider value={AppTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="invoice-preview" options={{ title: 'Invoice Preview' }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Invoice Help', headerTintColor: AppColors.cyan }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
