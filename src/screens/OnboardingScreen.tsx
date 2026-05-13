import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { completeOnboarding } from '../hooks/useOnboardingStorage';
import OnboardingSlide from '../components/OnboardingSlide';
import OnboardingGoalSlider from '../components/OnboardingGoalSlider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface SlideData {
  type: 'slide' | 'goal';
  emoji: string;
  title: string;
  description: string;
}

const slides: SlideData[] = [
  {
    type: 'slide',
    emoji: '📱',
    title: 'Beat Screen Time',
    description: 'Challenge friends to put down their phones and stay focused together.',
  },
  {
    type: 'slide',
    emoji: '⚔️',
    title: 'Win Duels',
    description: 'Compete in Focus Sprints, Weekly Wars, and Quick Duels.',
  },
  {
    type: 'slide',
    emoji: '🔥',
    title: 'Build Streaks',
    description: 'Track your progress and climb the leaderboard.',
  },
  {
    type: 'goal',
    emoji: '⏱️',
    title: 'Set Your Daily Goal',
    description: 'How many hours of screen time do you want to limit yourself to each day?',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(4);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { updateDailyGoal } = useAuth();

  const handleNext = useCallback(async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      // Complete onboarding
      setLoading(true);
      try {
        // Save daily goal to user profile
        const success = await updateDailyGoal(dailyGoal);
        if (success) {
          // Mark onboarding as complete
          await completeOnboarding();
          // Navigate to Home (Tabs)
          navigation.replace('Tabs');
        }
      } catch (error) {
        console.error('Error completing onboarding:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [currentIndex, dailyGoal, updateDailyGoal, navigation]);

  const handleSkip = useCallback(async () => {
    setLoading(true);
    try {
      // Set default goal
      const success = await updateDailyGoal(4);
      if (success) {
        await completeOnboarding();
        navigation.replace('Tabs');
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    } finally {
      setLoading(false);
    }
  }, [updateDailyGoal, navigation]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    viewAreaCoveragePercentThreshold: 50,
  };

  const renderSlide = useCallback(({ item, index }: { item: SlideData; index: number }) => {
    return (
      <View style={[styles.slide, { width }]}>
        {item.type === 'goal' ? (
          <OnboardingGoalSlider value={dailyGoal} onChange={setDailyGoal} />
        ) : (
          <OnboardingSlide emoji={item.emoji} title={item.title} description={item.description} />
        )}
      </View>
    );
  }, [dailyGoal]);

  const renderDot = (index: number) => {
    return (
      <View
        key={index}
        style={[
          styles.dot,
          index === currentIndex ? styles.dotActive : styles.dotInactive,
        ]}
      />
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;
  const buttonText = isLastSlide ? 'Get Started' : 'Next';
  const showSkip = !isLastSlide;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} disabled={loading}>
          <Text style={[styles.skipText, showSkip ? {} : styles.skipTextHidden]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={width}
        decelerationRate="fast"
        scrollEventThrottle={16}
        style={styles.flatList}
        contentContainerStyle={{ height: '100%' }}
        snapToAlignment="start"
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dots}>{slides.map((_, index) => renderDot(index))}</View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Setting up...' : buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    height: 35,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  skipTextHidden: {
    opacity: 0,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  dotInactive: {
    backgroundColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
