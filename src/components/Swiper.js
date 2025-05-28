import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Modal } from 'react-native';
import { styleConstants } from '../utils/styleConstants';
import AuthOptions from './AuthOptions'; 
import { useTranslation } from 'react-i18next';

const Swiper = ({ navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { t } = useTranslation();
    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/swiperImage.png')}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.textContainer}>
                <Text style={styles.heading}>{t('SwiperScreen.welcomeTitle')}</Text>
                <Text style={styles.subheading}>{t('SwiperScreen.welcomeSubtitle')}</Text>
            </View>
            <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('AuthOptions', { actionType: 'login' })} style={styles.buttonOutline}>
                    <Text style={styles.buttonText}>{t('SwiperScreen.getStartedButton')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('AuthOptions', { actionType: 'signup' })}>
                    <Text style={styles.signupPrompt}>
                        {t('SwiperScreen.noAccountPrompt')} <Text style={styles.signupLink}>{t('SwiperScreen.signUpLink')}</Text>
                    </Text>
                </TouchableOpacity>

            </View>
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <AuthOptions
                    navigation={navigation}
                    onClose={() => setModalVisible(false)}
                    actionType="signup"
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    image: {
        width: Dimensions.get('window').width,
        flex: 2,
    },
    textContainer: {
        flex: 1,
        alignItems: 'center',
    },
    heading: {
        fontSize: styleConstants.typography.fontSizes.xl,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
        color: styleConstants.colors.black,
    },
    subheading: {
        marginTop: 10,
        textAlign: 'center',
        paddingHorizontal: styleConstants.spacing.custom.s31,
        fontSize: styleConstants.typography.fontSizes.md,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
    },
    buttonsContainer: {
        flex: 1,
        paddingHorizontal: styleConstants.spacing.custom.s31,
        width: '100%',
        justifyContent: 'flex-start',
    },
    buttonOutline: {
        paddingVertical: 12,
        backgroundColor: styleConstants.colors.buttonBg,
        borderRadius: 50,
        alignItems: 'center',
        marginBottom: styleConstants.spacing.custom.s15,
    },
    buttonText: {
        color: styleConstants.colors.black,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
        fontSize: styleConstants.typography.fontSizes.md,
    },
    signupPrompt: {
        textAlign: 'center',
        color: styleConstants.colors.black,
        fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
        fontSize: styleConstants.typography.fontSizes.sm,
    },
    signupLink: {
        fontWeight: 'bold',
    },
});

export default Swiper;
