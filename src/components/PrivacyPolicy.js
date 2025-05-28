import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Modal,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styleConstants } from '../utils/styleConstants';
import { useTranslation } from 'react-i18next';
import Header from './HeaderComponent';

const PrivacyPolicy = ({ navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { t } = useTranslation();

    const showModal = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.content}>
                <Header heading={t('PrivacyPolicyScreen.privacyPolicyTitle')} goBack={() => navigation.goBack()} />
                <View style={styles.Subcontent}>

                    <Text style={styles.cardText}>
                        {t('PrivacyPolicyScreen.yourPrivacyIsImportant')}
                    </Text>
                    <Text style={styles.cardText}>
                        {t('PrivacyPolicyScreen.informationCollection')}
                    </Text>
                    <Text style={styles.cardText}>
                        {t('PrivacyPolicyScreen.dataUsage')}
                    </Text>
                    <Text style={styles.cardText}>
                        {t('PrivacyPolicyScreen.dataProtection')}
                    </Text>
                    <Text style={styles.cardText}>
                        {t('PrivacyPolicyScreen.yourRights')}
                    </Text>
                </View>
            </View>
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalSubContent}>
                            <Icon name="check-circle" size={64} color="#28A745" />
                            <Text style={styles.modalTitle}>{t('PrivacyPolicyScreen.privacyPolicyAccepted')}</Text>
                            <Text style={styles.modalSubtitle}>
                                {t('PrivacyPolicyScreen.youHaveSuccessfullyAccepted')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.buttonOutline}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.buttonText}>{t('PrivacyPolicyScreen.okay')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: styleConstants.colors.primary,
    },
    greetingContainer: {
        marginTop: Platform.OS === 'android' ? 15 : 0,
        paddingHorizontal: styleConstants.spacing.custom.s25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: styleConstants.spacing.custom.s20,
        paddingBottom: styleConstants.spacing.custom.s20,
    },
    Subcontent: {
        marginBottom: styleConstants.spacing.custom.s10,
    },
    cardTitle: {
        fontSize: styleConstants.typography.fontSizes.xl,
        fontWeight: 'bold',
        color: styleConstants.colors.black,
        textAlign: 'center',
        marginBottom: styleConstants.spacing.custom.s10,
        // paddingVertical: styleConstants.spacing.custom.s10,
    },
    cardText: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
        lineHeight: styleConstants.typography.fontSizes.lg,
        textAlign: 'justify',
        marginVertical: styleConstants.spacing.custom.s10,
    },
    buttonOutline: {
        paddingVertical: 12,
        backgroundColor: '#37B7C3',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    buttonText: {
        color: styleConstants.colors.black,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
        fontWeight: styleConstants.typography.fontWeights.bold,
        fontSize: styleConstants.typography.fontSizes.md,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: styleConstants.spacing.custom.s20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: styleConstants.spacing.custom.s20,
    },
    modalSubContent: {
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: styleConstants.typography.fontSizes.xl,
        fontWeight: 'bold',
        color: styleConstants.colors.black,
        marginTop: styleConstants.spacing.custom.s15,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: styleConstants.typography.fontSizes.md,
        color: styleConstants.colors.black,
        textAlign: 'center',
        marginVertical: styleConstants.spacing.custom.s20,
    },
});


export default PrivacyPolicy;