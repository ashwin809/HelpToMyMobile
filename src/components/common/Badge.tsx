import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'sponsor' | 'volunteer' | 'applicant' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'sponsor':
        return { bg: '#E0F2FE', text: colors.sponsor };
      case 'volunteer':
        return { bg: colors.primaryPale, text: colors.primaryDark };
      case 'applicant':
        return { bg: '#F3E8FF', text: colors.applicant };
      case 'warning':
        return { bg: colors.warningBackground, text: colors.warning };
      case 'error':
        return { bg: colors.errorBackground, text: colors.error };
      case 'neutral':
        return { bg: '#F1F5F9', text: colors.slateLight };
      default:
        return { bg: colors.primaryPale, text: colors.primaryDark };
    }
  };

  const { bg, text } = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'sm' ? styles.textSm : styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: spacing.borderRadiusPill,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sizeMd: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 12,
  },
});
