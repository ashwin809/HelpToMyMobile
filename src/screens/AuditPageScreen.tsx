import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { getAuthErrorMessage } from '../services/authService';
import { PublicTabParamList, RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

export type AuditPage = 'Home' | 'WhatWeDo' | 'AboutUs' | 'ContactUs' | 'Login' | 'Register' | 'ForgotPassword' | 'EditProfile' | 'ChangePassword';
type Navigation = CompositeNavigationProp<BottomTabNavigationProp<PublicTabParamList>, NativeStackNavigationProp<RootStackParamList>>;
type Props = { page: AuditPage; role?: 'Sponsor' | 'Volunteer' | 'Applicant' };
const fields = [
  ['Email address', 'email-address'], ['First name', 'default'], ['Last name', 'default'],
  ['Address line 1', 'default'], ['Address line 2 (optional)', 'default'], ['City', 'default'],
  ['Postcode', 'numeric'], ['State', 'default'], ['Country', 'default'],
  ['Phone (optional)', 'phone-pad'], ['Mobile (optional)', 'phone-pad'],
] as const;

export function AuditPageScreen({ page, role }: Props) {
  const navigation = useNavigation<Navigation>();
  const [selectedRole, setSelectedRole] = React.useState(role);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const { isAuthenticated, login, logout } = useAuth();
  const submitBlocked = () => Alert.alert('Backend/API required', 'This action is not connected: the audit found an ASP.NET Web Forms postback, but no supported mobile API contract.');
  const tryLogin = async () => {
    setBusy(true);
    try { await login({ email, password }); navigation.navigate('Main'); }
    catch (error) { Alert.alert('Login Failed', getAuthErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const action = (title: string, onPress: () => void) => <Button key={title} title={title} onPress={onPress} style={styles.button} />;
  const title: Record<AuditPage, string> = {
    Home: 'HelpToYou', WhatWeDo: 'What we do', AboutUs: 'Who we are', ContactUs: 'Contact Us',
    Login: 'Login', Register: selectedRole ? `Register as ${selectedRole}` : 'Register',
    ForgotPassword: 'Forgot password', EditProfile: 'Edit profile', ChangePassword: 'Change password',
  };
  const field = (label: string, props: { keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'; secureTextEntry?: boolean; multiline?: boolean; value?: string; onChangeText?: (value: string) => void } = {}) => <Input key={label} label={label} autoCapitalize="none" {...props} />;

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.brand}>HelpToYou</Text><Text style={styles.heading}>{title[page]}</Text>
    {page === 'Home' && <>
      <Text style={styles.body}>Connecting those who help and those who need help.</Text>
      <View style={styles.notice}><Text style={styles.noticeTitle}>How to help anyone else</Text><Text style={styles.body}>Saved site snapshot: 8,365 raised of 14,000. Live value source is unverified.</Text></View>
      {!isAuthenticated && action('Login', () => navigation.navigate('Login'))}
      {(['Sponsor', 'Volunteer', 'Applicant'] as const).map((r) => action(`Register — ${r}`, () => navigation.navigate('Register', { role: r })))}
      {action('Forgot password', () => navigation.navigate('ForgotPassword'))}
      {isAuthenticated && <>{action('Change password', () => navigation.navigate('ChangePassword'))}{action('Edit profile', () => navigation.navigate('EditProfile'))}{action('Log out', () => { void logout().catch((error) => Alert.alert('Sign Out Failed', getAuthErrorMessage(error))); })}</>}
      {action('Email HelpToYou', () => { void Linking.openURL('mailto:info@helptoyou.org'); })}
      {action('Share on Facebook', () => { void Linking.openURL('https://www.facebook.com/sharer.php?u=http://helptoyou.org/home.aspx'); })}
      {action('Share on Twitter', () => { void Linking.openURL('https://twitter.com/share?url=http://helptoyou.org/home.aspx'); })}
      
    </>}
    {page === 'WhatWeDo' && <Text style={styles.body}>Mission, screening, matching, and application information from the organization. Saved page copy needs live verification.</Text>}
    {page === 'AboutUs' && <Text style={styles.body}>Organization and team information. The saved copy names Pranav Kalyan, Senthil Krishnaswamy, Sathya Ramaswamy, Manivannan Arumugam, and Kalyana Kumar Mohan.</Text>}
    {page === 'ContactUs' && <>{field('Name')}{field('Email', { keyboardType: 'email-address' })}{field('Subject')}{field('Message', { multiline: true })}<Text style={styles.todo}>TODO: BACKEND/API REQUIRED — ContactUs.aspx postback; no mobile endpoint is known.</Text>{action('Submit (backend required)', submitBlocked)}{action('Email info@helptoyou.org', () => { void Linking.openURL('mailto:info@helptoyou.org'); })}</>}
    {page === 'Login' && <>{field('Email ID', { keyboardType: 'email-address', value: email, onChangeText: setEmail })}{field('Password', { secureTextEntry: true, value: password, onChangeText: setPassword })}{action(busy ? 'Working…' : 'Login', () => { void tryLogin(); })}{action('Forgot your password?', () => navigation.navigate('ForgotPassword'))}</>}
    {page === 'Register' && <>
      {!selectedRole && <View>{(['Sponsor', 'Volunteer', 'Applicant'] as const).map((r) => action(r, () => setSelectedRole(r)))}</View>}
      {selectedRole && <>{fields.map(([label, keyboardType]) => field(label, { keyboardType }))}{selectedRole === 'Volunteer' && <Text style={styles.body}>☐ Request for regional lead role</Text>}</>}
      <Text style={styles.todo}>TODO: BACKEND/API REQUIRED — UserRegistration.aspx Web Forms postback. The website registration fields do not include a password.</Text>{action('Save (backend required)', submitBlocked)}
    </>}
    {page === 'ForgotPassword' && <>{field('Email address', { keyboardType: 'email-address' })}<Text style={styles.todo}>TODO: BACKEND/API REQUIRED — reset delivery and mobile endpoint are unknown.</Text>{action('Retreive Password (backend required)', submitBlocked)}</>}
    {page === 'EditProfile' && <><Text style={styles.body}>Profile editing uses the registration data in edit mode.</Text>{fields.map(([label, keyboardType]) => field(label, { keyboardType }))}<Text style={styles.todo}>TODO: BACKEND/API REQUIRED — authenticated profile load and save.</Text>{action('Save (backend required)', submitBlocked)}</>}
    {page === 'ChangePassword' && <><Text style={styles.todo}>TODO: BACKEND/API REQUIRED — destination form, fields, validation, and postback behavior were not established.</Text>{action('Submit (backend required)', submitBlocked)}</>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 22, paddingBottom: 48, backgroundColor: '#fff', flexGrow: 1 },
  brand: { color: colors.primary, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  heading: { color: '#252525', fontWeight: '800', fontSize: 26, marginBottom: 16 },
  body: { color: '#454545', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  notice: { backgroundColor: '#F2FAF5', padding: 16, borderRadius: 12, marginVertical: 12 },
  noticeTitle: { color: '#242424', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  button: { marginVertical: 5 },
  todo: { backgroundColor: '#FFF7E6', borderColor: '#E9CF8C', borderWidth: 1, padding: 12, color: '#5A4617', borderRadius: 8, marginVertical: 10, lineHeight: 20 },
});
