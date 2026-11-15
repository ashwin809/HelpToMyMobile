import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PublicTabParamList } from './types';
import { colors } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HomeScreen,
  CommunityFeedScreen,
  MyNetworkScreen,
  MentorsScreen,
  ProfileScreen,
} from '../screens';

const Tab = createBottomTabNavigator<PublicTabParamList>();

export function PublicTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slateMedium,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityFeedScreen}
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Network"
        component={MyNetworkScreen}
        options={{
          title: 'Network',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Mentors"
        component={MentorsScreen}
        options={{
          title: 'Mentors',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
