import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../storage/db';
import { HelpCategory } from '../models';
import { colors, spacing, shadows } from '../theme';
import { Button, Input } from '../components/common';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'CreateHelpRequest'>;

const CATEGORIES: HelpCategory[] = [
  'Admissions',
  'Research',
  'Syllabus & Exam',
  'Scholarships',
  'Career Guidance',
  'General Help',
];

const SUGGESTED_UNIVERSITIES = [
  'Anna University, Chennai',
  'IIT Madras',
  'Stanford University',
  'NIT Trichy',
  'UC Berkeley',
];

export function CreateHelpRequestScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProps>();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [university, setUniversity] = useState(
    route.params?.targetUniversity || user?.university || 'Anna University, Chennai'
  );
  const [department, setDepartment] = useState(user?.department || 'Computer Science');
  const [category, setCategory] = useState<HelpCategory>(
    (route.params?.defaultCategory as HelpCategory) || 'Admissions'
  );
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a clear summary title for your question.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please explain what guidance or help you need.');
      return;
    }
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to post questions.');
      navigation.navigate('Login');
      return;
    }

    setSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const created = await db.createHelpRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        university: university.trim(),
        department: department.trim(),
        urgency,
        tags: tags.length ? tags : [category, university.split(',')[0]],
        author: user,
      });

      Alert.alert(
        'Request Published!',
        'Your question has been posted to the education community board. Professors and mentors will be able to answer.',
        [
          {
            text: 'View Request',
            onPress: () => navigation.replace('HelpDetail', { requestId: created.id }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask For Guidance</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.cardHeading}>Ask the Education Community</Text>
          <Text style={styles.cardSub}>
            Reach verified professors, alumni, and current students from universities.
          </Text>

          {/* Title */}
          <Input
            label="What do you need help with? (Title) *"
            placeholder="e.g. Guidance needed for Anna University PG Entrance & Interview"
            value={title}
            onChangeText={setTitle}
            required
          />

          {/* Category Picker */}
          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.categoryPills}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, isSelected && styles.catPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Target University */}
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Target University / Institution *</Text>
          <View style={styles.uniPills}>
            {SUGGESTED_UNIVERSITIES.map((u) => {
              const isSelected = university === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.uniPill, isSelected && styles.uniPillActive]}
                  onPress={() => setUniversity(u)}
                >
                  <Text style={[styles.uniPillText, isSelected && styles.uniPillTextActive]}>
                    {u.split(',')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            placeholder="Or type custom University / College name"
            value={university}
            onChangeText={setUniversity}
            leftIcon="business-outline"
          />

          <Input
            label="Department / Course"
            placeholder="e.g. Computer Science, Mechanical, AI"
            value={department}
            onChangeText={setDepartment}
            leftIcon="book-outline"
          />

          {/* Urgency */}
          <Text style={styles.fieldLabel}>Urgency Level</Text>
          <View style={styles.urgencyRow}>
            {(['Low', 'Medium', 'High'] as const).map((lvl) => {
              const isSelected = urgency === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.urgencyPill,
                    isSelected &&
                      (lvl === 'High'
                        ? styles.urgencyHigh
                        : lvl === 'Medium'
                        ? styles.urgencyMedium
                        : styles.urgencyLow),
                  ]}
                  onPress={() => setUrgency(lvl)}
                >
                  <Text
                    style={[
                      styles.urgencyText,
                      isSelected && styles.urgencyTextActive,
                    ]}
                  >
                    {lvl}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Input
            label="Detailed Questions / Requirements *"
            placeholder="Provide context on your background, what specific questions you have, cutoff details, syllabus doubts, or scholarship criteria..."
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            required
          />

          <Input
            label="Tags (Comma-separated)"
            placeholder="e.g. Admissions, M.Tech, GATE, Anna University"
            value={tagsInput}
            onChangeText={setTagsInput}
          />

          <Button
            title={submitting ? 'Publishing...' : 'Publish Help Request'}
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitBtn}
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.slateDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slateDark,
  },
  cardSub: {
    fontSize: 13,
    color: colors.slateMedium,
    marginTop: 2,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slateDark,
    marginBottom: 8,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  uniPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  uniPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uniPillActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primary,
  },
  uniPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  uniPillTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  urgencyPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  urgencyLow: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  urgencyMedium: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  urgencyHigh: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  urgencyTextActive: {
    fontWeight: '700',
    color: colors.slateDark,
  },
  submitBtn: {
    marginTop: 16,
    borderRadius: 12,
    height: 48,
  },
});
