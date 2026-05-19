import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { checkOnboardingStatus } from '../hooks/useOnboardingStorage';
import { ErrorBoundary } from '../components/ErrorBoundary';
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
import AccessibilityGuideScreen from '../screens/AccessibilityGuideScreen';

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
  AccessibilityGuideScreen: undefined;
};

const tabs = [
  { name: 'Home', component: HomeScreen, icon: '🎯' },
  { name: 'Leaderboard', component: LeaderboardScreen, icon: '🏆' },
  { name: 'My Duels', component: MyDuelsScreen, icon: '⚔️' },
  { name: 'Friends', component: FriendsScreen, icon: '👥' },
  { name: 'Badges', component: BadgesScreen, icon: '🏅' },
  { name: 'Profile', component: ProfileScreen, icon: '👤' },
];

function renderLoadingState(): React.JSX.Element {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function createTabScreen(tab: typeof tabs[0]): React.JSX.Element {
  return (
    <Tab.Screen
      key={tab.name}
      name={tab.name}
      component={tab.component}
      options={{
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{tab.icon}</Text>,
      }}
    />
  );
}

function TabNavigator(): React.JSX.Element {
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
      {tabs.map(createTabScreen)}
    </Tab.Navigator>
  );
}

interface ScreenConfig {
  name: string;
  component: any;
  options?: any;
}

const stackScreens: ScreenConfig[] = [
  { name: 'Onboarding', component: OnboardingScreen as React.ComponentType<any>, options: { headerShown: false } },
  { name: 'Tabs', component: TabNavigator, options: { headerShown: false } },
  { name: 'FocusSession', component: FocusSessionScreen as React.ComponentType<any>, options: { title: 'Focus Session', headerShown: false } },
  { name: 'CreateDuel', component: CreateDuelScreen as React.ComponentType<any>, options: { title: 'Create Duel' } },
  { name: 'SelectFriend', component: SelectFriendScreen as React.ComponentType<any>, options: { title: 'Select Opponent' } },
  { name: 'ConfigureDuel', component: ConfigureDuelScreen as React.ComponentType<any>, options: { title: 'Configure Duel' } },
  { name: 'ReviewDuel', component: ReviewDuelScreen as React.ComponentType<any>, options: { title: 'Review Challenge' } },
  { name: 'DuelChallenge', component: DuelChallengeScreen as React.ComponentType<any>, options: { title: 'Duel Challenge' } },
  { name: 'DuelResults', component: DuelResultsScreen as React.ComponentType<any>, options: { title: 'Duel Results' } },
  { name: 'DuelHistory', component: DuelHistoryScreen as React.ComponentType<any>, options: { title: 'Duel History' } },
  { name: 'BragCard', component: BragCardScreen as React.ComponentType<any>, options: { title: 'Share Stats' } },
  { name: 'ScreenTimeTest', component: ScreenTimeTestScreen as React.ComponentType<any>, options: { title: 'Screen Time Test' } },
  { name: 'StreakCalendar', component: StreakCalendarScreen as React.ComponentType<any>, options: { title: 'Streak Calendar' } },
  { name: 'Notifications', component: NotificationsScreen as React.ComponentType<any>, options: { title: 'Notifications', headerShown: false } },
  { name: 'CreateChallengeScreen', component: CreateChallengeScreen as React.ComponentType<any>, options: { title: 'Create Challenge' } },
  { name: 'ActiveChallengesScreen', component: ActiveChallengesScreen as React.ComponentType<any>, options: { title: 'My Challenges' } },
  { name: 'ChallengeDetailScreen', component: ChallengeDetailScreen as React.ComponentType<any>, options: { title: 'Challenge Details' } },
  { name: 'ChallengeResultsScreen', component: ChallengeResultsScreen as React.ComponentType<any>, options: { title: 'Challenge Results' } },
  { name: 'CategoryStats', component: CategoryStatsScreen as React.ComponentType<any>, options: { title: 'Category Stats' } },
  { name: 'AccessibilityGuideScreen', component: AccessibilityGuideScreen as React.ComponentType<any>, options: { title: 'Accessibility Setup', headerShown: false } },
];

function createStackScreen(screen: ScreenConfig): React.JSX.Element {
  return (
    <Stack.Screen
      key={screen.name}
      name={screen.name as any}
      component={screen.component}
      options={screen.options}
    />
  );
}

function createCommonScreenOptions() {
  return {
    headerStyle: { backgroundColor: COLORS.background },
    headerTintColor: COLORS.text,
  };
}

function MainNavigator(hasCompletedOnboarding: boolean): React.JSX.Element {
  const initialRouteName = hasCompletedOnboarding ? 'Tabs' : 'Onboarding';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName as any}
      screenOptions={createCommonScreenOptions()}
    >
      {stackScreens.map(createStackScreen)}
    </Stack.Navigator>
  );
}

function AppContent(): React.JSX.Element {
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
    return renderLoadingState();
  }

  if (!session) {
    return <AuthScreen />;
  }

  return MainNavigator(hasCompletedOnboarding ?? false);
}

export default function AppNavigator(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});