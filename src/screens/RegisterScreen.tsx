import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { getAuthErrorMessage } from '../services/authService';
import { colors, spacing, typography, shadows } from '../theme';
import { Button, Input } from '../components/common';
import { UserRole } from '../models';
import {
  searchWorldwideUniversities,
  UniversityItem,
  getPopularUniversities,
} from '../services/universityService';
import {
  searchWorldwideLocations,
  LocationResult,
  findKnownPincode,
} from '../services/locationService';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Register'>;
type RegisterRouteProp = RouteProp<RootStackParamList, 'Register'>;

const ROLE_OPTIONS: { role: UserRole; title: string; subtitle: string; icon: string }[] = [
  {
    role: 'Student',
    title: 'Student / Aspirant',
    subtitle: 'Seeking admissions, exam guidance, notes & mentoring',
    icon: '👨‍🎓',
  },
  {
    role: 'Professor',
    title: 'Professor / Faculty',
    subtitle: 'University educators guiding students & research',
    icon: '🎓',
  },
  {
    role: 'Alumni',
    title: 'Alumni / Mentor',
    subtitle: 'Graduates & tech professionals giving back to juniors',
    icon: '💼',
  },
  {
    role: 'Sponsor',
    title: 'Sponsor / Donor',
    subtitle: 'Providing educational aid & tuition assistance',
    icon: '🤝',
  },
  {
    role: 'Volunteer',
    title: 'Volunteer',
    subtitle: 'Regional community coordinator & student verification',
    icon: '🌟',
  },
];

