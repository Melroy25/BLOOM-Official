import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  X,
  Flame,
  Award,
  Sparkles,
  SlidersHorizontal,
  Compass,
  Plus,
  RefreshCw,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { Challenge, ChallengeCategory } from '../../../types/collabs';
import { ChallengeCard } from '../ChallengeCard';
import {
  getPublicChallenges,
  checkIsUserJoined,
} from '../../../services/challengeService';
import { useAuth } from '../../../context/AuthContext';

interface TrendingTabProps {
  challenges?: Challenge[];
  onToggleJoinChallenge?: (id: string) => void;
  onOpenCreateChallenge?: () => void;
  discussions?: any[];
  onOpenDiscussionComments?: (discussion: any) => void;
  onSelectActivity?: (activity: string) => void;
}

const CATEGORIES: ChallengeCategory[] = [
  'All',
  'Fitness',
  'Mindfulness',
  'Productivity',
  'Study',
  'Digital Detox',
  'Sleep',
  'Lifestyle',
  'Personal Growth',
];

type SortOption = 'popular' | 'recent' | 'shortest' | 'longest';

export const TrendingTab: React.FC<TrendingTabProps> = ({
  challenges: propChallenges = [],
  onToggleJoinChallenge,
  onOpenCreateChallenge,
  discussions = [],
  onOpenDiscussionComments,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory>('All');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Firestore Data State
  const [challenges, setChallenges] = useState<Challenge[]>(propChallenges);
  const [isLoading, setIsLoading] = useState(propChallenges.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (propChallenges && propChallenges.length > 0) {
      setChallenges(propChallenges);
      setIsLoading(false);
    }
  }, [propChallenges]);

  // Load real Firestore challenges
  const loadChallenges = useCallback(async () => {
    try {
      setErrorMsg(null);
      const data = await getPublicChallenges(
        selectedCategory === 'All' ? undefined : selectedCategory,
        searchQuery,
        sortBy
      );

      // If user is authenticated, check which challenges they have joined
      if (user?.uid) {
        const enriched = await Promise.all(
          data.map(async (c) => {
            const joined = await checkIsUserJoined(c.id, user.uid);
            return { ...c, isJoined: joined };
          })
        );
        setChallenges(enriched);
      } else {
        setChallenges(data);
      }
    } catch (err: any) {
      console.warn('[TrendingTab] Error loading challenges:', err);
      setErrorMsg('Could not load community challenges. Please pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, searchQuery, sortBy, user?.uid]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadChallenges();
  };

  // Open Reusable Challenge Details Screen via Expo Router
  const handleOpenChallenge = (challenge: Challenge) => {
    router.push({
      pathname: '/challenge/[challengeId]',
      params: { challengeId: challenge.id },
    } as any);
  };

  // Navigate to Create Challenge Screen
  const handleCreateChallenge = () => {
    if (onOpenCreateChallenge) {
      onOpenCreateChallenge();
    } else {
      router.push('/challenge/create' as any);
    }
  };

  // 1. POPULAR CHALLENGES (Sorted by participant count)
  const popularChallenges = useMemo(() => {
    return [...challenges]
      .sort((a, b) => (b.participantsCount || 0) - (a.participantsCount || 0))
      .slice(0, 4);
  }, [challenges]);

  // 2. TRENDING CHALLENGES (Marked trending or strong activity)
  const trendingChallenges = useMemo(() => {
    const explicitlyTrending = challenges.filter((c) => c.isTrending);
    if (explicitlyTrending.length >= 2) return explicitlyTrending.slice(0, 4);
    // Fallback to top popular
    return popularChallenges;
  }, [challenges, popularChallenges]);

  return (
    <View style={styles.container}>
      {/* ------------------------------------------------------------- */}
      {/* A. SEARCH BAR                                                */}
      {/* ------------------------------------------------------------- */}
      <View style={[styles.searchContainer, Shadows.sm]}>
        <Search size={18} color="#789B83" strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search challenges..."
          placeholderTextColor="#A5AEA8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search community challenges"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color="#7B857F" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* ------------------------------------------------------------- */}
      {/* B. CATEGORY FILTER CHIPS (Horizontal Scrollable)             */}
      {/* ------------------------------------------------------------- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Loading Indicator */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#365B45" />
          <Text style={styles.loadingText}>Discovering challenges...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
            <RefreshCw size={14} color="#365B45" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* If searching or filtering specific category, show unified results */}
          {searchQuery.trim().length > 0 || selectedCategory !== 'All' ? (
            <View style={styles.filteredSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {selectedCategory === 'All' ? 'Search Results' : `${selectedCategory} Challenges`}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {challenges.length} challenge{challenges.length === 1 ? '' : 's'} found
                  </Text>
                </View>
              </View>

              {challenges.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Compass size={36} color="#789B83" strokeWidth={1.5} />
                  <Text style={styles.emptyTitle}>No challenges found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try searching for another keyword or category.
                  </Text>
                </View>
              ) : (
                challenges.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    onPress={handleOpenChallenge}
                  />
                ))
              )}
            </View>
          ) : (
            <>
              {/* ------------------------------------------------------------- */}
              {/* C. POPULAR CHALLENGES (Community Favorites)                  */}
              {/* ------------------------------------------------------------- */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <View style={styles.headingBadgeRow}>
                      <Award size={16} color="#365B45" strokeWidth={2.2} />
                      <Text style={styles.sectionTitle}>Popular Challenges</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                      Challenges the community loves.
                    </Text>
                  </View>
                </View>

                {/* Horizontal Snap Scroll for Popular */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalCardScroll}
                >
                  {popularChallenges.map((c) => (
                    <ChallengeCard
                      key={`pop_${c.id}`}
                      challenge={c}
                      onPress={handleOpenChallenge}
                      compact
                    />
                  ))}
                </ScrollView>
              </View>

              {/* ------------------------------------------------------------- */}
              {/* D. TRENDING NOW (Active momentum)                            */}
              {/* ------------------------------------------------------------- */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <View style={styles.headingBadgeRow}>
                      <Flame size={16} color="#E88B5D" strokeWidth={2.2} />
                      <Text style={styles.sectionTitle}>Trending Now</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                      Strong recent participation & momentum.
                    </Text>
                  </View>
                </View>

                {trendingChallenges.slice(0, 2).map((c) => (
                  <ChallengeCard
                    key={`trend_${c.id}`}
                    challenge={c}
                    onPress={handleOpenChallenge}
                  />
                ))}
              </View>

              {/* ------------------------------------------------------------- */}
              {/* E. ALL CHALLENGES (Explore with Sorting)                      */}
              {/* ------------------------------------------------------------- */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Explore Challenges</Text>
                    <Text style={styles.sectionSubtitle}>
                      All discoverable community challenges.
                    </Text>
                  </View>

                  {/* Sort Trigger */}
                  <TouchableOpacity
                    style={styles.sortTriggerBtn}
                    onPress={() => setSortDropdownOpen(!sortDropdownOpen)}
                    activeOpacity={0.7}
                  >
                    <SlidersHorizontal size={13} color="#365B45" strokeWidth={2} />
                    <Text style={styles.sortTriggerText}>
                      {sortBy === 'popular'
                        ? 'Most Popular'
                        : sortBy === 'recent'
                        ? 'Recently Created'
                        : sortBy === 'shortest'
                        ? 'Shortest'
                        : 'Longest'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Inline Sort Dropdown */}
                {sortDropdownOpen && (
                  <View style={[styles.sortDropdownMenu, Shadows.md]}>
                    <TouchableOpacity
                      style={[styles.sortItem, sortBy === 'popular' && styles.sortItemActive]}
                      onPress={() => {
                        setSortBy('popular');
                        setSortDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.sortItemText, sortBy === 'popular' && styles.sortItemTextActive]}>
                        Most Popular
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sortItem, sortBy === 'recent' && styles.sortItemActive]}
                      onPress={() => {
                        setSortBy('recent');
                        setSortDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.sortItemText, sortBy === 'recent' && styles.sortItemTextActive]}>
                        Recently Created
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sortItem, sortBy === 'shortest' && styles.sortItemActive]}
                      onPress={() => {
                        setSortBy('shortest');
                        setSortDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.sortItemText, sortBy === 'shortest' && styles.sortItemTextActive]}>
                        Shortest Duration
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sortItem, sortBy === 'longest' && styles.sortItemActive]}
                      onPress={() => {
                        setSortBy('longest');
                        setSortDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.sortItemText, sortBy === 'longest' && styles.sortItemTextActive]}>
                        Longest Duration
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* All Challenges List */}
                {challenges.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Compass size={36} color="#789B83" strokeWidth={1.5} />
                    <Text style={styles.emptyTitle}>No challenges yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Be the first to publish a challenge for your campus!
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyCreateBtn}
                      onPress={handleCreateChallenge}
                    >
                      <Plus size={14} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.emptyCreateBtnText}>Create Challenge</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  challenges.map((c) => (
                    <ChallengeCard
                      key={`all_${c.id}`}
                      challenge={c}
                      onPress={handleOpenChallenge}
                    />
                  ))
                )}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#141E19',
    padding: 0,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  categoryChipActive: {
    backgroundColor: '#365B45',
    borderColor: '#365B45',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#29332E',
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  errorBox: {
    padding: Spacing.lg,
    backgroundColor: '#FDECEC',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#D98B8B',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  sectionWrap: {
    gap: 10,
  },
  filteredSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141E19',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 1,
  },
  horizontalCardScroll: {
    paddingVertical: 4,
  },
  sortTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  sortTriggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  sortDropdownMenu: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    padding: 4,
    marginBottom: 8,
  },
  sortItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  sortItemActive: {
    backgroundColor: '#E8F1E8',
  },
  sortItemText: {
    fontSize: 12,
    color: '#29332E',
  },
  sortItemTextActive: {
    fontWeight: '700',
    color: '#365B45',
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 8,
    marginVertical: Spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141E19',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#365B45',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    marginTop: 8,
  },
  emptyCreateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
