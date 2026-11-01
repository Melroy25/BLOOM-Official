import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  BackHandler,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Play,
  Pause,
  Sun,
  Heart,
  Leaf,
  Sparkles,
  Plus,
  ListPlus,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FloatingParticles } from '../../components/heal-zone/FloatingParticles';
import { PLAYLISTS, MusicPlaylist, CustomPlaylist } from '../../components/music/musicData';
import { CustomPlaylistStore } from '../../components/music/customPlaylistStore';
import { useMusicPlayer } from '../../components/music/MusicPlayerContext';
import { BottomMusicPlayer } from '../../components/music/BottomMusicPlayer';

export default function MusicTherapyScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16);
  const { width } = useWindowDimensions();

  const params = useLocalSearchParams<{ from?: string }>();
  const parentPage = params.from || '/heal-zone';

  const {
    currentPlaylist,
    isPlaying,
    currentSong,
    playAll,
    togglePlayPause,
  } = useMusicPlayer();

  // Custom Playlists state loaded & subscribed from CustomPlaylistStore
  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>(() =>
    CustomPlaylistStore.getCustomPlaylists()
  );

  useEffect(() => {
    const unsubscribe = CustomPlaylistStore.subscribe(() => {
      setCustomPlaylists(CustomPlaylistStore.getCustomPlaylists());
    });
    return unsubscribe;
  }, []);

  // Responsive sizing: 2 equal-width columns on mobile
  const contentMaxWidth = Math.min(width - 32, 540);
  const cardGap = 12;
  const cardWidth = Math.floor((contentMaxWidth - cardGap) / 2);

  // Back button returns to Heal Zone (or parent route)
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(parentPage as any);
    }
  }, [parentPage]);

  // Handle hardware back press on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  // Navigate to Playlist detail screen
  const handleOpenPlaylist = (playlist: MusicPlaylist) => {
    router.push({
      pathname: '/music/playlist',
      params: { id: playlist.id, from: parentPage },
    });
  };

  // Play button on card: toggle play if already playing, or play all & open
  const handleCardPlayPress = (e: any, playlist: MusicPlaylist) => {
    e.stopPropagation();
    if (currentPlaylist?.id === playlist.id && currentSong) {
      togglePlayPause();
    } else {
      playAll(playlist);
    }
  };

  // Navigate to Create Your Own Playlist page
  const handleCreatePlaylist = () => {
    router.push({
      pathname: '/music/create-playlist',
      params: { from: parentPage },
    });
  };

  // Edit custom playlist
  const handleEditCustomPlaylist = (e: any, playlist: CustomPlaylist) => {
    e.stopPropagation();
    router.push({
      pathname: '/music/create-playlist',
      params: { id: playlist.id },
    });
  };

  // Delete custom playlist with confirmation dialog
  const handleDeleteCustomPlaylist = (e: any, playlist: CustomPlaylist) => {
    e.stopPropagation();
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            CustomPlaylistStore.deleteCustomPlaylist(playlist.id);
          },
        },
      ]
    );
  };

  const renderPlaylistIcon = (iconName: string, accentColor: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun size={20} color={accentColor} strokeWidth={2.4} />;
      case 'Heart':
        return <Heart size={20} color={accentColor} strokeWidth={2.4} />;
      case 'Leaf':
        return <Leaf size={20} color={accentColor} strokeWidth={2.4} />;
      case 'Sparkles':
      default:
        return <Sparkles size={20} color={accentColor} strokeWidth={2.4} />;
    }
  };

  return (
    <View style={styles.screen}>
      <FloatingParticles />

      {/* TOP HEADER */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTopRow}>
          {/* Back button */}
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to Heal Zone"
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Mood Soundscapes</Text>
          </View>

          {/* Placeholder for header symmetry */}
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>Music Therapy 🎵</Text>
        <Text style={styles.subtitle}>
          Choose a playlist that matches your mood.
        </Text>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: currentSong ? 110 : 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {/* 1. 2-COLUMN GRID OF FOUR MOOD CATEGORY CARDS */}
          <View style={[styles.gridContainer, { gap: cardGap }]}>
            {PLAYLISTS.map((playlist) => {
              const isThisPlaylistPlaying =
                currentPlaylist?.id === playlist.id && isPlaying;

              return (
                <TouchableOpacity
                  key={playlist.id}
                  style={[
                    styles.playlistCard,
                    Shadows.sm,
                    {
                      width: cardWidth,
                      backgroundColor: playlist.bgColor,
                      borderColor: isThisPlaylistPlaying
                        ? playlist.accentColor
                        : playlist.borderColor,
                      borderWidth: isThisPlaylistPlaying ? 1.8 : 1,
                    },
                  ]}
                  onPress={() => handleOpenPlaylist(playlist)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${playlist.name} playlist`}
                >
                  {/* Top Badge & Emoji Row */}
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: playlist.badgeBg },
                      ]}
                    >
                      {renderPlaylistIcon(playlist.iconName, playlist.accentColor)}
                    </View>
                    <Text style={styles.emojiDisplay}>{playlist.iconEmoji}</Text>
                  </View>

                  {/* Playlist Name & Description */}
                  <View style={styles.cardBody}>
                    <Text style={styles.playlistName} numberOfLines={1}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.playlistDescription} numberOfLines={2}>
                      {playlist.description}
                    </Text>
                  </View>

                  {/* Bottom Row: Songs count & Quick Play button */}
                  <View style={styles.cardFooter}>
                    <View style={styles.trackCountBadge}>
                      <Text style={styles.trackCountText}>
                        {playlist.songs.length} Songs
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.cardPlayBtn,
                        Shadows.sm,
                        { backgroundColor: playlist.accentColor },
                      ]}
                      onPress={(e) => handleCardPlayPress(e, playlist)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isThisPlaylistPlaying
                          ? `Pause ${playlist.name}`
                          : `Play ${playlist.name}`
                      }
                    >
                      {isThisPlaylistPlaying ? (
                        <Pause size={14} color={Colors.white} strokeWidth={2.4} />
                      ) : (
                        <Play
                          size={14}
                          color={Colors.white}
                          strokeWidth={2.4}
                          style={styles.cardPlayIconOffset}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. CREATE YOUR OWN PLAYLIST BANNER CARD */}
          <TouchableOpacity
            style={[styles.createBannerCard, Shadows.sm]}
            onPress={handleCreatePlaylist}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Create your own playlist"
          >
            <View style={styles.createIconBadge}>
              <ListPlus size={22} color="#D96B43" strokeWidth={2.4} />
            </View>

            <View style={styles.createBannerContent}>
              <Text style={styles.createBannerHeading}>Create Your Own Playlist</Text>
              <Text style={styles.createBannerSubtitle}>
                Your mood, your music, your playlist.
              </Text>
            </View>

            <View style={styles.createActionPill}>
              <Plus size={14} color={Colors.white} strokeWidth={2.6} />
              <Text style={styles.createActionPillText}>Create</Text>
            </View>
          </TouchableOpacity>

          {/* 3. MY CUSTOM PLAYLISTS LIST (IF CREATED) */}
          {customPlaylists.length > 0 && (
            <View style={styles.customSection}>
              <View style={styles.customSectionHeaderRow}>
                <Text style={styles.customSectionHeaderTitle}>MY PERSONAL PLAYLISTS</Text>
                <Text style={styles.customSectionHeaderCount}>
                  {customPlaylists.length} {customPlaylists.length === 1 ? 'Mix' : 'Mixes'}
                </Text>
              </View>

              <View style={styles.customListContainer}>
                {customPlaylists.map((playlist) => {
                  const isThisPlaylistPlaying =
                    currentPlaylist?.id === playlist.id && isPlaying;

                  return (
                    <TouchableOpacity
                      key={playlist.id}
                      style={[
                        styles.customCard,
                        Shadows.sm,
                        isThisPlaylistPlaying && {
                          borderColor: playlist.accentColor,
                          borderWidth: 1.5,
                        },
                      ]}
                      onPress={() => handleOpenPlaylist(playlist)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${playlist.name}`}
                    >
                      <View style={[styles.customCardBadge, { backgroundColor: playlist.badgeBg }]}>
                        <Text style={styles.customCardEmoji}>{playlist.iconEmoji}</Text>
                      </View>

                      <View style={styles.customCardInfo}>
                        <Text style={styles.customCardTitle} numberOfLines={1}>
                          {playlist.name}
                        </Text>
                        <Text style={styles.customCardSubtitle} numberOfLines={1}>
                          {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'} • Personal Mix
                        </Text>
                      </View>

                      {/* Action buttons: Play, Edit, Delete */}
                      <View style={styles.customCardActions}>
                        {/* Play / Pause */}
                        <TouchableOpacity
                          style={[
                            styles.customCardPlayBtn,
                            { backgroundColor: playlist.accentColor },
                          ]}
                          onPress={(e) => handleCardPlayPress(e, playlist)}
                          activeOpacity={0.8}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          {isThisPlaylistPlaying ? (
                            <Pause size={13} color={Colors.white} strokeWidth={2.4} />
                          ) : (
                            <Play
                              size={13}
                              color={Colors.white}
                              strokeWidth={2.4}
                              style={{ marginLeft: 1 }}
                            />
                          )}
                        </TouchableOpacity>

                        {/* Edit button */}
                        <TouchableOpacity
                          style={styles.customMiniBtn}
                          onPress={(e) => handleEditCustomPlaylist(e, playlist)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          accessibilityLabel="Edit playlist"
                        >
                          <Edit3 size={14} color={playlist.accentColor} strokeWidth={2.2} />
                        </TouchableOpacity>

                        {/* Delete button */}
                        <TouchableOpacity
                          style={[styles.customMiniBtn, { backgroundColor: '#FDF2F0' }]}
                          onPress={(e) => handleDeleteCustomPlaylist(e, playlist)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          accessibilityLabel="Delete playlist"
                        >
                          <Trash2 size={14} color="#C46D4B" strokeWidth={2.2} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* COMPACT BOTTOM MUSIC PLAYER */}
      <BottomMusicPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.round,
    backgroundColor: '#ECE5F7',
    borderWidth: 1,
    borderColor: '#DDD4F0',
  },
  headerBadgeText: {
    ...Typography.label,
    fontSize: 10.5,
    color: '#5A4E80',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  title: {
    ...Typography.h1,
    fontSize: 26,
    color: Colors.darkText,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 20,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playlistCard: {
    minHeight: 184,
    borderRadius: 20,
    padding: 13,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiDisplay: {
    fontSize: 18,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 4,
  },
  playlistName: {
    ...Typography.h3,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 4,
  },
  playlistDescription: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.mutedText,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  trackCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  trackCountText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.darkText,
  },
  cardPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlayIconOffset: {
    marginLeft: 1.5,
  },
  // Create Your Own Playlist Card
  createBannerCard: {
    width: '100%',
    backgroundColor: '#FFF6F0',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#FAD7C0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  createIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDEEE4',
    borderWidth: 1,
    borderColor: '#F7D4BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBannerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  createBannerHeading: {
    ...Typography.h3,
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 2,
  },
  createBannerSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    fontStyle: 'italic',
  },
  createActionPill: {
    backgroundColor: '#D96B43',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  createActionPillText: {
    ...Typography.button,
    fontSize: 12.5,
    color: Colors.white,
    fontWeight: '700',
  },
  // My Custom Playlists Section
  customSection: {
    width: '100%',
    marginTop: 16,
  },
  customSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  customSectionHeaderTitle: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.mutedText,
    letterSpacing: 0.6,
    fontWeight: '800',
  },
  customSectionHeaderCount: {
    ...Typography.caption,
    fontSize: 11,
    color: '#D96B43',
    fontWeight: '600',
  },
  customListContainer: {
    gap: 8,
  },
  customCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customCardBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCardEmoji: {
    fontSize: 20,
  },
  customCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  customCardTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 1,
  },
  customCardSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
  },
  customCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customCardPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMiniBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
