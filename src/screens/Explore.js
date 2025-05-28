import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import Modal from 'react-native-modal';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styleConstants } from '../utils/styleConstants';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import PricingScreen from './PricingScreen';
import {
    fetchExploreDataRequest,
    fetchUserCompletedRequest,
    fetchUserFavoritesRequest,
    fetchUserFavoritesSuccess,
    fetchUserCompletedSuccess,
} from '../redux/slices/explore/exploreSlice';
import { useTranslation } from 'react-i18next';
import FastImage from 'react-native-fast-image';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { selectIAPLoading } from '../redux/slices/iap/iapSlice';

const Explore = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { exploreData, loading, userCompletedCards, userFavoriteCards } = useSelector((state) => state.explore);
  const user = useSelector((state) => state.auth.user);
  const isPremium = useSelector((state) => state.iap.isPremium);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('Recommended');
  const [isPricingModalVisible, setPricingModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t, i18n } = useTranslation();
  const pricingModalVisibleRef = useRef(isPricingModalVisible);
  const [initialIAPCheckComplete, setInitialIAPCheckComplete] = useState(false);
  const isMounted = useRef(true);
  const IAPloading = useSelector(selectIAPLoading);
  
  const logEvent = async (eventName, params) => {
    try {
      await analytics().logEvent(eventName, params);
      crashlytics().log(`Event logged: ${eventName}`);
    } catch (error) {
      console.error(`Error logging event: ${eventName}`, error);
      crashlytics().recordError(error, `Error logging event: ${eventName}`);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    pricingModalVisibleRef.current = isPricingModalVisible;
    return () => {
      isMounted.current = false;
    };
  }, [isPricingModalVisible]);

  useEffect(() => {
    if (!IAPloading && !initialIAPCheckComplete && isMounted.current) {
      crashlytics().log(`Initial IAP check: IAPloading=${IAPloading}, isPremium=${isPremium}`);
      if (!isPremium) {
        if (!pricingModalVisibleRef.current) {
          setPricingModalVisible(true);
        } else {
          crashlytics().log('Pricing modal show skipped, ref indicates already visible/opening.');
        }
      }
      setInitialIAPCheckComplete(true);
    }
  }, [IAPloading, isPremium, initialIAPCheckComplete]);


  useEffect(() => {
    if (isPremium && isMounted.current && pricingModalVisibleRef.current) {
      setPricingModalVisible(false);
    }
  }, [isPremium]);

  useEffect(() => {
    if (!loading && Object.keys(exploreData).length === 0) {
      dispatch(fetchExploreDataRequest());
    }

    if (user) {
        setUserName(user.name);
        logEvent('user_greeting', { user_id: user.uid, user_name: user.name });
        crashlytics().log(`User greeted: ${user.name}`);
        dispatch(fetchUserCompletedRequest());
        dispatch(fetchUserFavoritesRequest());
    } else if (user === null) {
        dispatch(fetchUserCompletedSuccess([]));
        dispatch(fetchUserFavoritesSuccess([]));
    }

  }, [user, dispatch, loading, exploreData]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchExploreDataRequest());
      crashlytics().log('Explore data refreshed');
    } catch (error) {
      crashlytics().recordError(error, 'Explore refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCloseModal = () => {
    setPricingModalVisible(false);
  };


  const handleTabChange = (tab) => {
    setActiveTab(tab);
    logEvent('tab_switch', { selected_tab: tab, user_id: user?.uid || 'anonymous' });
    crashlytics().log(`Tab switched: ${tab}`);
  };

  const handleCardSelection = useCallback((item, isUnlocked) => {
    if (!isUnlocked) {
      setPricingModalVisible(true);
      logEvent('locked_card_attempt', {
        card_id: item.id,
        card_title: item.translations?.en?.title || 'No English Title',
        user_id: user?.uid || 'anonymous',
      });
      crashlytics().log(`Locked card clicked: ${item.translations?.en?.title || 'No English Title'} (ID: ${item.id})`);
      return;
    }
    const currentLanguage = i18n.language;
    const translatedItem = {
      ...item,
      title: item.translations[currentLanguage]?.title || item.translations.en?.title || 'Title Not Found',
      subheading: item.translations[currentLanguage]?.subheading || item.translations.en?.subheading || 'Subheading Not Found',
      content: item.translations[currentLanguage]?.content || item.translations.en?.content || 'Content Not Found',
    };

    navigation.navigate('CardDetail', { item: translatedItem });

    logEvent('select_card', {
      card_id: item.id,
      card_title: item.translations?.en?.title || 'No English Title',
      user_id: user?.uid || 'anonymous',
    });
    crashlytics().log(`Card selected: ${item.translations?.en?.title || 'No English Title'} (ID: ${item.id})`);
  }, [user, logEvent, i18n, navigation]);

  if (loading && Object.keys(exploreData).length === 0) {
    crashlytics().log('Explore data is loading or missing');
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.fullScreenLoader} size="large" color={styleConstants.colors.black} />
      </SafeAreaView>
    );
  }

  const tabs = useMemo(() => Object.keys(exploreData), [exploreData]);

  const filteredMeditationPaths = useMemo(() => {
    if (!exploreData || !exploreData[activeTab.toLowerCase()]) return [];
    const paths = exploreData[activeTab.toLowerCase()];
    crashlytics().log(`Filtered paths for tab: ${activeTab}, count: ${paths.length}`);
    return paths;
  }, [exploreData, activeTab]);

  const renderTab = useCallback((tab, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.tab,
        { borderColor: activeTab === tab ? '#000' : '#CCCCCC' },
      ]}
      onPress={() => handleTabChange(tab)}
    >
      <Text
        style={[
          styles.tabText,
          { color: activeTab === tab ? '#000' : '#666666' },
        ]}
      >
        {t(`exploreCategories.${tab.toLowerCase()}`) || tab}
      </Text>
    </TouchableOpacity>
  ), [activeTab, handleTabChange, t]);

  const renderMeditationPath = useCallback(({ item, index }) => {
    const isUnlocked = isPremium || index === 0;
    const currentLanguage = i18n.language;
    const title = item.translations[currentLanguage]?.title || item.translations.en?.title || 'Title Not Found';
    const subheading = item.translations[currentLanguage]?.subheading || item.translations.en?.subheading || 'Subheading Not Found';
    const isCompleted = (userCompletedCards ?? []).includes(item.id);
    const isFavorite = (userFavoriteCards ?? []).includes(item.id);

    return (
      <TouchableOpacity onPress={() => handleCardSelection(item, isUnlocked)}>
        <View style={[styles.card, { backgroundColor: item.backgroundColor }]}>
          <FastImage
            source={{ uri: item.image,
              priority: FastImage.priority.high,
             }}
            style={styles.cardImage}
            resizeMode={FastImage.resizeMode.cover}
          >
          <View style={styles.iconRow}>
            {!isUnlocked && (
              <View style={styles.lockIconContainer}>
                <Icon name="lock-outline" size={20} color="#FFF" />
              </View>
            )}
          {isFavorite && (
               <View style={[styles.FavoriteIconContainer, !isUnlocked && { right: 40 }]}>
                 <Icon name="favorite" size={24} color="red" />
               </View>
            )}
          </View>
        </FastImage>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subheading}</Text>
            <View style={styles.cardDetails}>
                {isCompleted && (
                    <Text style={styles.completedText}>{t('ExploreScreen.completed')}</Text>
                )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleCardSelection, isPremium, i18n, userCompletedCards, userFavoriteCards, t]);

  return (
    <SafeAreaView style={styles.container}>
        <>
          <View style={styles.greetingContainer}>
            <View style={styles.greetingSubcontainer}>
              <Text style={styles.greetingText}>{t('ExploreScreen.welcome')}, {userName || 'User'}</Text>
              <Icon name="waving-hand" size={30} color="#EEC319" />
            </View>
            <Text style={styles.subheading}>{t('ExploreScreen.findThePath')}</Text>
          </View>

          <View style={styles.featuredContainer}>
            <ImageBackground
              source={require('../assets/images/image11.png')}
              style={styles.featuredBackground}
              imageStyle={styles.featuredImage}
            >
              <Text style={styles.featuredTitle}>{t('ExploreScreen.letItGo')}</Text>
              <Text style={styles.featuredSubtitle}>{t('ExploreScreen.dontJudgeYourself')}</Text>
            </ImageBackground>
          </View>

          {exploreData && Object.keys(exploreData).length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <FlatList
                  data={tabs}
                  renderItem={({ item, index }) => renderTab(item, index)}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabContainer}
                />
              </View>

              <FlatList
                data={filteredMeditationPaths}
                renderItem={renderMeditationPath}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.cardsContainer}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[styleConstants.colors.black]}
                  />
                }
              />
            </>
          ) : (
            <View style={styles.centeredMessage}>
              <Text>{t('ExploreScreen.couldNotLoadContent')}</Text>
            </View>
          )}
        </>

      {/* <Modal
        animationType="fade"
        transparent={true}
        visible={isPricingModalVisible}
        onRequestClose={handleCloseModal}>
        <View style={styles.pricingModalOverlay}>
          <PricingScreen onClose={handleCloseModal} />
        </View>
      </Modal> */}

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

