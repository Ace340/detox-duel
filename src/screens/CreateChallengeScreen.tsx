import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import { useGroupChallenges } from '../hooks/useGroupChallenges';
import type { ChallengeType } from '../types/groupChallenge';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

// Navigation params for CreateChallengeScreen
export type CreateChallengeScreenParams = undefined;

type Props = NativeStackScreenProps<RootStackParamList, 'CreateChallengeScreen'>;

// Challenge type options with emojis
const CHALLENGE_TYPES: Array<{ type: ChallengeType; label: string; emoji: string }> = [
  { type: 'lowest_screen_time', label: 'Lowest Screen Time', emoji: '📱' },
  { type: 'most_focus_sessions', label: 'Most Focus Sessions', emoji: '🧠' },
  { type: 'longest_streak', label: 'Longest Streak', emoji: '🔥' },
];

// Duration options (1-7 days)
const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function CreateChallengeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { friends, loading: friendsLoading, loadFriends } = useFriends(user?.id || '');
  const { createChallenge, loading: creating, error: createError } = useGroupChallenges();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState<ChallengeType>('lowest_screen_time');
  const [durationDays, setDurationDays] = useState(7);
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [participantsError, setParticipantsError] = useState('');
  const [maxParticipantsError, setMaxParticipantsError] = useState('');

  // Load friends on mount
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle friend selection
  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      // Clear error if at least 2 selected
      if (newSet.size >= 2) {
        setParticipantsError('');
      }
      return newSet;
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;

    // Title validation
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError('');
    }

    // Participants validation (at least 2 including creator)
    const totalParticipants = selectedFriendIds.size + 1; // +1 for creator
    if (totalParticipants < 2) {
      setParticipantsError('Select at least 1 friend (2 participants minimum)');
      isValid = false;
    } else {
      setParticipantsError('');
    }

    // Max participants validation
    const maxPartNum = parseInt(maxParticipants, 10);
    if (!maxParticipants || isNaN(maxPartNum) || maxPartNum < 2) {
      setMaxParticipantsError('Minimum 2 participants required');
      isValid = false;
    } else if (maxPartNum < totalParticipants) {
      setMaxParticipantsError(`Must be at least ${totalParticipants} (current participants)`);
      isValid = false;
    } else {
      setMaxParticipantsError('');
    }

    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setTitleError('You must be logged in to create a challenge');
      return;
    }

    // Calculate start and end dates
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);
    endDate.setHours(23, 59, 59, 999);

    // Set target metric based on challenge type
    let targetMetric = 0;
    switch (challengeType) {
      case 'lowest_screen_time':
        targetMetric = 60; // Target: 60 minutes max per day
        break;
      case 'most_focus_sessions':
        targetMetric = durationDays * 2; // Target: 2 sessions per day
        break;
      case 'longest_streak':
        targetMetric = durationDays; // Target: maintain streak for entire challenge
        break;
    }

    const challengeId = await createChallenge(
      title.trim(),
      description.trim() || null,
      challengeType,
      targetMetric,
      startDate.toISOString(),
      endDate.toISOString(),
      parseInt(maxParticipants, 10),
      Array.from(selectedFriendIds),
      user.id
    );

    if (challengeId) {
      // Navigate to challenge details or active challenges
      navigation.navigate('ChallengeDetailScreen' as any, { challengeId });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigation.goBack();
  };

  const selectedCount = selectedFriendIds.size;
  const isFormValid = title.trim() && selectedCount >= 1 && parseInt(maxParticipants, 10) >= 2;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Challenge 🏆</Text>
        <Text style={styles.description}>
          Create a group challenge and compete with friends!
        </Text>

        {/* Title Input */}
        <Card title="Challenge Title" subtitle="Give your challenge a name">
          <TextInput
            style={[styles.input, titleError && styles.inputError]}
            placeholder="Enter challenge title..."
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setTitleError('');
            }}
            autoCapitalize="words"
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
        </Card>

        {/* Description Input */}
        <Card title="Description" subtitle="What's this challenge about? (optional)">
          <TextInput
            style={styles.textArea}
            placeholder="Describe the challenge..."
            placeholderTextColor={COLORS.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
          />
        </Card>

        {/* Challenge Type Picker */}
        <Card title="Challenge Type" subtitle="Choose the type of competition">
          {CHALLENGE_TYPES.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.typeOption,
                challengeType === option.type && styles.typeOptionSelected,
              ]}
              onPress={() => setChallengeType(option.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.typeEmoji}>{option.emoji}</Text>
              <View style={styles.typeInfo}>
                <Text
                  style={[
                    styles.typeLabel,
                    challengeType === option.type && styles.typeLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.typeDescription}>
                  {option.type === 'lowest_screen_time' && 'Lowest daily screen time wins'}
                  {option.type === 'most_focus_sessions' && 'Most focus sessions wins'}
                  {option.type === 'longest_streak' && 'Longest consecutive streak wins'}
                </Text>
              </View>
              <View style={[
                styles.typeRadio,
                challengeType === option.type && styles.typeRadioSelected
              ]}>
                {challengeType === option.type && <View style={styles.typeRadioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Duration Selector */}
        <Card title="Duration" subtitle="How long should the challenge last?">
          <View style={styles.durationContainer}>
            {DURATION_OPTIONS.map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.durationButton,
                  durationDays === days && styles.durationButtonSelected,
                ]}
                onPress={() => setDurationDays(days)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.durationText,
                    durationDays === days && styles.durationTextSelected,
                  ]}
                >
                  {days}
                </Text>
                <Text
                  style={[
                    styles.durationLabel,
                    durationDays === days && styles.durationLabelSelected,
                  ]}
                >
                  {days === 1 ? 'day' : 'days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Max Participants Input */}
        <Card title="Max Participants" subtitle="Maximum number of participants (min: 2)">
          <View style={styles.participantsInputRow}>
            <Text style={styles.participantsLabel}>Maximum:</Text>
            <TextInput
              style={[
                styles.participantsInput,
                maxParticipantsError && styles.inputError,
              ]}
              placeholder="10"
              placeholderTextColor={COLORS.textSecondary}
              value={maxParticipants}
              onChangeText={(text) => {
                setMaxParticipants(text);
                setMaxParticipantsError('');
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          {maxParticipantsError ? <Text style={styles.errorText}>{maxParticipantsError}</Text> : null}
        </Card>

        {/* Friend Selection */}
        <Card
          title="Invite Friends"
          subtitle={`Selected: ${selectedCount} friend${selectedCount !== 1 ? 's' : ''}`}
        >
          {/* Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />

          {/* Friends List */}
          {friendsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          ) : filteredFriends.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery ? 'No friends found' : 'No friends available'}
            </Text>
          ) : (
            filteredFriends.map((friend) => (
              <View key={friend.id} style={styles.friendRow}>
                <TouchableOpacity
                  style={styles.friendInfo}
                  onPress={() => toggleFriend(friend.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {friend.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.friendName}>{friend.username}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    selectedFriendIds.has(friend.id) && styles.checkboxChecked,
                  ]}
                  onPress={() => toggleFriend(friend.id)}
                  activeOpacity={0.7}
                >
                  {selectedFriendIds.has(friend.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
          {participantsError ? <Text style={styles.errorText}>{participantsError}</Text> : null}
        </Card>

        {/* Error Display */}
        {createError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorMessage}>{createError}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={
              creating ? (
                <View style={styles.loadingButtonContent}>
                  <ActivityIndicator size="small" color={COLORS.text} />
                  <Text style={[styles.loadingButtonText, { marginLeft: SPACING.sm }]}>
                    Creating...
                  </Text>
                </View>
              ) : (
                'Create Challenge 🚀'
              )
            }
            onPress={handleSubmit}
            variant="primary"
            disabled={!isFormValid || creating}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  textArea: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  typeEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  typeLabelSelected: {
    color: COLORS.primary,
  },
  typeDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  typeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeRadioSelected: {
    borderColor: COLORS.primary,
  },
  typeRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  durationButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  durationText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  durationTextSelected: {
    color: COLORS.primary,
  },
  durationLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  durationLabelSelected: {
    color: COLORS.primary,
  },
  participantsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsLabel: {
    color: COLORS.text,
    fontSize: 16,
    marginRight: SPACING.md,
  },
  participantsInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: `${COLORS.error}20`,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  errorMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  cancelButton: {
    marginBottom: SPACING.sm,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
