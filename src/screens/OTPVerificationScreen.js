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
    Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    verifyOtpRequest,
    sendOtpRequest,
    signupRequest,
    resetOtpState,
    selectIsLoading,
    selectIsOtpLoading,
    selectOtpError,
    selectOtpVerifiedSuccess,
    selectUser,
    selectAuthError,
    selectAuthIsWelcome,
} from '../redux/slices/auth/authSlice';
import { styleConstants } from '../utils/styleConstants';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { useTranslation } from 'react-i18next';

const OTP_LENGTH = 6;

const OTPVerificationScreen = ({ navigation, route }) => {
    const { email, name, password } = route.params || {};

    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const otpInputRefs = useRef([]);
    const [isResending, setIsResending] = useState(false);
    const [localError, setLocalError] = useState('');

    const dispatch = useDispatch();
    const { t } = useTranslation();

    const isOtpLoading = useSelector(selectIsOtpLoading);
    const generalLoading = useSelector(selectIsLoading);
    const otpError = useSelector(selectOtpError);
    const otpVerifiedSuccess = useSelector(selectOtpVerifiedSuccess);
    const user = useSelector(selectUser);
    const authError = useSelector(selectAuthError);
    const isWelcome = useSelector(selectAuthIsWelcome);

    const logEvent = async (eventName, params) => {
       try {
         await analytics().logEvent(eventName, params);
         crashlytics().log(`Event logged: ${eventName}`);
       } catch (error) {
         console.error(`Error logging event: ${eventName}`, error);
         crashlytics().recordError(error, `Error logging event: ${eventName}`);
       }
    };

    const handleOtpChange = (text, index) => {
        if (!/^\d*$/.test(text) && text !== '') return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (localError) setLocalError('');

        if (text !== '') {
            if (index < OTP_LENGTH - 1) {
                otpInputRefs.current[index + 1]?.focus();
            } else {
                Keyboard.dismiss();
            }
        } else {
             if (index > 0) {
                  otpInputRefs.current[index - 1]?.focus();
             }
        }
    };

    const handleKeyPress = ({ nativeEvent: { key } }, index) => {
        if (key === 'Backspace' && otp[index] === '' && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = () => {
        Keyboard.dismiss();
        const enteredOtp = otp.join('');

        if (enteredOtp.length !== OTP_LENGTH) {
            setLocalError(t('OTPVerificationScreen.invalidOtpLength', { length: OTP_LENGTH }));
            logEvent('otp_validation_failed', { reason: 'length' });
            crashlytics().recordError(new Error('OTP validation failed - length'));
            return;
        }

        setLocalError('');

        if (!email) {
             setLocalError(t('OTPVerificationScreen.emailMissingError'));
             crashlytics().recordError(new Error('Verify OTP failed - email missing in route params'));
             return;
        }

        try {
            dispatch(verifyOtpRequest({ otp: enteredOtp, email }));
            logEvent('otp_verify_attempt', { email });
            crashlytics().log(`OTP verification attempt for email: ${email}`);
        } catch (e) {
            console.error('Dispatch error (verify OTP):', e);
            crashlytics().recordError(e, 'Error during OTP verification dispatch');
            setLocalError(t('OTPVerificationScreen.genericError'));
        }
    };

    const handleResendOtp = () => {
        if (!email) {
            setLocalError(t('OTPVerificationScreen.emailMissingError'));
            crashlytics().recordError(new Error('Resend OTP failed - email missing in route params'));
            return;
        }
        Keyboard.dismiss();
        setLocalError('');
        setIsResending(true);
        try {
            dispatch(sendOtpRequest({ email }));
            logEvent('otp_resend_attempt', { email });
            crashlytics().log(`OTP resend attempt for email: ${email}`);
            setTimeout(() => setIsResending(false), 2000);

        } catch (e) {
            console.error('Dispatch error (resend OTP):', e);
            crashlytics().recordError(e, 'Error during OTP resend dispatch');
            setLocalError(t('OTPVerificationScreen.resendFailedError'));
            setIsResending(false);
        }
    }

    useEffect(() => {
        if (otpError) {
             setLocalError(t(`apiErrors.${otpError}`, t('OTPVerificationScreen.otpGenericError')));
             logEvent('otp_verify_failed', { email, error_message: otpError });
             crashlytics().recordError(new Error(`OTP Verification failed: ${otpError}`));
        } else if (authError) {
             setLocalError(t(`apiErrors.${authError}`, t('OTPVerificationScreen.signupGenericError')));
             logEvent('signup_failed', { email, error_message: authError });
             crashlytics().recordError(new Error(`Signup failed after OTP: ${authError}`));
        } else {
             setLocalError('');
        }
    }, [otpError, authError, t, email]);

    useEffect(() => {
        if (otpVerifiedSuccess && !generalLoading) {
            if (!name || !email || !password) {
                 console.error("Signup details missing after OTP verification");
                 crashlytics().recordError(new Error('Signup details missing after OTP verification'));
                 setLocalError(t('OTPVerificationScreen.signupDetailsMissingError'));
                 dispatch(resetOtpState());
                 return;
            }
            dispatch(signupRequest({ name, email, password }));
            logEvent('signup_attempt_after_otp', { email });
            crashlytics().log(`Signup attempt after OTP for email: ${email}`);
        }
    }, [otpVerifiedSuccess, dispatch, name, email, password, generalLoading, logEvent, crashlytics, t]);

     useEffect(() => {
         if (user) {
             logEvent('signup_success', { user_id: user.uid, email: user.email });
             crashlytics().log(`Signup success for user ID: ${user.uid}`);
             dispatch(resetOtpState());
             navigation.navigate(isWelcome ? 'Main' : 'Welcome');
         }
     }, [user, navigation, isWelcome, logEvent, crashlytics, dispatch]);

     const overallLoading = isOtpLoading || generalLoading;

    useEffect(() => {
        const timer = setTimeout(() => {
            otpInputRefs.current[0]?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.safeArea}>
                    {overallLoading && !isResending && !user && !authError ? (
                         <View style={styles.loadingOverlay}>
                             <ActivityIndicator size="large" color={styleConstants.colors.black} />
                         </View>
                    ) : null}

                    <View style={styles.content}>
                        <Text style={styles.heading}>{t('OTPVerificationScreen.title')}</Text>
                        <Text style={styles.subHeading}>
                            {t('OTPVerificationScreen.subTitle')} {email ? <Text style={styles.emailText}>{email}</Text> : ''}
                        </Text>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    style={[
                                        styles.otpInput,
                                        localError ? styles.otpInputError : null
                                    ]}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    ref={(ref) => {
                                        otpInputRefs.current[index] = ref;
                                    }}
                                    textAlign="center"
                                    selectTextOnFocus
                                    editable={!overallLoading}
                                    autoFocus={index === 0}
                                    caretHidden={true}
                                />
                            ))}
                        </View>

                        {localError ? <Text style={styles.errorText}>{localError}</Text> : null}

                        <TouchableOpacity
                            style={[styles.button, overallLoading && styles.buttonDisabled]}
                            onPress={handleVerifyOTP}
                            disabled={overallLoading || otpVerifiedSuccess || otp.join('').length !== OTP_LENGTH} // Disable if loading, success, or OTP not complete
                        >
                            {/* {overallLoading && !isResending ? (
                                <ActivityIndicator size="small" color={styleConstants.colors.buttonText} />
                            ) : ( */}
                                <Text style={styles.buttonText}>{t('OTPVerificationScreen.verifyButton')}</Text>
                            {/* )} */}
                        </TouchableOpacity>

                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>
                                {t('OTPVerificationScreen.didNotReceive')}{' '}
                            </Text>
                            {isResending ? (
                                <ActivityIndicator size="small" color={styleConstants.colors.black} />
                            ) : (
                                <TouchableOpacity onPress={handleResendOtp} disabled={isResending || overallLoading}>
                                    <Text style={styles.resendText}>
                                        {t('OTPVerificationScreen.resendLink')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity style={styles.backContainer} onPress={() => navigation.goBack()} disabled={overallLoading}>
                            <Text style={styles.backText}>{t('common.goBack')}</Text>
                        </TouchableOpacity>

                    </View>
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
        marginHorizontal: 30,
        paddingTop: 50,
        justifyContent: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: styleConstants.colors.white + '99',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    content: {
        flex: 1,
    },
    heading: {
        textAlign: 'center',
        fontSize: styleConstants.typography.fontSizes.xl,
        fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
        marginBottom: 10,
    },
    subHeading: {
        textAlign: 'center',
        fontSize: styleConstants.typography.fontSizes.md,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
        marginBottom: styleConstants.spacing.custom.s20,
    },
     emailText: {
         fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
     },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: styleConstants.spacing.custom.s15,
    },
    otpInput: {
        borderBottomWidth: 2,
        borderBottomColor: styleConstants.colors.black,
        width: 40,
        height: 50,
        textAlign: 'center',
        fontSize: styleConstants.typography.fontSizes.lg,
        fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
        color: styleConstants.colors.black,
         backgroundColor: 'transparent',
    },
    otpInputError: {
        borderBottomColor: 'red',
    },
    button: {
        backgroundColor: styleConstants.colors.buttonBg,
        paddingVertical: styleConstants.spacing.sm,
        borderRadius: 50,
        alignItems: 'center',
        width: '100%',
        marginBottom: styleConstants.spacing.custom.s20,
        marginTop: styleConstants.spacing.custom.s10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: styleConstants.colors.black,
        fontSize: styleConstants.typography.fontSizes.md,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    },
    errorText: {
        color: 'red',
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        textAlign: 'center',
        marginBottom: styleConstants.spacing.custom.s10,
        minHeight: 20,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: styleConstants.spacing.md,
    },
    footerText: {
        fontSize: styleConstants.typography.fontSizes.sml,
        color: styleConstants.colors.black,
        fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
    },
    resendText: {
        color: styleConstants.colors.black,
        fontWeight: 'bold',
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
        textDecorationLine: 'underline',
        marginLeft: 5,
    },
    backContainer: {
        marginTop: styleConstants.spacing.lg,
    },
    backText: {
        fontSize: styleConstants.typography.fontSizes.sml,
        color: styleConstants.colors.greyDark,
        fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
});

export default OTPVerificationScreen;