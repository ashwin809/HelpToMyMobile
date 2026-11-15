import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { communityService } from '../services/communityService';
import { growthService } from '../services/growthService';
import { googleCalendarService, GoogleCalendarStatus } from '../services/googleCalendarService';
import { useAuth } from '../hooks/useAuth';
import { hasAnyRole, LEARNER_ROLES, MENTOR_ROLES } from '../utils/rolePermissions';
import { CirclePost, HelpRequest, LearningGoal, OfficeHour, Opportunity, StudyCircle, StudyResource } from '../models';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const palette = { ink: colors.slateDark, muted: colors.slateMedium, green: colors.primaryDark, border: '#E2EAE6', bg: '#F5F8F7' };

function Shell({ children, refreshing, onRefresh }: { children: React.ReactNode; refreshing?: boolean; onRefresh?: () => void }) {
  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} colors={[colors.primary]} /> : undefined}>{children}</ScrollView></SafeAreaView>;
}

function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <View style={s.pageTitle}><Text style={s.eyebrow}>{eyebrow}</Text><Text style={s.title}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text></View>;
}

function openGoogleCalendarDraft(item: OfficeHour): Promise<void> {
  const formatCalendarTime = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const details = [`HelpToYou appointment with ${item.firstName || 'your mentor'}.`, item.meetingUrl ? `Meeting link: ${item.meetingUrl}` : '']
    .filter(Boolean)
    .join('\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.title,
    dates: `${formatCalendarTime(item.startsAt)}/${formatCalendarTime(item.endsAt)}`,
    details,
  });
  return Linking.openURL(`https://calendar.google.com/calendar/render?${params.toString()}`);
}

function Field({ value, onChangeText, placeholder, multiline = false, keyboardType }: { value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; keyboardType?: 'url' | 'default' }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8B9A95" multiline={multiline} keyboardType={keyboardType} autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'} style={[s.field, multiline && s.fieldMulti]} />;
}

