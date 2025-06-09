import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from './ThemedView';
import { useUserSocialAccounts } from '@/src/hooks/useUserSocialAccounts';
import { SocialAccount } from '@/src/types';

export function SocialProfilesList() {
  const { socialAccounts, isLoading } = useUserSocialAccounts();

  if (isLoading) {
    return <ThemedText type="default">Loading...</ThemedText>;
  }

  return socialAccounts.length ? (
    socialAccounts.map((profile) => (
      <SocialProfileCard profile={profile} key={profile.id} />
    ))
  ) : (
    <ThemedText type="default">No social profiles found</ThemedText>
  );
}

export function SocialProfileCard({ profile }: { profile: SocialAccount }) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.contentContainer}>
        {profile.avatarUrl && (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        )}
        <View style={styles.tableContainer}>
          <ThemedText type="defaultSemiBold">
            {profile.displayName || profile.username}
          </ThemedText>
          <ThemedText type="subtext">{profile.provider}</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  tableContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});
