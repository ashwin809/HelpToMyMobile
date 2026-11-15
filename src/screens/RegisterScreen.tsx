import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { getAuthErrorMessage } from '../services/authService';
import { colors } from '../theme';
import { Button, Input } from '../components/common';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<Navigation>();
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) return setError('Please enter your email address.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (password.length < 8 || password.length > 128) return setError('Password must be between 8 and 128 characters.');
    setError('');
    try {
      await register({ email: email.trim(), password });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.brand}>HelpToYou</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Create your account with your email and password. You can add your profile details next.</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} required />
        <Input label="Password" placeholder="At least 8 characters" isPassword value={password} onChangeText={setPassword} required />
        <Button title="Create account" onPress={() => { void submit(); }} loading={isLoading} style={styles.button} />
        <Text style={styles.login} onPress={() => navigation.navigate('Login')}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  brand: { color: colors.primary, fontSize: 24, fontWeight: '800', marginBottom: 18 },
  title: { color: colors.slateDark, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.slateMedium, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 22 },
  error: { color: '#B91C1C', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16 },
  button: { marginTop: 10 },
  login: { textAlign: 'center', color: colors.slateMedium, marginTop: 20 },
  link: { color: colors.primaryDark, fontWeight: '700' },
});
