import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Search,
  X,
  Plus,
  Pin,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { useDocumentsStore, DocumentItem } from '../../data/documentsData';

type FilterCategory = 'all' | 'pinned' | 'recent' | 'study';

export default function DocumentsListScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 20);

  // Documents from reactive store
  const documents = useDocumentsStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Category filter
      if (activeCategory === 'pinned' && !doc.isPinned) return false;
      if (activeCategory === 'recent' && doc.category !== 'recent') return false;
      if (activeCategory === 'study' && doc.category !== 'study') return false;

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesContent = doc.content.toLowerCase().includes(query);
        const matchesTags = doc.tags.some(tag =>
          tag.toLowerCase().includes(query)
        );
        return matchesTitle || matchesContent || matchesTags;
      }

      return true;
    });
  }, [documents, activeCategory, searchQuery]);

  const categories: { key: FilterCategory; label: string }[] = [
    { key: 'all', label: `All ${documents.length}` },
    { key: 'pinned', label: '📌 Pinned' },
    { key: 'recent', label: 'Recent' },
    { key: 'study', label: 'Study Logs' },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: bottomPadding + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.push('/(tabs)/heal-zone' as any)
              }
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.headerPillBadge}>
              <BookOpen size={12} color={Colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.headerPillText}>JOURNAL & NOTES</Text>
            </View>
          </View>

          <Text style={styles.headerTitle}>Documents</Text>
          <Text style={styles.headerSubtitle}>
            Your personal space to write and reflect
          </Text>

          {/* SEARCH BAR */}
          <View style={[styles.searchContainer, Shadows.sm]}>
            <Search size={18} color={Colors.mutedText} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search documents..."
              placeholderTextColor={Colors.lightText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={Colors.mutedText} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* CATEGORY FILTER CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categories.map(cat => {
            const isActive = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  Shadows.sm,
                ]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2-COLUMN DOCUMENT GRID */}
        {filteredDocuments.length === 0 ? (
          <View style={[styles.emptyContainer, Shadows.sm]}>
            <View style={styles.emptyIconCircle}>
              <BookOpen size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>No documents found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim().length > 0
                ? 'Try a different search term or clear the filter.'
                : 'Tap the green + button below to write your first reflection.'}
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredDocuments.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.documentCard, Shadows.sm]}
                onPress={() => router.push(`/documents/${item.id}`)}
                activeOpacity={0.82}
              >
                {/* CARD TOP: PIN & PRIMARY TAG */}
                <View style={styles.cardTopRow}>
                  {item.tags.length > 0 ? (
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText} numberOfLines={1}>
                        {item.tags[0]}
                      </Text>
                    </View>
                  ) : (
                    <View />
                  )}

                  {item.isPinned && (
                    <View style={styles.pinWrapper}>
                      <Pin size={12} color={Colors.primaryDark} strokeWidth={2.4} />
                    </View>
                  )}
                </View>

                {/* TITLE */}
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>

                {/* SNIPPET PREVIEW */}
                <Text style={styles.cardSnippet} numberOfLines={3}>
                  {item.content.replace(/\n+/g, ' ')}
                </Text>

                {/* CARD FOOTER: DATE & WORD COUNT */}
                <View style={styles.cardFooter}>
                  <View style={styles.dateWrapper}>
                    <Clock size={11} color={Colors.mutedText} strokeWidth={1.8} />
                    <Text style={styles.cardDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.cardWordCount}>{item.wordCount}w</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <TouchableOpacity
        style={[styles.fabButton, Shadows.lg]}
        onPress={() => router.push('/documents/new')}
        activeOpacity={0.85}
      >
        <Plus size={26} color={Colors.white} strokeWidth={2.8} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  headerPillText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.darkText,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
    paddingVertical: 0,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: Spacing.lg,
  },
  filterChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  filterChipActive: {
    backgroundColor: Colors.lightSage,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  filterChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  documentCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 160,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    maxWidth: '82%',
  },
  tagBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  pinWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 6,
  },
  cardSnippet: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
    flex: 1,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 236, 233, 0.6)',
    paddingTop: 8,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDate: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.mutedText,
  },
  cardWordCount: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.lightText,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xl,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.darkText,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  fabButton: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
