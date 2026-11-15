import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { communityService } from '../services/communityService';
import { mentorService } from '../services/mentorService';
import { HelpRequest } from '../models';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { hasAnyRole, LEARNER_ROLES } from '../utils/rolePermissions';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [questionCount, setQuestionCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [featured, setFeatured] = useState<HelpRequest[]>([]);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([communityService.getHelpRequests({}), mentorService.getConnections()])
      .then(([questions, connections]) => {
        if (!active) return;
        setQuestionCount(questions.length);
        setConnectionCount(connections.filter((connection) => connection.status === 'accepted').length);
        setFeatured(questions.slice(0, 3));
      })
      .catch((error) => console.warn('Could not load home overview:', error));
    return () => { active = false; };
  }, []));

  const firstName = user?.firstName || 'there';
  const canAskCommunity = hasAnyRole(user, LEARNER_ROLES);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.greetingCopy}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.homeLogo}
              resizeMode="contain"
              accessibilityLabel="HelpToYou logo"
            />
            <Text style={styles.title} numberOfLines={2}>Good to see you, {firstName}</Text>
            <Text style={styles.subtitle}>Find guidance, share what you know, and grow your academic network.</Text>
          </View>
          <View style={styles.headerActions}>
          <TouchableOpacity style={styles.messagesButton} onPress={() => navigation.navigate('ChatList')} accessibilityLabel="Open messages">
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryDark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Main', { screen: 'Profile' })} accessibilityLabel="Open profile">
              <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{connectionCount}</Text><Text style={styles.statLabel}>Connections</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{questionCount}</Text><Text style={styles.statLabel}>Community questions</Text></View>
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Your next step</Text><Text style={styles.sectionHint}>Build momentum today</Text></View>
        <View style={styles.actionsGrid}>
          {canAskCommunity && <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CreateHelpRequest', {})}>
            <View style={[styles.actionIcon, { backgroundColor: '#E4F5EC' }]}><Ionicons name="help-circle-outline" size={21} color="#147D64" /></View>
            <Text style={styles.actionTitle}>Ask the community</Text><Text style={styles.actionText}>Get practical help from peers and mentors.</Text>
          </TouchableOpacity>}
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Main', { screen: 'Mentors' })}>
            <View style={[styles.actionIcon, { backgroundColor: '#EAF1FC' }]}><Ionicons name="people-outline" size={21} color="#2874A6" /></View>
            <Text style={styles.actionTitle}>Find a mentor</Text><Text style={styles.actionText}>Discover people by skills and experience.</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Recent questions</Text><TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Community' })}><Text style={styles.seeAll}>See community</Text></TouchableOpacity></View>
        {featured.length ? featured.map((request) => (
          <TouchableOpacity key={request.id} style={styles.questionCard} onPress={() => navigation.navigate('HelpDetail', { requestId: request.id })}>
            <View style={styles.questionTop}><Text style={styles.questionCategory}>{request.category}</Text><Ionicons name="arrow-forward" size={16} color={colors.primary} /></View>
            <Text style={styles.questionTitle} numberOfLines={2}>{request.title}</Text>
            <Text style={styles.questionMeta} numberOfLines={1}>{request.authorName} - {request.responseCount || 0} replies</Text>
          </TouchableOpacity>
        )) : (
          <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('Main', { screen: 'Community' })}>
            <Text style={styles.emptyText}>Explore the community and be the first to start a conversation.</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F8F7' },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  greetingCopy: { flex: 1, minWidth: 0 },
  homeLogo: { width: 142, height: 25, alignSelf: 'flex-start', marginBottom: 5 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.6, fontWeight: '800', marginBottom: 5 },
  title: { color: colors.slateDark, fontSize: 23, lineHeight: 28, fontWeight: '800' },
  subtitle: { color: colors.slateMedium, fontSize: 12, lineHeight: 18, marginTop: 5 },
  avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#DFF4E9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primaryDark, fontSize: 18, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  messagesButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, minWidth: 0, padding: 14, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8' },
  statValue: { color: colors.slateDark, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.slateMedium, fontSize: 11, lineHeight: 15, marginTop: 3 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  sectionTitle: { color: colors.slateDark, fontSize: 16, fontWeight: '800' },
  sectionHint: { color: colors.slateLight, fontSize: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '48%', flexGrow: 1, minWidth: 138, padding: 12, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8' },
  actionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  actionTitle: { color: colors.slateDark, fontSize: 12, fontWeight: '800' },
  actionText: { color: colors.slateMedium, fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  seeAll: { color: colors.primaryDark, fontSize: 11, fontWeight: '700' },
  questionCard: { padding: 13, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8', gap: 5 },
  questionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionCategory: { color: colors.primaryDark, fontSize: 10, fontWeight: '700' },
  questionTitle: { color: colors.slateDark, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  questionMeta: { color: colors.slateLight, fontSize: 10 },
  emptyCard: { padding: 14, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8' },
  emptyText: { color: colors.slateMedium, fontSize: 12, lineHeight: 18 },
});
