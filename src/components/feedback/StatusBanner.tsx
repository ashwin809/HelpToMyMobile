import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface StatusBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  type,
  message,
  onDismiss,
}) => {
  if (!message) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: colors.successBackground,
          text: colors.primaryDark,
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          bg: colors.errorBackground,
          text: colors.error,
          icon: 'alert-circle' as const,
        };
      case 'warning':
        return {
          bg: colors.warningBackground,
          text: '#B45309',
          icon: 'warning' as const,
        };
      case 'info':
      default:
        return {
          bg: colors.infoBackground,
          text: colors.info,
          icon: 'information-circle' as const,
        };
    }
  };

  const { bg, text, icon } = getConfig();

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={text} style={styles.icon} />
      <Text style={[styles.message, { color: text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  icon: {
    marginRight: 10,
  },
  message: {
    ...typography.bodySmall,
    flex: 1,
    fontWeight: '500',
  },
});
