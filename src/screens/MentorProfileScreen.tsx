import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { PROFILE_ROLE_OPTIONS } from '../constants/roles';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MentorProfile'>;

export function MentorProfileScreen({ navigation, route }: Props) {
  const { profile } = route.params;
  const roles = profile.userTypes?.length ? profile.userTypes : [profile.userType];
  const roleLabels = roles.map((role) => PROFILE_ROLE_OPTIONS.find((item) => item.role === role)?.label || role);
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'H';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={23} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentor profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          {profile.avatarUrl
            ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.initials}>{initials}</Text></View>}
          <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
          {profile.designation ? <Text style={styles.designation}>{profile.designation}</Text> : null}
          {profile.isVerified ? <View style={styles.verified}><Ionicons name="checkmark-circle" size={15} color={colors.primary} /><Text style={styles.verifiedText}>Verified profile</Text></View> : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Roles</Text>
            <View style={styles.chips}>{roleLabels.map((label) => <View key={label} style={styles.chip}><Text style={styles.chipText}>{label}</Text></View>)}</View>
          </View>

          {profile.university || profile.department || profile.educationLevel ? <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education and expertise</Text>
            {profile.university ? <Text style={styles.detail}><Ionicons name="business-outline" size={16} color={colors.primaryDark} />  {profile.university}</Text> : null}
            {profile.department ? <Text style={styles.detail}><Ionicons name="book-outline" size={16} color={colors.primaryDark} />  {profile.department}</Text> : null}
            {profile.educationLevel ? <Text style={styles.detail}><Ionicons name="school-outline" size={16} color={colors.primaryDark} />  {profile.educationLevel}</Text> : null}
          </View> : null}

          {profile.skills?.length ? <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests and guidance topics</Text>
            <View style={styles.chips}>{profile.skills.map((skill) => <View key={skill} style={styles.chip}><Text style={styles.chipText}>{skill}</Text></View>)}</View>
          </View> : null}

          {profile.bio ? <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View> : null}

          {!profile.designation && !profile.university && !profile.department && !profile.educationLevel && !profile.skills?.length && !profile.bio
            ? <Text style={styles.emptyDetails}>This member has not added more profile details yet.</Text>
            : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { height: 54, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 38, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.slateDark, fontSize: 16, fontWeight: '700' },
  headerSpacer: { width: 38 },
  content: { padding: 16, paddingBottom: 36 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 20, alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#E4F5EC' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.primaryDark, fontSize: 28, fontWeight: '800' },
  name: { marginTop: 13, color: colors.slateDark, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  designation: { marginTop: 4, color: colors.slateMedium, textAlign: 'center' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  verifiedText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  section: { width: '100%', borderTopWidth: 1, borderTopColor: '#EEF2F6', marginTop: 18, paddingTop: 16 },
  sectionTitle: { color: colors.slateDark, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: '#F0FBF5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  detail: { color: colors.slateDark, fontSize: 14, lineHeight: 22, marginBottom: 5 },
  bio: { color: colors.slateMedium, fontSize: 14, lineHeight: 21 },
  emptyDetails: { width: '100%', marginTop: 20, color: colors.slateMedium, textAlign: 'center', lineHeight: 20 },
});
