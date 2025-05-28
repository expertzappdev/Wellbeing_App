import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import DotIcon from 'react-native-vector-icons/Entypo';
import { styleConstants } from '../utils/styleConstants';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import useIAP from '../services/IAP';
import { useSelector, useDispatch } from 'react-redux';
import { selectIAPProducts, setSelectedProduct } from '../redux/slices/iap/iapSlice';
import { useTranslation } from 'react-i18next';

const getAndroidFormattedPrice = (product) => {
  try {
     return product?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice || 'N/A';
  } catch (e) {
    console.error("Error extracting formatted price for product:", product?.productId, e);
    crashlytics().recordError(new Error(`Error extracting price for productId: ${product?.productId}`));
    return 'N/A';
  }
};

const getAndroidOfferToken = (product) => {
  try {
    return product?.subscriptionOfferDetails?.[0]?.offerToken;
  } catch (e) {
    console.error("Error extracting offer token for product:", product?.productId, e);
    crashlytics().recordError(new Error(`Error extracting offerToken for productId: ${product?.productId}`));
    return null;
  }
};

const PricingScreen = ({ onClose }) => {
  const dispatch = useDispatch();
  const { handleiOSSubscription, handleAndroidSubscription, loading } = useIAP();
  const productDetails = useSelector(selectIAPProducts);
  const [selectedPlan, setSelectedPlan] = useState(null); 
  const navigation = useNavigation();
  const { t } = useTranslation(); 

  const logEvent = async (eventName, params) => {
    try {
      await analytics().logEvent(eventName, params);
      crashlytics().log(`Event logged: ${eventName}`);
    } catch (error) {
      console.error(`Error logging event: ${eventName}`, error);
      crashlytics().recordError(error);
    }
  };

  useEffect(() => {
    if (productDetails && productDetails.length > 0 && !selectedPlan) {
       setSelectedPlan(productDetails[0]?.productId);
       // dispatch(setSelectedProduct({ productId: productDetails[0].productId, ... }));
    }
  }, [productDetails, selectedPlan]);

  const handlePlanSelection = (product) => {
    setSelectedPlan(product.productId);

    const price = Platform.OS === 'ios'
        ? product.localizedPrice
        : getAndroidFormattedPrice(product);

    dispatch(setSelectedProduct({
      productId: product.productId,
      title: product.title || product.name,
      localizedPrice: price,
    }));

    logEvent('plan_selected', { selected_plan: product.productId });
    crashlytics().log(`Plan selected: ${product.productId}`);
  };

  const handleSubscribe = () => {
    if (!selectedPlan) {
      console.warn('No plan selected.');
      crashlytics().log('No plan selected during subscription attempt.');
      return;
    }
    // console.log('Selected Plan ID:', selectedPlan);
    logEvent('subscribe_attempt', { selected_plan: selectedPlan });
    crashlytics().log(`Subscription attempted for plan: ${selectedPlan}`);

    if (Platform.OS === 'android') {
      const productToSubscribe = productDetails.find(p => p.productId === selectedPlan);

      if (!productToSubscribe) {
         console.error("Could not find product details for selected plan:", selectedPlan);
         crashlytics().recordError(new Error(`Product details not found for Android productId: ${selectedPlan}`));
         return;
      }

      const offerToken = getAndroidOfferToken(productToSubscribe);

      if (!offerToken) {
        console.error("Could not find offerToken for Android product:", selectedPlan);
        crashlytics().recordError(new Error(`Missing offerToken for Android productId: ${selectedPlan}`));
        return;
      }
      handleAndroidSubscription(selectedPlan, offerToken);

    } else if (Platform.OS === 'ios') {
      handleiOSSubscription(selectedPlan);
    }
  };

  const handleClose = () => {
    logEvent('pricing_modal_closed', { selected_plan: selectedPlan || 'none' });
    crashlytics().log(`Pricing modal closed with selected plan: ${selectedPlan}`);
    onClose();
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.modalContainer}>
        {/* <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
          <Icon name="close" size={30} color="#000" />
        </TouchableOpacity> */}
        <View>
          <Text style={styles.heading}>{t('PricingScreen.chooseYourPlan')}</Text>
          <Text style={styles.subHeading}>{t('PricingScreen.selectYourSubscription')}</Text>
          <Text style={styles.description}>
            {t('PricingScreen.unlockYourJourney')}
          </Text>
        </View>
        {productDetails.length > 0 ? (
          <>
            <View style={styles.optionContainer}>
              {productDetails.map((product) => (
                <TouchableOpacity
                  key={product.productId}
                  style={styles.option}
                  onPress={() => handlePlanSelection(product)}>
                  <View style={styles.radioButton}>
                    {selectedPlan === product.productId && <View style={styles.radioFill} />}
                  </View>
                  {Platform.OS === 'ios' ? (
                    <Text style={styles.optionText}>
                      {product.title} - {product.localizedPrice || ' '}
                    </Text>
                  ) : (
                    <Text style={styles.optionText}>
                      {product.name} - {getAndroidFormattedPrice(product)}
                    </Text>
                  )}
                  {/* <Text style={{ fontSize: styleConstants.typography.fontSizes.sm }}>
                    {index === 1 ? '(Best Value)' : '(Basic Value)'}
                  </Text> */}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresHeading}>{t('PricingScreen.features')}</Text>
              {productDetails
                .find((product) => product.productId === selectedPlan)
                ?.description.split('\n')
                .map((feature, index) => (
                  <Text key={index} style={styles.featureItem}>
                    <DotIcon name="dot-single" size={16} color="#399918" /> {feature.trim()}
                  </Text>
                ))}
            </View>
          </>
        ) : (
          <Text style={styles.featuresHeading}>{t('PricingScreen.noSubscriptionPlansFound')}</Text>
        )}

        <TouchableOpacity
          style={styles.buttonOutline}
          onPress={handleSubscribe}
          disabled={loading || !selectedPlan}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('PricingScreen.subscribeNow')}</Text>}
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={loading}>
          <Text style={styles.buttonText}>{t('PricingScreen.cancel')}</Text>
        </TouchableOpacity> */}

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
    // marginHorizontal: styleConstants.spacing.custom.s20,
  },
  closeIcon: {
    alignSelf: 'flex-end',
  },
  heading: {
    fontSize: styleConstants.typography.fontSizes.xl,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: styleConstants.colors.black,
    textAlign: 'center',
    paddingVertical: styleConstants.spacing.custom.s10,
  },
  subHeading: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: styleConstants.colors.black,
  },
  description: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsLight,
    color: styleConstants.colors.black,
    marginTop: styleConstants.spacing.custom.s5,
    lineHeight: 20,
  },
  optionContainer: {
    marginVertical: styleConstants.spacing.custom.s20,
    backgroundColor: styleConstants.colors.white,
    padding: styleConstants.spacing.custom.s10,
    borderRadius: 5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ED8A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ED8A8A',
  },
  featuresContainer: {
    padding: 10,
    backgroundColor: styleConstants.colors.white,
    borderRadius: 8,
  },
  featuresHeading: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    marginBottom: 10,
  },
  featureItem: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsLight,
    marginVertical: 2,
  },
  buttonOutline: {
    marginTop: styleConstants.spacing.custom.s20,
    paddingVertical: styleConstants.spacing.custom.s15,
    backgroundColor: styleConstants.colors.buttonBg,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: styleConstants.spacing.custom.s15,
  },
  cancelButton: {
    paddingVertical: 12,
    backgroundColor: styleConstants.colors.white,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    fontSize: styleConstants.typography.fontSizes.md,
  },
});

export default PricingScreen;
