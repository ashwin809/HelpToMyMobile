import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../navigation/types';
import { authService, getAuthErrorMessage } from '../services/authService';
import { colors, shadows } from '../theme';

type ResetRoute = RouteProp<RootStackParamList, 'ResetPassword'>;
type Navigation = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ResetRoute>();
  const { user, logout } = useAuth();
  const token = route.params?.token || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      setError('This reset link is missing its security token. Request a new email.');
      return;
    }
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setComplete(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const returnToSignIn = async () => {
    if (user) {
      await logout().catch(() => undefined);
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>{complete ? 'Password updated' : 'Choose a new password'}</Text>
        <Text style={styles.subtitle}>
          {complete
            ? 'Your password has been changed. Sign in with your new password.'
            : 'Enter a new password for your HelpToYou account. The reset link can only be used once.'}
        </Text>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        {complete ? (
          <Button title="Return to Sign In" onPress={returnToSignIn} style={styles.button} />
        ) : (
          <>
            <Input
              label="New Password"
              placeholder="At least 8 characters"
              isPassword
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              required
            />
            <Input
              label="Confirm New Password"
              placeholder="Enter the password again"
              isPassword
              autoComplete="new-password"
              value={confirmation}
              onChangeText={setConfirmation}
              leftIcon="lock-closed-outline"
              required
            />
            <Button
              title={loading ? 'Updating...' : 'Update Password'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.button}
            />
            <Button title="Request a New Link" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 440, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', ...shadows.sm },
  title: { fontSize: 21, fontWeight: '800', color: colors.slateDark },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.slateMedium, marginTop: 8, marginBottom: 20 },
  error: { color: '#B91C1C', backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 13 },
  button: { marginTop: 14 },
});
