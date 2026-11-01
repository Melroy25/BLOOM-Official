import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import {
  Search,
  MessageCircle,
  X,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { UserProfile } from '../../../types/collabs';

interface FriendsTabProps {
  friends: UserProfile[];
  onOpenFriendChat: (friend: UserProfile) => void;
  onOpenFriendProfile: (friend: UserProfile) => void;
  onRemoveFriend?: (friendId: string) => void;
}

export const FriendsTab: React.FC<FriendsTabProps> = ({
  friends,
  onOpenFriendChat,
  onOpenFriendProfile,
  onRemoveFriend,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = friends.filter(
    f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color={Colors.mutedText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
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

      {/* Friends List with Thin Separators */}
      <View style={styles.listContainer}>
        {filteredFriends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {friends.length === 0 ? 'Your circle is empty' : 'No friends found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Tap Discover Friends above to find Bloom members!
            </Text>
          </View>
        ) : (
          filteredFriends.map((friend, index) => (
            <View key={friend.id} style={styles.friendRow}>
              {/* Avatar + Info */}
              <TouchableOpacity
                style={styles.friendInfoWrap}
                onPress={() => onOpenFriendProfile(friend)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarWrap}>
                  {friend.avatar ? (
                    <Image
                      source={{ uri: friend.avatar }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {friend.initials}
                      </Text>
                    </View>
                  )}
                  {friend.isOnline && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.textWrap}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendHandle}>{friend.handle}</Text>
                  {friend.bio ? (
                    <Text style={styles.friendStatus} numberOfLines={1}>
                      {friend.bio}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              {/* Action: Direct Message */}
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => onOpenFriendChat(friend)}
                activeOpacity={0.7}
                accessibilityLabel={`Message ${friend.name}`}
              >
                <MessageCircle size={18} color="#365B45" strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  // Minimal Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#141E19',
    paddingVertical: 0,
  },
  // List
  listContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    overflow: 'hidden',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
  },
  friendInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#365B45',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
  },
  friendHandle: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  friendStatus: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty
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
});
