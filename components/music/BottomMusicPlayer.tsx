import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  AlertCircle,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { useMusicPlayer } from './MusicPlayerContext';

const formatTime = (millis: number): string => {
  if (!millis || isNaN(millis) || millis < 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const BottomMusicPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    currentSong,
    currentPlaylist,
    isPlaying,
    isLoading,
    positionMillis,
    durationMillis,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    error,
  } = useMusicPlayer();

  if (!currentSong) return null;

  const playerMaxWidth = Math.min(width - 24, 520);
  const progressRatio = durationMillis > 0 ? Math.min(1, positionMillis / durationMillis) : 0;
  const progressPercent = Math.round(progressRatio * 100);
  const accentColor = currentPlaylist?.accentColor || Colors.primaryDark;
  const bottomMargin = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16);

  const handleProgressBarPress = (e: any) => {
    if (!durationMillis) return;
    const { locationX } = e.nativeEvent;
    // Estimate width from content width
    const targetRatio = Math.max(0, Math.min(1, locationX / (playerMaxWidth - 32)));
    seekTo(Math.floor(targetRatio * durationMillis));
  };

  return (
    <View style={[styles.outerContainer, { bottom: bottomMargin }]}>
      <View style={[styles.playerCard, Shadows.lg, { maxWidth: playerMaxWidth }]}>
        {/* TOP PROGRESS BAR */}
        <TouchableOpacity
          style={styles.progressContainer}
          activeOpacity={0.8}
          onPress={handleProgressBarPress}
          accessibilityRole="adjustable"
          accessibilityLabel="Seek audio position"
        >
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* PLAYER MAIN ROW */}
        <View style={styles.contentRow}>
          {/* Album Artwork / Mood Badge */}
          <View
            style={[
              styles.artworkBadge,
              {
                backgroundColor: currentPlaylist?.bgColor || '#EAE5F4',
                borderColor: currentPlaylist?.borderColor || '#DDD4F0',
              },
            ]}
          >
            <Text style={styles.artworkEmoji}>
              {currentPlaylist?.iconEmoji || '🎵'}
            </Text>
          </View>

          {/* Song and Artist Details */}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.artistName} numberOfLines={1}>
                {currentSong.artist}
              </Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.timeText}>
                {formatTime(positionMillis)} / {formatTime(durationMillis)}
              </Text>
            </View>
          </View>

          {/* Playback Controls */}
          <View style={styles.controlsRow}>
            {/* Previous Track Button */}
            <TouchableOpacity
              style={styles.controlIconBtn}
              onPress={playPrevious}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Previous track"
            >
              <SkipBack size={19} color={Colors.darkText} strokeWidth={2.2} />
            </TouchableOpacity>

            {/* Play / Pause / Loading Button */}
            <TouchableOpacity
              style={[
                styles.playPauseBtn,
                Shadows.sm,
                { backgroundColor: accentColor },
              ]}
              onPress={togglePlayPause}
              disabled={isLoading}
              activeOpacity={0.85}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause song' : 'Play song'}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : isPlaying ? (
                <Pause size={17} color={Colors.white} strokeWidth={2.4} />
              ) : (
                <Play
                  size={17}
                  color={Colors.white}
                  strokeWidth={2.4}
                  style={styles.playIconOffset}
                />
              )}
            </TouchableOpacity>

            {/* Next Track Button */}
            <TouchableOpacity
              style={styles.controlIconBtn}
              onPress={playNext}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Next track"
            >
              <SkipForward size={19} color={Colors.darkText} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Error Notice */}
        {error && (
          <View style={styles.errorNotice}>
            <AlertCircle size={11} color="#C46D4B" strokeWidth={2} />
            <Text style={styles.errorText} numberOfLines={1}>
              {error}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    paddingHorizontal: 12,
  },
  playerCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  progressContainer: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 6,
  },
  progressTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: '#EDE8DF',
  },
  progressFill: {
    height: '100%',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 10,
  },
  artworkBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkEmoji: {
    fontSize: 20,
  },
  songInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 4,
  },
  songTitle: {
    ...Typography.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artistName: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    maxWidth: 90,
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.lightText,
  },
  timeText: {
    ...Typography.caption,
    fontSize: 10.5,
    color: Colors.mutedText,
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  playPauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOffset: {
    marginLeft: 2,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 3,
  },
  errorText: {
    ...Typography.caption,
    fontSize: 10,
    color: '#C46D4B',
  },
});
