import React, { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import PushNotification, { Importance } from 'react-native-push-notification';
import { useSelector } from 'react-redux';
import {
    selectMorningReminderTime,
    selectEveningReminderTime,
    selectMorningReminderEnabled,
    selectEveningReminderEnabled,
    selectUser,
} from '../redux/slices/auth/authSlice';

const getFormattedDate = () => new Date().toISOString().split('T')[0];

const DailyDiaryReminder = () => {
  const { entries = {} } = useSelector((state) => state.diary || {});
  const loggedUser = useSelector(selectUser);
  const userId = loggedUser?.uid;
  const morningTimeData = useSelector(selectMorningReminderTime);
  const eveningTimeData = useSelector(selectEveningReminderTime);
  const isMorningEnabled = useSelector(selectMorningReminderEnabled);
  const isEveningEnabled = useSelector(selectEveningReminderEnabled);
  const appState = useRef(AppState.currentState);
  const EVENING_NOTIFICATION_ID = '1234';
  const MORNING_NOTIFICATION_ID = '1235';
  const DEFAULT_MORNING_TIME = { hour: 9, minute: 0 };
  const DEFAULT_EVENING_TIME = { hour: 20, minute: 0 }; // 20:00 is 8 PM

  const hasUserFilledData = () => {
    try {
      const todayDate = getFormattedDate();
      const todayEntry = entries?.[todayDate];
      return !!todayEntry && Object.keys(todayEntry).length > 0;
    } catch (e) {
      console.warn('Error checking if user filled data:', e);
      return false;
    }
  };

  const scheduleNotification = (id, hour, minute, enabled, title, message) => {
      try {
        PushNotification.cancelLocalNotifications({ id: String(id) });
      } catch (e) {
        console.warn(`Error cancelling notification ${id}:`, e);
      }

      if (!enabled) {
          return;
      }

      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(hour, minute, 0, 0);
      if (now >= targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      try {
        PushNotification.localNotificationSchedule({
          id: String(id),
          channelId: 'wellbeing',
          title: title,
          message: message,
          date: targetTime,
          allowWhileIdle: true,
          importance: 'high',
          priority: 'high',
          repeatType: 'day',
        });
      } catch (e) {
        console.warn(`Error scheduling notification ${id}:`, e);
      }
    };

  const cancelNotificationsIfFilled = () => {
    try {
      if (hasUserFilledData()) {
        const effectiveMorningEnabled = (userId && isMorningEnabled !== undefined) ? isMorningEnabled : true;
        const effectiveEveningEnabled = (userId && isEveningEnabled !== undefined) ? isEveningEnabled : true;

        if (effectiveEveningEnabled) {
            PushNotification.cancelLocalNotifications({ id: EVENING_NOTIFICATION_ID });
        }
        if (effectiveMorningEnabled) {
             PushNotification.cancelLocalNotifications({ id: MORNING_NOTIFICATION_ID });
        }
      }
    } catch (e) {
      console.warn('Error cancelling notifications:', e);
    }
  };

  useEffect(() => {
    try {
      PushNotification.configure({
        onNotification: function (notification) {
          // console.log('Notification received:', notification);
          // Add your notification handling logic here (e.g., navigate user)
        },
        requestPermissions: Platform.OS === 'ios',
      });

      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'wellbeing',
            channelName: 'Wellbeing Journal Notifications',
            channelDescription: 'Reminders to fill your wellbeing journal',
            importance: Importance.HIGH,
            vibrate: true,
          },
          (created) => console.log(`[Push] Channel created: ${created}`)
        );
      }
    } catch (e) {
      console.warn('Error in PushNotification configuration:', e);
    }
    // return () => {
    //   // If needed, add cleanup here, though PN library might handle it
    // };
  }, []);

  useEffect(() => {
    const useDefaultMorning = !(userId && isMorningEnabled && morningTimeData?.hour !== undefined);
    const useDefaultEvening = !(userId && isEveningEnabled && eveningTimeData?.hour !== undefined);
    const effectiveMorningTime = useDefaultMorning ? DEFAULT_MORNING_TIME : morningTimeData;
    const effectiveEveningTime = useDefaultEvening ? DEFAULT_EVENING_TIME : eveningTimeData;
    const shouldScheduleMorning = useDefaultMorning || (userId && isMorningEnabled);
    const shouldScheduleEvening = useDefaultEvening || (userId && isEveningEnabled);
    if (shouldScheduleMorning) {
        scheduleNotification(
            MORNING_NOTIFICATION_ID,
            effectiveMorningTime.hour,
            effectiveMorningTime.minute,
            true,
            'Good Morning!',
            'Start Your Day with Intention. Your daily journal awaits.'
        );
    } else {
        try {
             PushNotification.cancelLocalNotifications({ id: MORNING_NOTIFICATION_ID });
        } catch(e) { console.warn('Error cancelling morning notification:', e); }
    }

    if (shouldScheduleEvening) {
        scheduleNotification(
            EVENING_NOTIFICATION_ID,
            effectiveEveningTime.hour,
            effectiveEveningTime.minute,
            true,
            'Evening Reflection',
            'Time to complete your daily journal entry.'
        );
    } else {
         try {
            PushNotification.cancelLocalNotifications({ id: EVENING_NOTIFICATION_ID });
         } catch(e) { console.warn('Error cancelling evening notification:', e); }
    }
    cancelNotificationsIfFilled();


  }, [userId, morningTimeData, eveningTimeData, isMorningEnabled, isEveningEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        cancelNotificationsIfFilled();
      }
      appState.current = nextAppState;
    });

    cancelNotificationsIfFilled();

    return () => {
      subscription.remove();
    };
  }, [entries, isMorningEnabled, isEveningEnabled, userId]);

  return null;
};

export default DailyDiaryReminder;