import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation';
import { RootStackParamList } from './src/navigation/types';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    const openNotification = (response: { notification: { request: { content: { data: Record<string, unknown> } } } }) => {
      const data = response.notification.request.content.data;
      let attempts = 0;
      const navigateWhenReady = () => {
        if (!navigationRef.isReady()) {
          if (attempts++ < 20) setTimeout(navigateWhenReady, 100);
          return;
        }
        if (typeof data.threadId === 'string') {
          navigationRef.navigate('ChatThread', {
            threadId: data.threadId,
            participantName: typeof data.participantName === 'string' ? data.participantName : 'Message',
          });
        } else {
          navigationRef.navigate('Notifications');
        }
      };
      navigateWhenReady();
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(openNotification);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openNotification(response);
    }).catch((error) => console.warn('Could not read the opened notification:', error));
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
