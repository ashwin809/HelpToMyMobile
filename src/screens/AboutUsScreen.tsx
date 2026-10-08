import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../theme';

const LEADERS = [
  {
    name: 'Pranav Kalyan',
    title: 'Founder & Student Technologist',
    bio: 'Youngest Microsoft Certified Technology Specialist, passionate about leveraging technology to democratize educational access.',
    image: require('../../downloaded_assets/pranav.png'),
  },
  {
    name: 'Senthil Krishnaswamy',
    title: 'Co-Founder & Community Lead',
    bio: 'Dedicated to building transparent bridges between donors, educational institutions, and underprivileged aspirants.',
    image: require('../../downloaded_assets/senthil.png'),
  },
  {
    name: 'Sathya Ramaswamy',
    title: 'Advisory Board Member',
    bio: 'Global technology leader mentoring students on career opportunities, higher education, and scholarship readiness.',
    image: require('../../downloaded_assets/sathya.png'),
  },
  {
    name: 'Manivannan Arumugam',
    title: 'Technology & Architecture',
    bio: 'Software engineer guiding community platform architecture and non-profit digital transformation.',
    image: require('../../downloaded_assets/mani.png'),
  },
  {
    name: 'Kalyana Kumar Mohan',
    title: 'Operations & Outreach',
    bio: 'Driving field verification, student welfare initiatives, and volunteer coordination across regions.',
    image: require('../../downloaded_assets/kalyan.png'),
  },
];

export function AboutUsScreen() {
  const currentRaised = 8365;
  const targetGoal = 14000;
  const percentage = Math.round((currentRaised / targetGoal) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Banner */}
      <View style={styles.heroCard}>
        <Image
          source={require('../../downloaded_assets/slide_4.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>HelpToYou Foundation</Text>
          <Text style={styles.heroSub}>
            Connecting those who help and those who need help.
          </Text>
        </View>
      </View>

      {/* Cause Progress Tracker */}
      <View style={styles.causeCard}>
        <View style={styles.causeHeader}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.causeLabel}>FEATURED URGENT CAUSE</Text>
        </View>
        <Text style={styles.causeHeading}>Higher Education & Student Sponsorship</Text>
        <Text style={styles.causeDesc}>
          Providing tuition fees, entrance coaching, and mentorship for underprivileged students
          entering engineering, science, and medical universities.
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressRaised}>
              ${currentRaised.toLocaleString()}{' '}
              <Text style={styles.progressSub}>raised of ${targetGoal.toLocaleString()} goal</Text>
            </Text>
            <Text style={styles.progressPercent}>{percentage}% funded</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sponsorCta}
          onPress={() => Linking.openURL('http://helptoyou.org/whatWeDo.aspx')}
        >
          <Text style={styles.sponsorCtaText}>Support a Student Today</Text>
          <Ionicons name="open-outline" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 3 Pillars */}
      <Text style={styles.sectionHeader}>How HelpToYou Works</Text>
      <View style={styles.pillarsList}>
        <View style={styles.pillarCard}>
          <View style={[styles.pillarIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="school-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.pillarText}>
            <Text style={styles.pillarTitle}>1. Education Connect</Text>
            <Text style={styles.pillarDesc}>
              Students connect directly with professors and alumni to ask questions about admissions,
              syllabi, entrance exams, and academic roadmaps.
            </Text>
          </View>
        </View>

        <View style={styles.pillarCard}>
          <View style={[styles.pillarIconBox, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#0284C7" />
          </View>
          <View style={styles.pillarText}>
            <Text style={styles.pillarTitle}>2. Screening & Verification</Text>
            <Text style={styles.pillarDesc}>
              Regional volunteers verify applicant credentials, academic transcripts, and family financial
              needs to ensure aid reaches authentic students.
            </Text>
          </View>
        </View>

        <View style={styles.pillarCard}>
          <View style={[styles.pillarIconBox, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="gift-outline" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.pillarText}>
            <Text style={styles.pillarTitle}>3. Direct Sponsorship</Text>
            <Text style={styles.pillarDesc}>
              Generous donors and alumni sponsor educational fees, laptops, and study materials directly to
              institutions on behalf of the student.
            </Text>
          </View>
        </View>
      </View>

      {/* Leadership & Team */}
      <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Our Team & Mentors</Text>
      <View style={styles.leadersList}>
        {LEADERS.map((leader, idx) => (
          <View key={idx} style={styles.leaderCard}>
            <Image source={leader.image} style={styles.leaderPhoto} resizeMode="cover" />
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderName}>{leader.name}</Text>
              <Text style={styles.leaderTitle}>{leader.title}</Text>
              <Text style={styles.leaderBio}>{leader.bio}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Official Links */}
      <View style={styles.officialCard}>
        <Text style={styles.officialTitle}>Official Foundation Information</Text>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL('http://helptoyou.org/')}
        >
          <Ionicons name="globe-outline" size={18} color={colors.primary} />
          <Text style={styles.linkText}>Website: http://helptoyou.org</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL('mailto:info@helptoyou.org')}
        >
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <Text style={styles.linkText}>Inquiries: info@helptoyou.org</Text>
        </TouchableOpacity>
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
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 190,
    position: 'relative',
    marginBottom: 16,
    ...shadows.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: 12,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  causeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...shadows.sm,
  },
  causeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  causeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  causeHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slateDark,
    marginBottom: 6,
  },
  causeDesc: {
    fontSize: 13,
    color: colors.slateMedium,
    lineHeight: 18,
    marginBottom: 14,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressRaised: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slateDark,
  },
  progressSub: {
    fontWeight: '400',
    color: colors.slateMedium,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sponsorCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  sponsorCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slateDark,
    marginBottom: 12,
  },
  pillarsList: {
    gap: 12,
  },
  pillarCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    alignItems: 'center',
    ...shadows.sm,
  },
  pillarIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarText: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slateDark,
  },
  pillarDesc: {
    fontSize: 12,
    color: colors.slateMedium,
    marginTop: 2,
    lineHeight: 16,
  },
  leadersList: {
    gap: 12,
  },
  leaderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    alignItems: 'center',
    ...shadows.sm,
  },
  leaderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primaryPale,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.slateDark,
  },
  leaderTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: 1,
  },
  leaderBio: {
    fontSize: 11.5,
    color: colors.slateMedium,
    marginTop: 4,
    lineHeight: 15,
  },
  officialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 24,
    gap: 10,
    ...shadows.sm,
  },
  officialTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slateDark,
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
