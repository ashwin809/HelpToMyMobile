import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { User, Connection } from '../models';
import { colors, spacing, shadows } from '../theme';
import { Badge } from '../components/common';
import { chatService } from '../services/chatService';
import { mentorService } from '../services/mentorService';
import { reportBlockService } from '../services/reportBlockService';
import { showUserSafetyActions } from '../utils/userSafetyActions';
import { hasAnyRole, LEARNER_ROLES } from '../utils/rolePermissions';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const UNIVERSITIES = [
  'All Universities',
  'Anna University',
  'IIT Madras',
  'Stanford University',
  'NIT Trichy',
];

const ROLES = ['All', 'Professor', 'Alumni'];

function matchDetails(student: User | null, mentor: User) {
  const studentSkills = new Set((student?.skills || []).map((skill) => skill.trim().toLowerCase()));
  const sharedSkills = (mentor.skills || []).filter((skill) => studentSkills.has(skill.trim().toLowerCase()));
  const sameUniversity = Boolean(student?.university && mentor.university && student.university.toLowerCase() === mentor.university.toLowerCase());
  const sameDepartment = Boolean(student?.department && mentor.department && student.department.toLowerCase() === mentor.department.toLowerCase());
  const score = Math.min(98, 38 + sharedSkills.length * 15 + (sameUniversity ? 25 : 0) + (sameDepartment ? 12 : 0));
  const reasons = [...(sharedSkills.length ? [`${sharedSkills.length} shared topic${sharedSkills.length === 1 ? '' : 's'}`] : []), ...(sameUniversity ? ['same institution'] : []), ...(sameDepartment ? ['same field'] : [])];
  return { score, reason: reasons.length ? reasons.join(' - ') : 'Based on your academic profile' };
}

