import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Platform,
    Image,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { styleConstants } from '../utils/styleConstants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { googleLoginRequest, facebookLoginRequest, appleLoginRequest } from '../redux/slices/auth/authSlice';
import appleAuth, { AppleButton } from '@invertase/react-native-apple-authentication';
import { LoginManager, AccessToken, AuthenticationToken } from 'react-native-fbsdk-next';
import { sha256 } from 'react-native-sha256';
import { useTranslation } from 'react-i18next';

const AuthOptionsScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector(state => state.auth.isLoading);

    const { actionType } = route.params || { actionType: 'login' };
    const { t } = useTranslation();
    
    const [error, setError] = useState(null);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '6609925902-s7h6444t9596kbdj6f5f2evvqc81leid.apps.googleusercontent.com',
            offlineAccess: true,
        });
    }, []);

    // Google Sign-In
    const onGoogleButtonPress = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const signInResult = await GoogleSignin.signIn();
            let idToken = signInResult.data?.idToken || signInResult.idToken;
            if (!idToken) throw new Error('No ID token found');

            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            const userCredential = await auth().signInWithCredential(googleCredential);
            dispatch(googleLoginRequest(userCredential));

        } catch (error) {
            console.error('Google Sign-In Error:', error);
            setError('Google Sign-In failed. Please try again later.');
            Alert.alert('Error', error.message);
        }
    };

    // Apple Sign-In
    const onAppleButtonPress = async () => {
        try {
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
            });
            if (!appleAuthRequestResponse.identityToken) {
                throw new Error('Apple Sign-In failed - no identity token returned');
            }
            const { identityToken, nonce } = appleAuthRequestResponse;
            const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

            const userCredential = await auth().signInWithCredential(appleCredential);

            dispatch(appleLoginRequest(userCredential));

        } catch (error) {
            console.error('Apple Sign-In Error:', error);
            setError('Apple Sign-In failed. Please try again later.');
            Alert.alert('Error', error.message);
        }
    };

    // Facebook Sign-In
    const onFacebookButtonPress = async () => {
        try {
            await LoginManager.logOut();

            if (Platform.OS === 'ios') {
                const nonce = '123456';
                const nonceSha256 = await sha256(nonce);

                const result = await LoginManager.logInWithPermissions(
                    ['public_profile', 'email'],
                    'limited',
                    nonceSha256
                );

                if (result.isCancelled) {
                    throw new Error('User cancelled the login process');
                }
                const data = await AuthenticationToken.getAuthenticationTokenIOS();
                if (!data) {
                    throw new Error('Failed to obtain authentication token');
                }

                const facebookCredential = auth.FacebookAuthProvider.credential(data.authenticationToken, nonce);
                const userCredential = await auth().signInWithCredential(facebookCredential);

                dispatch(facebookLoginRequest(userCredential));

            } else {
                const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

                if (result.isCancelled) {
                    throw new Error('User cancelled the login process');
                }

                const data = await AccessToken.getCurrentAccessToken();
                if (!data) {
                    throw new Error('Failed to obtain access token');
                }

                const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
                const userCredential = await auth().signInWithCredential(facebookCredential);

                dispatch(facebookLoginRequest(userCredential));
            }
        } catch (error) {
            console.error('Facebook Sign-In Error:', error);
            setError('Facebook Sign-In failed. Please try again later.');
            Alert.alert('Error', error.message);
        }
    };

    // Manual Login or Signup navigation
    const handleManual = () => {
        if (actionType === 'login') {
            navigation.navigate('Login');
        } else {
            navigation.navigate('Signup');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {isLoading ? (
                <ActivityIndicator size="large" color={styleConstants.colors.black} style={styles.loading} />
            ) : (
                <>
                    <Image
                        source={require('../assets/images/swiperImage.png')}
                        style={styles.image}
                        resizeMode="cover"
                    />

                    <View style={styles.container}>
                        <Text style={styles.heading}>{t('SwiperScreen.welcomeTitle')}</Text>
                        <Text style={styles.subHeading}>
                            {actionType === 'login' ? t('AuthOptionsScreen.loginSubtitle') : t('AuthOptionsScreen.signupSubtitle')}
                        </Text>

                        <TouchableOpacity style={[styles.button, styles.tealBg]} onPress={handleManual}>
                            <View style={styles.iconWrapper}>
                                <Icon name="mail" size={24} color="#000" />
                            </View>
                            <Text style={[styles.buttonText, { color: '#000' }]}>
                                {actionType === 'login' ? t('AuthOptionsScreen.loginWithEmail') : t('AuthOptionsScreen.signUpWithEmail')}
                            </Text>
                        </TouchableOpacity>

                        {/* Google */}
                        <TouchableOpacity style={[styles.button, styles.whiteBg]} onPress={onGoogleButtonPress}>
                            <View style={styles.iconWrapper}>
                                <Image
                                    source={require('../assets/images/google-logo.png')}
                                    style={styles.googleIcon}
                                />
                            </View>
                            <Text style={[styles.buttonText]}>{t('AuthOptionsScreen.continueWithGoogle')}</Text>
                        </TouchableOpacity>

                        {/* Facebook */}
                        <TouchableOpacity style={[styles.button, styles.facebookBg]} onPress={onFacebookButtonPress}>
                            <View style={styles.iconWrapper}>
                                <Icon name="facebook-square" size={24} color="#fff" />
                            </View>
                            <Text style={[styles.buttonText, { color: '#fff' }]}>{t('AuthOptionsScreen.continueWithFacebook')}</Text>
                        </TouchableOpacity>

                        {/* Apple */}
                        {Platform.OS === 'ios' && (
                            <TouchableOpacity style={[styles.button, styles.appleBg]} onPress={onAppleButtonPress}>
                                <View style={styles.iconWrapper}>
                                    <Icon name="apple1" size={24} color="#fff" />
                                </View>
                                <Text style={[styles.buttonText, { color: '#fff' }]}>{t('AuthOptionsScreen.continueWithApple')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: styleConstants.colors.white,
    },
    image: {
        width: Dimensions.get('window').width,
        flex: 2,
    },
    container: {
        flex: 3,
        paddingHorizontal: styleConstants.spacing.custom.s31,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 20,
    },
    heading: {
        textAlign: 'center',
        fontSize: styleConstants.typography.fontSizes.xl,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
        color: styleConstants.colors.black,
        marginBottom: styleConstants.spacing.custom.s10,
    },
    subHeading: {
        textAlign: 'center',
        fontSize: styleConstants.typography.fontSizes.md,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
        marginBottom: styleConstants.spacing.custom.s20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        width: '100%',
        marginBottom: styleConstants.spacing.custom.s15,
    },
    iconWrapper: {
        width: 30,
        alignItems: 'flex-start',
    },
    tealBg: {
        backgroundColor: styleConstants.colors.buttonBg,
    },
    facebookBg: {
        backgroundColor: '#3B5998',
    },
    appleBg: {
        backgroundColor: '#000',
    },
    whiteBg: {
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#000',
    },
    buttonText: {
        flex: 1,
        textAlign: 'center',
        fontSize: styleConstants.typography.fontSizes.md,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    },
    googleIcon: {
        height: 24,
        width: 24,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AuthOptionsScreen;
