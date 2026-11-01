import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import {
  X,
  MessageCircle,
  Flame,
  Award,
  Users,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { UserProfile } from '../../../types/collabs';

interface FriendProfileModalProps {
  visible: boolean;
  onClose: () => void;
  friend: UserProfile | null;
  onMessageFriend: (friend: UserProfile) => void;
}

export const FriendProfileModal: React.FC<FriendProfileModalProps> = ({
  visible,
  onClose,
  friend,
  onMessageFriend,
}) => {
  if (!friend) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, Shadows.lg]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={18} color={Colors.mutedText} />
          </TouchableOpacity>

          {/* Avatar with Halo */}
          <View style={styles.avatarContainer}>
            <View style={styles.haloRing}>
              {friend.avatar ? (
                <Image source={{ uri: friend.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{friend.initials}</Text>
                </View>
              )}
            </View>
          </View>

          {/* User Details */}
          <View style={styles.detailsWrap}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{friend.name}</Text>
              <CheckCircle2 size={16} color={Colors.primary} fill="#C0EACD" />
            </View>
            <Text style={styles.userHandle}>{friend.handle}</Text>
            <Text style={styles.userBio}>{friend.bio}</Text>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Flame size={16} color="#E8A87C" />
              <Text style={styles.statVal}>{friend.streak}d streak</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Users size={16} color={Colors.primary} />
              <Text style={styles.statVal}>{friend.friendsCount} friends</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Award size={16} color="#456B54" />
              <Text style={styles.statVal}>{friend.challengesJoined} quests</Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => {
              onClose();
              onMessageFriend(friend);
            }}
            activeOpacity={0.8}
          >
            <MessageCircle size={18} color={Colors.white} />
            <Text style={styles.messageBtnText}>Message {friend.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    position: 'relative',
    gap: 14,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF6EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    marginTop: 8,
  },
  haloRing: {
    padding: 3,
    borderRadius: 44,
    backgroundColor: '#C0EACD',
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#C0EACD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#456B54',
  },
  detailsWrap: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#141E19',
  },
  userHandle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
  userBio: {
    fontSize: 13,
    color: '#141E19',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#EBF6EF',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#141E19',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#C2C8C1',
  },
  messageBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  messageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