export function RegisterScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RegisterRouteProp>();
  const { register, isLoading } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const locationSectionRef = useRef<View>(null);

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    (route.params?.role as UserRole) || 'Student'
  );

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // University state
  const [university, setUniversity] = useState('Anna University, Chennai');
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [uniResults, setUniResults] = useState<UniversityItem[]>([]);
  const [isSearchingUni, setIsSearchingUni] = useState(false);
  const [showUniDropdown, setShowUniDropdown] = useState(false);

  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [bio, setBio] = useState('');

  // Location state
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [pincodeAutoDetected, setPincodeAutoDetected] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  // Initial load of popular universities
  useEffect(() => {
    setUniResults(getPopularUniversities().slice(0, 10));
  }, []);

  // Debounced Worldwide University Search
  useEffect(() => {
    if (!uniSearchQuery.trim()) {
      setUniResults(getPopularUniversities().slice(0, 10));
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUni(true);
      try {
        const results = await searchWorldwideUniversities(uniSearchQuery);
        setUniResults(results);
      } catch {
        // fallback handled in service
      } finally {
        setIsSearchingUni(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [uniSearchQuery]);

  // Debounced Worldwide Location Search
  useEffect(() => {
    if (!locationSearchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchWorldwideLocations(locationSearchQuery);
        setLocationResults(results);
      } catch {
        // fallback handled in service
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [locationSearchQuery]);

  // Handle selecting a university
  const handleSelectUniversity = (item: UniversityItem) => {
    const displayName = item.country ? `${item.name} (${item.country})` : item.name;
    setUniversity(displayName);
    setShowUniDropdown(false);
    setUniSearchQuery('');
    Keyboard.dismiss();
  };

  // Handle selecting a worldwide location
  const handleSelectLocation = (item: LocationResult) => {
    setCity(item.city);
    setState(item.state);
    setCountry(item.country);
    if (item.postcode) {
      setPincode(item.postcode);
      setPincodeAutoDetected(true);
    } else {
      const known = findKnownPincode(item.city, item.country);
      if (known) {
        setPincode(known);
        setPincodeAutoDetected(true);
      }
    }
    setLocationSearchQuery(item.displayName);
    setShowLocationDropdown(false);
    Keyboard.dismiss();
  };

  // When city changes manually, try detecting pincode
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    if (newCity.trim().length >= 3) {
      const detected = findKnownPincode(newCity, country);
      if (detected) {
        setPincode(detected);
        setPincodeAutoDetected(true);
      }
    }
  };

  // Smooth scroll down to location section after bio
  const handleDoneWithBio = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 1100, animated: true });
    }, 100);
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please enter both First Name and Last Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (!university.trim()) {
      setErrorMessage('Please enter your University or Institution.');
      return;
    }

    setErrorMessage('');
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        userType: selectedRole,
        university: university.trim(),
        department: department.trim() || 'General Studies',
        designation:
          designation.trim() ||
          (selectedRole === 'Professor'
            ? 'Professor'
            : selectedRole === 'Student'
            ? 'Student Aspirant'
            : 'Member'),
        skills: skills.length ? skills : ['Education Help'],
        bio: bio.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postCode: pincode.trim(),
        phone: phone.trim(),
      });

      Alert.alert(
        'Welcome to HelpToYou!',
        `Your account as ${selectedRole} has been created successfully. You can now connect and ask for or provide educational help.`,
        [{ text: 'Continue' }]
      );
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      style={styles.screen}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={true}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>HelpToYou Community</Text>
          <Text style={styles.tagline}>
            Join our global education network of students, professors & alumni
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Account</Text>
          <Text style={styles.cardSubtitle}>
            Connect with academic mentors, peer networks, and institutions worldwide.
          </Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Role Selector Cards */}
          <Text style={styles.sectionLabel}>Select Your Role *</Text>
          <View style={styles.roleGrid}>
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = selectedRole === opt.role;
              return (
                <TouchableOpacity
                  key={opt.role}
                  style={[styles.roleCard, isSelected && styles.roleCardActive]}
                  onPress={() => setSelectedRole(opt.role)}
                >
                  <Text style={styles.roleIcon}>{opt.icon}</Text>
                  <View style={styles.roleContent}>
                    <Text
                      style={[
                        styles.roleTitle,
                        isSelected && styles.roleTitleActive,
                      ]}
                    >
                      {opt.title}
                    </Text>
                    <Text style={styles.roleSub}>{opt.subtitle}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleActive,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Basic Information */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
            Basic Information
          </Text>
          <View style={styles.nameRow}>
            <View style={styles.nameCol}>
              <Input
                label="First Name"
                placeholder="e.g. Arun"
                value={firstName}
                onChangeText={setFirstName}
                required
              />
            </View>
            <View style={styles.nameCol}>
              <Input
                label="Last Name"
                placeholder="e.g. Kumar"
                value={lastName}
                onChangeText={setLastName}
                required
              />
            </View>
          </View>

          <Input
            label="Email Address"
            placeholder="e.g. student@institution.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail-outline"
            required
          />

          <Input
            label="Create Password"
            placeholder="At least 6 characters"
            isPassword
            value={password}
            onChangeText={setPassword}
            leftIcon="lock-closed-outline"
            required
          />

          <Input
            label="Phone / Mobile (Optional)"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            leftIcon="call-outline"
          />

          {/* Educational Affiliation & Worldwide Universities */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
            Educational Affiliation & Expertise
          </Text>

          <View style={styles.fieldHeaderRow}>
            <Text style={styles.subFieldLabel}>University / College (Worldwide) *</Text>
            <TouchableOpacity
              onPress={() => setShowUniDropdown(!showUniDropdown)}
              style={styles.searchToggleBtn}
            >
              <Ionicons
                name={showUniDropdown ? 'chevron-up-circle' : 'search-circle'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.searchToggleText}>
                {showUniDropdown ? 'Close Search' : 'Search Worldwide List'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Popular Picks */}
          <View style={styles.uniPills}>
            {[
              'Anna University, Chennai',
              'IIT Madras',
              'Stanford University',
              'University of Oxford',
              'University of Toronto',
            ].map((u) => {
              const isSelected = university.includes(u.split(',')[0]);
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.uniPill, isSelected && styles.uniPillActive]}
                  onPress={() => {
                    setUniversity(u);
                    setShowUniDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.uniPillText,
                      isSelected && styles.uniPillTextActive,
                    ]}
                  >
                    {u.split(',')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Worldwide University Search Bar & Dropdown */}
          <View style={styles.searchBoxContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={colors.primary} style={styles.searchIcon} />
              <Input
                containerStyle={{ marginBottom: 0, flex: 1 }}
                style={{ paddingVertical: 4 }}
                placeholder="Search any university/college worldwide..."
                value={uniSearchQuery}
                onChangeText={(text) => {
                  setUniSearchQuery(text);
                  setShowUniDropdown(true);
                }}
                onFocus={() => setShowUniDropdown(true)}
              />
              {isSearchingUni && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
              )}
              {uniSearchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setUniSearchQuery('');
                    setUniResults(getPopularUniversities().slice(0, 10));
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.slateLight} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Dropdown Suggestions */}
            {showUniDropdown && (
              <View style={styles.dropdownCard}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>
                    {uniSearchQuery
                      ? `Worldwide Results for "${uniSearchQuery}"`
                      : 'Global Universities & Colleges'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowUniDropdown(false)}>
                    <Text style={styles.dropdownCloseText}>Done</Text>
                  </TouchableOpacity>
                </View>

                {uniResults.length === 0 && !isSearchingUni ? (
                  <View style={styles.emptyResultsBox}>
                    <Text style={styles.emptyResultsText}>
                      No exact match found. You can enter your college name directly below.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.resultsList}>
                    {uniResults.slice(0, 8).map((item, index) => (
                      <TouchableOpacity
                        key={`${item.name}-${index}`}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectUniversity(item)}
                      >
                        <Ionicons name="school" size={18} color={colors.primary} style={{ marginTop: 2, marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dropdownItemTitle}>{item.name}</Text>
                          <Text style={styles.dropdownItemSub}>
                            {item.stateProvince ? `${item.stateProvince}, ` : ''}{item.country}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.slateLight} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Selected / Custom University Field */}
          <Input
            label="Selected University / Institution"
            placeholder="Type or confirm your University name"
            value={university}
            onChangeText={setUniversity}
            leftIcon="school-outline"
            helperText="Selected from worldwide database or customized"
          />

          <Input
            label="Department / Field of Study"
            placeholder="e.g. Computer Science, Mechanical, AI & Data Science"
            value={department}
            onChangeText={setDepartment}
            leftIcon="book-outline"
          />

          <Input
            label={
              selectedRole === 'Professor'
                ? 'Designation & Academic Title'
                : selectedRole === 'Student'
                ? 'Current Academic Status / Year'
                : 'Current Role & Company'
            }
            placeholder={
              selectedRole === 'Professor'
                ? 'e.g. Associate Professor / Research Guide'
                : selectedRole === 'Student'
                ? 'e.g. Aspirant applying for PG / Final Year B.Tech'
                : 'e.g. Staff Engineer @ Tech Co'
            }
            value={designation}
            onChangeText={setDesignation}
          />

          <Input
            label="Skills & Guidance Areas (Comma separated)"
            placeholder="e.g. PG Admissions, GATE Prep, Machine Learning, SOP"
            value={skillsText}
            onChangeText={setSkillsText}
            helperText="Topics you can help others with, or topics you need guidance on"
          />

          {/* Bio Input with Done/Dismiss action */}
          <View>
            <Input
              label="Bio / Introduction"
              placeholder={
                selectedRole === 'Professor'
                  ? 'Briefly describe your research interests and how you mentor students...'
                  : 'Briefly describe what help you are looking for or your academic goals...'
              }
              multiline
              numberOfLines={4}
              value={bio}
              onChangeText={setBio}
              returnKeyType="default"
            />
            {/* Quick helper button to dismiss keyboard and scroll down */}
            <TouchableOpacity
              style={styles.bioDoneBtn}
              onPress={handleDoneWithBio}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-down-circle" size={18} color={colors.primary} />
              <Text style={styles.bioDoneBtnText}>Done with Bio &bull; Continue to Location &darr;</Text>
            </TouchableOpacity>
          </View>

          {/* Worldwide Location Details */}
          <View ref={locationSectionRef} style={{ marginTop: 24 }}>
            <View style={styles.locationSectionHeader}>
              <View>
                <Text style={styles.sectionLabel}>Location (Worldwide)</Text>
                <Text style={styles.locationSubText}>
                  Search any city or region worldwide. Pincode / Postal code will be auto-filled.
                </Text>
              </View>
              <Ionicons name="globe-outline" size={24} color={colors.primary} />
            </View>

            {/* Worldwide Location Search Box */}
            <View style={styles.searchBoxContainer}>
              <View style={styles.searchBox}>
                <Ionicons name="location-outline" size={18} color={colors.primary} style={styles.searchIcon} />
                <Input
                  containerStyle={{ marginBottom: 0, flex: 1 }}
                  style={{ paddingVertical: 4 }}
                  placeholder="Type city or place (e.g. Chennai, London, New York)..."
                  value={locationSearchQuery}
                  onChangeText={(text) => {
                    setLocationSearchQuery(text);
                    setShowLocationDropdown(true);
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                />
                {isSearchingLocation && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                )}
                {locationSearchQuery ? (
                  <TouchableOpacity
                    onPress={() => {
                      setLocationSearchQuery('');
                      setLocationResults([]);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.slateLight} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Location Results Dropdown */}
              {showLocationDropdown && (
                <View style={styles.dropdownCard}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>
                      {locationSearchQuery
                        ? `Matches for "${locationSearchQuery}"`
                        : 'Popular Global Locations'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowLocationDropdown(false)}>
                      <Text style={styles.dropdownCloseText}>Close</Text>
                    </TouchableOpacity>
                  </View>

                  {locationResults.length === 0 && !isSearchingLocation ? (
                    <View style={styles.emptyResultsBox}>
                      <Text style={styles.emptyResultsText}>
                        Type 3 or more letters to search worldwide cities.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.resultsList}>
                      {locationResults.slice(0, 8).map((item, index) => (
                        <TouchableOpacity
                          key={`${item.city}-${item.country}-${index}`}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectLocation(item)}
                        >
                          <Ionicons name="pin" size={18} color={colors.primary} style={{ marginTop: 2, marginRight: 8 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dropdownItemTitle}>
                              {item.city}{item.state ? `, ${item.state}` : ''}
                            </Text>
                            <Text style={styles.dropdownItemSub}>{item.country}</Text>
                          </View>
                          {item.postcode ? (
                            <View style={styles.postcodeBadge}>
                              <Text style={styles.postcodeBadgeText}>PIN: {item.postcode}</Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* City & State Fields */}
            <View style={styles.nameRow}>
              <View style={styles.nameCol}>
                <Input
                  label="City"
                  placeholder="e.g. Chennai"
                  value={city}
                  onChangeText={handleCityChange}
                  leftIcon="business-outline"
                />
              </View>
              <View style={styles.nameCol}>
                <Input
                  label="State / Province"
                  placeholder="e.g. Tamil Nadu"
                  value={state}
                  onChangeText={setState}
                  leftIcon="map-outline"
                />
              </View>
            </View>

            {/* Country & Auto-Filled Pincode Fields */}
            <View style={styles.nameRow}>
              <View style={styles.nameCol}>
                <Input
                  label="Country"
                  placeholder="e.g. India"
                  value={country}
                  onChangeText={setCountry}
                  leftIcon="earth-outline"
                />
              </View>
              <View style={styles.nameCol}>
                <View>
                  <Input
                    label="Pincode / Postal Code"
                    placeholder="e.g. 600001"
                    keyboardType="numeric"
                    value={pincode}
                    onChangeText={(val) => {
                      setPincode(val);
                      setPincodeAutoDetected(false);
                    }}
                    leftIcon="mail-outline"
                    helperText={
                      pincodeAutoDetected
                        ? '✓ Auto-detected from location'
                        : 'Postal code for your area'
                    }
                  />
                  {pincodeAutoDetected && (
                    <View style={styles.autoDetectedTag}>
                      <Ionicons name="checkmark-circle" size={12} color="#15803D" />
                      <Text style={styles.autoDetectedTagText}>Auto-filled</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <Button
            title={isLoading ? 'Creating Account...' : 'Complete Registration'}
            onPress={handleRegister}
            loading={isLoading}
            style={styles.submitBtn}
          />

          {/* Back to Login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 160,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: colors.slateMedium,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slateDark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.slateMedium,
    marginBottom: 18,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slateDark,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  searchToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  searchToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  roleGrid: {
    gap: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  roleIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slateDark,
  },
  roleTitleActive: {
    color: colors.primaryDark,
  },
  roleSub: {
    fontSize: 11,
    color: colors.slateMedium,
    marginTop: 2,
    lineHeight: 15,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameCol: {
    flex: 1,
  },
  uniPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  uniPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uniPillActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primary,
  },
  uniPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slateMedium,
  },
  uniPillTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  searchBoxContainer: {
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginLeft: 4,
    marginRight: 2,
  },
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 6,
    padding: 10,
    ...shadows.md,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slateDark,
  },
  dropdownCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  resultsList: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slateDark,
  },
  dropdownItemSub: {
    fontSize: 11,
    color: colors.slateLight,
    marginTop: 2,
  },
  emptyResultsBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: 12,
    color: colors.slateMedium,
    textAlign: 'center',
  },
  bioDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: -4,
    marginBottom: 12,
  },
  bioDoneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  locationSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  locationSubText: {
    fontSize: 12,
    color: colors.slateMedium,
    marginTop: 2,
  },
  postcodeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  postcodeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  autoDetectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoDetectedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 24,
    borderRadius: 12,
    height: 48,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.slateMedium,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
