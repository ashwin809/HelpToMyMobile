import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../models';
import { colors, spacing, shadows } from '../theme';
import { Button, Input } from '../components/common';
import { PROFILE_ROLE_OPTIONS } from '../constants/roles';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [skillsText, setSkillsText] = useState((user?.skills || []).join(', '));
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [postCode, setPostCode] = useState(user?.postCode || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [allowConnectionRequests, setAllowConnectionRequests] = useState(user?.allowConnectionRequests ?? true);
  const [userTypes, setUserTypes] = useState<UserRole[]>(() => {
    const currentRoles = (user?.userTypes?.length ? user.userTypes : [user?.userType || 'Student'])
      .filter((role): role is Exclude<UserRole, 'Applicant'> => role !== 'Applicant');
    if (!currentRoles.length) return ['Student'];
    const primaryRole = currentRoles.find((role) => role === user?.userType) || currentRoles[0];
    return [primaryRole, ...currentRoles.filter((role) => role !== primaryRole)];
  });
  const [saving, setSaving] = useState(false);

  const toggleRole = (role: UserRole) => {
    setUserTypes((current) => current.includes(role)
      ? current.length > 1 ? current.filter((item) => item !== role) : current
      : [...current, role]);
  };

  const makePrimaryRole = (role: UserRole) => {
    if (userTypes.includes(role)) setUserTypes([role, ...userTypes.filter((item) => item !== role)]);
  };

  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.45,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Could not read photo', 'Please choose another image.');
        return;
      }
      const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType || '') ? asset.mimeType : 'image/jpeg';
      const photoData = `data:${mimeType};base64,${asset.base64}`;
      if (photoData.length > 2_500_000) {
        Alert.alert('Photo is too large', 'Choose a smaller photo so it can be saved to your profile.');
        return;
      }
      setAvatarUrl(photoData);
    } catch (error) {
      Alert.alert('Photo picker unavailable', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First Name and Last Name are required.');
      return;
    }

    setSaving(true);
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userType: userTypes[0],
        userTypes,
        university: university.trim(),
        department: department.trim(),
        designation: designation.trim(),
        skills,
        bio: bio.trim(),
        city: city.trim(),
        state: state.trim(),
        postCode: postCode.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl || null,
        allowConnectionRequests,
      });

      Alert.alert('Profile Updated', 'Your profile details have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.card}>
          <View style={styles.photoSection}>
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.profilePhoto} /> : <View style={[styles.profilePhoto, styles.photoPlaceholder]}><Ionicons name="person" size={28} color={colors.primaryDark} /></View>}
            <View style={styles.photoCopy}><Text style={styles.photoTitle}>Profile photo</Text><Text style={styles.photoHint}>Choose a square image from your device.</Text><View style={styles.photoActions}><TouchableOpacity style={styles.photoButton} onPress={() => void choosePhoto()}><Ionicons name="image-outline" size={15} color={colors.primaryDark} /><Text style={styles.photoButtonText}>{avatarUrl ? 'Change photo' : 'Choose photo'}</Text></TouchableOpacity>{avatarUrl ? <TouchableOpacity style={styles.removePhotoButton} onPress={() => setAvatarUrl('')}><Text style={styles.removePhotoText}>Remove</Text></TouchableOpacity> : null}</View></View>
          </View>
          <Text style={styles.cardTitle}>Academic & Personal Details</Text>

          <View style={styles.rolesSection}>
            <Text style={styles.rolesTitle}>Your roles</Text>
            <Text style={styles.rolesHint}>Select all roles that fit. Your primary role is shown in your profile; you can change it here.</Text>
            <View style={styles.rolesList}>
              {PROFILE_ROLE_OPTIONS.map((item) => {
                const selected = userTypes.includes(item.role);
                const primary = userTypes[0] === item.role;
                return <View key={item.role} style={[styles.roleCard, selected && styles.roleCardSelected]}>
                  <TouchableOpacity onPress={() => toggleRole(item.role)} style={styles.roleSelect} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}>
                    <View style={styles.roleCopy}><Text style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>{item.label}</Text><Text style={styles.roleDescription}>{item.description}</Text></View>
                    <Text style={[styles.primaryBadge, primary && styles.primaryBadgeActive]}>{primary ? 'Primary' : selected ? 'Selected' : 'Select'}</Text>
                  </TouchableOpacity>
                  {selected && !primary ? <TouchableOpacity onPress={() => makePrimaryRole(item.role)} style={styles.makePrimary}><Text style={styles.makePrimaryText}>Make primary</Text></TouchableOpacity> : null}
                </View>;
              })}
            </View>
          </View>

          <View style={styles.nameRow}>
            <View style={styles.nameCol}>
              <Input
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                required
              />
            </View>
            <View style={styles.nameCol}>
              <Input
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                required
              />
            </View>
          </View>

          <Input
            label="University / Institution"
            value={university}
            onChangeText={setUniversity}
            leftIcon="business-outline"
          />

          <Input
            label="Department / Field"
            value={department}
            onChangeText={setDepartment}
            leftIcon="book-outline"
          />

          <Input
            label="Academic Title / Designation"
            value={designation}
            onChangeText={setDesignation}
          />

          <Input
            label="Skills & Guidance Topics (comma-separated)"
            value={skillsText}
            onChangeText={setSkillsText}
          />

          <Input
            label="Bio & Mentorship Statement"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />

          <View style={styles.nameRow}>
            <View style={styles.nameCol}>
              <Input label="City" value={city} onChangeText={setCity} />
            </View>
            <View style={styles.nameCol}>
              <Input label="State" value={state} onChangeText={setState} />
            </View>
          </View>

          <Input
            label="Pincode / Postal Code"
            value={postCode}
            onChangeText={setPostCode}
            keyboardType="numeric"
            leftIcon="mail-outline"
          />

          <Input
            label="Phone / Mobile"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <View style={styles.privacySection}>
            <View style={styles.privacyCopy}>
              <Text style={styles.privacyTitle}>Connection requests</Text>
              <Text style={styles.privacyHint}>Let eligible members send you a connection request. Your email and phone are never shown in discovery.</Text>
            </View>
            <Switch
              value={allowConnectionRequests}
              onValueChange={setAllowConnectionRequests}
              trackColor={{ false: '#CBD5E1', true: '#86E4B4' }}
              thumbColor={allowConnectionRequests ? colors.primaryDark : '#FFFFFF'}
              accessibilityLabel="Allow connection requests"
            />
          </View>

          <Button
            title={saving ? 'Saving Changes...' : 'Save Profile Changes'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.slateDark,
    marginBottom: 16,
  },
  rolesSection: { marginBottom: 16 },
  rolesTitle: { color: colors.slateDark, fontSize: 13, fontWeight: '700' },
  rolesHint: { color: colors.slateMedium, fontSize: 11, marginTop: 3, marginBottom: 8 },
  rolesList: { flexDirection: 'column', gap: 7 },
  roleCard: { width: '100%', paddingVertical: 10, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: '#DCE5E1', backgroundColor: '#FFFFFF' },
  roleCardSelected: { borderColor: colors.primary, backgroundColor: '#F0FBF5' },
  roleSelect: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleCopy: { flex: 1 },
  roleChipText: { color: colors.slateMedium, fontSize: 12, fontWeight: '600' },
  roleChipTextSelected: { color: colors.primaryDark, fontWeight: '700' },
  roleDescription: { color: colors.slateMedium, fontSize: 11, lineHeight: 15, marginTop: 2 },
  primaryBadge: { color: colors.slateMedium, fontSize: 11, fontWeight: '700' },
  primaryBadgeActive: { color: colors.primaryDark },
  makePrimary: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 3 },
  makePrimaryText: { color: colors.primaryDark, fontSize: 11, fontWeight: '700' },
  photoSection: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 20, padding: 12, borderRadius: 14, backgroundColor: '#F5F8F7' },
  profilePhoto: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#E4F5EC' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoCopy: { flex: 1, minWidth: 0 },
  photoTitle: { color: colors.slateDark, fontSize: 13, fontWeight: '800' },
  photoHint: { color: colors.slateMedium, fontSize: 10, marginTop: 3 },
  photoActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  photoButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: '#DFF3E7' },
  photoButtonText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  removePhotoButton: { paddingVertical: 6 },
  removePhotoText: { color: '#A34752', fontSize: 10, fontWeight: '700' },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameCol: {
    flex: 1,
  },
  saveBtn: {
    marginTop: 18,
    borderRadius: 12,
    height: 48,
  },
  privacySection: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F8F7', borderRadius: 12, padding: 12, marginTop: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: colors.slateDark, fontSize: 13, fontWeight: '700' },
  privacyHint: { color: colors.slateMedium, fontSize: 11, lineHeight: 16, marginTop: 3 },
});
