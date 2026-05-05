import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { COLORS } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FocusSessionScreen from '../screens/FocusSessionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Tabs: undefined;
  FocusSession: {
    duration: number;
  };
};

const tabs = [
  { name: 'Home', component: HomeScreen, icon: '🎯' },
  { name: 'Leaderboard', component: LeaderboardScreen, icon: '🏆' },
  { name: 'Friends', component: FriendsScreen, icon: '👥' },
  { name: 'Profile', component: ProfileScreen, icon: '👤' },
];

function TabNavigator() {
  return (
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
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FocusSession"
          component={FocusSessionScreen as React.ComponentType<any>}
          options={{ title: 'Focus Session', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
