import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser, selectUserSubscriptions } from '../redux/slices/auth/authSlice';
import { useNavigation } from '@react-navigation/native';
import { styleConstants } from '../utils/styleConstants';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import Header from './HeaderComponent';

const SupportInfo = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector(selectUser);
  const userSubscriptions = useSelector(selectUserSubscriptions);
  const [isLoading, setLoading] = useState(false);
  const { t, i18n: i18nInstance } = useTranslation();

  const logEvent = async (eventName, params) => {
    try {
      await analytics().logEvent(eventName, params);
      crashlytics().log(`Event logged: ${eventName}`);
    } catch (error) {
      console.error(`Error logging event: ${eventName}`, error);
      crashlytics().recordError(error, `Error logging event: ${eventName}`);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.container}>
          {isLoading ? (
            <ActivityIndicator size="large" color={styleConstants.colors.buttonBg} />
          ) : (
            <Text>{t('ProfileScreen.userNotLoggedIn')}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.contentScrollArea} contentContainerStyle={styles.contentContainer}>
      <Header heading={t('ProfileScreen.supportInfo')} goBack={() => navigation.goBack()} />
        <View style={styles.optionsSection}>
          {/* <Text style={styles.sectionTitle}>{t('ProfileScreen.accountSettings')}</Text> */}
          
          <TouchableOpacity style={styles.optionTouchable} onPress={() => {
            navigation.navigate('PrivacyPolicy');
            logEvent('navigate_to_privacy_policy', { user_id: user.uid });
          }}>
            <View style={styles.optionItem}>
              <Text style={styles.optionText}>{t('ProfileScreen.privacyPolicy')}</Text>
              <MaterialIcons name='chevron-right' size={24} color={styleConstants.colors.black} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionTouchable} onPress={() => {
            navigation.navigate('TermsAndServices');
            logEvent('navigate_to_terms', { user_id: user.uid });
          }}>
            <View style={styles.optionItem}>
              <Text style={styles.optionText}>{t('ProfileScreen.termsOfService')}</Text>
              <MaterialIcons name='chevron-right' size={24} color={styleConstants.colors.black} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionTouchable} onPress={() => {
            Linking.openURL('https://averybit.com/contact/');
            logEvent('navigate_to_help_support', { user_id: user.uid });
          }}>
            <View style={styles.optionItem}>
              <Text style={styles.optionText}>{t('ProfileScreen.helpAndSupport')}</Text>
              <MaterialIcons name='chevron-right' size={24} color={styleConstants.colors.black} />
            </View>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default SupportInfo;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: styleConstants.colors.primary,
  },
  header: {
    backgroundColor: styleConstants.colors.primary,
    alignItems: 'center',
    paddingBottom: styleConstants.spacing.custom.s10,
    paddingTop: Platform.OS === 'android' ? styleConstants.spacing.custom.s10 : 0,
  },
  title: {
    fontSize: styleConstants.typography.fontSizes.xl,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
    color: styleConstants.colors.black,
  },
  contentScrollArea: {
    flex: 1,
    paddingHorizontal: styleConstants.spacing.custom.s20,
  },
  contentContainer: {
    paddingBottom: styleConstants.spacing.custom.s20,
  },
  optionsSection: {
    marginTop: styleConstants.spacing.custom.s20,
  },
  sectionTitle: {
    fontSize: styleConstants.typography.fontSizes.md,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
  },
  optionTouchable: {
    paddingVertical: styleConstants.spacing.custom.s15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    flex: 1,
    marginRight: styleConstants.spacing.custom.s10,
  },
  languageDropdownContainer: {
    marginTop: styleConstants.spacing.custom.s20,
    marginBottom: styleConstants.spacing.custom.s10,
  },
  bottomButtonContainer: {
    paddingHorizontal: styleConstants.spacing.custom.s20,
    paddingTop: styleConstants.spacing.custom.s20,
    paddingBottom: Platform.OS === 'ios' ? styleConstants.spacing.custom.s20 : styleConstants.spacing.custom.s20,
    backgroundColor: styleConstants.colors.primary,
  },
  logoutButton: {
    //  marginTop: styleConstants.spacing.custom.s15,
    //  marginBottom: styleConstants.spacing.custom.s15,
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: styleConstants.spacing.custom.s15,
    alignItems: 'center',
  },
  subHeading: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: 'red',
  },
  smlButton: {
    backgroundColor: styleConstants.colors.buttonBg,
    paddingVertical: styleConstants.spacing.custom.s13,
    borderRadius: 50,
    alignItems: 'center',
    width: '48%',
  },
  buttonText: {
    color: styleConstants.colors.black,
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
  },
  subscriptionHeading: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    marginRight: styleConstants.spacing.custom.s5,
  }
});