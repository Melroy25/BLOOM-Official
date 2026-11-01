import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import {
  X,
  Share2,
  Link2,
  Check,
  BookOpen,
  MessageSquare,
  Download,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { UserProfile } from '../../../types/collabs';

interface ShareProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onCopyLink: () => void;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  visible,
  onClose,
  currentUser,
  onCopyLink,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    onCopyLink();
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const profileUrl = `bloom.me/${currentUser.handle.replace('@', '')}`;

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

          <View style={styles.iconTopBadge}>
            <Share2 size={20} color="#456B54" strokeWidth={2.2} />
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.modalTitle}>Bloom QR Pass</Text>
            <Text style={styles.modalSubtitle}>
              Let a student scan to connect instantly
            </Text>
          </View>

          {/* Aesthetic QR Card */}
          <View style={styles.qrCardContainer}>
            <View style={styles.qrGraphicWrap}>
              <Svg width={140} height={140} viewBox="0 0 100 100">
                {/* Corner Position Block Top-Left */}
                <Rect x="10" y="10" width="24" height="24" rx="4" fill="#365B45" fillOpacity={0.15} />
                <Rect x="14" y="14" width="16" height="16" rx="2" fill="#446650" />
                <Rect x="18" y="18" width="8" height="8" fill="#FAF8F2" />

                {/* Corner Position Block Top-Right */}
                <Rect x="66" y="10" width="24" height="24" rx="4" fill="#365B45" fillOpacity={0.15} />
                <Rect x="70" y="14" width="16" height="16" rx="2" fill="#446650" />
                <Rect x="74" y="18" width="8" height="8" fill="#FAF8F2" />

                {/* Corner Position Block Bottom-Left */}
                <Rect x="10" y="66" width="24" height="24" rx="4" fill="#365B45" fillOpacity={0.15} />
                <Rect x="14" y="70" width="16" height="16" rx="2" fill="#446650" />
                <Rect x="18" y="74" width="8" height="8" fill="#FAF8F2" />

                {/* Central Botanical Accent Mark */}
                <Circle cx="50" cy="50" r="10" fill="#789B83" />
                <Path d="M50 44 C53 46 53 50 50 53 C47 50 47 46 50 44 Z" fill="#FAF8F2" />

                {/* Data Grid Dots */}
                <Rect x="42" y="14" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="52" y="14" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="42" y="24" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="52" y="24" width="6" height="6" rx="1" fill="#446650" />

                <Rect x="14" y="44" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="24" y="44" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="14" y="54" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="24" y="54" width="6" height="6" rx="1" fill="#446650" />

                <Rect x="70" y="44" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="80" y="44" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="70" y="54" width="6" height="6" rx="1" fill="#446650" />

                <Rect x="42" y="70" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="52" y="70" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="42" y="80" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="66" y="76" width="6" height="6" rx="1" fill="#446650" />
                <Rect x="76" y="80" width="8" height="6" rx="1" fill="#446650" />
              </Svg>
            </View>

            <View style={styles.qrLabelWrap}>
              <Text style={styles.qrName}>{currentUser.name}</Text>
              <Text style={styles.qrHandle}>{profileUrl}</Text>
            </View>
          </View>

          {/* Copy Link Button */}
          <TouchableOpacity
            style={[styles.copyButton, copied && styles.copyButtonDone]}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            {copied ? (
              <>
                <Check size={18} color="#456B54" strokeWidth={2.5} />
                <Text style={styles.copyButtonTextDone}>Link Copied!</Text>
              </>
            ) : (
              <>
                <Link2 size={18} color="#141E19" strokeWidth={2.2} />
                <Text style={styles.copyButtonText}>Copy Invite Link</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Social Quick Sharing Pills */}
          <View style={styles.socialPillsRow}>
            <TouchableOpacity
              style={styles.socialPill}
              activeOpacity={0.7}
              onPress={handleCopy}
            >
              <BookOpen size={18} color="#141E19" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialPill}
              activeOpacity={0.7}
              onPress={handleCopy}
            >
              <MessageSquare size={18} color="#141E19" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialPill}
              activeOpacity={0.7}
              onPress={handleCopy}
            >
              <Download size={18} color="#141E19" />
            </TouchableOpacity>
          </View>
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
    maxWidth: 340,
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
  iconTopBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C0EACD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  titleWrap: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#141E19',
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
    textAlign: 'center',
  },
  // QR Card
  qrCardContainer: {
    width: 220,
    backgroundColor: '#EBF6EF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 10,
  },
  qrGraphicWrap: {
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qrLabelWrap: {
    alignItems: 'center',
  },
  qrName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  qrHandle: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 1,
  },
  // Copy Button
  copyButton: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF6EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyButtonDone: {
    backgroundColor: '#C0EACD',
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#141E19',
  },
  copyButtonTextDone: {
    fontSize: 13,
    fontWeight: '700',
    color: '#456B54',
  },
  socialPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EBF6EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