export function MentorsScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const canRequestMentor = hasAnyRole(user, LEARNER_ROLES);

  const [mentors, setMentors] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('All Universities');
  const [selectedRole, setSelectedRole] = useState('All');

  useEffect(() => {
    let active = true;
    if (!user) {
      setBlockedUserIds(new Set());
      return;
    }
    reportBlockService.getBlockedUserIds(user.id).then((ids) => {
      if (active) setBlockedUserIds(ids);
    }).catch((error) => console.warn('Failed to load blocked users:', error));
    return () => { active = false; };
  }, [user?.id]);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [all, connections] = await Promise.all([
        mentorService.getMentors({ university: selectedUniversity, role: selectedRole, search: searchQuery.trim() || undefined }),
        mentorService.getConnections(),
      ]);
      setMentors(all.filter((mentor) => !blockedUserIds.has(mentor.id)));
      setConnections(connections);
    } catch (err) {
      console.warn('Failed to load mentors:', err);
      setLoadError('Could not load helper and mentor profiles. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user, blockedUserIds, selectedUniversity, selectedRole, searchQuery]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const handleConnect = async (targetUser: User) => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to connect with mentors.');
      return;
    }

    try {
      const conn = await mentorService.connectWithUser(
        targetUser.id,
        `Hello ${targetUser.firstName}, I would like to seek your guidance.`
      );
      setConnections((prev) => [...prev.filter((c) => c.id !== conn.id), conn]);
      Alert.alert(
        'Connection Request Sent!',
        `Your guidance request has been sent to ${targetUser.firstName} ${targetUser.lastName}.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send connection request.');
    }
  };

  const isConnected = (targetUserId: string) => {
    return connections.some(
      (c) =>
        (c.fromUserId === targetUserId || c.toUserId === targetUserId) &&
        c.status === 'accepted'
    );
  };

  const isPending = (targetUserId: string) => {
    return connections.some(
      (c) =>
        (c.fromUserId === targetUserId || c.toUserId === targetUserId) &&
        c.status === 'pending'
    );
  };

  const renderMentorCard = ({ item }: { item: User }) => {
    const connected = isConnected(item.id);
    const pending = isPending(item.id);
    const match = matchDetails(user, item);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image
            source={{
              uri:
                item.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(
                  item.firstName + ' ' + item.lastName
                )}&backgroundColor=00BD62`,
            }}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.mentorName} numberOfLines={1} ellipsizeMode="tail">
                {item.firstName} {item.lastName}
              </Text>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              )}
            </View>
            <Text style={styles.designation} numberOfLines={1}>
              {item.designation || item.userType}
            </Text>
            <View style={styles.badgeRow}>
              <Badge
                label={item.userType}
                size="sm"
                variant={
                  item.userType === 'Professor'
                    ? 'volunteer'
                    : item.userType === 'Student'
                    ? 'sponsor'
                    : item.userType === 'Alumni'
                    ? 'applicant'
                    : 'primary'
                }
              />
            </View>
          </View>
          {user && user.id !== item.id && (
            <TouchableOpacity
              style={styles.safetyButton}
              accessibilityRole="button"
              accessibilityLabel={`Safety options for ${item.firstName} ${item.lastName}`}
              onPress={() => showUserSafetyActions({
                currentUserId: user.id,
                targetUserId: item.id,
                targetName: `${item.firstName} ${item.lastName}`,
                onBlocked: (targetId) => setBlockedUserIds((prev) => new Set(prev).add(targetId)),
              })}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.slateMedium} />
            </TouchableOpacity>
          )}
        </View>

        {/* Institution & Department */}
        <View style={styles.institutionRow}>
          <Ionicons name="business-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.institutionText} numberOfLines={2} ellipsizeMode="tail">{item.university}</Text>
        </View>
        {item.department ? (
          <Text style={styles.deptText}>Dept: {item.department}</Text>
        ) : null}

        {/* Bio */}
        {item.bio ? (
          <Text style={styles.bioText} numberOfLines={2}>
            {item.bio}
          </Text>
        ) : null}

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsRow}>
            {item.skills.slice(0, 3).map((skill, idx) => (
              <View key={idx} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {item.skills.length > 3 && (
              <View style={styles.skillChipMore}>
                <Text style={styles.skillTextMore}>+{item.skills.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.matchRow}>
          <Ionicons name="sparkles-outline" size={14} color="#7653B5" />
          <Text style={styles.matchScore}>{match.score}% profile match</Text>
          <Text style={styles.matchReason} numberOfLines={1}>{match.reason}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('MentorProfile', { profile: item })}
          >
            <Ionicons name="person-circle-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.profileBtnText}>View profile</Text>
          </TouchableOpacity>
          {canRequestMentor && <>
          <TouchableOpacity
            style={[
              styles.connectBtn,
              connected && styles.connectedBtn,
              pending && styles.pendingBtn,
            ]}
            onPress={() => handleConnect(item)}
            disabled={connected || pending}
          >
            <Ionicons
              name={
                connected
                  ? 'checkmark'
                  : pending
                  ? 'time-outline'
                  : 'person-add-outline'
              }
              size={15}
              color={connected ? colors.primaryDark : pending ? colors.slateMedium : '#FFFFFF'}
            />
            <Text
              style={[
                styles.connectBtnText,
                connected && styles.connectedBtnText,
                pending && styles.pendingBtnText,
              ]}
            >
              {connected ? 'Connected' : pending ? 'Request Pending' : 'Connect'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.askDirectBtn}
            onPress={() =>
              navigation.navigate('CreateHelpRequest', {
                targetUniversity: item.university,
              })
            }
          >
            <Ionicons name="help-circle-outline" size={15} color={colors.primary} />
            <Text style={styles.askDirectText}>Ask Question</Text>
          </TouchableOpacity>
          </>}

          {connected && (
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={async () => {
                if (!user) return;
                const threadId = await chatService.createOrGetThread(user.id, item.id);
                navigation.navigate('ChatThread', { threadId, participantName: `${item.firstName} ${item.lastName}` });
              }}
            >
              <Ionicons name="chatbubble-outline" size={15} color="#3B82F6" />
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
          <View style={styles.topBarCopy}>
          <Text style={styles.pageTitle} numberOfLines={2}>Members & Mentors</Text>
          <Text style={styles.pageSub}>
            Discover by skills and campus. Match scores compare shared profile details.
          </Text>
          <View style={styles.demoNotice}>
            <Ionicons name="information-circle-outline" size={15} color="#516B85" />
            <Text style={styles.demoNoticeText}>Profiles marked Demo are fictional examples for this presentation.</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.slateMedium} />
          <TextInput
            placeholder="Search professors, skills (e.g. AI, Admissions)..."
            placeholderTextColor={colors.slateMuted}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.slateMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* University Scroll */}
      <View style={styles.uniScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.uniScroll}
        >
          {UNIVERSITIES.map((u) => {
            const isSelected = selectedUniversity === u;
            return (
              <TouchableOpacity
                key={u}
                style={[
                  styles.uniFilterChip,
                  isSelected && styles.uniFilterChipActive,
                ]}
                onPress={() => setSelectedUniversity(u)}
              >
                <Text
                  style={[
                    styles.uniFilterText,
                    isSelected && styles.uniFilterTextActive,
                  ]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Role Filter Chips */}
      <View style={styles.roleScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roleScroll}
        >
          {ROLES.map((r) => {
            const isSelected = selectedRole === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.rolePill, isSelected && styles.rolePillActive]}
                onPress={() => setSelectedRole(r)}
              >
                <Text style={[styles.rolePillText, isSelected && styles.rolePillTextActive]}>
                  {r === 'All' ? 'All Roles' : `${r}s`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.officeHoursBanner} onPress={() => navigation.navigate('OfficeHours')}>
        <Ionicons name="calendar-outline" size={19} color={colors.primaryDark} />
        <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.officeHoursTitle}>Mentor office hours</Text><Text style={styles.officeHoursSubtitle}>See available guidance sessions</Text></View>
        <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
      </TouchableOpacity>

      {/* Mentors List */}
      <FlatList
        data={[...mentors].sort((a, b) => matchDetails(user, b).score - matchDetails(user, a).score)}
        keyExtractor={(item) => item.id}
        renderItem={renderMentorCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading && mentors.length > 0} onRefresh={() => { void loadMentors(); }} colors={[colors.primary]} />}
        ListHeaderComponent={loadError && mentors.length > 0 ? <TouchableOpacity style={styles.errorNotice} onPress={() => { void loadMentors(); }}><Text style={styles.errorText}>{loadError} Tap to retry.</Text></TouchableOpacity> : loading && mentors.length > 0 ? <View style={styles.loadingNotice}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Updating profiles...</Text></View> : undefined}
        ListEmptyComponent={
          loading ? <View style={styles.emptyContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.emptySubtitle}>Loading helper and mentor profiles...</Text></View> : loadError ? <View style={styles.emptyContainer}><Ionicons name="cloud-offline-outline" size={42} color={colors.slateMuted} /><Text style={styles.emptyTitle}>Profiles unavailable</Text><Text style={styles.emptySubtitle}>{loadError}</Text><TouchableOpacity style={styles.retryButton} onPress={() => { void loadMentors(); }}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View> : <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.slateMuted} />
            <Text style={styles.emptyTitle}>No profiles found</Text>
            <Text style={styles.emptySubtitle}>No helper or mentor profiles match this search yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topBarCopy: { flex: 1, minWidth: 0 },
  officeHoursBanner: { marginHorizontal: 16, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 11, borderRadius: 12, backgroundColor: '#E4F5EC', borderWidth: 1, borderColor: '#CDEBDD' },
  officeHoursTitle: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  officeHoursSubtitle: { color: colors.slateMedium, fontSize: 9.5, marginTop: 2 },
  pageTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.slateDark,
  },
  pageSub: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.slateMedium,
    marginTop: 2,
  },
  demoNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 9, padding: 9, borderRadius: 10, backgroundColor: '#EEF3F8' },
  demoNoticeText: { flex: 1, minWidth: 0, color: '#516B85', fontSize: 10.5, lineHeight: 15 },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.slateDark,
  },
  uniScrollWrapper: {
    marginTop: 10,
  },
  uniScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  uniFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uniFilterChipActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primary,
  },
  uniFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  uniFilterTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  roleScrollWrapper: {
    marginTop: 8,
    marginBottom: 4,
  },
  roleScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  rolePillActive: {
    backgroundColor: colors.slateDark,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  rolePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.primaryPale,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  safetyButton: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  mentorName: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '700',
    color: colors.slateDark,
  },
  designation: {
    fontSize: 12,
    color: colors.slateMedium,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 2,
  },
  institutionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  deptText: {
    fontSize: 11.5,
    color: colors.slateLight,
    marginBottom: 6,
  },
  bioText: {
    fontSize: 12.5,
    color: colors.slateMedium,
    lineHeight: 18,
    marginBottom: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 9, backgroundColor: '#F4F0FC', marginBottom: 10 },
  matchScore: { color: '#6540A0', fontSize: 10, fontWeight: '800' },
  matchReason: { flex: 1, minWidth: 0, color: '#725F90', fontSize: 9 },
  skillChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 11,
    color: colors.slateDark,
    fontWeight: '500',
  },
  skillChipMore: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skillTextMore: {
    fontSize: 11,
    color: colors.slateMedium,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  profileBtn: { flexGrow: 1, flexBasis: '46%', minWidth: 128, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FBF5', borderWidth: 1, borderColor: '#CDEBDD', paddingVertical: 9, borderRadius: 10, gap: 6 },
  profileBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.primaryDark },
  connectBtn: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 128,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  connectedBtn: {
    backgroundColor: colors.primaryPale,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pendingBtn: {
    backgroundColor: '#F1F5F9',
  },
  connectBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  connectedBtnText: {
    color: colors.primaryDark,
  },
  pendingBtnText: {
    color: colors.slateMedium,
  },
  askDirectBtn: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 128,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  askDirectText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  messageBtn: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 128,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  messageBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 },
  loadingText: { color: colors.slateMedium, fontSize: 12 },
  errorNotice: { padding: 12, backgroundColor: '#FEF2F2', borderRadius: 10, marginBottom: 10 },
  errorText: { color: '#B91C1C', fontSize: 12 },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.primary, borderRadius: 9 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slateDark,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.slateMedium,
    marginTop: 4,
  },
});
