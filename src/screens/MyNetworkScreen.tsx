import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { mentorService } from '../services/mentorService';
import { Connection, User } from '../models';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { hasAnyRole, MENTOR_ROLES } from '../utils/rolePermissions';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function MyNetworkScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const canRespondToRequests = hasAnyRole(user, MENTOR_ROLES);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [nextConnections, nextPeople] = await Promise.all([mentorService.getConnections(), mentorService.getMentors({})]);
      setConnections(nextConnections);
      setPeople(nextPeople);
    } catch (error) {
      console.warn('Could not load your network:', error);
    } finally { setLoading(false); }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const personFor = (connection: Connection) => {
    const otherId = connection.fromUserId === user?.id ? connection.toUserId : connection.fromUserId;
    return people.find((person) => person.id === otherId);
  };
  const inbound = connections.filter((item) => item.status === 'pending' && item.toUserId === user?.id);
  const outbound = connections.filter((item) => item.status === 'pending' && item.fromUserId === user?.id);
  const accepted = connections.filter((item) => item.status === 'accepted');
  const declined = connections.filter((item) => item.status === 'declined');

  const respond = async (connection: Connection, status: 'accepted' | 'declined') => {
    setWorkingId(connection.id);
    try {
      await mentorService.updateConnection(connection.id, status);
      await load();
    } catch (error) {
      Alert.alert('Could not update request', error instanceof Error ? error.message : 'Please try again.');
    } finally { setWorkingId(null); }
  };

  const startChat = async (person: User) => {
    if (!user) return;
    try {
      const threadId = await chatService.createOrGetThread(user.id, person.id);
      navigation.navigate('ChatThread', { threadId, participantName: `${person.firstName} ${person.lastName}` });
    } catch (error) {
      Alert.alert('Could not open conversation', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const renderPerson = (connection: Connection, kind: 'accepted' | 'inbound' | 'outbound' | 'declined') => {
    const person = personFor(connection);
    const name = person ? `${person.firstName} ${person.lastName}` : 'Community member';
    return (
      <View key={connection.id} style={styles.personCard}>
        {person?.avatarUrl ? <Image source={{ uri: person.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Ionicons name="person" size={19} color={colors.primaryDark} /></View>}
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={2}>{name}</Text>
          <Text style={styles.personMeta} numberOfLines={1}>{person?.designation || person?.userType || 'Member'}{person?.university ? ` - ${person.university}` : ''}</Text>
          {kind === 'outbound' && <Text style={styles.pendingText}>Request sent - awaiting response</Text>}
          {kind === 'declined' && <Text style={styles.declinedText}>Request declined</Text>}
          {connection.message && kind === 'inbound' && <Text style={styles.requestMessage} numberOfLines={2}>{connection.message}</Text>}
        </View>
        {kind === 'accepted' ? (
          <TouchableOpacity style={styles.messageButton} onPress={() => person && void startChat(person)} accessibilityLabel={`Message ${name}`}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryDark} />
          </TouchableOpacity>
        ) : kind === 'inbound' && canRespondToRequests ? (
          <View style={styles.requestActions}>
            <TouchableOpacity style={styles.acceptButton} disabled={workingId === connection.id} onPress={() => void respond(connection, 'accepted')}>
              {workingId === connection.id ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.acceptText}>Accept</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineButton} disabled={workingId === connection.id} onPress={() => void respond(connection, 'declined')}><Text style={styles.declineText}>Decline</Text></TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} colors={[colors.primary]} />}
      >
            <Text style={styles.eyebrow}>YOUR COMMUNITY</Text>
            <Text style={styles.title}>My Network</Text>
            <Text style={styles.subtitle}>Keep the people and conversations helping you move forward in one place.</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{accepted.length}</Text><Text style={styles.summaryLabel}>Connected</Text></View>
              <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{inbound.length}</Text><Text style={styles.summaryLabel}>Requests to review</Text></View>
              <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{outbound.length}</Text><Text style={styles.summaryLabel}>Awaiting reply</Text></View>
            </View>
            <TouchableOpacity style={styles.discoverBanner} onPress={() => navigation.navigate('Main', { screen: 'Mentors' })}>
              <View style={styles.discoverIcon}><Ionicons name="compass-outline" size={20} color="#FFFFFF" /></View>
              <View style={styles.discoverCopy}><Text style={styles.discoverTitle}>Grow your network</Text><Text style={styles.discoverText}>Find students, alumni, and mentors who share your interests.</Text></View>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            {loading && !people.length && <ActivityIndicator style={{ marginTop: 18 }} color={colors.primary} />}
            <Section title="Connection requests" count={inbound.length} />
            {!inbound.length && !loading && <Text style={styles.emptyText}>You are all caught up. New requests will show here.</Text>}
            {inbound.map((item) => renderPerson(item, 'inbound'))}
            {outbound.length > 0 && <Section title="Awaiting response" count={outbound.length} />}
            {outbound.map((item) => renderPerson(item, 'outbound'))}
            {declined.length > 0 && <Section title="Past requests" count={declined.length} />}
            {declined.map((item) => renderPerson(item, 'declined'))}
            <Section title="Your connections" count={accepted.length} />
            {!accepted.length && !loading && <Text style={styles.emptyText}>Your accepted connections will appear here. Explore mentors to meet people.</Text>}
            {accepted.map((item) => renderPerson(item, 'accepted'))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, count }: { title: string; count: number }) {
  return <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.countPill}><Text style={styles.countText}>{count}</Text></View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F8F7' },
  content: { padding: 16, paddingBottom: 28 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 5 },
  title: { color: colors.slateDark, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.slateMedium, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCard: { flex: 1, minWidth: 0, paddingVertical: 11, paddingHorizontal: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8', borderRadius: 13, alignItems: 'center' },
  summaryNumber: { color: colors.slateDark, fontSize: 20, fontWeight: '800' },
  summaryLabel: { color: colors.slateMedium, textAlign: 'center', fontSize: 9.5, lineHeight: 13, marginTop: 2 },
  discoverBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 15, backgroundColor: '#17483C', marginBottom: 6 },
  discoverIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#2A6758', alignItems: 'center', justifyContent: 'center' },
  discoverCopy: { flex: 1, minWidth: 0 },
  discoverTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  discoverText: { color: '#D1E5DD', fontSize: 10, lineHeight: 14, marginTop: 2 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: colors.slateDark, fontSize: 15, fontWeight: '800' },
  countPill: { minWidth: 21, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#E4F5EC', alignItems: 'center' },
  countText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  personCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8', borderRadius: 14, padding: 11, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#E4F5EC', alignItems: 'center', justifyContent: 'center' },
  personInfo: { flex: 1, minWidth: 0 },
  personName: { color: colors.slateDark, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  personMeta: { color: colors.slateMedium, fontSize: 10, marginTop: 2 },
  pendingText: { color: '#8B6A22', fontSize: 9.5, marginTop: 3 },
  declinedText: { color: '#B91C1C', fontSize: 9.5, marginTop: 3 },
  requestMessage: { color: colors.slateMedium, fontSize: 10, lineHeight: 14, marginTop: 4 },
  messageButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E4F5EC', alignItems: 'center', justifyContent: 'center' },
  requestActions: { gap: 5 },
  acceptButton: { minWidth: 62, height: 30, borderRadius: 9, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  acceptText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  declineButton: { minWidth: 62, height: 28, borderRadius: 9, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  declineText: { color: colors.slateMedium, fontSize: 10, fontWeight: '700' },
  emptyText: { color: colors.slateMedium, fontSize: 11, lineHeight: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8', borderRadius: 12, padding: 12 },
});
