import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Image, SafeAreaView, Platform, ScrollView, RefreshControl, TouchableOpacity, Alert, Keyboard } from 'react-native'; // Import Keyboard
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDiaryRequest, addDiaryEntryRequest, fetchQuoteRequest } from '../redux/slices/diary/diarySlice';
import { selectUser, getUserByIdRequest, setIsWelcomeShown } from '../redux/slices/auth/authSlice';
// import { restorePurchasesRequest } from '../redux/slices/iap/iapSlice';
import { selectIAPLoading } from '../redux/slices/iap/iapSlice';
import { styleConstants } from '../utils/styleConstants';
import Icon from 'react-native-vector-icons/AntDesign';
import FeatherIcon from 'react-native-vector-icons/Feather'
import PricingScreen from './PricingScreen';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import Collapsible from 'react-native-collapsible';

const Separator = () => <View style={styles.separator} />;

const InputRow = React.memo(React.forwardRef(({ placeholder, showNumber, value, onChangeText, onBlur, onSubmitEditing }, ref) => {
  const returnKeyType = onSubmitEditing ? 'next' : 'default';
  const blurOnSubmit = !onSubmitEditing;
  return (
    <View style={styles.inputRow}>
      {showNumber && <Text style={styles.number}>{String(showNumber)}.</Text>}
      <TextInput
        style={styles.input}
        value={value ?? ""}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        onChangeText={onChangeText}
        onBlur={onBlur}
        ref={ref}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
      />
    </View>
  )
}));

