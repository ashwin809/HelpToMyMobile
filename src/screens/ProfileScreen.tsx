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
import { db } from '../storage/db';
import { HelpRequest } from '../models';
import { colors, spacing, shadows } from '../theme';
import { Badge, Button } from '../components/common';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const { user, logout } = useAuth();

  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    try {
      const requests = await db.getHelpRequests({ authorId: user.id });
      setMyRequests(requests);

    } catch (err) {
      console.warn('Failed to load user profile data:', err);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
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
              <Text style={styles.userName}>
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
              <Badge
                label={user.userType}
                size="sm"
                variant={
                  user.userType === 'Professor'
                    ? 'volunteer'
                    : user.userType === 'Student'
                    ? 'sponsor'
                    : user.userType === 'Alumni'
                    ? 'applicant'
                    : 'primary'
                }
              />
              <Text style={styles.emailText}>{user.email}</Text>
            </View>
          </View>
        </View>

        {/* Institution details */}
        <View style={styles.uniRow}>
          <Ionicons name="business" size={16} color={colors.primaryDark} />
          <Text style={styles.uniText}>{user.university}</Text>
        </View>
        {user.department ? (
          <Text style={styles.deptText}>Department: {user.department}</Text>
        ) : null}

        {/* Location & Pincode */}
        {(user.city || user.country || user.postCode) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text style={{ fontSize: 13, color: colors.slateDark, fontWeight: '500' }}>
              {[user.city, user.state, user.country].filter(Boolean).join(', ')}
              {user.postCode ? ` • PIN: ${user.postCode}` : ''}
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{myRequests.length}</Text>
            <Text style={styles.statLabel}>Questions Posted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{user.helpedCount || 0}</Text>
            <Text style={styles.statLabel}>Times Helped</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{user.rating || 5.0} ★</Text>
            <Text style={styles.statLabel}>Rating</Text>
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
                {req.category} • {req.university} • {req.responseCount || 0} Responses
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 18,
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
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slateDark,
  },
  statLabel: {
    fontSize: 11,
    color: colors.slateMedium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
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
