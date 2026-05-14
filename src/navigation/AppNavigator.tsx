import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { checkOnboardingStatus } from '../hooks/useOnboardingStorage';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import FriendsScreen from '../screens/FriendsScreen';
import BadgesScreen from '../screens/BadgesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FocusSessionScreen from '../screens/FocusSessionScreen';
import CreateDuelScreen from '../screens/CreateDuelScreen';
import SelectFriendScreen from '../screens/SelectFriendScreen';
import ConfigureDuelScreen from '../screens/ConfigureDuelScreen';
import ReviewDuelScreen from '../screens/ReviewDuelScreen';
import DuelChallengeScreen from '../screens/DuelChallengeScreen';
import DuelResultsScreen from '../screens/DuelResultsScreen';
import DuelHistoryScreen from '../screens/DuelHistoryScreen';
import BragCardScreen from '../screens/BragCardScreen';
import MyDuelsScreen from '../screens/MyDuelsScreen';
import { ScreenTimeTestScreen } from '../screens/ScreenTimeTestScreen';
import StreakCalendarScreen from '../screens/StreakCalendarScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';
import ActiveChallengesScreen from '../screens/ActiveChallengesScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import ChallengeResultsScreen from '../screens/ChallengeResultsScreen';
import CategoryStatsScreen from '../screens/CategoryStatsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Tabs: undefined;
  Onboarding: undefined;
  FocusSession: {
    duration: number;
  };
  CreateDuel: {
    opponentId?: string;
    duelType?: string;
  };
  SelectFriend: undefined;
  ConfigureDuel: {
    selectedFriendIds: string[];
  };
  ReviewDuel: {
    selectedFriendIds: string[];
    duelType: string;
    durationHours: number;
    bannedApps: string[];
  };
  DuelChallenge: {
    duelId: string;
    opponentId: string;
  };
  DuelResults: {
    duelId: string;
  };
  DuelHistory: undefined;
  BragCard: undefined;
  ScreenTimeTest: undefined;
  StreakCalendar: undefined;
  Notifications: undefined;
  CreateChallengeScreen: { friendId?: string };
  ActiveChallengesScreen: { filter?: 'pending' | 'active' | 'completed' };
  ChallengeDetailScreen: { challengeId: string };
  ChallengeResultsScreen: { challengeId: string };
  CategoryStats: undefined;
};

const tabs = [
  { name: 'Home', component: HomeScreen, icon: '🎯' },
  { name: 'Leaderboard', component: LeaderboardScreen, icon: '🏆' },
  { name: 'My Duels', component: MyDuelsScreen, icon: '⚔️' },
  { name: 'Friends', component: FriendsScreen, icon: '👥' },
  { name: 'Badges', component: BadgesScreen, icon: '🏅' },
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
  const { session, loading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (session) {
        const completed = await checkOnboardingStatus();
        setHasCompletedOnboarding(completed);
      }
      setCheckingOnboarding(false);
    };

    checkOnboarding();
  }, [session]);

  if (loading || checkingOnboarding) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthScreen />
      ) : (
        <Stack.Navigator
          initialRouteName={hasCompletedOnboarding ? 'Tabs' : 'Onboarding'}
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.text,
          }}
        >
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen as React.ComponentType<any>}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="FocusSession"
            component={FocusSessionScreen as React.ComponentType<any>}
            options={{ title: 'Focus Session', headerShown: false }}
          />
          <Stack.Screen
            name="CreateDuel"
            component={CreateDuelScreen as React.ComponentType<any>}
            options={{ title: 'Create Duel' }}
          />
          <Stack.Screen
            name="SelectFriend"
            component={SelectFriendScreen as React.ComponentType<any>}
            options={{ title: 'Select Opponent' }}
          />
          <Stack.Screen
            name="ConfigureDuel"
            component={ConfigureDuelScreen as React.ComponentType<any>}
            options={{ title: 'Configure Duel' }}
          />
          <Stack.Screen
            name="ReviewDuel"
            component={ReviewDuelScreen as React.ComponentType<any>}
            options={{ title: 'Review Challenge' }}
          />
          <Stack.Screen
            name="DuelChallenge"
            component={DuelChallengeScreen as React.ComponentType<any>}
            options={{ title: 'Duel Challenge' }}
          />
          <Stack.Screen
            name="DuelResults"
            component={DuelResultsScreen as React.ComponentType<any>}
            options={{ title: 'Duel Results' }}
          />
          <Stack.Screen
            name="DuelHistory"
            component={DuelHistoryScreen as React.ComponentType<any>}
            options={{ title: 'Duel History' }}
          />
          <Stack.Screen
            name="BragCard"
            component={BragCardScreen as React.ComponentType<any>}
            options={{ title: 'Share Stats' }}
          />
          <Stack.Screen
            name="ScreenTimeTest"
            component={ScreenTimeTestScreen as React.ComponentType<any>}
            options={{ title: 'Screen Time Test' }}
          />
          <Stack.Screen
            name="StreakCalendar"
            component={StreakCalendarScreen as React.ComponentType<any>}
            options={{ title: 'Streak Calendar' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen as React.ComponentType<any>}
            options={{ title: 'Notifications', headerShown: false }}
          />
          <Stack.Screen
            name="CreateChallengeScreen"
            component={CreateChallengeScreen as React.ComponentType<any>}
            options={{ title: 'Create Challenge' }}
          />
          <Stack.Screen
            name="ActiveChallengesScreen"
            component={ActiveChallengesScreen as React.ComponentType<any>}
            options={{ title: 'My Challenges' }}
          />
          <Stack.Screen
            name="ChallengeDetailScreen"
            component={ChallengeDetailScreen as React.ComponentType<any>}
            options={{ title: 'Challenge Details' }}
          />
          <Stack.Screen
            name="ChallengeResultsScreen"
            component={ChallengeResultsScreen as React.ComponentType<any>}
            options={{ title: 'Challenge Results' }}
          />
          <Stack.Screen
            name="CategoryStats"
            component={CategoryStatsScreen as React.ComponentType<any>}
            options={{ title: 'Category Stats' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
