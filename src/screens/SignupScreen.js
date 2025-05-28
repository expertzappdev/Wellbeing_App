import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendOtpRequest,
  resetOtpState,
  selectAuthIsWelcome,
  selectIsOtpLoading,
  selectOtpSentSuccess,
  selectOtpError 
} from '../redux/slices/auth/authSlice';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { styleConstants } from '../utils/styleConstants';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { useTranslation } from 'react-i18next';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const emailInputRef = useRef();
  const passwordInputRef = useRef();
  const dispatch = useDispatch();

  const isWelcome = useSelector(selectAuthIsWelcome);
  const isOtpLoading = useSelector(selectIsOtpLoading);
  const otpSentSuccess = useSelector(selectOtpSentSuccess); 
  const otpError = useSelector(selectOtpError); 

  // const { error, user } = useSelector((state) => state.auth);

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

  const handleSignup = () => {
    let isValid = true;

    setNameError('');
    setEmailError('');
    setPasswordError('');

    if (!name.trim()) {
      setNameError(t('SignupScreen.invalidName'));
      isValid = false;
    }

    if (!validateUsername(name)) {
      setNameError(t('SignupScreen.usernameOnlyLetters'));
      isValid = false;
    }

    if (!validateEmail(email)) {
      setEmailError(t('SignupScreen.invalidEmail'));
      isValid = false;
    }

    if (!validatePassword(password)) {
      setPasswordError(t('SignupScreen.invalidPassword'));
      isValid = false;
    }

    if (!isValid) {
      logEvent('signup_validation_failed', {
        name_valid: !!name.trim(),
        email_valid: validateEmail(email),
        password_valid: validatePassword(password),
      });
      crashlytics().recordError(new Error('Signup validation failed'));
      return;
    }

    try {
      dispatch(sendOtpRequest({ email }));
      logEvent('send_otp_attempt_for_signup', { email });
      crashlytics().log(`Send OTP attempt for email: ${email}`);

    } catch (e) {
      console.error('Dispatch error (send OTP):', e);
      crashlytics().recordError(e, 'Error during send OTP dispatch');
    }
  };

  useEffect(() => {
    if (otpSentSuccess) {
      navigation.navigate('OTPVerify', {
        name: name,
        email: email,
        password: password,
      });
      dispatch(resetOtpState());
    }
  }, [otpSentSuccess, navigation, name, email, password, dispatch]);

  useEffect(() => {
    if (otpError) {
      logEvent('send_otp_failed', { email, error_message: otpError });
      crashlytics().recordError(new Error(`OTP Send failed: ${otpError}`));

      if (otpError.includes('email')) {
         setEmailError(t('SignupScreen.failedToSendOtp'));
      } else {
         setPasswordError(t('SignupScreen.failedToSendOtp'));
      }
    }
  }, [otpError, email, t]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          {isOtpLoading ? (
            <ActivityIndicator size="large" color={styleConstants.colors.black} style={styles.loading} />
          ) : (
            <View style={styles.content}>
              <Text style={styles.heading}>{t('SignupScreen.signUpHere')}</Text>
              <Text style={styles.subHeading}>{t('SignupScreen.letsGetStarted')}</Text>

              <View style={styles.inputField}>
                <Text style={styles.label}>{t('SignupScreen.nameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('SignupScreen.namePlaceholder')}
                  placeholderTextColor={styleConstants.colors.placeholder}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError('');
                  }}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current.focus()}
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>

              <View style={styles.inputField}>
                <Text style={styles.label}>{t('SignupScreen.emailLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('SignupScreen.emailPlaceholder')}
                  placeholderTextColor={styleConstants.colors.placeholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  ref={emailInputRef}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current.focus()}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              <View style={styles.inputField}>
                <Text style={styles.label}>{t('SignupScreen.passwordLabel')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={t('SignupScreen.passwordPlaceholder')}
                    placeholderTextColor={styleConstants.colors.placeholder}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError('');
                    }}
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                    returnKeyType="done"
                    ref={passwordInputRef}
                    onSubmitEditing={handleSignup}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={passwordVisible ? 'eye' : 'eye-off'}
                      size={24}
                      color={styleConstants.colors.black}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSignup}
                disabled={isOtpLoading}
              >
                <Text style={styles.buttonText}>{t('SignupScreen.signUpButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signUpContainer}>
                <Text style={styles.footerText}>
                  {t('SignupScreen.alreadyAccountPrompt')}{' '}
                  <Text
                    onPress={() => {
                      navigation.navigate('Login');
                    }}
                    style={styles.signUpText}
                  >
                    {t('SignupScreen.signInLink')}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback >
    </KeyboardAvoidingView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 50,
    backgroundColor: styleConstants.colors.primary,
  },
  safeArea: {
    flex: 1,
    marginHorizontal: 30,
    paddingTop: 50,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    // justifyContent: 'center',
  },
  heading: {
    textAlign: 'center',
    fontSize: styleConstants.typography.fontSizes.xl,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
    // marginBottom: 10,
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
    // marginBottom: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: styleConstants.colors.black,
    paddingVertical: styleConstants.spacing.custom.s5,
    fontSize: styleConstants.typography.fontSizes.md,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    marginLeft: -30
  },
  button: {
    backgroundColor: styleConstants.colors.buttonBg,
    paddingVertical: styleConstants.spacing.sm,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: styleConstants.spacing.custom.s25,
    marginTop: styleConstants.spacing.custom.s10,
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
    fontSize: styleConstants.typography.fontSizes.sml,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
  },
  signUpText: {
    fontSize: styleConstants.typography.fontSizes.sml,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
  },
  signUpContainer: {
    alignItems: 'center',
  },
});

export default SignupScreen;
