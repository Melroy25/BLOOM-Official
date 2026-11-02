import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BloomHeader } from '../../components/dashboard/BloomHeader';
import { TodayOverviewSection } from '../../components/dashboard/TodayOverviewSection';
import { QuickAccessSection } from '../../components/dashboard/QuickAccessSection';
import { AddWidgetCard } from '../../components/dashboard/AddWidgetCard';
import { DailyGoalsSection } from '../../components/dashboard/DailyGoalsSection';
import { StaggerContainer } from '../../components/animations/StaggerContainer';
import { StaggerItem } from '../../components/animations/StaggerItem';
import { BackgroundGlow } from '../../components/theme/BackgroundGlow';
import {
  getUserTasks,
  addTask,
  updateTask,
  deleteTask,
} from '../../services/firestoreService';
import { pinBloomWidget } from '../../services/widgetDataService';
import { loadWeeklyUsage, recordTodayUsage } from '../../services/storageService';
import { TaskDocument } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  // Tasks State
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In-App Screen Time State
  const [screenTimeMinutes, setScreenTimeMinutes] = useState<number>(0);

  const activeUserName = userProfile?.fullName || user?.displayName || 'Friend';

  // 1. Load Real Tasks from Firestore
  const loadTasks = useCallback(async () => {
    if (!user?.uid) {
      setTasksLoading(false);
      return;
    }
    try {
      const fetched = await getUserTasks(user.uid);
      setTasks(fetched);
    } catch (err) {
      console.warn('[HomeScreen] Error loading tasks:', err);
    } finally {
      setTasksLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 2. Track In-App Screen Time Today
  useEffect(() => {
    let isMounted = true;
    const loadUsage = async () => {
      try {
        const weekly = await loadWeeklyUsage();
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEntry = weekly.find((w) => w.date === todayStr);
        if (isMounted) {
          setScreenTimeMinutes(todayEntry ? todayEntry.minutes : 0);
        }
      } catch (err) {
        console.warn('[HomeScreen] Error loading screen time:', err);
      }
    };
    loadUsage();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTasks();
  };

  // Task Actions
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    const nextState = !currentCompleted;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextState } : t))
    );
    try {
      await updateTask(taskId, { completed: nextState });
    } catch (err: any) {
      // Revert if error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: currentCompleted } : t))
      );
      Alert.alert('Update Failed', err?.message || 'Could not update task.');
    }
  };

  const handleAddTask = async (title: string) => {
    if (!user?.uid) return;
    const optimisticId = `task_${Date.now()}`;
    const newTask: TaskDocument = {
      id: optimisticId,
      userId: user.uid,
      title,
      completed: false,
      category: 'personal',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks((prev) => [newTask, ...prev]);

    try {
      const realId = await addTask({
        userId: user.uid,
        title,
        completed: false,
        category: 'personal',
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === optimisticId ? { ...t, id: realId } : t))
      );
    } catch (err: any) {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const previous = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch (err: any) {
      setTasks(previous);
      Alert.alert('Delete Failed', err?.message || 'Could not delete task.');
    }
  };

  const handleEditTask = async (taskId: string, newTitle: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t))
    );
    try {
      await updateTask(taskId, { title: newTitle });
    } catch (err: any) {
      Alert.alert('Edit Failed', err?.message || 'Could not update task title.');
    }
  };

  // Metrics calculation
  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );
  const totalTasksCount = tasks.length;

  return (
    <BackgroundGlow style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <StaggerContainer baseDelay={0} interval={60}>
          {/* 1. HEADER (Logo & Settings Button) + 2. GREETING (Personalised) + 3. MOTIVATIONAL MESSAGE */}
          <StaggerItem role="header">
            <BloomHeader
              userName={activeUserName}
              onSettingsPress={() => router.push('/settings')}
            />
          </StaggerItem>

          {/* 4. TODAY'S OVERVIEW (4 Tiles: Tasks Done, Screen Time, SOS Signal, Reports) */}
          <StaggerItem role="card" delay={100}>
            <TodayOverviewSection
              tasksDoneCount={completedTasksCount}
              totalTasksCount={totalTasksCount}
              screenTimeText={`${screenTimeMinutes}m`}
              onOpenTasks={() => router.push('/(tabs)/tasks')}
              onOpenSOS={() => router.push('/sos')}
              onOpenReports={() => router.push('/reports')}
            />
          </StaggerItem>

          {/* 5. QUICK ACCESS (4 Tiles: Heal Bubble, Talk to BLOOM, Write Journal, Focus Mode) */}
          <StaggerItem role="card" delay={180}>
            <QuickAccessSection
              onOpenHealBubble={() => router.push('/heal-bubble')}
              onOpenAI={() => router.push('/(tabs)/ai')}
              onOpenJournal={() => router.push('/journal')}
              onOpenFocusMode={() => router.push('/focus-mode')}
            />
          </StaggerItem>

          {/* 5.5. + ADD WIDGET ACTION CARD (Native Home Screen Widget Pinning) */}
          <StaggerItem role="card" delay={210}>
            <AddWidgetCard onPress={pinBloomWidget} />
          </StaggerItem>

          {/* 6. DAILY GOALS (To-Do List with Checkboxes, + Create Task, Edit & Delete) */}
          <StaggerItem role="remaining" delay={240}>
            <DailyGoalsSection
              tasks={tasks}
              isLoading={tasksLoading}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Bottom spacing for bottom navigation bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
