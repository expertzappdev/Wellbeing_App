import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { styleConstants } from '../utils/styleConstants';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation(); // Initialize translation function

  const handlePasswordReset = async () => {
    if (!email) {
      setEmailError(t('ForgotPasswordScreen.enterEmailAddress'));
      return;
    }

    setIsLoading(true);
    try {
      await auth().sendPasswordResetEmail(email);
      await analytics().logEvent('password_reset_sent', { email });
      Alert.alert(t('Success'), t('ForgotPasswordScreen.passwordResetEmailSent')); // You'll need to add "Success" and "passwordResetEmailSent" to your translations
      navigation.goBack();
    } catch (error) {
      console.error(error);
      crashlytics().recordError(error, 'Password Reset Failed');
      Alert.alert(t('Error'), error.message || t('ForgotPasswordScreen.somethingWentWrong')); // You'll need to add "Error" and "somethingWentWrong" to your translations
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          {isLoading ? (
            <ActivityIndicator size="large" color={styleConstants.colors.black} style={styles.loading} />
          ) : (
            <View style={styles.content}>
              <Text style={styles.heading}>{t('ForgotPasswordScreen.forgotPasswordTitle')}</Text>
              <Text style={styles.subHeading}>{t('ForgotPasswordScreen.resetYourPassword')}</Text>

              {/* Email Input */}
              <View style={styles.inputField}>
                <Text style={styles.label}>{t('ForgotPasswordScreen.emailLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('ForgotPasswordScreen.emailPlaceholder')}
                  value={email}
                  placeholderTextColor={styleConstants.colors.placeholder}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handlePasswordReset}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
                <Text style={styles.buttonText}>{t('ForgotPasswordScreen.sendResetEmailButton')}</Text>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity style={styles.signUpContainer}>
                <Text style={styles.footerText}>
                  {t('ForgotPasswordScreen.rememberPasswordPrompt')}{' '}
                  <Text
                    onPress={() => navigation.goBack()}
                    style={styles.signUpText}
                  >
                    {t('ForgotPasswordScreen.backToLoginLink')}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: styleConstants.colors.primary,
  },
  safeArea: {
    flex: 1,
    marginHorizontal: 30,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  heading: {
    textAlign: 'center',
    fontSize: styleConstants.typography.fontSizes.xl,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
  },
  subHeading: {
    textAlign: 'center',
    fontSize: styleConstants.typography.fontSizes.lg,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    marginBottom: styleConstants.spacing.custom.s20,
  },
  inputField: {
    marginBottom: styleConstants.spacing.custom.s20,
  },
  label: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
    color: styleConstants.colors.black,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: styleConstants.colors.black,
    paddingVertical: styleConstants.spacing.custom.s5,
    fontSize: styleConstants.typography.fontSizes.md,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
  },
  button: {
    backgroundColor: styleConstants.colors.buttonBg,
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: styleConstants.spacing.custom.s25,
  },
  buttonText: {
    color: styleConstants.colors.black,
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  footerText: {
    fontSize: styleConstants.typography.fontSizes.sm,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
  },
  signUpText: {
    fontSize: styleConstants.typography.fontSizes.sm,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
  },
  signUpContainer: {
    alignItems: 'center',
  },
});

export default ForgotPasswordScreen;
