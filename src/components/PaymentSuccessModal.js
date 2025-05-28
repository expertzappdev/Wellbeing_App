import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { styleConstants } from '../utils/styleConstants';
import { useTranslation } from 'react-i18next';

const PaymentSuccessModal = ({ onClose }) => {
  const { t } = useTranslation();

  const logEvent = async (eventName, params) => {
    try {
      await analytics().logEvent(eventName, params);
      crashlytics().log(`Event logged: ${eventName}`);
    } catch (error) {
      console.error(`Error logging event: ${eventName}`, error);
      crashlytics().recordError(error, `Error logging event: ${eventName}`);
    }
  };

  React.useEffect(() => {
    logEvent('payment_success_modal_shown', { timestamp: Date.now() });
    crashlytics().log('PaymentSuccessModal displayed');
  }, []);

  const handleClose = () => {
    logEvent('payment_success_modal_closed', { timestamp: Date.now() });
    crashlytics().log('PaymentSuccessModal closed');
    onClose();
  };

  const handleOkayPress = () => {
    logEvent('payment_success_okay_pressed', { timestamp: Date.now() });
    crashlytics().log('User pressed "Okay" on PaymentSuccessModal');
    onClose();
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
          <Icon name="close" size={30} color="#000" />
        </TouchableOpacity>
        <View>
          <LottieView
            source={require('../assets/images/Animation.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
          <Text style={styles.heading}>{t('PaymentSuccessModal.success')}</Text>
          <Text style={styles.description}>
            {t('PaymentSuccessModal.enjoyDailyPrompts')}
          </Text>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={handleOkayPress}>
          <Text style={styles.buttonText}>{t('PaymentSuccessModal.okay')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#F1E1E1',
    borderRadius: 15,
    padding: 15,
  },
  closeIcon: {
    alignSelf: 'flex-end',
  },
  heading: {
    fontSize: styleConstants.typography.fontSizes.lg,
    // fontWeight: styleConstants.typography.fontWeights.bold,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
    color: styleConstants.colors.black,
    paddingVertical: styleConstants.spacing.custom.s15,
    textAlign: 'center',
  },
  checkIcon: {
    textAlign: 'center',
  },
  description: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsLight,
    color: styleConstants.colors.black,
    lineHeight: 20,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#44B722',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: styleConstants.spacing.custom.s15,
    height: 56,
  },
  buttonText: {
    color: styleConstants.colors.white,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    fontWeight: styleConstants.typography.fontWeights.bold,
    fontSize: styleConstants.typography.fontSizes.md,
  },
  lottie: {
    alignSelf: 'center',
    zIndex: 100,
    width: 120,
    height: 120,
},
});

export default PaymentSuccessModal;