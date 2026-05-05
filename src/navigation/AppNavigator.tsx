import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { COLORS } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const tabs = [
  { name: 'Home', component: HomeScreen, icon: '🎯' },
  { name: 'Leaderboard', component: LeaderboardScreen, icon: '🏆' },
  { name: 'Friends', component: FriendsScreen, icon: '👥' },
  { name: 'Profile', component: ProfileScreen, icon: '👤' },
];

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
        }}
      >
        {tabs.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>{tab.icon}</Text>,
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
