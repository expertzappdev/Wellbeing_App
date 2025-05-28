import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/AntDesign';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { styleConstants } from '../utils/styleConstants';
import { useNavigation } from '@react-navigation/native';
import Header from './HeaderComponent';
import {
  selectUser,
  selectMorningReminderTime,
  selectEveningReminderTime,
  selectMorningReminderEnabled,
  selectEveningReminderEnabled,
  selectReminderSettingsLoading,
  selectReminderSettingsError,
  saveReminderSettingsRequest,
} from '../redux/slices/auth/authSlice';

const createDateFromInput = (input, defaultHour, defaultMinute) => {
  let hour = defaultHour;
  let minute = defaultMinute;

  if (input && typeof input === 'object' && input !== null && input.hasOwnProperty('hour') && input.hasOwnProperty('minute')) {
    hour = input.hour;
    minute = input.minute;
  } else if (input instanceof Date && !isNaN(input.getTime())) {
    hour = input.getHours();
    minute = input.getMinutes();
  } else if (typeof input === 'string') {
    try {
      const date = new Date(input);
      if (!isNaN(date.getTime())) {
        hour = date.getHours();
        minute = date.getMinutes();
      } else {
        console.warn(`Invalid date string received: ${input}. Using default time.`);
      }
    } catch (e) {
      console.warn(`Error parsing date string: ${input}. Using default time.`, e);
    }
  } else if (input !== undefined && input !== null) {
    console.warn(`Invalid date input type received: ${typeof input}. Using default time.`);
  }

  const now = new Date();
  const timeToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  );

  return timeToday;
};


