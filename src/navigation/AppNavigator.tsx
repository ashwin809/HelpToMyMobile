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
  ResetPasswordScreen,
  AIAssistantScreen,
  ChatListScreen,
  ChatThreadScreen,
  NotificationsScreen,
  BlockedUsersScreen,
  AboutUsScreen,
  FeatureHubScreen,
  StudyCirclesScreen,
  OfficeHoursScreen,
  OpportunitiesScreen,
  LearningGoalsScreen,
  CampusQAScreen,
  ResourceLibraryScreen,
  ProfileSetupScreen,
  MentorProfileScreen,
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
      initialRouteName={user ? (user.profileSetupComplete === false ? 'ProfileSetup' : 'Main') : 'Login'}
      screenOptions={{ headerShown: false }}
    >
      {user ? (
        <>
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          <Stack.Screen name="Main" component={PublicTabNavigator} />
          <Stack.Screen name="AboutUs" component={AboutUsScreen} />
          <Stack.Screen name="FeatureHub" component={FeatureHubScreen} />
          <Stack.Screen name="StudyCircles" component={StudyCirclesScreen} />
          <Stack.Screen name="OfficeHours" component={OfficeHoursScreen} />
          <Stack.Screen name="Opportunities" component={OpportunitiesScreen} />
          <Stack.Screen name="LearningGoals" component={LearningGoalsScreen} />
          <Stack.Screen name="CampusQA" component={CampusQAScreen} />
          <Stack.Screen name="ResourceLibrary" component={ResourceLibraryScreen} />
          <Stack.Screen name="HelpDetail" component={HelpDetailScreen} />
          <Stack.Screen name="CreateHelpRequest" component={CreateHelpRequestScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="MentorProfile" component={MentorProfileScreen} />
          <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
          <Stack.Screen name="ChatList" component={ChatListScreen} />
          <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
});