function PrimaryButton({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity style={[s.primaryButton, disabled && { opacity: 0.55 }]} onPress={onPress} disabled={disabled}><Text style={s.primaryButtonText}>{title}</Text></TouchableOpacity>;
}

export function FeatureHubScreen() {
  const navigation = useNavigation<Navigation>();
  const features: { title: string; text: string; icon: keyof typeof Ionicons.glyphMap; route: keyof RootStackParamList; tone: string }[] = [
    { title: 'Study circles', text: 'Learn in small peer groups.', icon: 'people-circle-outline', route: 'StudyCircles', tone: '#E4F5EC' },
    { title: 'Mentor office hours', text: 'Request a focused guidance session.', icon: 'calendar-outline', route: 'OfficeHours', tone: '#EAF1FC' },
    { title: 'Opportunities', text: 'Save scholarships, internships, and more.', icon: 'trophy-outline', route: 'Opportunities', tone: '#FFF2DC' },
    { title: 'Progress planner', text: 'Track goals and milestones.', icon: 'flag-outline', route: 'LearningGoals', tone: '#F1EAFE' },
    { title: 'Campus Q&A', text: 'See questions for your institution.', icon: 'school-outline', route: 'CampusQA', tone: '#EAF1FC' },
    { title: 'Resource library', text: 'Share and discover useful links.', icon: 'library-outline', route: 'ResourceLibrary', tone: '#E4F5EC' },
    { title: 'Our mission', text: 'Learn why HelpToYou brings students and mentors together.', icon: 'heart-outline', route: 'AboutUs', tone: '#FCE8E8' },
  ];
  return <Shell><PageTitle eyebrow="GROW TOGETHER" title="Explore tools" subtitle="Find practical ways to learn, connect, and move toward your goals." />
    <View style={s.tileGrid}>{features.map((feature) => <TouchableOpacity key={feature.route} style={s.featureTile} onPress={() => navigation.navigate(feature.route as never)}><View style={[s.iconTile, { backgroundColor: feature.tone }]}><Ionicons name={feature.icon} size={22} color={palette.green} /></View><Text style={s.featureTitle}>{feature.title}</Text><Text style={s.featureText}>{feature.text}</Text><Ionicons name="arrow-forward" size={16} color={colors.primary} style={{ alignSelf: 'flex-end', marginTop: 8 }} /></TouchableOpacity>)}</View>
    <TouchableOpacity style={s.linkBanner} onPress={() => navigation.navigate('Main', { screen: 'Mentors' })}><Ionicons name="sparkles-outline" size={20} color="#FFFFFF" /><View style={{ flex: 1 }}><Text style={s.bannerTitle}>Find your mentor match</Text><Text style={s.bannerText}>See who shares your skills and interests.</Text></View><Ionicons name="arrow-forward" size={17} color="#FFFFFF" /></TouchableOpacity>
  </Shell>;
}

export function CampusQAScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [items, setItems] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!user?.university) { setLoading(false); return; }
    setLoading(true);
    try { setItems(await communityService.getHelpRequests({ university: user.university })); }
    catch (error) { Alert.alert('Could not load campus questions', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setLoading(false); }
  }, [user?.id, user?.university]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <Shell refreshing={loading} onRefresh={() => void load()}><PageTitle eyebrow="YOUR CAMPUS" title="Campus Q&A" subtitle={user?.university || 'Add your institution to your profile to see campus questions.'} />
    <PrimaryButton title="Ask your campus" onPress={() => navigation.navigate('CreateHelpRequest', { targetUniversity: user?.university })} />
    {loading ? <ActivityIndicator style={{ marginTop: 22 }} color={colors.primary} /> : items.map((item) => <TouchableOpacity key={item.id} style={s.card} onPress={() => navigation.navigate('HelpDetail', { requestId: item.id })}><Text style={s.tag}>{item.category}{item.title.startsWith('[DEMO]') ? ' - DEMO SAMPLE' : ''}</Text><Text style={s.cardTitle}>{item.title}</Text><Text style={s.cardBody} numberOfLines={2}>{item.description}</Text><Text style={s.meta}>{item.authorName} - {item.responseCount} replies</Text></TouchableOpacity>)}
    {!loading && items.length === 0 && <Text style={s.empty}>No campus questions yet. Start a useful local discussion.</Text>}
  </Shell>;
}