const ReminderSettings = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector(selectUser);
  const savedMorningTimeData = useSelector(selectMorningReminderTime);
  const savedEveningTimeData = useSelector(selectEveningReminderTime);
  const savedIsMorningEnabled = useSelector(selectMorningReminderEnabled);
  const savedIsEveningEnabled = useSelector(selectEveningReminderEnabled);
  const isLoading = useSelector(selectReminderSettingsLoading);
  const saveError = useSelector(selectReminderSettingsError);
  const [morningTime, setMorningTime] = useState(() =>
    createDateFromInput(savedMorningTimeData, 9, 0)
  );
  const [eveningTime, setEveningTime] = useState(() =>
    createDateFromInput(savedEveningTimeData, 20, 0)
  );
  const [isMorningReminderEnabled, setIsMorningReminderEnabled] = useState(savedIsMorningEnabled);
  const [isEveningReminderEnabled, setIsEveningReminderEnabled] = useState(savedIsEveningEnabled);

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);

  useEffect(() => {
    setMorningTime(createDateFromInput(savedMorningTimeData, 9, 0));
    setEveningTime(createDateFromInput(savedEveningTimeData, 20, 0));
    setIsMorningReminderEnabled(savedIsMorningEnabled);
    setIsEveningReminderEnabled(savedIsEveningEnabled);
  }, [savedMorningTimeData, savedEveningTimeData, savedIsMorningEnabled, savedIsEveningEnabled]);

  useEffect(() => {
    if (!isLoading) {
      if (saveError) {
        Alert.alert(t('common.error'), saveError || t('reminderSettings.saveError'));
      }
    }
  }, [isLoading, saveError, t]);

  const showTimePicker = useCallback((type) => {
    setEditingType(type);
    setPickerVisible(true);
  }, []);

  const hidePicker = useCallback(() => {
    setPickerVisible(false);
    setEditingType(null);
  }, []);

  const handleConfirm = useCallback((selectedDate) => {
    const currentDate = selectedDate || (editingType === 'morning' ? morningTime : eveningTime);

    const today = new Date();
    const timeToSet = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      currentDate.getHours(),
      currentDate.getMinutes(),
      0,
      0
    );

    if (editingType === 'morning') {
      setMorningTime(timeToSet);
    } else {
      setEveningTime(timeToSet);
    }
    hidePicker();
  }, [editingType, morningTime, eveningTime, hidePicker]);


  const handleSave = useCallback(() => {
    if (!user?.uid) {
      Alert.alert(t('common.error'), t('reminderSettings.userNotFound', 'User not logged in. Cannot save settings.'));
      return;
    }
    dispatch(saveReminderSettingsRequest({
      uid: user.uid,
      settings: {
        morningHour: morningTime.getHours(),
        morningMinute: morningTime.getMinutes(),
        eveningHour: eveningTime.getHours(),
        eveningMinute: eveningTime.getMinutes(),
        isMorningEnabled: isMorningReminderEnabled,
        isEveningEnabled: isEveningReminderEnabled,
      }
    }));
    navigation.goBack();
  }, [dispatch, user?.uid, morningTime, eveningTime, isMorningReminderEnabled, isEveningReminderEnabled]);

  const formatTime = useCallback((date) => {
    if (!date || isNaN(date.getTime())) return '--:--';
    try {
      if (Intl && Intl.DateTimeFormat) {
        return new Intl.DateTimeFormat(i18n.language || 'en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(date);
      } else {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? t('common.pm', 'PM') : t('common.am', 'AM');
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
      }
    } catch (error) {
      console.error("Error formatting time:", error, "Date:", date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }, [t, i18n.language]);

  const pickerValue = editingType === 'morning' ? morningTime : eveningTime;

  return (
    <View style={styles.parentContainer}>
      <SafeAreaView style={styles.container}>
        <Header heading={t('reminderSettings.title')} goBack={() => navigation.goBack()} />

        <View style={styles.headerTitle}>
          <Text style={styles.titleHeader}>{t('reminderSettings.headerTitle')}</Text>
          <Text style={styles.subtitle}>{t('reminderSettings.headerSubtitle')}</Text>
        </View>

        <View contentContainerStyle={styles.content}>

          <View style={styles.reminderCard}>
            <View style={styles.cardHeader}>
              <FeatherIcon name="sun" size={24} color="#FFD700" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>{t('reminderSettings.morningLabel')}</Text>
              <View style={{ flex: 1 }} />
              <Switch
                trackColor={{ false: styleConstants.colors.grey, true: styleConstants.colors.success }}
                thumbColor="#fff"
                ios_backgroundColor={styleConstants.colors.grey}
                onValueChange={setIsMorningReminderEnabled}
                value={isMorningReminderEnabled}
              />
            </View>
            {isMorningReminderEnabled && (
              <View style={styles.cardBody}>
                <Text style={styles.timeLabel}>{t('reminderSettings.setTime')}</Text>
                <TouchableOpacity onPress={() => showTimePicker('morning')} style={styles.timeDisplayButton}>
                  <Text style={styles.timeDisplay}>{formatTime(morningTime)}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.reminderCard}>
            <View style={styles.cardHeader}>
              <FeatherIcon name="moon" size={24} color="#800080" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>{t('reminderSettings.eveningLabel')}</Text>
              <View style={{ flex: 1 }} />
              <Switch
                trackColor={{ false: styleConstants.colors.grey, true: styleConstants.colors.success }}
                thumbColor="#fff"
                ios_backgroundColor={styleConstants.colors.grey}
                onValueChange={setIsEveningReminderEnabled}
                value={isEveningReminderEnabled}
              />
            </View>
            {isEveningReminderEnabled && (
              <View style={styles.cardBody}>
                <Text style={styles.timeLabel}>{t('reminderSettings.setTime')}</Text>
                <TouchableOpacity onPress={() => showTimePicker('evening')} style={styles.timeDisplayButton}>
                  <Text style={styles.timeDisplay}>{formatTime(eveningTime)}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={styleConstants.colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>{t('reminderSettings.saveButton')}</Text>
            )}
          </TouchableOpacity>
          {saveError && <Text style={styles.errorText}>{saveError}</Text>}
        </View>
        <DateTimePickerModal
          isVisible={isPickerVisible}
          mode="time"
          date={pickerValue}
          onConfirm={handleConfirm}
          onCancel={hidePicker}
          is24Hour={false}
          locale={i18n.language || 'en_GB'}
          headerTextIOS={t('reminderSettings.pickTime', 'Pick a time')}
        />

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  parentContainer: {
    flex: 1,
    backgroundColor: styleConstants.colors.primary,
  },
  container: {
    flex: 1,
    marginHorizontal: styleConstants.spacing.md,
  },

  header: {
    backgroundColor: styleConstants.colors.primary,
    alignItems: 'center',
    paddingBottom: styleConstants.spacing.custom.s5,
    paddingTop: Platform.OS === 'android' ? styleConstants.spacing.custom.s10 : 0,
},
title: {
    fontSize: styleConstants.typography.fontSizes.xl,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
    color: styleConstants.colors.black,
    textAlign: 'center',
    // flex: 1,
},
  headerTitle: {
    backgroundColor: styleConstants.colors.primary,
    marginTop: styleConstants.spacing.custom.s10,
  },
  titleHeader: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
    color: styleConstants.colors.black,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    textAlign: 'center',
    paddingBottom: styleConstants.spacing.sm,
  },
  content: {
    flexGrow: 1,
    // padding: styleConstants.spacing.md,
    paddingBottom: styleConstants.spacing.xl,
  },
  reminderCard: {
    backgroundColor: styleConstants.colors.white,
    borderRadius: styleConstants.spacing.md,
    padding: styleConstants.spacing.md,
    marginBottom: styleConstants.spacing.md,
    borderWidth: 1,
    borderColor: styleConstants.colors.border || styleConstants.colors.grey,
    ...styleConstants.shadows?.default,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: styleConstants.spacing.sm,
  },
  cardTitle: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: styleConstants.colors.black,
  },
  cardBody: {
    marginTop: styleConstants.spacing.md,
  },
  timeLabel: {
    fontSize: styleConstants.typography.fontSizes.sm,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    marginBottom: styleConstants.spacing.sm,
  },
  timeDisplayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: styleConstants.spacing.xs,
    paddingHorizontal: styleConstants.spacing.md,
    // backgroundColor: styleConstants.colors.cardBackground,
    borderRadius: styleConstants.spacing.xl,
    borderWidth: 1,
    borderColor: styleConstants.colors.grey,
  },
  timeDisplay: {
    fontSize: styleConstants.typography.fontSizes.lg,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: styleConstants.colors.black,
  },
  saveButtonContainer: {
    padding: styleConstants.spacing.md,
    backgroundColor: styleConstants.colors.primary,
  },
  saveButton: {
    backgroundColor: styleConstants.colors.buttonBg,
    padding: styleConstants.spacing.md,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonDisabled: {
    backgroundColor: styleConstants.colors.grey,
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: styleConstants.colors.black,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: styleConstants.typography.fontSizes.sm,
    color: 'red',
    marginTop: styleConstants.spacing.sm,
    textAlign: 'center',
  }
});

export default ReminderSettings;