export default Explore;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleConstants.colors.primary,
  },
  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: styleConstants.spacing.custom.s20,
  },
  greetingContainer: {
    marginTop: styleConstants.spacing.sm,
    paddingHorizontal: styleConstants.spacing.custom.s20,
  },
  greetingSubcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: styleConstants.typography.fontSizes.lg,
    paddingEnd: 10,
    fontFamily: styleConstants.typography.fontFamily.PoppinsExtraBold,
    color: styleConstants.colors.black,
  },
  subheading: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    marginTop: 5,
  },
  featuredContainer: {
    marginTop: styleConstants.spacing.custom.s15,
    paddingHorizontal: styleConstants.spacing.custom.s20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  featuredBackground: {
    height: 160,
    justifyContent: 'center',
    paddingHorizontal: styleConstants.spacing.custom.s20,
  },
  featuredImage: {
    borderRadius: 15,
  },
  featuredTitle: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontWeight: 'bold',
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    marginTop: '20%',
  },
  featuredSubtitle: {
    fontSize: styleConstants.typography.fontSizes.sm,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    marginTop: styleConstants.spacing.custom.s5,
  },
  sectionHeader: {
    paddingHorizontal: styleConstants.spacing.custom.s20,
    marginTop: styleConstants.spacing.custom.s20,
  },
  tabContainer: {
    paddingBottom: 10,
  },
  tab: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: styleConstants.spacing.custom.s15,
    marginRight: styleConstants.spacing.custom.s10,
  },
  tabText: {
    fontSize: styleConstants.typography.fontSizes.sm,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
  },
  cardsContainer: {
    marginTop: styleConstants.spacing.custom.s10,
    paddingHorizontal: styleConstants.spacing.custom.s20,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: styleConstants.spacing.custom.s20,
    height: 100,
  },
  cardImage: {
    width: 100,
    height: 'auto',
  },
  lockIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  FavoriteIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 12,
    padding: 4,
  },
  cardContent: {
    flex: 1,
    padding: styleConstants.spacing.custom.s15,
  },
  cardTitle: {
    fontSize: styleConstants.typography.fontSizes.sm,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    fontWeight: 'bold',
    color: styleConstants.colors.black,
  },
  cardSubtitle: {
    fontSize: styleConstants.typography.fontSizes.xs,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    marginTop: styleConstants.spacing.custom.s5,
  },
  cardDetails: {
    flexDirection: 'row',
    marginTop: styleConstants.spacing.custom.s10,
  },
  completedText: {
    fontSize: styleConstants.typography.fontSizes.xs,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: styleConstants.colors.black,
    borderWidth: 1,
    borderColor: styleConstants.colors.grey,
    borderRadius: 50,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pricingModalOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
});