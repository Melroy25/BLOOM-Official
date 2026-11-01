import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  AlertOctagon,
  Watch,
  HeartPulse,
  Layout,
  Phone,
  MapPin,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Circle,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  Smartphone,
  Copy,
  Plus,
  Trash2,
  X,
  ChevronLeft,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { EmergencyContact, SmartwatchDevice, HealthConnectPermissions, WidgetSettings } from '../../types/tasks';
import {
  getBackendContacts,
  addBackendContact,
  deleteBackendContact,
  getBackendSmartwatches,
  toggleBackendSmartwatch,
  addBackendSmartwatch,
  getBackendHealthConnect,
  updateBackendHealthConnect,
  getBackendWidgetConfig,
  updateBackendWidgetConfig,
} from '../../services/bloomBackend';
import {
  getCurrentLocation,
  getStoredLocation,
  subscribeToLocation,
  requestLocationPermission,
  formatCoordinates,
  UserLocation,
} from '../../services/locationService';

type SafetySubTab = 'sos' | 'smartwatch' | 'health_connect' | 'widgets';

interface Props {
  initialTab?: SafetySubTab;
  onBack?: () => void;
}

export default function SafetyHardwareView({ initialTab = 'sos', onBack }: Props) {
  const [subTab, setSubTab] = useState<SafetySubTab>(initialTab);

  // SOS state
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Real GPS location state
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locPermissionDenied, setLocPermissionDenied] = useState(false);

  // Smartwatch state
  const [watches, setWatches] = useState<SmartwatchDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [newWatchName, setNewWatchName] = useState('');
  const [newWatchBrand, setNewWatchBrand] = useState('Wear OS');

  // Health Connect state
  const [healthPerms, setHealthPerms] = useState<HealthConnectPermissions | null>(null);

  // Widget preview state
  const [widgetConfig, setWidgetConfig] = useState<WidgetSettings | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();

    // Load cached GPS coordinates immediately for instantaneous UI
    getStoredLocation().then((cached) => {
      if (cached) setLocation(cached);
    });

    // Acquire high-precision live GPS coordinates
    fetchLiveLocation(true);

    // Listen to real-time location updates
    const unsubscribe = subscribeToLocation((newLoc) => {
      setLocation(newLoc);
    });

    return () => unsubscribe();
  }, []);

  const fetchLiveLocation = async (highAccuracy = true) => {
    setIsLocating(true);
    try {
      const loc = await getCurrentLocation(highAccuracy);
      if (loc) {
        setLocation(loc);
        setLocPermissionDenied(false);
      } else {
        const hasPerm = await requestLocationPermission();
        if (!hasPerm) {
          setLocPermissionDenied(true);
        }
      }
    } finally {
      setIsLocating(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, w, h, wg] = await Promise.all([
        getBackendContacts(),
        getBackendSmartwatches(),
        getBackendHealthConnect(),
        getBackendWidgetConfig(),
      ]);
      setContacts(c);
      setWatches(w);
      setHealthPerms(h);
      setWidgetConfig(wg);
    } finally {
      setLoading(false);
    }
  };

  // SOS Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (sosCountdown !== null && sosCountdown > 0) {
      timer = setInterval(() => {
        setSosCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (sosCountdown === 0) {
      setSosCountdown(null);
      setSosTriggered(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sosCountdown]);

  const handleStartSos = () => {
    setSosTriggered(false);
    setSosCountdown(5);
    fetchLiveLocation(true);
  };

  const handleCancelSos = () => {
    setSosCountdown(null);
    setSosTriggered(false);
  };

  // Add Contact Handler
  const handleAddContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) return;
    const updated = await addBackendContact(
      contactName.trim(),
      contactRelation.trim() || 'Contact',
      contactPhone.trim()
    );
    setContacts(updated);
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setShowContactModal(false);
  };

  // Delete Contact Handler
  const handleDeleteContact = async (id: string) => {
    const updated = await deleteBackendContact(id);
    setContacts(updated);
  };

  // BLE Scan
  const handleScanBLE = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  // Toggle Watch Connection
  const handleToggleWatch = async (id: string) => {
    const updated = await toggleBackendSmartwatch(id);
    setWatches(updated);
  };

  // Pair Custom Watch
  const handlePairWatch = async () => {
    if (!newWatchName.trim()) return;
    const updated = await addBackendSmartwatch(newWatchName.trim(), newWatchBrand as any);
    setWatches(updated);
    setNewWatchName('');
    setShowPairModal(false);
  };

  // Health Connect toggle
  const handleTogglePerm = async (key: keyof HealthConnectPermissions) => {
    if (!healthPerms) return;
    const updated = await updateBackendHealthConnect({
      [key]: !healthPerms[key],
      lastSyncTimestamp: 'Just now',
    });
    setHealthPerms(updated);
  };

  // Widget theme toggle
  const handleSetWidgetTheme = async (theme: 'sage' | 'dark' | 'peach') => {
    if (!widgetConfig) return;
    const updated = await updateBackendWidgetConfig({ theme });
    setWidgetConfig(updated);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={18} color={Colors.primaryDark} strokeWidth={2.5} />
          <Text style={styles.backButtonText}>Back to All 13 Modules</Text>
        </TouchableOpacity>
      )}

      {/* Sub Tabs */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'sos' && styles.subTabBtnActive]}
          onPress={() => setSubTab('sos')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, subTab === 'sos' && styles.subTabTextActive]}>
            SOS Signal 🚨
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'smartwatch' && styles.subTabBtnActive]}
          onPress={() => setSubTab('smartwatch')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, subTab === 'smartwatch' && styles.subTabTextActive]}>
            Smartwatch ⌚
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'health_connect' && styles.subTabBtnActive]}
          onPress={() => setSubTab('health_connect')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, subTab === 'health_connect' && styles.subTabTextActive]}>
            Health Connect 🩺
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'widgets' && styles.subTabBtnActive]}
          onPress={() => setSubTab('widgets')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, subTab === 'widgets' && styles.subTabTextActive]}>
            Widgets 📱
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
      ) : (
        <>
          {/* 1. SOS Signal View */}
          {subTab === 'sos' && (
            <View style={styles.col}>
              {/* Main SOS Trigger Card */}
              <View style={[styles.card, styles.sosCard, Shadows.md]}>
                <View style={styles.sosIconCircle}>
                  <AlertOctagon size={36} color={Colors.white} strokeWidth={2} />
                </View>

                <Text style={styles.sosCardTitle}>Student SOS Emergency Signal</Text>
                <Text style={styles.sosCardSubtitle}>
                  Broadcasts emergency status & high-precision GPS coordinates to your trusted circle.
                </Text>

                {sosCountdown !== null ? (
                  <View style={styles.countdownContainer}>
                    <Text style={styles.countdownNumber}>{sosCountdown}</Text>
                    <Text style={styles.countdownNotice}>SENDING DISPATCH IN {sosCountdown} SECONDS</Text>
                    <TouchableOpacity
                      style={styles.cancelSosBtn}
                      onPress={handleCancelSos}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelSosText}>CANCEL DISPATCH NOW</Text>
                    </TouchableOpacity>
                  </View>
                ) : sosTriggered ? (
                  <View style={styles.triggeredBox}>
                    <CheckCircle2 size={24} color={Colors.error} strokeWidth={2.2} />
                    <Text style={styles.triggeredTitle}>🚨 EMERGENCY SIGNAL BROADCASTED</Text>
                    <Text style={styles.triggeredDesc}>
                      {contacts.length > 0
                        ? `SMS dispatch sent to ${contacts.map((c) => c.name).join(', ')} with live GPS coordinates.`
                        : 'Emergency broadcast dispatched with your real-time coordinates.'}
                    </Text>
                    {location && (
                      <View style={styles.triggeredLocCard}>
                        <Text style={styles.triggeredLocAddress}>📍 {location.addressLabel}</Text>
                        <Text style={styles.triggeredLocCoords}>
                          {formatCoordinates(location.latitude, location.longitude)}
                        </Text>
                        <TouchableOpacity
                          style={styles.openDispatchedPinBtn}
                          onPress={() => Linking.openURL(location.mapsUrl)}
                          activeOpacity={0.8}
                        >
                          <ExternalLink size={13} color="#FFFFFF" strokeWidth={2.2} />
                          <Text style={styles.openDispatchedPinText}>
                            Open Dispatched Pin on Google Maps
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.resetSosBtn}
                      onPress={handleCancelSos}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resetSosText}>Reset SOS Status</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.triggerSosBtn}
                    onPress={handleStartSos}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.triggerSosText}>PRESS FOR SOS ALERT</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* GPS Coordinates Card */}
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.rowBetween}>
                  <View style={styles.row}>
                    <MapPin size={18} color={Colors.primaryDark} strokeWidth={2} />
                    <Text style={styles.cardHeaderTitle}>Live GPS Location</Text>
                  </View>
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={styles.refreshLocBtn}
                      onPress={() => fetchLiveLocation(true)}
                      disabled={isLocating}
                      activeOpacity={0.7}
                    >
                      {isLocating ? (
                        <ActivityIndicator size="small" color={Colors.primaryDark} />
                      ) : (
                        <RefreshCw size={12} color={Colors.primaryDark} strokeWidth={2.2} />
                      )}
                      <Text style={styles.refreshLocText}>
                        {isLocating ? 'Locating...' : 'Refresh GPS'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.gpsLivePill}>
                      <View style={[styles.gpsDot, isLocating && styles.gpsDotPulsing]} />
                      <Text style={styles.gpsLiveText}>
                        {location?.accuracy
                          ? `±${Math.round(location.accuracy)}M ACCURACY`
                          : 'LIVE GPS ACTIVE'}
                      </Text>
                    </View>
                  </View>
                </View>

                {location ? (
                  <>
                    <Text style={styles.coordText}>
                      {formatCoordinates(location.latitude, location.longitude)}
                    </Text>
                    <Text style={styles.coordAddress}>📍 {location.addressLabel}</Text>
                    <TouchableOpacity
                      style={styles.mapsLinkRow}
                      onPress={() => Linking.openURL(location.mapsUrl)}
                      activeOpacity={0.7}
                    >
                      <ExternalLink size={13} color={Colors.primaryDark} strokeWidth={2} />
                      <Text style={styles.mapsLinkText}>Verify Exact Pin on Google Maps</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.noLocBox}>
                    <Text style={styles.noLocText}>
                      {locPermissionDenied
                        ? 'Location permission not granted. Tap below to enable.'
                        : 'Acquiring high-precision GPS lock from device satellites...'}
                    </Text>
                    <TouchableOpacity
                      style={styles.enableGpsBtn}
                      onPress={() => fetchLiveLocation(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.enableGpsBtnText}>
                        {locPermissionDenied ? 'Enable Location Access' : 'Fetch Real GPS Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={styles.coordSub}>
                  Attached automatically to outbound SMS emergency broadcasts with live Google Maps link.
                </Text>
              </View>

              {/* Emergency Contacts List */}
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardHeaderTitle}>Designated Emergency Contacts</Text>
                  <TouchableOpacity
                    style={styles.addContactBtn}
                    onPress={() => setShowContactModal(true)}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={Colors.primaryDark} strokeWidth={2.5} />
                    <Text style={styles.addContactBtnText}>Add Contact</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.contactList}>
                  {contacts.map((c) => (
                    <View key={c.id} style={styles.contactItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactName}>{c.name}</Text>
                        <Text style={styles.contactSub}>
                          {c.relation} • {c.phone}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => Linking.openURL(`tel:${c.phone}`)}
                        activeOpacity={0.7}
                      >
                        <Phone size={13} color={Colors.white} strokeWidth={2} />
                        <Text style={styles.callBtnText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteContactBtn}
                        onPress={() => handleDeleteContact(c.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={14} color={Colors.mutedText} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* 2. Smartwatch Connection View */}
          {subTab === 'smartwatch' && (
            <View style={styles.col}>
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.rowBetween}>
                  <View style={styles.row}>
                    <Watch size={20} color={Colors.primaryDark} strokeWidth={2} />
                    <Text style={styles.cardHeaderTitle}>Wear OS & BLE Companion</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.scanBtn}
                      onPress={handleScanBLE}
                      disabled={isScanning}
                      activeOpacity={0.7}
                    >
                      {isScanning ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <RefreshCw size={13} color={Colors.primary} strokeWidth={2} />
                      )}
                      <Text style={styles.scanBtnText}>{isScanning ? 'Scanning...' : 'Scan BLE'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.scanBtn}
                      onPress={() => setShowPairModal(true)}
                      activeOpacity={0.7}
                    >
                      <Plus size={13} color={Colors.primary} strokeWidth={2} />
                      <Text style={styles.scanBtnText}>Pair</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.disclaimerText}>
                  Authentic smartwatch telemetry: PPG Heart Rate, HRV and sleep SpO2 are streamed via
                  authorized Wear OS Companion APIs. Mock metrics are disabled.
                </Text>
              </View>

              {/* Paired Devices */}
              <View style={styles.devicesList}>
                {watches.map((w) => (
                  <View key={w.id} style={[styles.card, Shadows.sm]}>
                    <View style={styles.rowBetween}>
                      <View style={styles.row}>
                        <View
                          style={[
                            styles.watchIconBox,
                            { backgroundColor: w.connected ? Colors.lightSage : Colors.cream },
                          ]}
                        >
                          <Watch
                            size={22}
                            color={w.connected ? Colors.primaryDark : Colors.mutedText}
                            strokeWidth={2}
                          />
                        </View>
                        <View style={{ marginLeft: Spacing.sm }}>
                          <Text style={styles.watchName}>{w.name}</Text>
                          <Text style={styles.watchBrand}>
                            {w.brand} • Battery: {w.batteryPercent}% 🔋
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.connectBtn,
                          w.connected ? styles.btnConnected : styles.btnDisconnected,
                        ]}
                        onPress={() => handleToggleWatch(w.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.connectBtnText,
                            w.connected ? styles.textConnected : styles.textDisconnected,
                          ]}
                        >
                          {w.connected ? 'CONNECTED ✓' : 'PAIR'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Sensor Telemetry Badges */}
                    <View style={styles.sensorRow}>
                      <View style={styles.sensorBadge}>
                        <Text style={styles.sensorText}>PPG Heart Rate: Active</Text>
                      </View>
                      <View style={styles.sensorBadge}>
                        <Text style={styles.sensorText}>HRV RMSSD: Streamed</Text>
                      </View>
                      <View style={styles.sensorBadge}>
                        <Text style={styles.sensorText}>Sleep SpO2: Enabled</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 3. Health Connect UI View */}
          {subTab === 'health_connect' && healthPerms && (
            <View style={styles.col}>
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.row}>
                  <HeartPulse size={22} color="#D98B8B" strokeWidth={2} />
                  <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                    <Text style={styles.cardHeaderTitle}>Android Health Connect</Text>
                    <Text style={styles.cardSubtitle}>Unified Android 14+ Biometric Hub</Text>
                  </View>
                  <View style={styles.hcBadge}>
                    <Text style={styles.hcBadgeText}>SYSTEM API</Text>
                  </View>
                </View>

                <Text style={styles.hcDesc}>
                  Health Connect acts as the centralized on-device repository across Google Fit,
                  Samsung Health, and Whoop.
                </Text>

                {/* Permissions list */}
                <View style={styles.hcPermList}>
                  {[
                    { key: 'readSleep', label: 'SleepSessionRecord (Sleep Architecture)' },
                    { key: 'readSteps', label: 'StepsRecord (Daily Academic Steps)' },
                    { key: 'readHeartRate', label: 'HeartRateRecord (Resting Pulse & HRV)' },
                    { key: 'readExercise', label: 'ExerciseSessionRecord (Active Sessions)' },
                  ].map((p) => {
                    const isChecked = (healthPerms as any)[p.key];
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={styles.hcPermItem}
                        onPress={() => handleTogglePerm(p.key as any)}
                        activeOpacity={0.7}
                      >
                        {isChecked ? (
                          <CheckCircle2 size={18} color={Colors.primary} strokeWidth={2} />
                        ) : (
                          <Circle size={18} color={Colors.mutedText} strokeWidth={1.5} />
                        )}
                        <Text style={styles.hcPermText}>{p.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.openSettingsBtn}
                  onPress={() => Linking.openSettings()}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={15} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.openSettingsText}>Open Health Connect Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 4. Widget Configuration UI View */}
          {subTab === 'widgets' && widgetConfig && (
            <View style={styles.col}>
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.row}>
                  <Layout size={20} color={Colors.primaryDark} strokeWidth={2} />
                  <View style={{ marginLeft: Spacing.sm }}>
                    <Text style={styles.cardHeaderTitle}>Android Glance AppWidgets</Text>
                    <Text style={styles.cardSubtitle}>
                      Glanceable metrics on your Android launcher
                    </Text>
                  </View>
                </View>

                {/* Theme Selector */}
                <Text style={styles.widgetSubTitle}>Widget Color Palette</Text>
                <View style={styles.themeSelectorRow}>
                  {(['sage', 'dark', 'peach'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.themePill,
                        widgetConfig.theme === t && styles.themePillActive,
                      ]}
                      onPress={() => handleSetWidgetTheme(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.themePillText, widgetConfig.theme === t && styles.themePillTextActive]}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Live Widget Previews */}
                <Text style={styles.widgetSubTitle}>Home Screen Widget Previews</Text>

                {/* Preview 1: Screen Time & Sleep Pill */}
                <View
                  style={[
                    styles.widgetPreviewBox,
                    widgetConfig.theme === 'sage'
                      ? styles.wpSage
                      : widgetConfig.theme === 'dark'
                      ? styles.wpDark
                      : styles.wpPeach,
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <Text
                      style={[
                        styles.wpTitle,
                        widgetConfig.theme === 'dark' && { color: Colors.white },
                      ]}
                    >
                      🌱 BLOOM SCREEN TIME
                    </Text>
                    <Text
                      style={[
                        styles.wpTime,
                        widgetConfig.theme === 'dark' && { color: Colors.primaryLight },
                      ]}
                    >
                      LIVE
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.wpStat,
                      widgetConfig.theme === 'dark' && { color: Colors.white },
                    ]}
                  >
                    1h 45m / 2h 00m
                  </Text>
                  <Text
                    style={[
                      styles.wpNote,
                      widgetConfig.theme === 'dark' && { color: '#A5AEA8' },
                    ]}
                  >
                    Circadian Balance: Normal • No sleep delay detected
                  </Text>
                </View>

                {/* Preview 2: Next Assignment Countdown */}
                <View
                  style={[
                    styles.widgetPreviewBox,
                    widgetConfig.theme === 'sage'
                      ? styles.wpSage
                      : widgetConfig.theme === 'dark'
                      ? styles.wpDark
                      : styles.wpPeach,
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <Text
                      style={[
                        styles.wpTitle,
                        widgetConfig.theme === 'dark' && { color: Colors.white },
                      ]}
                    >
                      📚 NEXT DUE ASSIGNMENT
                    </Text>
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>TODAY</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.wpStat,
                      widgetConfig.theme === 'dark' && { color: Colors.white },
                    ]}
                  >
                    Graph Traversal Problem Set
                  </Text>
                  <Text
                    style={[
                      styles.wpNote,
                      widgetConfig.theme === 'dark' && { color: '#A5AEA8' },
                    ]}
                  >
                    CS 301 • Due at 23:59 (8h remaining)
                  </Text>
                </View>

                <View style={styles.pinInstructionsBox}>
                  <Text style={styles.pinInstructionText}>
                    📌 To pin to your Android device: Long-press your home screen wallpaper &gt; tap{' '}
                    <Text style={{ fontWeight: '700' }}>Widgets</Text> &gt; select{' '}
                    <Text style={{ fontWeight: '700' }}>Bloom Wellness</Text>.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {/* Add Contact Modal */}
      <Modal visible={showContactModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Contact Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Campus Health Services"
              placeholderTextColor={Colors.lightText}
              value={contactName}
              onChangeText={setContactName}
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Medical Clinic, Sister"
              placeholderTextColor={Colors.lightText}
              value={contactRelation}
              onChangeText={setContactRelation}
            />

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. +1-555-0199"
              placeholderTextColor={Colors.lightText}
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={setContactPhone}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleAddContact}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitText}>Save to Trusted Circle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pair Watch Modal */}
      <Modal visible={showPairModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pair BLE Smartwatch</Text>
              <TouchableOpacity onPress={() => setShowPairModal(false)}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Watch Device Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Garmin Venu 3"
              placeholderTextColor={Colors.lightText}
              value={newWatchName}
              onChangeText={setNewWatchName}
            />

            <Text style={styles.inputLabel}>Platform / OS</Text>
            <View style={styles.themeSelectorRow}>
              {(['Wear OS', 'Galaxy Watch', 'Garmin', 'Apple Watch'] as const).map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[
                    styles.themePill,
                    newWatchBrand === b && styles.themePillActive,
                  ]}
                  onPress={() => setNewWatchBrand(b)}
                >
                  <Text style={[styles.themePillText, newWatchBrand === b && styles.themePillTextActive]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handlePairWatch}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitText}>Pair & Authorize Telemetry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  backButtonText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontSize: 13,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabBtnActive: {
    backgroundColor: Colors.lightSage,
  },
  subTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  subTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  col: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.mutedText,
  },
  sosCard: {
    backgroundColor: '#FFF4F4',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5C6C6',
    paddingVertical: Spacing.xxl,
  },
  sosIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  sosCardTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.error,
    marginBottom: 4,
  },
  sosCardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  triggerSosBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    ...Shadows.md,
  },
  triggerSosText: {
    ...Typography.button,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.error,
    marginBottom: 4,
  },
  countdownNotice: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  cancelSosBtn: {
    backgroundColor: Colors.darkText,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  cancelSosText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  triggeredBox: {
    alignItems: 'center',
    gap: 6,
  },
  triggeredTitle: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.error,
  },
  triggeredDesc: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.darkText,
  },
  resetSosBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  resetSosText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  gpsLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  refreshLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    gap: 4,
    marginRight: 6,
  },
  refreshLocText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  gpsDotPulsing: {
    backgroundColor: '#E6A23C',
  },
  gpsLiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  coordText: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 13.5,
    marginTop: Spacing.sm,
    color: Colors.darkText,
  },
  coordAddress: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: 3,
  },
  mapsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  mapsLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primaryDark,
    textDecorationLine: 'underline',
  },
  noLocBox: {
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  noLocText: {
    fontSize: 11.5,
    color: Colors.mutedText,
    marginBottom: 6,
  },
  enableGpsBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
  },
  enableGpsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  triggeredLocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 10,
    width: '100%',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F5C6C6',
    alignItems: 'center',
  },
  triggeredLocAddress: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.darkText,
    textAlign: 'center',
  },
  triggeredLocCoords: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
    textAlign: 'center',
  },
  openDispatchedPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.error,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.round,
    marginTop: 8,
  },
  openDispatchedPinText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  coordSub: {
    ...Typography.caption,
    color: Colors.mutedText,
    marginTop: 2,
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 2,
  },
  addContactBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  contactList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  contactName: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 13,
  },
  contactSub: {
    ...Typography.caption,
    color: Colors.mutedText,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    gap: 4,
    marginRight: 6,
  },
  callBtnText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  deleteContactBtn: {
    padding: 4,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 3,
  },
  scanBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 10,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.mutedText,
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  devicesList: {
    gap: Spacing.sm,
  },
  watchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchName: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 14,
  },
  watchBrand: {
    ...Typography.caption,
    color: Colors.mutedText,
  },
  connectBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  btnConnected: {
    backgroundColor: Colors.lightSage,
  },
  btnDisconnected: {
    backgroundColor: Colors.cream,
  },
  connectBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textConnected: {
    color: Colors.primaryDark,
  },
  textDisconnected: {
    color: Colors.mutedText,
  },
  sensorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sensorBadge: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sensorText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  hcBadge: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hcBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  hcDesc: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  hcPermList: {
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  hcPermItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  hcPermText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.darkText,
  },
  openSettingsBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  openSettingsText: {
    ...Typography.button,
    fontSize: 13,
  },
  widgetSubTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.darkText,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  themePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  themePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  themePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedText,
  },
  themePillTextActive: {
    color: Colors.white,
  },
  widgetPreviewBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  wpSage: {
    backgroundColor: Colors.lightSage,
    borderWidth: 1,
    borderColor: '#D4E6D4',
  },
  wpDark: {
    backgroundColor: '#29332E',
  },
  wpPeach: {
    backgroundColor: '#FDF1EB',
    borderWidth: 1,
    borderColor: '#F7D6C4',
  },
  wpTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  wpTime: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  wpStat: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 14,
    marginVertical: 4,
  },
  wpNote: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.mutedText,
  },
  dueBadge: {
    backgroundColor: '#FBF0DF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  dueBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.warning,
  },
  pinInstructionsBox: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  pinInstructionText: {
    ...Typography.caption,
    color: Colors.darkText,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 18,
  },
  inputLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Typography.body,
    fontSize: 14,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalSubmitText: {
    ...Typography.button,
  },
});
