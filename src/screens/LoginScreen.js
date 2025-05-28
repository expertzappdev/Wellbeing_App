import React, { useState, useEffect, useRef } from 'react';
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
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { loginRequest } from '../redux/slices/auth/authSlice';
import { validateEmail, validatePassword } from '../utils/validation';
import { styleConstants } from '../utils/styleConstants';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef();

  const dispatch = useDispatch();
  const { error, user } = useSelector((state) => state.auth);
  const { t } = useTranslation(); // Initialize translation function

  // Log analytics events
  const logEvent = async (eventName, params) => {
    try {
      await analytics().logEvent(eventName, params);
    } catch (error) {
      console.error(`Error logging event: ${eventName}`, error);
      crashlytics().recordError(error, `Analytics Event Error: ${eventName}`);
    }
  };

  // Handle SignIn
  const handleSignIn = async () => {
    let isValid = true;

    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!validateEmail(email)) {
      setEmailError(t('LoginScreen.invalidEmail')); // You might want to add this to your translation files
      isValid = false;
    }


    // Validate password
    if (!validatePassword(password)) {
      setPasswordError(t('LoginScreen.invalidPassword')); // You might want to add this to your translation files
      isValid = false;
    }

    if (!isValid) {
      logEvent('login_validation_failed', { email_valid: validateEmail(email), password_valid: validatePassword(password) });
      crashlytics().log('Login validation failed');
      return;
    }

    setIsLoading(true);
    try {
      dispatch(loginRequest({ email, password }));
      logEvent('login_attempt', { email });
    } catch (e) {
      crashlytics().recordError(e, 'Dispatch loginRequest failed');
    }
  };

  useEffect(() => {
    if (user) {
      setEmail('');
      setPassword('');
      setIsLoading(false);
      logEvent('login_success', { user_id: user.uid, email: user.email });
      crashlytics().setUserId(user.uid);
      navigation.navigate('Main');
    }
  }, [user, navigation]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      logEvent('login_failed', { error_message: error });
      crashlytics().recordError(new Error(`Login failed: ${error}`));
      if (error === 'auth/invalid-email') {
        setEmailError(t('LoginScreen.invalidEmail'));
      } else if (error === 'auth/user-not-found') {
        setEmailError(t('LoginScreen.noAccountPrompt'));
      } else if (error === 'auth/wrong-password') {
        setPasswordError(t('LoginScreen.invalidPassword'));
      } else {
        setPasswordError(t('LoginScreen.unknownError'));
      }
    }
  }, [error, t]);

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
              <Text style={styles.heading}>{t('LoginScreen.wellbeingJournal')}</Text>
              <Text style={styles.subHeading}>{t('LoginScreen.letsGo')}</Text>

              {/* Email Input */}
              <View style={styles.inputField}>
                <Text style={styles.label}>{t('LoginScreen.emailLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('LoginScreen.emailPlaceholder')}
                  value={email}
                  placeholderTextColor={styleConstants.colors.placeholder}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current.focus()}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputField}>
                <Text style={styles.label}>{t('LoginScreen.passwordLabel')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={t('LoginScreen.passwordPlaceholder')}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholderTextColor={styleConstants.colors.placeholder}
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                    returnKeyType="done"
                    ref={passwordInputRef}
                    onSubmitEditing={handleSignIn}
                  />
                  <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}
                    style={styles.eyeIcon}>
                    <Icon name={passwordVisible ? 'eye' : 'eye-off'} size={24} color={styleConstants.colors.black} />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPassword}>{t('LoginScreen.forgotPassword')}</Text>
              </TouchableOpacity>


              {/* Loading Indicator or SignIn Button */}
              {/* {isLoading ? (
              <ActivityIndicator size="large" color={styleConstants.colors.black} style={styles.loading} />
            ) : ( */}
              <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>{t('LoginScreen.signInButton')}</Text>
              </TouchableOpacity>
              {/* )} */}

              <TouchableOpacity style={styles.signUpContainer}>
                <Text style={styles.footerText}>
                  {t('LoginScreen.noAccountPrompt')}{' '}
                  <Text
                    onPress={() => navigation.navigate('Signup')}
                    style={styles.signUpText}
                  >
                    {t('LoginScreen.signUpLink')}
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
    backgroundColor: styleConstants.colors.primary,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 30,
  },
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
  forgotPassword: {
    textAlign: 'right',
    fontSize: styleConstants.typography.fontSizes.sm,
    color: styleConstants.colors.black,
    marginBottom: styleConstants.spacing.custom.s15,
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

export default LoginScreen;
