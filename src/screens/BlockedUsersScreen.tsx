import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { reportBlockService } from '../services/reportBlockService';
import { colors } from '../theme';

type BlockedUser = { id: string; targetUserId: string; targetName: string };

export function BlockedUsersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlockedUsers = useCallback(async () => {
    if (!user) return;
    try {
      setBlockedUsers(await reportBlockService.getBlockedUsers(user.id));
    } catch (error) {
      Alert.alert('Could not load blocked users', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadBlockedUsers(); }, [loadBlockedUsers]);

  const handleUnblock = (blocked: BlockedUser) => {
    Alert.alert(`Unblock ${blocked.targetName}?`, 'Their posts and profile can appear in your app again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: () => {
          if (!user) return;
          void reportBlockService.unblockUser(user.id, blocked.targetUserId).then(loadBlockedUsers).catch((error: unknown) => {
            Alert.alert('Could not unblock user', error instanceof Error ? error.message : 'Please try again.');
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Blocked Users</Text>
        <View style={styles.backButton} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>You have not blocked anyone.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.personIcon}><Ionicons name="person-outline" size={20} color={colors.primary} /></View>
              <Text style={styles.name}>{item.targetName}</Text>
              <TouchableOpacity style={styles.unblockButton} onPress={() => handleUnblock(item)}>
                <Text style={styles.unblockText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.slateDark },
  list: { padding: 16, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  personIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { flex: 1, color: colors.slateDark, fontSize: 15, fontWeight: '600' },
  unblockButton: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  unblockText: { color: colors.slateDark, fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { marginTop: 60, textAlign: 'center', color: colors.slateMedium, fontSize: 14 },
});
