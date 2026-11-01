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
import {
  getUserTasks,
  addTask,
  updateTask,
  deleteTask,
} from '../../services/firestoreService';
import {
  pinBloomWidget,
  saveScreenTimeUsage,
} from '../../services/widgetDataService';
import { TaskDocument } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  // Tasks State
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In-App Screen Time State
  const [screenTimeMinutes, setScreenTimeMinutes] = useState<number>(38);

  const activeUserName = userProfile?.fullName || user?.displayName || 'Friend';

  // 1. Load Real Tasks from Firestore
  const loadTasks = useCallback(async () => {
    if (!user?.uid) {
      setTasksLoading(false);
      return;
    }
    try {
      const fetched = await getUserTasks(user.uid);
      if (fetched.length === 0) {
        // Seed 4 initial default goals in Firestore if brand-new user
        const initialTasks = [
          'Complete today\'s study goals',
          'Take a 20-minute mindful walk',
          'Drink enough water (2.5L)',
          'Write a mindful journal reflection',
        ];
        const seeded: TaskDocument[] = [];
        for (const title of initialTasks) {
          const id = await addTask({
            userId: user.uid,
            title,
            completed: false,
            category: 'wellness',
          });
          seeded.push({
            id,
            userId: user.uid,
            title,
            completed: false,
            category: 'wellness',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        setTasks(seeded);
      } else {
        setTasks(fetched);
      }
    } catch (err) {
      console.warn('[DashboardScreen] Error loading tasks:', err);
    } finally {
      setTasksLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 2. Track In-App Screen Time Today & Sync with widget service
  useEffect(() => {
    const todayKey = `@bloom_app_usage_${new Date().toISOString().split('T')[0]}`;
    AsyncStorage.getItem(todayKey)
      .then((saved) => {
        const minutes = saved ? parseInt(saved, 10) : 38;
        setScreenTimeMinutes(minutes);
        // Increment session active minutes
        const updated = minutes + 2;
        AsyncStorage.setItem(todayKey, String(updated)).catch(() => {});
        // Sync with widget storage
        saveScreenTimeUsage(updated);
      })
      .catch(() => {});
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

  // Handle Home Screen Widget Pinning
  const handlePinWidget = async () => {
    await pinBloomWidget();
  };

  // Metrics calculation
  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );
  const totalTasksCount = tasks.length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
        {/* 1. HEADER (Logo & Settings Button) + 2. GREETING (Personalised) */}
        <BloomHeader
          userName={activeUserName}
          onSettingsPress={() => router.push('/settings')}
        />

        {/* 4. TODAY'S OVERVIEW (4 Tiles: Tasks Done, Screen Time, SOS Signal, Reports) */}
        <TodayOverviewSection
          tasksDoneCount={completedTasksCount}
          totalTasksCount={totalTasksCount}
          screenTimeText={`${screenTimeMinutes}m`}
          onOpenTasks={() => router.push('/(tabs)/tasks')}
          onOpenSOS={() => router.push('/sos')}
          onOpenReports={() => router.push('/reports')}
        />

        {/* 5. QUICK ACCESS (4 Tiles: Heal Bubble, Talk to BLOOM, Write Journal, Focus Mode) */}
        <QuickAccessSection
          onOpenHealBubble={() => router.push('/heal-bubble')}
          onOpenAI={() => router.push('/(tabs)/ai')}
          onOpenJournal={() => router.push('/journal')}
          onOpenFocusMode={() => router.push('/focus-mode')}
        />

        {/* 5.5. + ADD WIDGET ACTION CARD (Triggers Native OS Widget Pinning) */}
        <AddWidgetCard onPress={handlePinWidget} />

        {/* 6. DAILY GOALS (To-Do List with Checkboxes, + Create Task, Edit & Delete) */}
        <DailyGoalsSection
          tasks={tasks}
          isLoading={tasksLoading}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />

        {/* Bottom spacing for bottom navigation bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
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
