import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService, getAuthErrorMessage } from '../services/authService';
import { colors, spacing, shadows } from '../theme';
import { Button, Input } from '../components/common';

export function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message);
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Reset Failed', getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password Recovery</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={32} color={colors.primary} />
          </View>

          <Text style={styles.cardTitle}>Reset Your Password</Text>
          <Text style={styles.cardSub}>
            Enter the email address associated with your HelpToYou account and we'll send you recovery
            instructions.
          </Text>

          {submitted ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              <Text style={styles.successHeading}>Check Your Inbox</Text>
              <Text style={styles.successText}>{message}</Text>
              <Button
                title="Back to Sign In"
                onPress={() => navigation.goBack()}
                style={{ marginTop: 16 }}
              />
            </View>
          ) : (
            <>
              <Input
                label="Registered Email Address"
                placeholder="e.g. prof.sundaram@annauniv.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                leftIcon="mail-outline"
                required
              />

              <Button
                title={loading ? 'Sending...' : 'Send Reset Link'}
                onPress={handleReset}
                loading={loading}
                style={styles.submitBtn}
              />

              <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelText}>Cancel and return to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navBack: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slateDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...shadows.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.slateDark,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 13,
    color: colors.slateMedium,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  submitBtn: {
    width: '100%',
    marginTop: 8,
    borderRadius: 12,
    height: 48,
  },
  cancelBtn: {
    marginTop: 16,
  },
  cancelText: {
    fontSize: 13,
    color: colors.slateMedium,
    fontWeight: '600',
  },
  successBox: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F0FDF4',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 8,
  },
  successText: {
    fontSize: 13,
    color: colors.slateDark,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
