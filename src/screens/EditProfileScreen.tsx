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
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, shadows } from '../theme';
import { Button, Input } from '../components/common';

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
  const [saving, setSaving] = useState(false);

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
        university: university.trim(),
        department: department.trim(),
        designation: designation.trim(),
        skills,
        bio: bio.trim(),
        city: city.trim(),
        state: state.trim(),
        postCode: postCode.trim(),
        phone: phone.trim(),
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic & Personal Details</Text>

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

          <Button
            title={saving ? 'Saving Changes...' : 'Save Profile Changes'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
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
});
