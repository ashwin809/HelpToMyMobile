import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { getAuthErrorMessage } from '../services/authService';
import { communityService } from '../services/communityService';
import { chatService, mentorService } from '../services';
import { HelpRequest } from '../models';
import { colors, spacing, shadows } from '../theme';
import { Badge, Button } from '../components/common';
import { SafeAreaView } from 'react-native-safe-area-context';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const { user, logout } = useAuth();

  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [connectedPeople, setConnectedPeople] = useState(0);
  const [activeConversations, setActiveConversations] = useState(0);
  const [responsesGiven, setResponsesGiven] = useState(0);
  const [resolvedInquiriesHelped, setResolvedInquiriesHelped] = useState(0);
  const [profileDataLoading, setProfileDataLoading] = useState(true);
  const [profileDataError, setProfileDataError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      setProfileDataLoading(true);
      setProfileDataError('');

      void Promise.all([
        communityService.getHelpRequests({ authorId: user.id }),
        mentorService.getConnections(),
        communityService.getCommunityImpact(),
      ]).then(([requests, connections, impact]) => {
        if (!active) return;
        setMyRequests(requests);
        setConnectedPeople(connections.filter((connection) => connection.status === 'accepted').length);
        setResponsesGiven(impact.responsesGiven);
        setResolvedInquiriesHelped(impact.resolvedInquiriesHelped);
      }).catch((err) => {
        console.warn('Failed to load user profile data:', err);
        if (active) setProfileDataError('Some profile activity could not be loaded. Pull down to try again.');
      }).finally(() => { if (active) setProfileDataLoading(false); });

      const unsubscribe = chatService.subscribeToUserThreads(user.id, (threads) => {
        if (active) setActiveConversations(threads.filter((thread) => Boolean(thread.lastMessage)).length);
      }, (err) => console.warn('Failed to load profile conversations:', err));

      return () => {
        active = false;
        unsubscribe();
      };
    }, [user])
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Sign Out Failed', getAuthErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="person-circle-outline" size={64} color={colors.slateMuted} />
        <Text style={styles.unauthTitle}>Not Signed In</Text>
        <Text style={styles.unauthSub}>Sign in to view your academic profile and questions.</Text>
        <Button
          title="Sign In"
          onPress={() => navigation.navigate('Login')}
          style={{ width: 200, marginTop: 16 }}
        />
      </View>
    );
  }

  const selectedRoles = user.userTypes?.length ? user.userTypes : [user.userType];
  const isLearner = selectedRoles.some((role) => role === 'Student' || role === 'Applicant');
  const isMentor = selectedRoles.some((role) => role === 'Professor' || role === 'Alumni');
  const impactItems = [
    { label: 'Connections', value: connectedPeople, detail: 'People in your network', icon: 'people-outline' as const, tone: '#147D64' },
    { label: 'Conversations', value: activeConversations, detail: 'Chats started', icon: 'chatbubbles-outline' as const, tone: '#2874A6' },
    ...(isLearner ? [
      { label: 'Questions asked', value: myRequests.length, detail: 'Guidance requests posted', icon: 'help-circle-outline' as const, tone: '#7653B5' },
      { label: 'Questions resolved', value: myRequests.filter((request) => request.status === 'resolved').length, detail: 'Marked resolved by you', icon: 'checkmark-done-outline' as const, tone: '#B9770E' },
    ] : []),
    ...(isMentor ? [
      { label: 'Answers shared', value: responsesGiven, detail: 'Community replies posted', icon: 'chatbox-ellipses-outline' as const, tone: '#7653B5' },
      { label: 'Resolved inquiries helped', value: resolvedInquiriesHelped, detail: 'Your replies on resolved questions', icon: 'school-outline' as const, tone: '#B9770E' },
    ] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        {profileDataLoading ? <Text style={styles.profileStatus}>Updating your profile activity…</Text> : null}
        {profileDataError ? <Text accessibilityRole="alert" style={styles.profileError}>{profileDataError}</Text> : null}
        <View style={styles.headerRow}>
          <Image
            source={{
              uri:
                user.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(
                  user.firstName + ' ' + user.lastName
                )}&backgroundColor=00BD62`,
            }}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={2} ellipsizeMode="tail">
                {user.firstName} {user.lastName}
              </Text>
              {user.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
            </View>
            <Text style={styles.userRoleText}>
              {user.designation || user.userType}
            </Text>
            <View style={styles.badgeRow}>
              {selectedRoles.map((role) => <Badge key={role} label={role} size="sm" variant="primary" />)}
              <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="middle">{user.email}</Text>
            </View>
          </View>
        </View>

        {/* Institution details */}
        <View style={styles.uniRow}>
          <Ionicons name="business" size={16} color={colors.primaryDark} />
          <Text style={styles.uniText} numberOfLines={2} ellipsizeMode="tail">{user.university || 'Institution not set'}</Text>
        </View>
        {user.department ? (
          <Text style={styles.deptText}>Department: {user.department}</Text>
        ) : null}

        {/* Location & Pincode */}
        {(user.city || user.country || user.postCode) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text numberOfLines={2} style={{ flex: 1, minWidth: 0, fontSize: 13, color: colors.slateDark, fontWeight: '500' }}>
              {[user.city, user.state, user.country].filter(Boolean).join(', ')}
              {user.postCode ? ` · PIN: ${user.postCode}` : ''}
            </Text>
          </View>
        ) : null}

        {/* Bio */}
        {user.bio ? (
          <View style={styles.bioBox}>
            <Text style={styles.bioLabel}>About & Statement</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        ) : null}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsLabel}>Areas of Guidance & Topics</Text>
            <View style={styles.skillsRow}>
              {user.skills.map((skill, i) => (
                <View key={i} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Role-specific impact from the signed-in user's activity */}
        <View style={styles.impactSection}>
          <View style={styles.impactHeader}>
            <View style={styles.impactHeadingWrap}>
              <Text style={styles.impactHeading}>Your impact</Text>
              <Text style={styles.impactSubheading}>{isLearner ? 'Your learning journey' : 'Your contribution to learners'}</Text>
            </View>
            <View style={styles.rolePill}><Text style={styles.rolePillText}>{selectedRoles.join(' · ')}</Text></View>
          </View>
          <View style={styles.statsGrid}>
            {impactItems.map((item) => (
              <View key={item.label} style={styles.impactCard}>
                <View style={styles.impactCardTop}>
                  <View style={[styles.impactIconWrap, { backgroundColor: `${item.tone}14` }]}>
                    <Ionicons name={item.icon} size={17} color={item.tone} />
                  </View>
                  <Text style={styles.statNum}>{item.value}</Text>
                </View>
                <Text style={styles.statLabel} numberOfLines={2}>{item.label}</Text>
                <Text style={styles.statDetail} numberOfLines={2}>{item.detail}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Edit & Signout Buttons */}
        <View style={styles.profileActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={16} color="#DC2626" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.blockedUsersBtn} onPress={() => navigation.navigate('BlockedUsers')}>
          <Ionicons name="ban-outline" size={16} color={colors.slateMedium} />
          <Text style={styles.blockedUsersText}>Manage Blocked Users</Text>
        </TouchableOpacity>
      </View>

      {/* My Posted Questions */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="help-buoy-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionHeading}>My Questions ({myRequests.length})</Text>
        </View>

        {myRequests.length === 0 ? (
          <View style={styles.emptyRequests}>
            <Text style={styles.emptyRequestsText}>
              You have not asked any questions yet.
            </Text>
            <TouchableOpacity
              style={styles.askPromptBtn}
              onPress={() => navigation.navigate('CreateHelpRequest', {})}
            >
              <Text style={styles.askPromptText}>+ Ask For Guidance</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myRequests.map((req) => (
            <TouchableOpacity
              key={req.id}
              style={styles.myReqItem}
              onPress={() => navigation.navigate('HelpDetail', { requestId: req.id })}
            >
              <View style={styles.myReqHeader}>
                <Text style={styles.myReqTitle}>{req.title}</Text>
                <Badge
                  label={req.status.toUpperCase()}
                  size="sm"
                  variant={req.status === 'resolved' ? 'volunteer' : 'warning'}
                />
              </View>
              <Text style={styles.myReqMeta}>
                {req.category} â€¢ {req.university} â€¢ {req.responseCount || 0} Responses
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  unauthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slateDark,
    marginTop: 12,
  },
  unauthSub: {
    fontSize: 13,
    color: colors.slateMedium,
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  profileStatus: { color: colors.slateMedium, fontSize: 11, marginBottom: 10 },
  profileError: { color: '#B91C1C', backgroundColor: '#FEF2F2', borderRadius: 9, padding: 10, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    borderWidth: 2,
    borderColor: colors.primaryPale,
  },
  headerInfo: {
    flex: 1,
    flexGrow: 1,
    width: 0,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    color: colors.slateDark,
  },
  userRoleText: {
    fontSize: 12.5,
    color: colors.slateMedium,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  emailText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11.5,
    color: colors.slateLight,
  },
  uniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  uniText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  deptText: {
    fontSize: 12,
    color: colors.slateMedium,
    marginTop: 2,
    marginLeft: 22,
  },
  bioBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slateMedium,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bioText: {
    fontSize: 12.5,
    color: colors.slateDark,
    lineHeight: 18,
  },
  skillsSection: {
    marginTop: 12,
  },
  skillsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slateMedium,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skillPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  impactSection: { marginTop: 18, gap: 12 },
  impactHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  impactHeadingWrap: { flex: 1, minWidth: 0 },
  impactHeading: { fontSize: 16, fontWeight: '800', color: colors.slateDark },
  impactSubheading: { fontSize: 11, color: colors.slateMedium, marginTop: 2 },
  rolePill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: '#E7F4EF' },
  rolePillText: { fontSize: 9, letterSpacing: 0.7, fontWeight: '800', color: colors.primaryDark },
  impactCard: {
    width: '48%',
    minHeight: 104,
    backgroundColor: '#FBFCFE',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5EBF2',
    padding: 11,
    justifyContent: 'space-between',
  },
  impactCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  impactIconWrap: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statNum: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.slateDark,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.slateDark,
    marginTop: 8,
  },
  statDetail: {
    fontSize: 9.5,
    lineHeight: 13,
    color: colors.slateMedium,
    marginTop: 2,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryPale,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  signOutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  blockedUsersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    marginTop: 10,
  },
  blockedUsersText: { fontSize: 12, fontWeight: '600', color: colors.slateMedium },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slateDark,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.slateMedium,
    marginBottom: 12,
  },
  personaList: {
    gap: 8,
  },
  personaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  personaItemActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  personaAvatarCol: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  personaAvatarText: {
    fontSize: 20,
  },
  personaMeta: {
    flex: 1,
  },
  personaName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slateDark,
  },
  personaSub: {
    fontSize: 11,
    color: colors.slateMedium,
  },
  emptyRequests: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyRequestsText: {
    fontSize: 13,
    color: colors.slateMedium,
  },
  askPromptBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  askPromptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  myReqItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  myReqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  myReqTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.slateDark,
  },
  myReqMeta: {
    fontSize: 11,
    color: colors.slateMedium,
    marginTop: 4,
  },
});
