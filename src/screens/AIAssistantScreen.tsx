import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { aiAssistantService } from '../services/aiAssistantService';
import { colors } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'AIAssistant'>;
type Message = { id: string; role: 'assistant' | 'student'; text: string };

const SUGGESTIONS = [
  'Build a 7-day exam study plan',
  'Explain machine learning simply',
  'How do I start a research project?',
  'Scholarship application checklist',
];

export function AIAssistantScreen() {
  const navigation = useNavigation<Navigation>();
  const listRef = useRef<FlatList<Message>>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can help you plan study sessions, break down research work, and organize academic tasks. Choose a prompt or ask a question.',
    },
  ]);

  useEffect(() => {
    if (messages.length > 1) listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendPrompt = async (value: string) => {
    const prompt = value.trim();
    if (!prompt || isSending) return;
    const history = messages
      .filter((message) => message.id !== 'welcome')
      .slice(-8)
      .map((message) => ({
        role: message.role === 'student' ? 'user' as const : 'assistant' as const,
        content: message.text,
      }));
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-student`, role: 'student', text: prompt },
    ]);
    setDraft('');
    setIsSending(true);
    try {
      const reply = await aiAssistantService.ask(prompt, history);
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', text: reply }]);
    } catch (error) {
      const message = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error || 'Could not reach the AI assistant. Check your connection and try again.'
        : 'Could not reach the AI assistant. Check your connection and try again.';
      setMessages((current) => [...current, { id: `${Date.now()}-assistant-error`, role: 'assistant', text: message }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.slateDark} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>Academic assistant</Text>
            <Text style={styles.headerSubtitle}>AI study assistant</Text>
          </View>
          <View style={styles.offlinePill}>
            <View style={styles.statusDot} />
            <Text style={styles.offlineText}>AI</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={17} color="#47677A" />
          <Text style={styles.noticeText}>Your question goes to the configured AI provider. Avoid private details, and verify admissions or scholarship facts with official sources.</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isStudent = item.role === 'student';
            return (
              <View style={[styles.messageRow, isStudent ? styles.studentRow : styles.assistantRow]}>
                {!isStudent && (
                  <View style={styles.assistantAvatar}><Ionicons name="sparkles" size={14} color={colors.primaryDark} /></View>
                )}
                <View style={[styles.bubble, isStudent ? styles.studentBubble : styles.assistantBubble]}>
                  {!isStudent && <Text style={styles.assistantLabel}>STUDY GUIDE</Text>}
                  <Text style={[styles.messageText, isStudent ? styles.studentText : styles.assistantText]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={isSending ? (
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" color={colors.primaryDark} />
              <Text style={styles.thinkingText}>Preparing your answer…</Text>
            </View>
          ) : messages.length === 1 ? (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>TRY ASKING</Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTIONS.map((suggestion) => (
                  <TouchableOpacity key={suggestion} style={styles.suggestionCard} onPress={() => { void sendPrompt(suggestion); }}>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                    <Ionicons name="arrow-up-outline" size={15} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : undefined}
        />

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask about study, research, or careers..."
              placeholderTextColor={colors.slateMuted}
              style={styles.input}
              multiline
              maxLength={600}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => { void sendPrompt(draft); }}
              accessibilityLabel="Your question"
            />
            <TouchableOpacity
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
              onPress={() => { void sendPrompt(draft); }}
              disabled={!draft.trim() || isSending}
              accessibilityRole="button"
              accessibilityLabel="Send question"
            >
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.communityLink} onPress={() => navigation.navigate('Main', { screen: 'Community' })}>
            <Text style={styles.communityLinkText}>Need a person’s advice? Ask the community</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  keyboardArea: { flex: 1 },
  header: {
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE8',
  },
  backButton: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.slateDark },
  headerSubtitle: { fontSize: 11, color: colors.slateMedium, marginTop: 1 },
  offlinePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E9F6EF' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16865C' },
  offlineText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, color: '#16704F' },
  thinkingRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  thinkingText: { fontSize: 12, color: colors.slateMedium },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginHorizontal: 14, marginTop: 12, padding: 11, borderRadius: 12, backgroundColor: '#EAF1F4' },
  noticeText: { flex: 1, minWidth: 0, color: '#47677A', fontSize: 11, lineHeight: 16 },
  messageList: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  assistantRow: { justifyContent: 'flex-start' },
  studentRow: { justifyContent: 'flex-end' },
  assistantAvatar: { width: 27, height: 27, borderRadius: 10, backgroundColor: '#DDF1E7', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubble: { maxWidth: '86%', borderRadius: 17, paddingHorizontal: 13, paddingVertical: 11 },
  assistantBubble: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EBE8', borderBottomLeftRadius: 5 },
  studentBubble: { backgroundColor: colors.primaryDark, borderBottomRightRadius: 5 },
  assistantLabel: { fontSize: 9, letterSpacing: 0.8, fontWeight: '800', color: colors.primaryDark, marginBottom: 5 },
  messageText: { fontSize: 13, lineHeight: 19 },
  assistantText: { color: colors.slateDark },
  studentText: { color: '#FFFFFF' },
  suggestionsSection: { paddingTop: 20, gap: 9 },
  suggestionsTitle: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: colors.slateMedium },
  suggestionsGrid: { gap: 8 },
  suggestionCard: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBE8' },
  suggestionText: { flex: 1, minWidth: 0, fontSize: 12, fontWeight: '600', color: colors.slateDark },
  composerWrap: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E4EBE8' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 6, borderRadius: 17, borderWidth: 1, borderColor: '#DCE5E1', backgroundColor: '#FBFCFC' },
  input: { flex: 1, minWidth: 0, maxHeight: 96, minHeight: 40, paddingHorizontal: 9, paddingTop: 10, paddingBottom: 8, color: colors.slateDark, fontSize: 13 },
  sendButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark },
  sendButtonDisabled: { backgroundColor: '#A8B8B0' },
  communityLink: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 7 },
  communityLinkText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
});
