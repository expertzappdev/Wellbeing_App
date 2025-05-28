import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import CardComponent from '../components/CardComponent';
import { styleConstants } from '../utils/styleConstants';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const WelcomeScreen = () => {
  const { t } = useTranslation(); // Initialize translation function

  return (
    <SafeAreaView style={styles.mainContainer}>

      <View style={styles.container}>

        <View style={styles.headingContainer}>
          <Text style={styles.heading}>{t('WelcomeScreen.welcomeToWellbeingJournal')}</Text>
        </View>
        <View style={styles.subHeadingContainer}>
          <Text style={styles.subHeading}>{t('WelcomeScreen.yourJourneyToABalancedLifeBeginsHere')}</Text>
          <Text style={styles.subHeading}>{t('WelcomeScreen.balancedLifeBeginsHere')}</Text>
        </View>

        <View style={styles.cardContainer}>
          <CardComponent
            image={require('../assets/images/welcomeImage1.png')}
            description={t('WelcomeScreen.card1Description')}
          />
          <CardComponent
            image={require('../assets/images/welcomeImage2.png')}
            description={t('WelcomeScreen.card2Description')}
          />
          <CardComponent
            image={require('../assets/images/welcomeImage3.png')}
            description={t('WelcomeScreen.card3Description')}
          />
        </View>
        <ButtonComponent
          bgColor="#EDD4B9"
          text={t('WelcomeScreen.getStartedButton')}
          textSize={styleConstants.typography.fontSizes.md}
          borderRadius={50}
          redirectPath="Main"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: styleConstants.colors.primary,
    flex: 1,
  },
  container: {
    paddingHorizontal:styleConstants.spacing.custom.s20,
    paddingTop: 20,
    backgroundColor: styleConstants.colors.primary,
  },
  headingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: styleConstants.spacing.custom.s13,
  },
  heading: {
    fontSize: styleConstants.typography.fontSizes.lg,
    fontWeight: styleConstants.typography.fontWeights.bold,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
    justifyContent: 'center',
    textAlign: 'center',
  },
  subHeading: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
  },
  cardContainer: {
    marginTop: styleConstants.spacing.custom.s25,
    marginBottom: 0,
  },
});

export default WelcomeScreen;
