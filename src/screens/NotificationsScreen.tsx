import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import { notificationService } from '../services';
import { AppNotification } from '../models';
import { useAuth } from '../hooks/useAuth';

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setErrorMessage('Sign in to view your notifications.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const unsubscribe = notificationService.subscribeToUserNotifications(user.id, (fetched) => {
      setNotifications(fetched);
      setLoading(false);
    }, (error) => {
      console.warn('Failed to load notifications:', error);
      setErrorMessage(`Could not load notifications. ${error.message}`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading]);

  const handleNotificationPress = async (item: AppNotification) => {
    if (!item.isRead) {
      await notificationService.markAsRead(item.id);
    }
    
    // Navigate based on type
    if (item.type === 'HELP_REQUEST' && item.relatedId) {
      navigation.navigate('HelpDetail', { requestId: item.relatedId });
    } else if (item.type === 'MESSAGE' && item.relatedId) {
      navigation.navigate('ChatThread', { threadId: item.relatedId, participantName: 'Message' });
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    let iconName: any = 'notifications-outline';
    let iconColor = colors.primary;
    let bgColor = colors.primaryPale;

    if (item.type === 'HELP_REQUEST') {
      iconName = 'hand-left-outline';
      iconColor = '#F59E0B'; // Amber
      bgColor = '#FEF3C7';
    } else if (item.type === 'MESSAGE') {
      iconName = 'chatbubble-outline';
      iconColor = '#3B82F6'; // Blue
      bgColor = '#DBEAFE';
    } else if (item.type === 'CONNECTION') {
      iconName = 'people-outline';
      iconColor = '#10B981'; // Emerald
      bgColor = '#D1FAE5';
    }

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
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
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.slateMuted} />
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySubText}>You're all caught up!</Text>
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
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    ...shadows.sm,
  },
  unreadCard: { backgroundColor: '#F0FDF4' }, // Light green tint for unread
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.slateDark, marginBottom: 4 },
  unreadText: { fontWeight: '700' },
  body: { fontSize: 13, color: colors.slateMedium, marginBottom: 6 },
  timeText: { fontSize: 11, color: colors.slateLight },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 8, marginTop: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.slateDark, marginTop: 16 },
  emptySubText: { fontSize: 14, color: colors.slateMedium, marginTop: 8 },
});
