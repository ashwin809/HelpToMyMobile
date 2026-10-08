import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { PublicTabNavigator } from './BottomTabNavigator';
import {
  LoginScreen,
  RegisterScreen,
  HelpDetailScreen,
  CreateHelpRequestScreen,
  EditProfileScreen,
  ForgotPasswordScreen,
  AIAssistantScreen,
  ChatListScreen,
  ChatThreadScreen,
  NotificationsScreen,
  BlockedUsersScreen,
} from '../screens';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={user ? 'authenticated' : 'unauthenticated'}
      initialRouteName={user ? 'Main' : 'Login'}
      screenOptions={{ headerShown: false }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={PublicTabNavigator} />
          <Stack.Screen name="HelpDetail" component={HelpDetailScreen} />
          <Stack.Screen name="CreateHelpRequest" component={CreateHelpRequestScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
          <Stack.Screen name="ChatList" component={ChatListScreen} />
          <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
});
