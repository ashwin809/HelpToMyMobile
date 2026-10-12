import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'AIAssistant'>;

export function AIAssistantScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academic assistant</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Ionicons name="sparkles-outline" size={30} color={colors.primaryDark} />
        </View>
        <Text style={styles.title}>Guidance assistant coming soon</Text>
        <Text style={styles.description}>
          An AI service has not been connected yet. We won’t present automated or unverified answers as expert guidance.
        </Text>
        <TouchableOpacity
          style={styles.communityButton}
          accessibilityRole="button"
          onPress={() => navigation.navigate('Main', { screen: 'Community' })}
        >
          <Text style={styles.communityButtonText}>Ask the community</Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8F7' },
  header: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3EBE7',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.slateDark },
  headerSpacer: { width: 40 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F4EC',
    marginBottom: 22,
  },
  title: {
    color: colors.slateDark,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.slateMedium,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 360,
  },
  communityButton: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: colors.primaryDark,
    marginTop: 24,
  },
  communityButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
