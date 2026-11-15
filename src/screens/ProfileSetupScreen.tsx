import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../models';
import { colors } from '../theme';
import { Button, Input } from '../components/common';
import { getPopularUniversities, searchWorldwideUniversities, UniversityItem } from '../services/universityService';
import { getAuthErrorMessage } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PROFILE_ROLE_OPTIONS } from '../constants/roles';

export function ProfileSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, updateUser, isLoading } = useAuth();
  const [step, setStep] = useState(Math.min(3, Math.max(1, user?.profileSetupStep || 1)));
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [userTypes, setUserTypes] = useState<UserRole[]>(user?.userTypes?.length ? user.userTypes : [user?.userType || 'Student']);
  const [interests, setInterests] = useState((user?.skills || []).join(', '));
  const [institution, setInstitution] = useState(user?.university || '');
  const [institutionQuery, setInstitutionQuery] = useState('');
  const [results, setResults] = useState<UniversityItem[]>([]);
  const [field, setField] = useState(user?.department || '');
  const [expertise, setExpertise] = useState(user?.designation || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [error, setError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [institutionError, setInstitutionError] = useState('');

  const toggleRole = (role: UserRole) => {
    if (!userTypes.includes(role)) {
      setUserTypes((current) => [...current, role]);
    } else if (userTypes.length > 1) {
      setUserTypes((current) => current.filter((item) => item !== role));
    }
  };

  const makePrimaryRole = (role: UserRole) => {
    if (userTypes.includes(role)) setUserTypes([role, ...userTypes.filter((item) => item !== role)]);
  };

  useEffect(() => {
    let active = true;
    const query = institutionQuery.trim();
    if (!query) { setResults([]); return; }
    const timer = setTimeout(() => {
      void searchWorldwideUniversities(query).then((items) => { if (active) setResults(items.slice(0, 5)); }).catch(() => {
        if (active) setResults(getPopularUniversities().filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5));
      });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [institutionQuery]);

  const save = async (next: number, skipCurrentStep = false) => {
    setError('');
    setFirstNameError('');
    setLastNameError('');
    setInstitutionError('');
    if (step === 1 && !firstName.trim()) { setFirstNameError('Enter your first name.'); return; }
    if (step === 1 && !lastName.trim()) { setLastNameError('Enter your last name.'); return; }
    if (step === 2 && institutionQuery.trim() && !skipCurrentStep) {
      setInstitutionError('Select a result or use the institution name you entered.');
      return;
    }
    try {
      const skills = interests.split(',').map((item) => item.trim()).filter(Boolean);
      await updateUser({
        ...(step === 1 ? { firstName: firstName.trim(), lastName: lastName.trim(), userType: userTypes[0], userTypes, skills } : {}),
        ...(step === 2 ? { university: institution.trim() || null, department: field.trim() || null, designation: expertise.trim() || null } : {}),
        ...(step === 3 ? { bio: bio.trim() || null, profileSetupComplete: true, profileSetupStep: 3 } : { profileSetupStep: next }),
      });
      if (step === 2 && skipCurrentStep) {
        setInstitutionQuery('');
        setResults([]);
      }
      if (step < 3) setStep(next);
      else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) { setError(getAuthErrorMessage(err)); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.brand}>HelpToYou</Text>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>Step {step} of 3</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} /></View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {step === 1 ? <>
          <Input label="First name" placeholder="Your first name" value={firstName} onChangeText={(value) => { setFirstName(value); setFirstNameError(''); }} autoCapitalize="words" required error={firstNameError} />
          <Input label="Last name" placeholder="Your last name" value={lastName} onChangeText={(value) => { setLastName(value); setLastNameError(''); }} autoCapitalize="words" required error={lastNameError} />
          <Text style={styles.heading}>How will you use HelpToYou?</Text>
          <Text style={styles.helper}>Choose one primary role and any other roles that fit. You can change them later.</Text>
          {PROFILE_ROLE_OPTIONS.map((item) => {
            const selected = userTypes.includes(item.role);
            const primary = userTypes[0] === item.role;
            return <View key={item.role} style={[styles.role, selected && styles.roleSelected]}>
              <TouchableOpacity onPress={() => toggleRole(item.role)} style={styles.roleSelect} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}>
                <View style={styles.roleCopy}><Text style={[styles.roleText, selected && styles.roleTextSelected]}>{item.label}</Text><Text style={styles.roleDescription}>{item.description}</Text></View><Text style={styles.radio}>{primary ? 'Primary' : selected ? 'Selected' : 'Select'}</Text>
              </TouchableOpacity>
              {selected && !primary ? <TouchableOpacity onPress={() => makePrimaryRole(item.role)} style={styles.makePrimary}><Text style={styles.makePrimaryText}>Make primary</Text></TouchableOpacity> : null}
            </View>;
          })}
          <Input label="Interests or help categories (optional)" placeholder="Admissions, tutoring, exam guidance" value={interests} onChangeText={setInterests} />
        </> : null}
        {step === 2 ? <>
          <Text style={styles.heading}>Education and expertise</Text>
          <Text style={styles.helper}>Institution, field, and expertise are optional. Search the worldwide list, or enter an institution that is not listed.</Text>
          {institution ? <View style={styles.selectedInstitutionRow}><Text style={styles.selectedInstitution}>Selected institution: {institution}</Text><TouchableOpacity onPress={() => setInstitution('')} accessibilityRole="button"><Text style={styles.clearInstitution}>Clear</Text></TouchableOpacity></View> : null}
          <Input
            label="Institution (optional)"
            placeholder="Search institutions worldwide"
            value={institutionQuery || institution}
            onChangeText={(value) => {
              setInstitutionQuery(value);
              if (institution) setInstitution('');
              setInstitutionError('');
            }}
            error={institutionError}
          />
          {results.map((item) => <TouchableOpacity key={`${item.name}-${item.country}`} onPress={() => { setInstitution(item.country ? `${item.name} (${item.country})` : item.name); setInstitutionQuery(''); setResults([]); }} style={styles.result}><Text style={styles.resultText}>{item.name}{item.country ? ` - ${item.country}` : ''}</Text></TouchableOpacity>)}
          {institutionQuery.trim() ? <TouchableOpacity onPress={() => { setInstitution(institutionQuery.trim()); setInstitutionQuery(''); setResults([]); }} style={styles.result}><Text style={styles.resultText}>Use "{institutionQuery.trim()}" as this institution</Text></TouchableOpacity> : null}
          <Input label="Field of study / department (optional)" placeholder="e.g. Computer Science" value={field} onChangeText={setField} />
          <Input label="Expertise / specialization (optional)" placeholder="e.g. Mathematics, admissions" value={expertise} onChangeText={setExpertise} />
        </> : null}
        {step === 3 ? <>
          <Text style={styles.heading}>A little about you</Text>
          <Text style={styles.helper}>Your short biography is optional. You can update it later.</Text>
          <Input label="Short biography (optional)" placeholder="Tell the community what you are interested in" value={bio} onChangeText={setBio} multiline />
        </> : null}
        <View style={styles.actions}>
          {step > 1 ? <Button title="Back" variant="outline" onPress={() => setStep(step - 1)} style={styles.actionButton} /> : null}
          <Button title={step === 3 ? 'Finish' : 'Continue'} onPress={() => { void save(step + 1); }} loading={isLoading} style={styles.actionButton} />
        </View>
        {step > 1 && step < 3 ? <Text style={styles.skip} onPress={() => { void save(step + 1, true); }}>Skip optional fields</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' }, content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  brand: { color: colors.primary, fontSize: 23, fontWeight: '800' }, title: { color: colors.slateDark, fontSize: 22, fontWeight: '700', marginTop: 20 },
  subtitle: { color: colors.slateMedium, marginTop: 5 }, progress: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 4, marginVertical: 18 }, progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 4 },
  heading: { color: colors.slateDark, fontSize: 17, fontWeight: '700', marginBottom: 14 }, role: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, padding: 11, minHeight: 52, marginBottom: 8 },
  roleSelected: { borderColor: colors.primary, backgroundColor: '#F0FBF5' }, roleSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, roleCopy: { flex: 1, paddingRight: 12 }, roleText: { color: colors.slateDark, fontWeight: '600' }, roleTextSelected: { color: colors.primaryDark, fontWeight: '700' }, roleDescription: { color: colors.slateMedium, fontSize: 12, lineHeight: 17, marginTop: 3 }, radio: { color: colors.primary, fontSize: 13, fontWeight: '700' }, makePrimary: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 3 }, makePrimaryText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  result: { padding: 10, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderColor: '#E2E8F0' }, resultText: { color: colors.slateDark }, selectedInstitutionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, selectedInstitution: { color: colors.primaryDark, fontWeight: '600', flex: 1 }, clearInstitution: { color: colors.slateMedium, fontWeight: '700', paddingLeft: 12 }, helper: { color: colors.slateMedium, lineHeight: 20, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 }, actionButton: { flex: 1 }, skip: { textAlign: 'center', color: colors.primaryDark, fontWeight: '600', paddingTop: 16 },
  error: { color: '#B91C1C', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 14 },
});