export function StudyCirclesScreen() {
  const [items, setItems] = useState<StudyCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [posts, setPosts] = useState<CirclePost[]>([]);
  const [postDraft, setPostDraft] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems(await growthService.listCircles()); } catch (error) { Alert.alert('Could not load circles', error instanceof Error ? error.message : 'Try again.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const create = async () => {
    if (name.trim().length < 3 || topic.trim().length < 2 || description.trim().length < 10) return Alert.alert('Add a little more detail', 'Enter a name, topic, and description of at least 10 characters.');
    try { await growthService.createCircle({ name: name.trim(), topic: topic.trim(), description: description.trim() }); setName(''); setTopic(''); setDescription(''); setShowForm(false); await load(); }
    catch (error) { Alert.alert('Could not create circle', error instanceof Error ? error.message : 'Try again.'); }
  };
  const join = async (circle: StudyCircle) => { try { await growthService.joinCircle(circle.id); setItems((previous) => previous.map((item) => item.id === circle.id ? { ...item, isMember: true, memberCount: item.memberCount + (item.isMember ? 0 : 1) } : item)); return true; } catch (error) { Alert.alert('Could not join', error instanceof Error ? error.message : 'Try again.'); return false; } };
  const openDiscussion = async (circle: StudyCircle) => {
    if (activeCircleId === circle.id) { setActiveCircleId(null); return; }
    if (!circle.isMember && !(await join(circle))) return;
    try { setPosts(await growthService.listCirclePosts(circle.id)); setActiveCircleId(circle.id); }
    catch (error) { Alert.alert('Could not open discussion', error instanceof Error ? error.message : 'Try again.'); }
  };
  const postUpdate = async (circleId: string) => {
    if (postDraft.trim().length < 2) return;
    try { const post = await growthService.createCirclePost(circleId, postDraft.trim()); setPosts((previous) => [post, ...previous]); setPostDraft(''); }
    catch (error) { Alert.alert('Could not share update', error instanceof Error ? error.message : 'Try again.'); }
  };
  return <Shell refreshing={loading} onRefresh={() => void load()}><PageTitle eyebrow="PEER LEARNING" title="Study circles" subtitle="Small groups make it easier to ask questions and keep each other moving." />
    <PrimaryButton title={showForm ? 'Close form' : 'Create a study circle'} onPress={() => setShowForm((value) => !value)} />
    {showForm && <View style={s.card}><Field value={name} onChangeText={setName} placeholder="Circle name" /><Field value={topic} onChangeText={setTopic} placeholder="Topic (for example, GATE prep)" /><Field value={description} onChangeText={setDescription} placeholder="What will members work on together?" multiline /><PrimaryButton title="Create circle" onPress={() => void create()} /></View>}
    {loading && !items.length ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} /> : items.map((item) => <View key={item.id} style={s.card}><View style={s.cardTop}><Text style={s.tag}>{item.topic}{item.isDemo ? ' - DEMO' : ''}</Text><Text style={s.meta}>{item.memberCount} members</Text></View><Text style={s.cardTitle}>{item.name}</Text><Text style={s.cardBody}>{item.description}</Text><Text style={s.meta}>{item.university || 'Open community'}</Text>{!item.isMember && <PrimaryButton title="Join circle" onPress={() => void join(item)} />}<PrimaryButton title={activeCircleId === item.id ? 'Close discussion' : item.isMember ? 'Open circle discussion' : 'Join and open discussion'} onPress={() => void openDiscussion(item)} />{activeCircleId === item.id && <View style={s.discussionPanel}>{posts.length ? posts.map((post) => <View key={post.id} style={s.postCard}><Text style={s.postAuthor}>{post.firstName} {post.lastName} - {post.userType}</Text><Text style={s.cardBody}>{post.content}</Text><Text style={s.meta}>{new Date(post.createdAt).toLocaleString()}</Text></View>) : <Text style={s.helper}>Start the circle's discussion with a question or study tip.</Text>}<Field value={postDraft} onChangeText={setPostDraft} placeholder="Share a question or study update" multiline /><PrimaryButton title="Post to circle" onPress={() => void postUpdate(item.id)} disabled={postDraft.trim().length < 2} /></View>}</View>)}
  </Shell>;
}

export function OfficeHoursScreen() {
  const { user } = useAuth();
  const canCoordinateAppointments = hasAnyRole(user, MENTOR_ROLES);
  const canRequestAppointments = hasAnyRole(user, LEARNER_ROLES);
  const [items, setItems] = useState<OfficeHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarStatus, setCalendarStatus] = useState<GoogleCalendarStatus>({ configured: false, connected: false });
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [officeHours, status] = await Promise.all([growthService.listOfficeHours(), googleCalendarService.getStatus()]);
      setItems(officeHours);
      setCalendarStatus(status);
    } catch (error) { Alert.alert('Could not load office hours', error instanceof Error ? error.message : 'Try again.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const connectCalendar = async () => {
    setCalendarBusy(true);
    try {
      const authorizationUrl = await googleCalendarService.startConnection();
      await Linking.openURL(authorizationUrl);
      Alert.alert('Finish Google setup', 'Approve HelpToYou in the browser, return to this screen, then tap Check connection.');
    } catch (error) { Alert.alert('Could not connect Google Calendar', error instanceof Error ? error.message : 'Try again.'); }
    finally { setCalendarBusy(false); }
  };
  const refreshCalendarStatus = async () => {
    setCalendarBusy(true);
    try { setCalendarStatus(await googleCalendarService.getStatus()); }
    catch (error) { Alert.alert('Could not check Google Calendar', error instanceof Error ? error.message : 'Try again.'); }
    finally { setCalendarBusy(false); }
  };
  const disconnectCalendar = async () => {
    setCalendarBusy(true);
    try { await googleCalendarService.disconnect(); setCalendarStatus((current) => ({ ...current, connected: false })); Alert.alert('Calendar disconnected', 'HelpToYou has removed the saved Google authorization.'); }
    catch (error) { Alert.alert('Could not disconnect Google Calendar', error instanceof Error ? error.message : 'Try again.'); }
    finally { setCalendarBusy(false); }
  };
  const addToCalendar = async (item: OfficeHour) => {
    if (!item.bookingId) return;
    setCalendarBusy(true);
    try {
      const result = await googleCalendarService.addAppointment(item.bookingId);
      setItems((previous) => previous.map((slot) => slot.id === item.id ? { ...slot, googleEventUrl: result.eventUrl || undefined } : slot));
      Alert.alert(result.alreadyAdded ? 'Already in Google Calendar' : 'Added to Google Calendar', 'The confirmed appointment is on your primary Google Calendar.', result.eventUrl ? [{ text: 'Open event', onPress: () => void Linking.openURL(result.eventUrl!) }, { text: 'Done' }] : undefined);
    } catch (error) { Alert.alert('Could not add appointment', error instanceof Error ? error.message : 'Try again.'); }
    finally { setCalendarBusy(false); }
  };
  const create = async () => {
    const startDate = new Date(startsAt); const endDate = new Date(endsAt);
    if (!title.trim() || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return Alert.alert('Check the session details', 'Enter a title and valid start/end date and time.');
    try { await growthService.createOfficeHour({ title: title.trim(), startsAt: startDate.toISOString(), endsAt: endDate.toISOString(), ...(meetingUrl.trim() ? { meetingUrl: meetingUrl.trim() } : {}) }); setShowForm(false); setTitle(''); setStartsAt(''); setEndsAt(''); setMeetingUrl(''); await load(); }
    catch (error) { Alert.alert('Could not publish office hour', error instanceof Error ? error.message : 'Use a future start time and a valid meeting link.'); }
  };
  const book = async (item: OfficeHour) => { try { await growthService.bookOfficeHour(item.id); setItems((previous) => previous.map((slot) => slot.id === item.id ? { ...slot, bookingStatus: 'requested' } : slot)); Alert.alert('Request sent', 'The mentor can now follow up about this session.'); } catch (error) { Alert.alert('Could not book', error instanceof Error ? error.message : 'Try another time.'); } };
  const respondToBooking = async (item: OfficeHour, status: 'accepted' | 'declined' | 'cancelled') => {
    if (!item.bookingId) return;
    try {
      await growthService.updateOfficeHourBooking(item.bookingId, status);
      setItems((previous) => previous.map((slot) => slot.id === item.id ? { ...slot, bookingStatus: status } : slot));
      if (status === 'cancelled') Alert.alert('Appointment cancelled', 'The mentor has been notified. Remove any Calendar event you created for this session.');
    } catch (error) { Alert.alert(status === 'cancelled' ? 'Could not cancel appointment' : 'Could not update booking', error instanceof Error ? error.message : 'Try again.'); }
  };
  return <Shell refreshing={loading} onRefresh={() => void load()}><PageTitle eyebrow="GUIDANCE SESSIONS" title="Mentor office hours" subtitle="Book a short, focused conversation or offer time to support students." />
    {calendarStatus.configured ? <View style={s.card}><Text style={s.cardTitle}>Google Calendar</Text><Text style={s.helper}>{calendarStatus.connected ? 'Connected. Confirmed appointments can be added to your primary calendar. HelpToYou does not check availability or send invitations.' : 'Connect your Google account to add confirmed appointments to your calendar.'}</Text><View style={s.cardTop}><View style={{ flex: 1 }}><PrimaryButton title={calendarBusy ? 'Please wait…' : calendarStatus.connected ? 'Check connection' : 'Connect Google Calendar'} onPress={() => void (calendarStatus.connected ? refreshCalendarStatus() : connectCalendar())} disabled={calendarBusy} /></View>{calendarStatus.connected && <View style={{ flex: 1 }}><PrimaryButton title="Disconnect" onPress={() => void disconnectCalendar()} disabled={calendarBusy} /></View>}</View></View> : <View style={s.card}><Text style={s.cardTitle}>Google Calendar</Text><Text style={s.helper}>Calendar account sync is not configured on the API yet. You can still create a prefilled Calendar event for a confirmed appointment.</Text></View>}
    {canCoordinateAppointments && <PrimaryButton title={showForm ? 'Close form' : 'Offer an office hour'} onPress={() => setShowForm((value) => !value)} />}
    {canCoordinateAppointments && showForm && <View style={s.card}><Text style={s.helper}>Times use your device's local timezone. Example: 2026-10-27 14:30</Text><Field value={title} onChangeText={setTitle} placeholder="Session topic" /><Field value={startsAt} onChangeText={setStartsAt} placeholder="Start date and time" /><Field value={endsAt} onChangeText={setEndsAt} placeholder="End date and time" /><Field value={meetingUrl} onChangeText={setMeetingUrl} placeholder="Optional meeting link" keyboardType="url" /><PrimaryButton title="Publish time" onPress={() => void create()} /></View>}
    {loading && !items.length ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} /> : items.map((item) => <View key={item.id} style={s.card}><Text style={s.tag}>{item.isDemo ? 'DEMO SAMPLE SESSION' : 'MENTOR OFFICE HOUR'}</Text><Text style={s.cardTitle}>{item.title}</Text><Text style={s.cardBody}>{item.isMine ? `${user?.firstName} ${user?.lastName} - Your session` : item.firstName ? `${item.firstName} ${item.lastName} - ${item.designation || item.userType}` : 'Community mentor'}</Text><Text style={s.meta}>{new Date(item.startsAt).toLocaleString()} - {new Date(item.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>{item.isMine && item.bookingStatus === 'requested' ? <><Text style={s.status}>Request from {item.bookerFirstName} {item.bookerLastName}</Text>{item.bookingNote ? <Text style={s.cardBody}>{item.bookingNote}</Text> : null}{canCoordinateAppointments && <View style={s.cardTop}><View style={{ flex: 1 }}><PrimaryButton title="Accept" onPress={() => void respondToBooking(item, 'accepted')} /></View><View style={{ flex: 1 }}><PrimaryButton title="Decline" onPress={() => void respondToBooking(item, 'declined')} /></View></View>}</> : item.bookingStatus ? <><Text style={s.status}>{item.bookingStatus === 'requested' ? 'Request sent' : `Booking: ${item.bookingStatus}`}</Text>{!item.isMine && (item.bookingStatus === 'requested' || item.bookingStatus === 'accepted') ? <PrimaryButton title="Cancel appointment" onPress={() => void respondToBooking(item, 'cancelled')} /> : null}</> : item.isBooked ? <Text style={s.status}>This time has been requested</Text> : !item.isMine && canRequestAppointments ? item.canRequest === false ? <Text style={s.helper}>Connect with this mentor before requesting an office hour.</Text> : <PrimaryButton title="Request this time" onPress={() => void book(item)} /> : null}{item.bookingStatus === 'accepted' && item.bookingId && <PrimaryButton title={item.googleEventUrl ? 'Open Google Calendar event' : calendarStatus.connected ? 'Add to Google Calendar' : 'Create in Google Calendar'} onPress={() => item.googleEventUrl ? void Linking.openURL(item.googleEventUrl) : calendarStatus.connected ? void addToCalendar(item) : void openGoogleCalendarDraft(item).catch((error) => Alert.alert('Could not open Google Calendar', error instanceof Error ? error.message : 'Try again.'))} disabled={calendarBusy} />}</View>)}
  </Shell>;
}

export function OpportunitiesScreen() {
  const { user } = useAuth();
  const canPublishOpportunity = hasAnyRole(user, MENTOR_ROLES);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [kind, setKind] = useState<Opportunity['kind']>('Scholarship');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [deadline, setDeadline] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems(await growthService.listOpportunities()); } catch (error) { Alert.alert('Could not load opportunities', error instanceof Error ? error.message : 'Try again.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const save = async (item: Opportunity) => { try { const isSaved = await growthService.toggleOpportunitySave(item.id); setItems((previous) => previous.map((value) => value.id === item.id ? { ...value, isSaved } : value)); } catch (error) { Alert.alert('Could not save opportunity', error instanceof Error ? error.message : 'Try again.'); } };
  const addOpportunity = async () => {
    if (title.trim().length < 4 || organization.trim().length < 2 || description.trim().length < 10) return Alert.alert('Complete the listing', 'Add a title, organization, and clear description.');
    try {
      if (deadline.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(deadline.trim())) return Alert.alert('Check the deadline', 'Use YYYY-MM-DD format.');
      const item = await growthService.createOpportunity({ title: title.trim(), organization: organization.trim(), kind, description: description.trim(), ...(eligibility.trim() ? { eligibility: eligibility.trim() } : {}), ...(deadline.trim() ? { deadline: deadline.trim() } : {}), ...(applyUrl.trim() ? { applyUrl: applyUrl.trim() } : {}) });
      setItems((previous) => [item, ...previous]); setTitle(''); setOrganization(''); setDescription(''); setEligibility(''); setDeadline(''); setApplyUrl(''); setShowForm(false);
    } catch (error) { Alert.alert('Could not share opportunity', error instanceof Error ? error.message : 'Check the listing details and try again.'); }
  };
  return <Shell refreshing={loading} onRefresh={() => void load()}><PageTitle eyebrow="NEXT STEPS" title="Opportunities" subtitle="Keep scholarships, internships, research programs, and competitions together." />
    {canPublishOpportunity && <PrimaryButton title={showForm ? 'Close listing form' : 'Share an opportunity'} onPress={() => setShowForm((value) => !value)} />}
    {canPublishOpportunity && showForm && <View style={s.card}><Text style={s.helper}>Community listings should link to an official provider page. Confirm deadlines and eligibility before applying.</Text><Field value={title} onChangeText={setTitle} placeholder="Opportunity title" /><Field value={organization} onChangeText={setOrganization} placeholder="Organization" /><View style={s.kindRow}>{(['Scholarship','Internship','Research','Competition','Other'] as Opportunity['kind'][]).map((option) => <TouchableOpacity key={option} style={[s.kindChip, kind === option && s.kindChipActive]} onPress={() => setKind(option)}><Text style={[s.kindText, kind === option && s.kindTextActive]}>{option}</Text></TouchableOpacity>)}</View><Field value={description} onChangeText={setDescription} placeholder="Describe the opportunity" multiline /><Field value={eligibility} onChangeText={setEligibility} placeholder="Who is eligible? (optional)" /><Field value={deadline} onChangeText={setDeadline} placeholder="Application deadline (YYYY-MM-DD)" /><Field value={applyUrl} onChangeText={setApplyUrl} placeholder="Official details link (optional)" keyboardType="url" /><PrimaryButton title="Publish listing" onPress={() => void addOpportunity()} /></View>}
    {loading && !items.length ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} /> : items.map((item) => <View key={item.id} style={s.card}><View style={s.cardTop}><Text style={s.tag}>{item.kind}{item.isDemo ? ' - DEMO' : ''}</Text><TouchableOpacity onPress={() => void save(item)} accessibilityLabel={item.isSaved ? 'Remove saved opportunity' : 'Save opportunity'}><Ionicons name={item.isSaved ? 'bookmark' : 'bookmark-outline'} size={21} color={colors.primaryDark} /></TouchableOpacity></View><Text style={s.cardTitle}>{item.title}</Text><Text style={s.meta}>{item.organization}{item.deadline ? ` - Deadline ${new Date(item.deadline).toLocaleDateString()}` : ''}</Text><Text style={s.cardBody}>{item.description}</Text>{item.eligibility ? <Text style={s.helper}>Who can apply: {item.eligibility}</Text> : null}{item.applyUrl ? <PrimaryButton title="View official details" onPress={() => void Linking.openURL(item.applyUrl!)} /> : <Text style={s.helper}>Sample listing - confirm current details with the provider.</Text>}</View>)}
  </Shell>;
}

export function LearningGoalsScreen() {
  const [items, setItems] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Study');
  const [dueDate, setDueDate] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems(await growthService.listGoals()); } catch (error) { Alert.alert('Could not load goals', error instanceof Error ? error.message : 'Try again.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const add = async () => { if (title.trim().length < 3) return Alert.alert('Add a goal', 'Give your goal a short, clear name.'); try { const item = await growthService.createGoal({ title: title.trim(), category: category.trim() || 'Study', dueDate: dueDate.trim() || null }); setItems((previous) => [item, ...previous]); setTitle(''); setDueDate(''); } catch (error) { Alert.alert('Could not add goal', error instanceof Error ? error.message : 'Try again.'); } };
  const update = async (item: LearningGoal, progress: number) => { try { const changed = await growthService.updateGoal(item.id, { progress }); setItems((previous) => previous.map((goal) => goal.id === item.id ? changed : goal)); } catch (error) { Alert.alert('Could not update goal', error instanceof Error ? error.message : 'Try again.'); } };
  const remove = async (item: LearningGoal) => { try { await growthService.deleteGoal(item.id); setItems((previous) => previous.filter((goal) => goal.id !== item.id)); } catch (error) { Alert.alert('Could not delete goal', error instanceof Error ? error.message : 'Try again.'); } };
  return <Shell refreshing={loading} onRefresh={() => void load()}><PageTitle eyebrow="SMALL STEPS ADD UP" title="Progress planner" subtitle="Set a goal, give it a date, and update your progress as you go." />
    <View style={s.card}><Field value={title} onChangeText={setTitle} placeholder="What do you want to achieve?" /><Field value={category} onChangeText={setCategory} placeholder="Category (Study, Research, Career...)" /><Field value={dueDate} onChangeText={setDueDate} placeholder="Optional due date (YYYY-MM-DD)" /><PrimaryButton title="Add goal" onPress={() => void add()} /></View>
    {loading && !items.length ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} /> : items.map((item) => <View key={item.id} style={s.card}><View style={s.cardTop}><Text style={s.tag}>{item.category}{item.dueDate ? ` - Due ${new Date(item.dueDate).toLocaleDateString()}` : ''}</Text><TouchableOpacity onPress={() => Alert.alert('Remove goal?', item.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => void remove(item) }])}><Ionicons name="trash-outline" size={18} color="#9B5560" /></TouchableOpacity></View><Text style={s.cardTitle}>{item.title}</Text><View style={s.progressTrack}><View style={[s.progressFill, { width: `${item.progress}%` }]} /></View><View style={s.progressRow}><Text style={s.meta}>{item.progress}% complete</Text><View style={s.progressActions}><TouchableOpacity style={s.stepButton} onPress={() => void update(item, Math.max(0, item.progress - 10))}><Text style={s.stepText}>-10</Text></TouchableOpacity><TouchableOpacity style={s.stepButton} onPress={() => void update(item, Math.min(100, item.progress + 10))}><Text style={s.stepText}>+10</Text></TouchableOpacity><TouchableOpacity style={s.stepButton} onPress={() => void update(item, 100)}><Text style={s.stepText}>Done</Text></TouchableOpacity></View></View></View>)}
    {!loading && !items.length && <Text style={s.empty}>Your goals will appear here after you add one above.</Text>}
  </Shell>;
}

export function ResourceLibraryScreen() {
  const [items, setItems] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Study skills');
  const [url, setUrl] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems(await growthService.listResources()); } catch (error) { Alert.alert('Could not load resources', error instanceof Error ? error.message : 'Try again.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const add = async () => { if (title.trim().length < 3 || description.trim().length < 5 || !/^https?:\/\//i.test(url.trim())) return Alert.alert('Check the resource', 'Add a title, short description, category, and a valid http(s) link.'); try { const item = await growthService.createResource({ title: title.trim(), description: description.trim(), category: category.trim(), url: url.trim() }); setItems((previous) => [item, ...previous]); setShowForm(false); setTitle(''); setDescription(''); setUrl(''); } catch (error) { Alert.alert('Could not share resource', error instanceof Error ? error.message : 'Try again.'); } };
  return <Shell refreshing={loading} onRefresh={() => void load()}><PageTitle eyebrow="SHARED KNOWLEDGE" title="Resource library" subtitle="Useful study guides, research links, and application checklists shared by the community." />
    <PrimaryButton title={showForm ? 'Close form' : 'Share a resource'} onPress={() => setShowForm((value) => !value)} />
    {showForm && <View style={s.card}><Field value={title} onChangeText={setTitle} placeholder="Resource title" /><Field value={category} onChangeText={setCategory} placeholder="Category" /><Field value={description} onChangeText={setDescription} placeholder="What will this help someone do?" multiline /><Field value={url} onChangeText={setUrl} placeholder="https://..." keyboardType="url" /><PrimaryButton title="Share resource" onPress={() => void add()} /></View>}
    {loading && !items.length ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} /> : items.map((item) => <View key={item.id} style={s.card}><Text style={s.tag}>{item.category}{item.isDemo ? ' - DEMO' : ''}</Text><Text style={s.cardTitle}>{item.title}</Text><Text style={s.cardBody}>{item.description}</Text><Text style={s.meta}>{item.university || 'Community resource'}</Text><PrimaryButton title="Open resource" onPress={() => void Linking.openURL(item.url)} /></View>)}
  </Shell>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg }, content: { padding: 16, paddingBottom: 32, gap: 12 },
  pageTitle: { gap: 4, marginBottom: 4 }, eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.5, fontWeight: '800' }, title: { color: palette.ink, fontSize: 24, lineHeight: 30, fontWeight: '800' }, subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 14, borderWidth: 1, borderColor: palette.border, gap: 8 }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, cardTitle: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: '800' }, cardBody: { color: palette.muted, fontSize: 12, lineHeight: 18 }, tag: { color: palette.green, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }, meta: { color: palette.muted, fontSize: 10, lineHeight: 14 }, helper: { color: palette.muted, fontSize: 10, lineHeight: 15 }, status: { color: palette.green, fontSize: 11, fontWeight: '700' }, empty: { color: palette.muted, fontSize: 12, lineHeight: 18, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 14 },
  field: { minHeight: 43, borderWidth: 1, borderColor: palette.border, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, color: palette.ink, fontSize: 12, backgroundColor: '#FBFCFC' }, fieldMulti: { minHeight: 78, textAlignVertical: 'top' }, primaryButton: { minHeight: 40, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 11, backgroundColor: palette.green, alignItems: 'center', justifyContent: 'center' }, primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, featureTile: { width: '48%', minWidth: 145, flexGrow: 1, backgroundColor: '#FFFFFF', padding: 13, borderRadius: 14, borderWidth: 1, borderColor: palette.border }, iconTile: { width: 37, height: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 9 }, featureTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' }, featureText: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }, linkBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#17483C', padding: 14, borderRadius: 14, marginTop: 3 }, bannerTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' }, bannerText: { color: '#D1E5DD', fontSize: 10, marginTop: 3 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, kindChip: { borderRadius: 9, backgroundColor: '#F1F5F9', paddingHorizontal: 9, paddingVertical: 7 }, kindChipActive: { backgroundColor: '#DFF3E7' }, kindText: { color: palette.muted, fontSize: 9, fontWeight: '700' }, kindTextActive: { color: palette.green },
  discussionPanel: { gap: 8, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: palette.border }, postCard: { padding: 10, borderRadius: 10, backgroundColor: '#F7FAF8', gap: 3 }, postAuthor: { color: palette.green, fontSize: 10, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: '#E8EFEA', borderRadius: 5, overflow: 'hidden', marginTop: 4 }, progressFill: { height: 8, backgroundColor: colors.primary, borderRadius: 5 }, progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, progressActions: { flexDirection: 'row', gap: 5 }, stepButton: { minWidth: 37, height: 28, paddingHorizontal: 6, borderRadius: 8, backgroundColor: '#EAF5EE', alignItems: 'center', justifyContent: 'center' }, stepText: { color: palette.green, fontSize: 9, fontWeight: '800' },
});
