import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { getAuthErrorMessage } from '../services/authService';
import { colors, spacing, typography, shadows } from '../theme';
import { Button, Input } from '../components/common';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Navigation>();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const handleLogin = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage('');
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err));
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>HelpToYou</Text>
        <Text style={styles.tagline}>
          Education Community Connect & Guidance Platform
        </Text>
      </View>

      {/* Main Login Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In to Your Account</Text>
        <Text style={styles.cardSubtitle}>
          Connect with professors, students, and educational mentors.
        </Text>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Input
          label="Email Address"
          placeholder="e.g. prof.sundaram@annauniv.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (errorMessage) setErrorMessage('');
          }}
          leftIcon="mail-outline"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          isPassword
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (errorMessage) setErrorMessage('');
          }}
          leftIcon="lock-closed-outline"
        />

        <TouchableOpacity
          style={styles.forgotPassButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPassText}>Forgot your password?</Text>
        </TouchableOpacity>

        <Button
          title={isLoading ? 'Signing In...' : 'Sign In'}
          onPress={handleLogin}
          loading={isLoading}
          style={styles.submitBtn}
        />

        {/* Register Prompt */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to HelpToYou?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register', {})}>
            <Text style={styles.registerLink}> Create an Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Trust Footer */}
      <View style={styles.trustFooter}>
        <Text style={styles.trustText}>
          A non-profit initiative connecting underprivileged students with educational opportunities.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: colors.slateMedium,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 300,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slateDark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.slateMedium,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  forgotPassButton: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: -4,
  },
  forgotPassText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 12,
    height: 48,
  },
  demoSection: {
    marginTop: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: '700',
    color: colors.slateMuted,
    letterSpacing: 0.8,
  },
  demoHint: {
    fontSize: 12,
    color: colors.slateMedium,
    marginBottom: 12,
  },
  demoButtonsContainer: {
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  demoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  demoTextCol: {
    flex: 1,
  },
  demoName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slateDark,
  },
  demoRole: {
    fontSize: 11,
    color: colors.slateMedium,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.slateMedium,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  trustFooter: {
    marginTop: 24,
    maxWidth: 360,
  },
  trustText: {
    fontSize: 11,
    color: colors.slateMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
