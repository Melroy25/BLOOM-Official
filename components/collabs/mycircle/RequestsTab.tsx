import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Check, X, Sprout } from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { UserProfile } from '../../../types/collabs';

interface RequestsTabProps {
  requests: UserProfile[];
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onExploreDiscover?: () => void;
}

export const RequestsTab: React.FC<RequestsTabProps> = ({
  requests,
  onAcceptRequest,
  onDeclineRequest,
  onExploreDiscover,
}) => {
  if (requests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Sprout size={28} color="#365B45" strokeWidth={1.8} />
        </View>
        <Text style={styles.emptyTitle}>No pending requests</Text>
        <Text style={styles.emptySubtitle}>
          Your circle is all caught up. Explore suggestions to connect with peers.
        </Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={onExploreDiscover}
          activeOpacity={0.8}
        >
          <Text style={styles.exploreBtnText}>Discover People</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {requests.map((req, index) => (
        <View key={req.id} style={styles.requestRow}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {req.avatar ? (
              <Image source={{ uri: req.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{req.initials}</Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.detailsCol}>
            <Text style={styles.reqName}>{req.name}</Text>
            <Text style={styles.reqHandle}>{req.handle}</Text>
            {req.mutualInfo ? (
              <Text style={styles.reqMutual} numberOfLines={1}>
                {req.mutualInfo}
              </Text>
            ) : null}
          </View>

          {/* Compact Accept & Decline actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAcceptRequest(req.id)}
              activeOpacity={0.8}
            >
              <Check size={14} color={Colors.white} strokeWidth={2.4} />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => onDeclineRequest(req.id)}
              activeOpacity={0.8}
            >
              <X size={14} color={Colors.mutedText} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    overflow: 'hidden',
  },
  requestRow: {
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
  reqName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
  },
  reqHandle: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  reqMutual: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  declineBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F1E8',
    borderWidth: 1,
    borderColor: '#D4E2D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State
  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
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
    marginTop: 4,
    maxWidth: 240,
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: '#E8F1E8',
  },
  exploreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
});
