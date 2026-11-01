import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { UserPlus, Check, Search, X } from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { UserProfile } from '../../../types/collabs';

interface DiscoverTabProps {
  suggestions: UserProfile[];
  onAddFriend: (userId: string) => void;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  suggestions,
  onAddFriend,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [requestedIds, setRequestedIds] = useState<Record<string, boolean>>({});

  const handleToggleAdd = (id: string) => {
    setRequestedIds(prev => ({ ...prev, [id]: !prev[id] }));
    onAddFriend(id);
  };

  const filteredSuggestions = suggestions.filter(
    u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.mutualInfo && u.mutualInfo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color={Colors.mutedText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people to discover..."
          placeholderTextColor="#7B857F"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <X size={14} color={Colors.mutedText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggested Peers List */}
      <View style={styles.listContainer}>
        {filteredSuggestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No people found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with another name or interest
            </Text>
          </View>
        ) : (
          filteredSuggestions.map((user, index) => {
            const isRequested = !!requestedIds[user.id];

            return (
              <View key={user.id} style={styles.suggestRow}>
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                  {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{user.initials}</Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.detailsCol}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userHandle}>{user.handle}</Text>
                  {user.mutualInfo ? (
                    <Text style={styles.userMutual} numberOfLines={1}>
                      {user.mutualInfo}
                    </Text>
                  ) : null}
                </View>

                {/* Add Friend Action */}
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    isRequested && styles.addBtnRequested,
                  ]}
                  onPress={() => handleToggleAdd(user.id)}
                  activeOpacity={0.8}
                >
                  {isRequested ? (
                    <>
                      <Check size={12} color="#365B45" strokeWidth={2.5} />
                      <Text style={styles.addBtnTextRequested}>Requested</Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} color={Colors.white} strokeWidth={2} />
                      <Text style={styles.addBtnText}>Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#DCE7DF',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#141E19',
    paddingVertical: 0,
  },
  listContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#DCE7DF',
    overflow: 'hidden',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#141E19',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 4,
    textAlign: 'center',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#E8F1E8',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#365B45',
  },
  detailsCol: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
  },
  userHandle: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  userMutual: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
  },
  addBtnRequested: {
    backgroundColor: '#E8F1E8',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  addBtnTextRequested: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
});
