import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../storage/db';
import { HelpRequest, HelpResponse } from '../models';
import { colors, spacing, shadows } from '../theme';
import { Badge, Button } from '../components/common';
import { showUserSafetyActions } from '../utils/userSafetyActions';

type RouteProps = RouteProp<RootStackParamList, 'HelpDetail'>;

export function HelpDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { requestId } = route.params;

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await db.getHelpRequestById(requestId);
      setRequest(data);
    } catch (err) {
      console.warn('Failed to load request:', err);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Empty Reply', 'Please write your advice or guidance before submitting.');
      return;
    }
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to answer questions.');
      return;
    }

    setSubmittingReply(true);
    try {
      await db.addResponseToRequest({
        requestId,
        content: replyText.trim(),
        author: user,
      });
      setReplyText('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not post your reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleMarkResolved = async () => {
    try {
      await db.updateRequestStatus(requestId, 'resolved');
      Alert.alert('Success', 'Question marked as resolved.');
      await loadData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleUpvote = async () => {
    if (!request) return;
    await db.toggleUpvoteRequest(request.id);
    setRequest((prev) => (prev ? { ...prev, upvotes: (prev.upvotes || 0) + 1 } : null));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Help request not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAuthor = user && user.id === request.authorId;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Help & Discussion
        </Text>
        <TouchableOpacity style={styles.headerUpvote} onPress={handleUpvote}>
          <Ionicons name="arrow-up-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.headerUpvoteText}>{request.upvotes || 0}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Main Question Card */}
        <View style={styles.mainCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {request.authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <View style={styles.authorTopLine}>
                <Text style={styles.authorName}>{request.authorName}</Text>
                <Badge label={request.authorRole} size="sm" variant="sponsor" />
              </View>
              <Text style={styles.authorSub}>
                {request.authorDesignation || request.authorUniversity || 'Community Member'}
              </Text>
            </View>

            {user && user.id !== request.authorId && (
              <TouchableOpacity
                style={styles.safetyButton}
                accessibilityRole="button"
                accessibilityLabel={`Safety options for ${request.authorName}`}
                onPress={() => showUserSafetyActions({
                  currentUserId: user.id,
                  targetUserId: request.authorId,
                  targetName: request.authorName,
                  contentType: 'help_request',
                  contentId: request.id,
                  onBlocked: () => navigation.goBack(),
                })}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={colors.slateMedium} />
              </TouchableOpacity>
            )}

            <View
              style={[
                styles.statusPill,
                request.status === 'resolved'
                  ? styles.statusResolved
                  : request.status === 'in_progress'
                  ? styles.statusInProgress
                  : styles.statusOpen,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  request.status === 'resolved'
                    ? styles.statusResolvedText
                    : request.status === 'in_progress'
                    ? styles.statusInProgressText
                    : styles.statusOpenText,
                ]}
              >
                {request.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{request.title}</Text>

          <Text style={styles.description}>{request.description}</Text>

          {/* Metadata Chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Ionicons name="school-outline" size={13} color={colors.primaryDark} />
              <Text style={styles.chipText}>{request.university}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="pricetag-outline" size={13} color={colors.slateMedium} />
              <Text style={styles.chipText}>{request.category}</Text>
            </View>
            {request.urgency === 'High' && (
              <View style={[styles.chip, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="flash" size={13} color="#EF4444" />
                <Text style={[styles.chipText, { color: '#B91C1C' }]}>Urgent</Text>
              </View>
            )}
          </View>

          {/* Author Actions */}
          {isAuthor && request.status !== 'resolved' && (
            <TouchableOpacity style={styles.resolveBtn} onPress={handleMarkResolved}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Responses Thread */}
        <View style={styles.threadHeader}>
          <Text style={styles.threadTitle}>
            Responses & Guidance ({request.responses?.length || 0})
          </Text>
          <Text style={styles.threadSubtitle}>
            Verified advice from professors, alumni, and campus mentors
          </Text>
        </View>

        {(!request.responses || request.responses.length === 0) ? (
          <View style={styles.noResponsesBox}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.slateMuted} />
            <Text style={styles.noResponsesText}>
              No one has replied yet. Be the first to help!
            </Text>
          </View>
        ) : (
          request.responses.map((resp: HelpResponse) => (
            <View key={resp.id} style={styles.responseCard}>
              <View style={styles.respHeader}>
                <View style={styles.respAvatar}>
                  <Text style={styles.respAvatarText}>
                    {resp.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.respMeta}>
                  <View style={styles.respNameRow}>
                    <Text style={styles.respAuthor}>{resp.authorName}</Text>
                    <Badge
                      label={resp.authorRole}
                      size="sm"
                      variant={
                        resp.authorRole === 'Professor'
                          ? 'volunteer'
                          : resp.authorRole === 'Alumni'
                          ? 'sponsor'
                          : 'neutral'
                      }
                    />
                    {resp.isAccepted && (
                      <View style={styles.acceptedBadge}>
                        <Ionicons name="checkmark" size={12} color="#059669" />
                        <Text style={styles.acceptedText}>Helpful Answer</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.respAffiliation}>
                    {resp.authorDesignation || resp.authorUniversity || 'Academic Mentor'}
                  </Text>
                </View>
              </View>

              <Text style={styles.respContent}>{resp.content}</Text>

              <View style={styles.respFooter}>
                <View style={styles.respHelpfulRow}>
                  <Ionicons name="thumbs-up-outline" size={14} color={colors.slateMedium} />
                  <Text style={styles.respHelpfulCount}>{resp.upvotes || 0} found this helpful</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Reply Form */}
        <View style={styles.replyCard}>
          <Text style={styles.replyCardTitle}>Offer Your Guidance</Text>
          {user ? (
            <Text style={styles.replyingAs}>
              Replying as: <Text style={{ fontWeight: '700' }}>{user.firstName} {user.lastName}</Text> ({user.userType} • {user.university?.split(',')[0]})
            </Text>
          ) : (
            <Text style={styles.replyingAs}>
              You are currently viewing as guest. Sign in to reply.
            </Text>
          )}

          <TextInput
            placeholder="Share step-by-step guidance, admission advice, or resources..."
            placeholderTextColor={colors.slateMuted}
            style={styles.replyInput}
            multiline
            numberOfLines={4}
            value={replyText}
            onChangeText={setReplyText}
          />

          <Button
            title={submittingReply ? 'Posting...' : 'Post Guidance / Advice'}
            onPress={handlePostReply}
            loading={submittingReply}
            style={styles.postBtn}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    color: colors.slateDark,
  },
  headerUpvote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  headerUpvoteText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...shadows.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  authorInfo: {
    flex: 1,
  },
  safetyButton: {
    width: 30,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slateDark,
  },
  authorSub: {
    fontSize: 12,
    color: colors.slateMedium,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusOpen: {
    backgroundColor: '#FEF3C7',
  },
  statusOpenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  statusInProgress: {
    backgroundColor: '#E0F2FE',
  },
  statusInProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  statusResolved: {
    backgroundColor: '#DCFCE7',
  },
  statusResolvedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slateDark,
    lineHeight: 25,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.slateDark,
    lineHeight: 22,
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 6,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  threadHeader: {
    marginBottom: 14,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slateDark,
  },
  threadSubtitle: {
    fontSize: 12,
    color: colors.slateMedium,
    marginTop: 2,
  },
  noResponsesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  noResponsesText: {
    fontSize: 13,
    color: colors.slateMedium,
    marginTop: 8,
    textAlign: 'center',
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...shadows.sm,
  },
  respHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  respAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  respAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  respMeta: {
    flex: 1,
  },
  respNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  respAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slateDark,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  acceptedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  respAffiliation: {
    fontSize: 11,
    color: colors.slateMedium,
    marginTop: 1,
  },
  respContent: {
    fontSize: 13.5,
    color: colors.slateDark,
    lineHeight: 20,
    marginBottom: 10,
  },
  respFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  respHelpfulRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  respHelpfulCount: {
    fontSize: 12,
    color: colors.slateMedium,
  },
  replyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    ...shadows.sm,
  },
  replyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slateDark,
  },
  replyingAs: {
    fontSize: 12,
    color: colors.slateMedium,
    marginTop: 2,
    marginBottom: 12,
  },
  replyInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.slateDark,
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 12,
  },
  postBtn: {
    borderRadius: 12,
    height: 44,
  },
  errorText: {
    fontSize: 15,
    color: colors.slateMedium,
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
