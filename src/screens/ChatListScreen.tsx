import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';
import { chatService } from '../services';
import { ChatThread } from '../models';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reportBlockService } from '../services/reportBlockService';

export function ChatListScreen({ isTab = false }: { isTab?: boolean }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isLoading: authLoading } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setErrorMessage('Sign in to view your messages.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    let cancelled = false;
    let unsubscribe: () => void = () => {};
    void reportBlockService.getBlockedUserIds(user.id).then((blockedUserIds) => {
      if (cancelled) return;
      unsubscribe = chatService.subscribeToUserThreads(user.id, (fetchedThreads) => {
        setThreads(fetchedThreads.filter((thread) => {
          const otherUserId = thread.participants.find((participantId) => participantId !== user.id);
          return !otherUserId || !blockedUserIds.has(otherUserId);
        }));
        setLoading(false);
      }, (error) => {
        console.warn('Failed to load message threads:', error);
        setErrorMessage(`Could not load messages. ${error.message}`);
        setLoading(false);
      });
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.warn('Failed to load blocked users:', error);
      setErrorMessage(`Could not load messages. ${error instanceof Error ? error.message : 'Please try again.'}`);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user, authLoading]);

  const renderThread = ({ item }: { item: ChatThread }) => {
    // In a real app, you would fetch user profiles to show names/avatars.
    // For now, we'll just show the ID or a placeholder.
    const otherParticipantId = item.participants.find(id => id !== user?.id) || 'Unknown';
    
    return (
      <TouchableOpacity 
        style={styles.threadCard}
        onPress={() => navigation.navigate('ChatThread', { threadId: item.id, participantName: `User ${otherParticipantId.slice(0, 4)}` })}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.primary} />
        </View>
        <View style={styles.threadInfo}>
          <Text style={styles.participantName}>User {otherParticipantId.slice(0, 4)}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage ? item.lastMessage.text : 'New chat created'}
          </Text>
        </View>
        {item.lastMessage && (
          <View style={styles.metaInfo}>
            <Text style={styles.timeText}>
              {new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {!item.lastMessage.isRead && item.lastMessage.senderId !== user?.id && (
              <View style={styles.unreadBadge} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {isTab ? <View style={styles.backButton} /> : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.slateDark} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMessage ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={42} color={colors.slateMuted} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.slateMuted} />
              <Text style={styles.emptyText}>No messages yet.</Text>
              <Text style={styles.emptySubText}>Start a conversation with a mentor or peer!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.slateDark },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.slateMedium, fontSize: 14, textAlign: 'center', marginHorizontal: 28, marginTop: 12 },
  listContent: { padding: 16 },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    ...shadows.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  threadInfo: { flex: 1 },
  participantName: { fontSize: 16, fontWeight: '700', color: colors.slateDark, marginBottom: 4 },
  lastMessage: { fontSize: 13, color: colors.slateMedium },
  metaInfo: { alignItems: 'flex-end', marginLeft: 8 },
  timeText: { fontSize: 11, color: colors.slateLight, marginBottom: 6 },
  unreadBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.slateDark, marginTop: 16 },
  emptySubText: { fontSize: 14, color: colors.slateMedium, marginTop: 8 },
});
