import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../storage/db';
import { HelpRequest, HelpCategory } from '../models';
import { colors, spacing, shadows } from '../theme';
import { Badge } from '../components/common';
import { reportBlockService } from '../services/reportBlockService';
import { showUserSafetyActions } from '../utils/userSafetyActions';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: { label: string; value: string; icon: string }[] = [
  { label: 'All Topics', value: 'All', icon: 'apps-outline' },
  { label: 'Admissions', value: 'Admissions', icon: 'school-outline' },
  { label: 'Research', value: 'Research', icon: 'flask-outline' },
  { label: 'Syllabus & Exam', value: 'Syllabus & Exam', icon: 'book-outline' },
  { label: 'Scholarships', value: 'Scholarships', icon: 'cash-outline' },
  { label: 'Career Guidance', value: 'Career Guidance', icon: 'briefcase-outline' },
];

const UNIVERSITIES = [
  'All Universities',
  'Anna University',
  'IIT Madras',
  'Stanford University',
  'NIT Trichy',
];

export function CommunityFeedScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedUniversity, setSelectedUniversity] = useState('All Universities');

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

  const loadRequests = useCallback(async () => {
    try {
      const data = await db.getHelpRequests({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        university: selectedUniversity === 'All Universities' ? undefined : selectedUniversity,
        query: searchQuery,
      });
      setRequests(data.filter((request) => !blockedUserIds.has(request.authorId)));
    } catch (err) {
      console.warn('Failed to load requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedUniversity, searchQuery, user, blockedUserIds]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleUpvote = async (requestId: string) => {
    await db.toggleUpvoteRequest(requestId);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r))
    );
  };

  const renderHelpCard = ({ item }: { item: HelpRequest }) => {
    const isUrgent = item.urgency === 'High';
    const hasResponses = (item.responseCount || 0) > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('HelpDetail', { requestId: item.id })}
      >
        {/* Author & Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.authorMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{item.authorName}</Text>
              <Badge
                label={item.authorRole}
                size="sm"
                variant={
                  item.authorRole === 'Professor'
                    ? 'volunteer'
                    : item.authorRole === 'Student'
                    ? 'sponsor'
                    : item.authorRole === 'Sponsor'
                    ? 'primary'
                    : 'neutral'
                }
              />
            </View>
            <Text style={styles.universityMeta} numberOfLines={1}>
              {item.authorDesignation || item.university}
            </Text>
          </View>

          {user && user.id !== item.authorId && (
            <TouchableOpacity
              style={styles.safetyButton}
              accessibilityRole="button"
              accessibilityLabel={`Safety options for ${item.authorName}`}
              onPress={(event) => {
                event.stopPropagation();
                showUserSafetyActions({
                  currentUserId: user.id,
                  targetUserId: item.authorId,
                  targetName: item.authorName,
                  contentType: 'help_request',
                  contentId: item.id,
                  onBlocked: (targetId) => setBlockedUserIds((prev) => new Set(prev).add(targetId)),
                });
              }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.slateMedium} />
            </TouchableOpacity>
          )}

          {isUrgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={11} color="#EF4444" />
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.questionTitle}>{item.title}</Text>

        {/* Description snippet */}
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Target University & Category Pills */}
        <View style={styles.tagsRow}>
          <View style={styles.uniTag}>
            <Ionicons name="business-outline" size={12} color={colors.primaryDark} />
            <Text style={styles.uniTagText}>{item.university}</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{item.category}</Text>
          </View>
          <View
            style={[
              styles.statusTag,
              item.status === 'resolved'
                ? styles.statusResolved
                : item.status === 'in_progress'
                ? styles.statusInProgress
                : styles.statusOpen,
            ]}
          >
            <Text
              style={[
                styles.statusTagText,
                item.status === 'resolved'
                  ? styles.statusResolvedText
                  : item.status === 'in_progress'
                  ? styles.statusInProgressText
                  : styles.statusOpenText,
              ]}
            >
              {item.status === 'resolved'
                ? '✓ Resolved'
                : item.status === 'in_progress'
                ? '● Discussing'
                : '○ Need Help'}
            </Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.upvoteBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleUpvote(item.id);
            }}
          >
            <Ionicons name="arrow-up-circle-outline" size={18} color={colors.slateMedium} />
            <Text style={styles.upvoteCount}>{item.upvotes || 0}</Text>
          </TouchableOpacity>

          <View style={styles.repliesCount}>
            <Ionicons name="chatbubbles-outline" size={16} color={colors.slateMedium} />
            <Text style={styles.repliesText}>
              {item.responseCount || 0}{' '}
              {item.responseCount === 1 ? 'Response' : 'Responses'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.answerBtn}
            onPress={() => navigation.navigate('HelpDetail', { requestId: item.id })}
          >
            <Text style={styles.answerBtnText}>
              {hasResponses ? 'View Discussion' : 'Offer Help'}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandText}>
            <Text style={styles.brandName}>HelpToYou</Text>
            <Text style={styles.brandSubtitle}>Education Community Connect</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('ChatList')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.slateDark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.slateDark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.askButton}
            onPress={() => navigation.navigate('CreateHelpRequest', {})}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.askButtonText}>Ask For Help</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.welcomePanel}>
        <View style={styles.welcomeCopy}>
          <Text style={styles.eyebrow}>LEARN TOGETHER</Text>
          <Text style={styles.welcomeTitle}>Guidance starts with a question.</Text>
          <Text style={styles.welcomeSubtitle}>
            Connect with students, mentors, and educators who are ready to help.
          </Text>
        </View>
        <View style={styles.welcomeMark}>
          <Ionicons name="school" size={25} color="#FFFFFF" />
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.slateMedium} />
          <TextInput
            placeholder="Search questions, universities, courses..."
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

      {/* Category Filter Pills */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.slateMedium}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* University Filter Row */}
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

      <View style={styles.feedHeading}>
        <View>
          <Text style={styles.feedTitle}>Community questions</Text>
          <Text style={styles.feedSubtitle}>Explore questions and share what you know</Text>
        </View>
        <Text style={styles.resultCount}>{requests.length}</Text>
      </View>

      {/* Help Requests Feed */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderHelpCard}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.slateMuted} />
            <Text style={styles.emptyTitle}>No questions found</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to post a question for professors and mentors!
            </Text>
            <TouchableOpacity
              style={styles.emptyAskBtn}
              onPress={() => navigation.navigate('CreateHelpRequest', {})}
            >
              <Text style={styles.emptyAskBtnText}>+ Ask For Guidance</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {/* AI Assistant Floating Button */}
      <TouchableOpacity
        style={styles.aiFab}
        onPress={() => navigation.navigate('AIAssistant')}
      >
        <Ionicons name="sparkles" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  brandText: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 132,
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    color: colors.slateMedium,
    fontWeight: '500',
    flexShrink: 1,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
    ...shadows.sm,
  },
  askButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerIconBtn: {
    width: 30,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123C32',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    minHeight: 132,
    borderRadius: 18,
    overflow: 'hidden',
  },
  welcomeCopy: {
    flex: 1,
    paddingRight: 10,
  },
  eyebrow: {
    color: '#9BE6C3',
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '800',
    marginBottom: 7,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    maxWidth: 260,
  },
  welcomeSubtitle: {
    color: '#D1E5DD',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 280,
  },
  welcomeMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#245749',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 14,
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
  categoryScrollWrapper: {
    marginTop: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  uniScrollWrapper: {
    marginTop: 8,
    marginBottom: 4,
  },
  uniScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  uniFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  uniFilterChipActive: {
    backgroundColor: '#E2E8F0',
  },
  uniFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slateLight,
  },
  uniFilterTextActive: {
    color: colors.slateDark,
    fontWeight: '700',
  },
  feedHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slateDark,
  },
  feedSubtitle: {
    color: colors.slateLight,
    fontSize: 11,
    marginTop: 2,
  },
  resultCount: {
    minWidth: 30,
    height: 30,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: '#E7F4EE',
    color: '#176448',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingTop: 7,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E3EBE7',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  authorMeta: {
    flex: 1,
  },
  safetyButton: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slateDark,
  },
  universityMeta: {
    fontSize: 11,
    color: colors.slateMedium,
    marginTop: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slateDark,
    lineHeight: 21,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: colors.slateMedium,
    lineHeight: 18,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  uniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 4,
  },
  uniTagText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  categoryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    color: colors.slateMedium,
    fontWeight: '600',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusOpen: {
    backgroundColor: '#FEF3C7',
  },
  statusOpenText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  statusInProgress: {
    backgroundColor: '#E0F2FE',
  },
  statusInProgressText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  statusResolved: {
    backgroundColor: '#F3F4F6',
  },
  statusResolvedText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 14,
  },
  upvoteCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  repliesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repliesText: {
    fontSize: 12,
    color: colors.slateMedium,
    fontWeight: '500',
  },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  answerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slateDark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.slateMedium,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 280,
  },
  emptyAskBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyAskBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  aiFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});
