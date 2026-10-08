import { Alert } from 'react-native';
import { reportBlockService } from '../services/reportBlockService';

type SafetyActionOptions = {
  currentUserId: string;
  targetUserId: string;
  targetName: string;
  contentType?: 'profile' | 'help_request';
  contentId?: string;
  onBlocked?: (targetUserId: string) => void;
};

export function showUserSafetyActions(options: SafetyActionOptions) {
  if (!options.currentUserId || options.currentUserId === options.targetUserId) return;

  Alert.alert(`Options for ${options.targetName}`, 'Help keep the community safe.', [
    {
      text: 'Report',
      onPress: () => {
        const reasons = ['Spam or scam', 'Harassment or unsafe behavior', 'Inappropriate content'];
        Alert.alert('Report this user', 'Choose a reason:', [
          ...reasons.map((reason) => ({
            text: reason,
            onPress: () => {
              void reportBlockService.reportUser({
                reporterId: options.currentUserId,
                targetUserId: options.targetUserId,
                targetName: options.targetName,
                reason,
                contentType: options.contentType,
                contentId: options.contentId,
              }).then(() => {
                Alert.alert('Report sent', 'Thank you. The report has been sent for review.');
              }).catch((error: unknown) => {
                Alert.alert('Could not send report', error instanceof Error ? error.message : 'Please try again.');
              });
            },
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]);
      },
    },
    {
      text: 'Block',
      style: 'destructive',
      onPress: () => Alert.alert(
        `Block ${options.targetName}?`,
        'Their profile and posts will be hidden from you, and you will not be able to start a new chat with them.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: () => {
              void reportBlockService.blockUser(options.currentUserId, options.targetUserId, options.targetName)
                .then(() => {
                  options.onBlocked?.(options.targetUserId);
                  Alert.alert('User blocked', `${options.targetName} has been blocked.`);
                })
                .catch((error: unknown) => {
                  Alert.alert('Could not block user', error instanceof Error ? error.message : 'Please try again.');
                });
            },
          },
        ],
      ),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