const HomeScreen = () => {
  const dispatch = useDispatch();
  const loggedUser = useSelector(selectUser);
  const isPremium = useSelector((state) => state.iap?.isPremium ?? false);
  const IAPloading = useSelector(selectIAPLoading);
  const { entries, quote, loading, error } = useSelector((state) => state.diary ?? { entries: {}, quote: null, loading: false, error: null });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPricingModalVisible, setPricingModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [morningPoints, setMorningPoints] = useState(["", "", ""]);
  const [eveningPoints, setEveningPoints] = useState(["", "", ""]);
  const [todayGreat, setTodayGreat] = useState("");
  const [positiveAffirmation, setPositiveAffirmation] = useState("");
  const [goodDeed, setGoodDeed] = useState("");
  const [learnedToday, setLearnedToday] = useState("");
  const [highlightedDates, setHighlightedDates] = useState([]);
  // const [defaultRedDots, setDefaultRedDots] = useState({});
  const [errorMessage, setErrorMessage] = useState(false);
  const charLimit = 70;
  const { t, i18n } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [initialIAPCheckComplete, setInitialIAPCheckComplete] = useState(false);
  const isMounted = useRef(true);
  const pricingModalVisibleRef = useRef(isPricingModalVisible);
  const [activeSection, setActiveSection] = useState();
  const morning1Ref = useRef();
  const morning2Ref = useRef();
  const morning3Ref = useRef();
  const todayGreatRef = useRef();
  const positiveAffirmationRef = useRef();
  const goodDeedRef = useRef();
  const learnedTodayRef = useRef();
  const evening1Ref = useRef();
  const evening2Ref = useRef();
  const evening3Ref = useRef();

  useEffect(() => {
    isMounted.current = true;
    pricingModalVisibleRef.current = isPricingModalVisible;
    return () => {
      isMounted.current = false;
    };
  }, [isPricingModalVisible]);

  const logEventSafe = useCallback(async (eventName, params = {}) => {
    try {
      const safeParams = {
        userId: loggedUser?.uid ?? 'anonymous',
        selectedDate: selectedDate,
        screen: 'HomeScreen',
        ...params,
      };
      await analytics().logEvent(eventName, safeParams);
    } catch (err) {
      console.error(`Error logging analytics event: ${eventName}`, err);
      crashlytics().setAttribute('analyticsErrorEvent', eventName);
      crashlytics().recordError(err, `Analytics Logging Failed`);
    }
  }, [loggedUser?.uid, selectedDate]);

  const logErrorSafe = useCallback((err, contextMessage = 'Unknown Context') => {
    console.error(contextMessage, err);
    crashlytics().setAttribute('errorContext', contextMessage);
    if (err instanceof Error) {
      crashlytics().recordError(err);
    } else {
      crashlytics().recordError(new Error(String(err)));
    }
    logEventSafe('error_event', { error_message: String(err?.message || err), context: contextMessage });
  }, [logEventSafe]);


  const onRefresh = useCallback(async () => {
    if (!isMounted.current) return;
    setRefreshing(true);
    try {
      if (loggedUser?.uid && selectedDate) {
        await Promise.all([
          dispatch(getUserByIdRequest(loggedUser.uid)),
          dispatch(fetchQuoteRequest()),
          dispatch(fetchDiaryRequest({ userId: loggedUser.uid, selectedDate }))
        ]);
        await logEventSafe('refresh_data_success', { user_id: loggedUser.uid, selected_date: selectedDate });
      } else {
        await logEventSafe('refresh_data_skipped', { reason: !loggedUser?.uid ? 'no_user' : 'no_date' });
      }
    } catch (err) {
      logErrorSafe(err, 'Error during manual refresh');
    } finally {
      if (isMounted.current) {
        setTimeout(() => {
          if (isMounted.current) setRefreshing(false);
        }, 500);
      }
    }
  }, [loggedUser?.uid, selectedDate, dispatch, logEventSafe, logErrorSafe]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayObj = useMemo(() => new Date(today), [today]);

  const toggleModal = useCallback(() => {
    setIsModalVisible(prev => !prev);
    if (!isModalVisible) {
      logEventSafe('open_calendar');
      crashlytics().log('Calendar modal opened');
    }
  }, [isModalVisible, logEventSafe]);


  const getDateRange = useMemo(() => {
    try {
      const baseDate = new Date();
      const pastDate = new Date();
      pastDate.setFullYear(baseDate.getFullYear() - 5);
      const futureDate = new Date();
      futureDate.setFullYear(baseDate.getFullYear() + 10);
      return { pastDate, futureDate };
    } catch (err) {
      logErrorSafe(err, "Error calculating date range");
      const fallbackDate = new Date();
      return { pastDate: fallbackDate, futureDate: fallbackDate };
    }
  }, [logErrorSafe]);

  const { pastDate, futureDate } = getDateRange;


  useEffect(() => {
    const restoreAndLog = async () => {
      // if (!isPremium && loggedUser?.uid) {
      //   try {
      //     await dispatch(restorePurchasesRequest({ userId: loggedUser.uid }));
      //     if (isMounted.current) {
      //       // dispatch(setIsWelcomeShown()); // Keep original position if needed, though check prevents duplicate welcome?
      //     }
      //     await logEventSafe('attempt_restore_purchase');
      //   } catch (err) {
      //     logErrorSafe(err, 'Error during restorePurchasesRequest dispatch');
      //   }
      // }
      if (isMounted.current) {
        if (loggedUser?.uid) dispatch(setIsWelcomeShown());
        logEventSafe('view_screen');
        crashlytics().log('HomeScreen viewed');
      }
    };
    restoreAndLog();
  }, [dispatch, isPremium, loggedUser?.uid, logEventSafe, logErrorSafe]);


  useEffect(() => {
    if (!IAPloading && !initialIAPCheckComplete && isMounted.current) {
      crashlytics().log(`Initial IAP check: IAPloading=${IAPloading}, isPremium=${isPremium}`);
      if (!isPremium) {
        if (!pricingModalVisibleRef.current) {
          setPricingModalVisible(true);
          logEventSafe('trigger_pricing_modal_show_initial');
        } else {
          crashlytics().log('Pricing modal show skipped, ref indicates already visible/opening.');
        }
      }
      setInitialIAPCheckComplete(true);
    }
  }, [IAPloading, isPremium, initialIAPCheckComplete, logEventSafe]);


  useEffect(() => {
    if (isPremium && isMounted.current && pricingModalVisibleRef.current) {
      setPricingModalVisible(false);
      logEventSafe('trigger_pricing_modal_hide_on_premium');
    }
  }, [isPremium, logEventSafe]);


  const handleCloseModal = useCallback(() => {
    if (isMounted.current) {
      setPricingModalVisible(false);
    }
    logEventSafe('close_pricing_modal_manual');
    crashlytics().log('Pricing modal closed manually');
  }, [logEventSafe]);

  useEffect(() => {
    const fetchFilledDates = async () => {
      if (!loggedUser?.uid) return;
      try {
        crashlytics().log('Fetching highlighted dates');
        const snapshot = await firestore()
          .collection('users')
          .doc(loggedUser.uid)
          .collection('dailyEntries')
          .get();

        const dates = snapshot.empty ? [] : snapshot.docs.map((doc) => doc.id).filter(id => id && /^\d{4}-\d{2}-\d{2}$/.test(id));

        if (isMounted.current) {
          setHighlightedDates(dates);
        }
        logEventSafe('highlight_dates_fetched', { count: dates.length });
        crashlytics().log(`Workspaceed ${dates.length} highlight dates`);
      } catch (err) {
        logErrorSafe(err, 'Error fetching filled dates');
      }
    };

    fetchFilledDates();
  }, [loggedUser?.uid, logEventSafe, logErrorSafe]);


  const computedMarkedDates = useMemo(() => {
    const marks = {};
    try {
      if (!pastDate || !futureDate || highlightedDates === null) return {}; // Ensure dependencies are ready

      const pYear = pastDate.getFullYear();
      const fYear = futureDate.getFullYear();

      crashlytics().log(`Computing dots for range: ${pYear} to ${fYear} based on ${highlightedDates.length} filled dates.`);
      let dotCount = 0;

      for (let year = pYear; year <= fYear; year++) {
        const startMonth = (year === pYear) ? pastDate.getMonth() : 0;
        const endMonth = (year === fYear) ? futureDate.getMonth() : 11;

        for (let month = startMonth; month <= endMonth; month++) {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const startDay = (year === pYear && month === startMonth) ? pastDate.getDate() : 1;
          const endDay = (year === fYear && month === endMonth) ? futureDate.getDate() : daysInMonth;

          for (let day = startDay; day <= endDay; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isFilled = highlightedDates.includes(dateString);
            const isFutureDate = new Date(dateString) > todayObj; // Compare using Date objects for accuracy

            if (isFilled) {
              marks[dateString] = { marked: true, dotColor: 'lightgreen' };
              dotCount++;
            } else if (!isFutureDate) {
               if (dateString <= today) {
                 marks[dateString] = { marked: true, dotColor: 'darkred' };
                 dotCount++;
               }
            }
          }
        }
      }
      crashlytics().log(`Computed ${dotCount} total dots.`);
    } catch (err) {
      logErrorSafe(err, 'Error creating markedDates from highlightedDates');
      return {};
    }
    return marks;
  }, [pastDate, futureDate, highlightedDates, today, todayObj, logErrorSafe]);


  const finalMarkedDates = useMemo(() => {
    try {
      const baseMarks = { ...computedMarkedDates };

      const todayStyles = {
        selected: true,
        selectedColor: '#DEAA79',
        selectedTextColor: 'white',
        marked: baseMarks[today]?.marked ?? false,
        dotColor: baseMarks[today]?.dotColor
      };

      const selectedStyles = {
        selected: true,
        selectedColor: 'orange',
        selectedTextColor: 'white',
        marked: baseMarks[selectedDate]?.marked ?? false,
        dotColor: baseMarks[selectedDate]?.dotColor
      };

      baseMarks[today] = { ...(baseMarks[today] || {}), ...todayStyles };

      if (selectedDate && selectedDate !== today) {
        baseMarks[selectedDate] = { ...(baseMarks[selectedDate] || {}), ...selectedStyles };
      } else if (selectedDate === today) {
        baseMarks[today] = { ...baseMarks[today], ...selectedStyles };
      }

      return baseMarks;
    } catch (err) {
      logErrorSafe(err, "Error creating finalMarkedDates");
      const fallbackMarks = {};
      fallbackMarks[today] = { selected: true, selectedColor: '#DEAA79', selectedTextColor: 'white' };
      if (selectedDate) {
        fallbackMarks[selectedDate] = { ...(fallbackMarks[selectedDate] || {}), selected: true, selectedColor: 'orange', selectedTextColor: 'white' };
      }
      return fallbackMarks;
    }
  }, [computedMarkedDates, selectedDate, today, logErrorSafe]); // Depend on computedMarkedDates


  useEffect(() => {
    const fetchDataForDate = async () => {
      if (loggedUser?.uid && selectedDate) {
        try {
          crashlytics().log(`Workspaceing data for date: ${selectedDate}`);
          await Promise.all([
            dispatch(getUserByIdRequest(loggedUser.uid)),
            dispatch(fetchQuoteRequest()),
            dispatch(fetchDiaryRequest({ userId: loggedUser.uid, selectedDate }))
          ]);
          logEventSafe('fetch_entries_and_quote_success');
        } catch (err) {
          logErrorSafe(err, `Error fetching data for date: ${selectedDate}`);
        }
      } else {
        crashlytics().log('Skipping data fetch: No user or selected date.');
      }
    };
    fetchDataForDate();
  }, [loggedUser?.uid, selectedDate, dispatch, logEventSafe, logErrorSafe]);


  useEffect(() => {
    if (!isMounted.current) return;
    try {
      const entry = entries?.[selectedDate] ?? {};
      setMorningPoints([
        entry?.morning?.point1 ?? "",
        entry?.morning?.point2 ?? "",
        entry?.morning?.point3 ?? "",
      ]);
      setEveningPoints([
        entry?.evening?.point1 ?? "",
        entry?.evening?.point2 ?? "",
        entry?.evening?.point3 ?? "",
      ]);
      setTodayGreat(entry?.morning?.todayGreat ?? "");
      setPositiveAffirmation(entry?.morning?.positiveAffirmation ?? "");
      setGoodDeed(entry?.evening?.goodDeed ?? "");
      setLearnedToday(entry?.evening?.learnedToday ?? "");
    } catch (err) {
      logErrorSafe(err, "Error setting form fields from entry data");
      setMorningPoints(["", "", ""]);
      setEveningPoints(["", "", ""]);
      setTodayGreat("");
      setPositiveAffirmation("");
      setGoodDeed("");
      setLearnedToday("");
    }
  }, [entries, selectedDate, logErrorSafe]);

  const handleAutosave = useCallback(async (fieldName, value, index = null) => {
    const userId = loggedUser?.uid;
    if (!userId) {
      Alert.alert(t('HomeScreen.error') || "Error", t('errors.notLoggedIn') || "User not logged in");
      return;
    }

    let currentMorningPoints = Array.isArray(morningPoints) && morningPoints.length === 3 ? [...morningPoints] : ["", "", ""];
    let currentEveningPoints = Array.isArray(eveningPoints) && eveningPoints.length === 3 ? [...eveningPoints] : ["", "", ""];
    let currentTodayGreat = todayGreat ?? "";
    let currentPositiveAffirmation = positiveAffirmation ?? "";
    let currentGoodDeed = goodDeed ?? "";
    let currentLearnedToday = learnedToday ?? "";

    switch (fieldName) {
      case 'morningPoints':
        if (index !== null && index >= 0 && index < 3) {
          currentMorningPoints[index] = value ?? "";
        }
        break;
      case 'eveningPoints':
        if (index !== null && index >= 0 && index < 3) {
          currentEveningPoints[index] = value ?? "";
        }
        break;
      case 'todayGreat':
        currentTodayGreat = value ?? "";
        break;
      case 'positiveAffirmation':
        currentPositiveAffirmation = value ?? "";
        break;
      case 'goodDeed':
        currentGoodDeed = value ?? "";
        break;
      case 'learnedToday':
        currentLearnedToday = value ?? "";
        break;
      default:
        console.warn(`[Autosave] Unknown fieldName for autosave: ${fieldName}`);
        return;
    }

    const entryData = {
      morning: {
        point1: morningPoints[0]?.trim() ?? "",
        point2: morningPoints[1]?.trim() ?? "",
        point3: morningPoints[2]?.trim() ?? "",
        todayGreat: todayGreat?.trim() ?? "",
        positiveAffirmation: positiveAffirmation?.trim() ?? "",
      },
      evening: {
        point1: eveningPoints[0]?.trim() ?? "",
        point2: eveningPoints[1]?.trim() ?? "",
        point3: eveningPoints[2]?.trim() ?? "",
        goodDeed: goodDeed?.trim() ?? "",
        learnedToday: learnedToday?.trim() ?? "",
      },
      lastUpdated: firestore.FieldValue.serverTimestamp(),
    };

    const isEntryNowEmpty =
      !(entryData.morning.point1 || entryData.morning.point2 || entryData.morning.point3 ||
        entryData.morning.todayGreat || entryData.morning.positiveAffirmation ||
        entryData.evening.point1 || entryData.evening.point2 || entryData.evening.point3 ||
        entryData.evening.goodDeed || entryData.evening.learnedToday);

    if (isEntryNowEmpty) {
      console.log(`[Autosave] Skipped for empty entry: ${selectedDate}`);
      return;
    }

    try {
      crashlytics().log(`Autosaving entry for date: ${selectedDate}, field: ${fieldName}, index: ${index}`);
      await dispatch(addDiaryEntryRequest({ userId, selectedDate, entryData }));

      setHighlightedDates(prev => {
        const currentDates = Array.isArray(prev) ? prev : [];
        if (currentDates.includes(selectedDate)) return currentDates;
        return [...currentDates, selectedDate];
      });

    } catch (err) {
      console.error(`[Autosave] Error during dispatch or save for date: ${selectedDate}`, err);
    }
  }, [
    loggedUser?.uid, selectedDate, morningPoints, eveningPoints, todayGreat,
    positiveAffirmation, goodDeed, learnedToday, dispatch, logEventSafe, logErrorSafe, t
  ]);

  const saveTokenToFirestore = useCallback(async () => {
    const userId = loggedUser?.uid;
    if (!userId) return;

    try {
      const token = await AsyncStorage.getItem('deviceToken');
      if (token) {
        const tokenRef = firestore()
          .collection('users')
          .doc(userId)
          .collection('userdevicetoken')
          .where('token', '==', token);

        const snapshot = await tokenRef.get();

        if (snapshot.empty) {
          await firestore()
            .collection('users')
            .doc(userId)
            .collection('userdevicetoken')
            .add({
              token,
              createdAt: firestore.FieldValue.serverTimestamp(),
              platform: Platform.OS
            });
          logEventSafe('save_fcm_token_success');
          crashlytics().log('FCM token saved successfully');
        }
      } else {
        crashlytics().log('No FCM token found in AsyncStorage');
      }
    } catch (err) {
      logErrorSafe(err, 'Error saving FCM token to Firestore');
    }
  }, [loggedUser?.uid, logEventSafe, logErrorSafe]);


  useEffect(() => {
    saveTokenToFirestore();
  }, [saveTokenToFirestore]);

  const handleDayPress = useCallback((day) => {
    if (day?.dateString) {
       if (new Date(day.dateString) > todayObj) {
         logEventSafe('calendar_day_pressed_future', { pressedDate: day.dateString });
         return; 
       }
      if (isMounted.current) {
        setSelectedDate(day.dateString);
        setIsModalVisible(false);
      }
      logEventSafe('calendar_day_pressed', { pressedDate: day.dateString });
    } else {
      logErrorSafe(new Error('Calendar onDayPress received invalid day object'), 'Calendar Interaction Error');
    }
  }, [logEventSafe, logErrorSafe, todayObj]);

  const handleTextChange = useCallback((setter, text) => {
    if (isMounted.current) {
      const limitedText = text.length > charLimit ? text.substring(0, charLimit) : text;
      setter(limitedText);

      const isOverLimit = text.length > charLimit;
      if (isOverLimit && !errorMessage) {
        setErrorMessage(true);
        setTimeout(() => { if (isMounted.current && errorMessage) setErrorMessage(false); }, 2000);
      } else if (!isOverLimit && errorMessage) { 
         setErrorMessage(false);
      }
    }
  }, [charLimit, errorMessage]);

  const handlePointChange = useCallback((setter, index, text) => {
    if (isMounted.current) {
      if (text.length <= charLimit) {
        setter((prev = []) => {
          const currentPoints = Array.isArray(prev) && prev.length === 3 ? prev : ["", "", ""];
          const updated = [...currentPoints];
          updated[index] = text;
          return updated;
        });
        setErrorMessage(false);
      } else {
        setter((prev = []) => {
          const currentPoints = Array.isArray(prev) && prev.length === 3 ? prev : ["", "", ""];
          const updated = [...currentPoints];
          updated[index] = text.substring(0, charLimit);
          return updated;
        });
        setErrorMessage(true);
        setTimeout(() => { if (isMounted.current && errorMessage) setErrorMessage(false); }, 2000);
      }
    }
  }, [charLimit, errorMessage]);

  useEffect(() => {
    const loadAccordionState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('accordionState');
        if (savedState !== null && (savedState === 'morning' || savedState === 'evening')) { // Validate loaded state
          setActiveSection(savedState);
        } else {
          setActiveSection('morning');
        }
      } catch (e) {
        console.error("Failed to load accordion state.", e);
        setActiveSection('morning');
      }
    };
    loadAccordionState();
  }, []);

  useEffect(() => {
    const saveAccordionState = async () => {
    if (activeSection) {
      try {
        await AsyncStorage.setItem('accordionState', activeSection);
      } catch (e) {
        console.error("Failed to save accordion state.", e);
      }
      }
    };
    saveAccordionState();
  }, [activeSection]);

  // const toggleSection = (section) => {
  //   setActiveSection(section);
  // };

  const toggleSection = (section) => {
    let nextActiveSection = null;

    if (activeSection === section) {
      nextActiveSection = section === 'morning' ? 'evening' : 'morning';
    } else {
      nextActiveSection = section;
    }

    setActiveSection(nextActiveSection);
  };

  const renderMorningHeader = () => (
    <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('morning')}>
      <Image source={require('../assets/images/Sun.png')} style={styles.accordionIcon} />
      <Text style={styles.accordionTitle}>{t('HomeScreen.morningReflection')}</Text>
      <FeatherIcon
        name={activeSection === 'morning' ? 'chevron-down' : 'chevron-right'}
        size={24}
        color={styleConstants.colors.black}
      />
    </TouchableOpacity>
  );

  const renderEveningHeader = () => (
    <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('evening')}>
      <Image source={require('../assets/images/Moon.png')} style={styles.accordionIcon} />
      <Text style={styles.accordionTitle}>{t('HomeScreen.eveningReflection') || 'Evening Reflection'}</Text>
      <FeatherIcon
        name={activeSection === 'evening' ? 'chevron-down' : 'chevron-right'}
        size={24}
        color={styleConstants.colors.black}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <TouchableOpacity style={styles.header} onPress={toggleModal} activeOpacity={0.7}>
        <Text style={styles.title}>
          {selectedDate === today
            ? t('HomeScreen.today')
            : selectedDate.split('-').reverse().join('-')}
        </Text>
        <Icon name="caretdown" size={15} style={styles.headerIcon} />
      </TouchableOpacity>

      <ScrollView
        style={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={styleConstants.primaryColor}
            colors={[styleConstants.primaryColor]}
          />
        }
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={Keyboard.dismiss}
        >
          <View style={styles.container}>
            {renderMorningHeader()}
            <Collapsible collapsed={activeSection !== 'morning'}>
              <View style={styles.sectionContent}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitleTop}>{t('HomeScreen.imGratefulFor')}</Text>
                  {morningPoints.map((point, index) => (
                    <InputRow
                      key={`morning-${index}`}
                      showNumber={index + 1}
                      placeholder=""
                      value={point ?? ""}
                      onChangeText={(text) => handlePointChange(setMorningPoints, index, text)}
                      onBlur={(e) => handleAutosave('morningPoints', e.nativeEvent.text, index)}
                      ref={
                        index === 0 ? morning1Ref :
                          index === 1 ? morning2Ref :
                            morning3Ref
                      }
                      onSubmitEditing={
                        index === 0 ? () => morning2Ref.current?.focus() :
                          index === 1 ? () => morning3Ref.current?.focus() :
                            () => todayGreatRef.current?.focus()
                      }
                    />
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('HomeScreen.thisIsHowIllMakeTodayGreat')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder=""
                    placeholderTextColor="#aaa"
                    value={todayGreat ?? ""}
                    maxLength={charLimit}
                    onChangeText={(text) => handleTextChange(setTodayGreat, text)}
                    onBlur={(e) => handleAutosave('todayGreat', e.nativeEvent.text)}
                    ref={todayGreatRef}
                    onSubmitEditing={() => positiveAffirmationRef.current?.focus()}
                    returnKeyType="next"
                  />
                </View>
                <Separator />

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('HomeScreen.positiveAffirmation')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder=""
                    placeholderTextColor="#aaa"
                    value={positiveAffirmation ?? ""}
                    maxLength={charLimit}
                    onChangeText={(text) => handleTextChange(setPositiveAffirmation, text)}
                    onBlur={(e) => handleAutosave('positiveAffirmation', e.nativeEvent.text)}
                    ref={positiveAffirmationRef}
                    returnKeyType="done"
                  />
                </View>
                <Separator />
              </View>
            </Collapsible>

            <View style={styles.highlightBox}>
              {loading ? (
                <Text style={styles.highlightText}>{t('HomeScreen.loadingQuote')}</Text>
              ) : error ? (
                <Text style={styles.highlightText}>{t('HomeScreen.defaultQuote')}</Text>
              ) : (
                <Text style={styles.highlightText}>
                  {quote?.translations?.[i18n.language] ?? quote?.translations?.['en'] ?? t('HomeScreen.defaultQuote')}
                </Text>
              )}
            </View>

            {renderEveningHeader()}
            <Collapsible collapsed={activeSection !== 'evening'}>
              <View style={styles.sectionContent}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitleTop}>{t('HomeScreen.myGoodDeedToday')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder=""
                    placeholderTextColor="#aaa"
                    value={goodDeed ?? ""}
                    maxLength={charLimit}
                    onChangeText={(text) => handleTextChange(setGoodDeed, text)}
                    onBlur={(e) => handleAutosave('goodDeed', e.nativeEvent.text)}
                    ref={goodDeedRef}
                    onSubmitEditing={() => learnedTodayRef.current?.focus()}
                    returnKeyType="next"
                  />
                </View>
                <Separator />

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('HomeScreen.whatILearnedToday')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder=""
                    placeholderTextColor="#aaa"
                    value={learnedToday ?? ""}
                    maxLength={charLimit}
                    onChangeText={(text) => handleTextChange(setLearnedToday, text)}
                    onBlur={(e) => handleAutosave('learnedToday', e.nativeEvent.text)}
                    ref={learnedTodayRef}
                    onSubmitEditing={() => evening1Ref.current?.focus()}
                    returnKeyType="next"
                  />
                </View>
                <Separator />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('HomeScreen.greatThingsIExperiencedToday')}</Text>

                  {eveningPoints.map((point, index) => (
                    <InputRow
                      key={`evening-${index}`}
                      showNumber={index + 1}
                      placeholder=""
                      value={point ?? ""}
                      onChangeText={(text) => handlePointChange(setEveningPoints, index, text)}
                      onBlur={(e) => handleAutosave('eveningPoints', e.nativeEvent.text, index)}
                      ref={
                        index === 0 ? evening1Ref :
                          index === 1 ? evening2Ref :
                            evening3Ref
                      }
                      onSubmitEditing={
                        index === 0 ? () => evening2Ref.current?.focus() :
                          index === 1 ? () => evening3Ref.current?.focus() :
                            () => Keyboard.dismiss()
                      }
                      returnKeyType={index === 2 ? 'done' : 'next'}
                    />
                  ))}
                </View>
              </View>
            </Collapsible>
            <Separator />
          </View>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        isVisible={errorMessage}
        animationIn="wobble"
        animationOut="fadeOut"
        backdropOpacity={0.4}
        useNativeDriverForBackdrop={Platform.OS === 'android'}
        style={styles.animationModal}
        onModalHide={() => { if (isMounted.current) setErrorMessage(false); }}
        hideModalContentWhileAnimating
      >
        <View style={styles.animationContent}>
          <LottieView
            source={require('../assets/images/Animation5.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
          <Text style={styles.errorText}>{t('HomeScreen.oopsReachedCharacterLimit')}</Text>
        </View>
      </Modal>
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={toggleModal}
        onBackButtonPress={toggleModal}
        style={styles.modal}
        animationIn="slideInDown"
        animationOut="slideOutUp"
        animationInTiming={500}
        animationOutTiming={500}
        useNativeDriver={Platform.OS === 'android'}
        hideModalContentWhileAnimating={true}
      >
        <View style={styles.modalContent}>
          <Calendar
            current={selectedDate || today}
            markedDates={finalMarkedDates}
            onDayPress={handleDayPress}
            style={styles.calendarView}
            theme={{
              dotStyle: {
                 width: 6,
                 height: 6,
                 borderRadius: 4,
              },
            }}
            maxDate={today}
          />
        </View>
      </Modal>

      <Modal
        animationIn="slideInDown"
        animationOut="slideOutUp"
        animationInTiming={500}
        animationOutTiming={500}
        transparent={true}
        isVisible={isPricingModalVisible}
        onRequestClose={handleCloseModal}>
        <View style={styles.pricingModalOverlay}>
          <PricingScreen onClose={handleCloseModal} />
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: styleConstants.colors.secondary,
  },
  container: {
    paddingHorizontal: styleConstants.spacing.custom.s20,
    backgroundColor: styleConstants.colors.primary,
  },
  contentContainer: {
    backgroundColor: styleConstants.colors.primary,
  },
  header: {
    backgroundColor: styleConstants.colors.secondary,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 10,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  title: {
    fontSize: styleConstants.typography.fontSizes.xl,
    fontWeight: styleConstants.typography.fontWeights.bold,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
    color: styleConstants.colors.black,
    paddingHorizontal: styleConstants.spacing.custom.s5,

  },
  sectionTitle: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontWeight: styleConstants.typography.fontWeights.regular,
    color: styleConstants.colors.hometext,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    textAlign: 'center',
    marginTop: styleConstants.spacing.custom.s10,
    marginBottom: styleConstants.spacing.md,
  },
  sectionTitleTop: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontWeight: styleConstants.typography.fontWeights.regular,
    color: styleConstants.colors.hometext,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    textAlign: 'center',
    marginTop: styleConstants.spacing.custom.s20,
    marginBottom: styleConstants.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: styleConstants.spacing.custom.s5,
  },
  icon: {
    width: 35,
    height: 35,
    position: 'absolute',
    right: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: styleConstants.spacing.custom.s25,
  },
  number: {
    fontSize: styleConstants.typography.fontSizes.md,
    color: styleConstants.colors.black,
    marginRight: styleConstants.spacing.custom.s5,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    fontSize: styleConstants.typography.fontSizes.sml,
    color: '#131010',
  },
  separator: {
    height: styleConstants.spacing.custom.s20,
  },
  highlightBox: {
    backgroundColor: styleConstants.colors.buttonBg,
    padding: 15,
    marginTop: styleConstants.spacing.custom.s20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  highlightText: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    paddingHorizontal: 5,
    color: styleConstants.colors.black,
    textAlign: 'center',
    lineHeight: 30,
  },
  subHeadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: styleConstants.spacing.custom.s20,
  },
  subHeading: {
    fontSize: styleConstants.typography.fontSizes.lg,
    color: styleConstants.colors.hometext,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    marginTop: 2,
  },

  modal: {
    justifyContent: 'flex-start',
    margin: 0,
  },
  modalContent: {
    backgroundColor: styleConstants.colors.white,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    marginHorizontal: 30,
    marginTop: 100,
  },
  modalTitle: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: styleConstants.colors.hometext,
    marginBottom: styleConstants.spacing.custom.s15,
  },
  calendarView: {
    width: 310,
  },
  buttonOutline: {
    paddingVertical: 12,
    backgroundColor: styleConstants.colors.buttonBg,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: styleConstants.spacing.custom.s25,
  },
  buttonText: {
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    fontSize: styleConstants.typography.fontSizes.md,
  },
  pricingModalOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  lottie: {
    zIndex: 100,
    width: 120,
    height: 120,
  },
  successText: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  },
  animatedContainer: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: styleConstants.spacing.custom.s10,
  },
  animationContent: {
    backgroundColor: styleConstants.colors.white,
    borderRadius: 20,
    alignItems: 'center',
    padding: styleConstants.spacing.custom.s25,
  },
  animationSubContent: {
    alignItems: 'center',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: styleConstants.spacing.md,
    backgroundColor: styleConstants.colors.secondary,
    marginTop: styleConstants.spacing.custom.s20,
    paddingHorizontal: styleConstants.spacing.md,
    borderRadius: 8,
  },
  accordionTitle: {
    flex: 1,
    fontSize: styleConstants.typography.fontSizes.md,
    fontWeight: styleConstants.typography.fontWeights.regular,
    color: styleConstants.colors.hometext,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    textAlign: 'center',
    marginHorizontal: styleConstants.spacing.md,
  },
  accordionIcon: {
    width: 35,
    height: 35,
  },
  // sectionContent: {
  //   paddingTop: styleConstants.spacing.md,
  // },
  radioButtonContainer: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: styleConstants.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: styleConstants.colors.black,
  },
});

export default HomeScreen;
