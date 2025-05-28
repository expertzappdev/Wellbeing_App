import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, selectUserSubscriptions } from '../redux/slices/auth/authSlice';
import { useNavigation } from '@react-navigation/native';
import { styleConstants } from '../utils/styleConstants';
import { useTranslation } from 'react-i18next';
import Header from './HeaderComponent';
const UserSubscriptionScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const user = useSelector(selectUser);
    const userSubscriptions = useSelector(selectUserSubscriptions);
    const [isLoading, setLoading] = useState(false);
    const { t, i18n: i18nInstance } = useTranslation();
    let startDateMillis, expiryDateMillis;
    if (Platform.OS === 'android') {
        startDateMillis = userSubscriptions[0]?.latestValidationResponse?.startTimeMillis;
        expiryDateMillis = userSubscriptions[0]?.latestValidationResponse?.expiryTimeMillis;
      } else {
        // Correct field names for iOS
        startDateMillis = userSubscriptions[0]?.latestValidationResponse?.latest_receipt_info[0]?.purchase_date_ms;
        expiryDateMillis = userSubscriptions[0]?.latestValidationResponse?.latest_receipt_info[0]?.expires_date_ms;
      }
      
      console.log('latestValidationResponse', userSubscriptions[0]?.latestValidationResponse);
      console.log('Platform', Platform.OS);
      console.log('Start:', startDateMillis, 'End:', expiryDateMillis);

            
    const startDate = startDateMillis
        ? new Date(Number(startDateMillis)).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : 'N/A';

    const endDate = expiryDateMillis
        ? new Date(Number(expiryDateMillis)).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : 'N/A';

    if (!user) {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <View style={styles.container}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color={styleConstants.colors.buttonBg} />
                    ) : (
                        <Text>{t('ProfileScreen.userNotLoggedIn')}</Text>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.contentScrollArea} contentContainerStyle={styles.contentContainer}>
            <Header heading={t('userSubscription.title')} goBack={() => navigation.goBack()} />
                <View style={styles.optionsSection}>
                    {userSubscriptions?.length > 0 ? (
                        <TouchableOpacity style={styles.optionTouchable}>
                            <View style={styles.optionItem}>
                                <Text style={styles.optionText}>{t('userSubscription.activeSubscription')}</Text>
                                <Text style={styles.subscriptionHeading}>
                                    {userSubscriptions[0].productTitle.length > 23
                                        ? `${userSubscriptions[0].productTitle.substring(0, 23)}...`
                                        : userSubscriptions[0].productTitle}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.optionTouchable}>
                            <View style={styles.optionItem}>
                                <Text style={styles.optionText}>{t('userSubscription.activeSubscription')}</Text>
                                <Text style={styles.subscriptionHeading}>{t('userSubscription.noSubscription')}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    {userSubscriptions?.length > 0 && (
                        <TouchableOpacity style={styles.optionTouchable}>
                            <View style={styles.optionItem}>
                                <Text style={styles.optionText}>{t('userSubscription.startDate')}</Text>
                                <Text style={styles.subscriptionHeading}>{startDate}</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {userSubscriptions?.length > 0 && (
                        <TouchableOpacity style={styles.optionTouchable}>
                            <View style={styles.optionItem}>
                                <Text style={styles.optionText}>{t('userSubscription.expiredDate')}</Text>
                                <Text style={styles.subscriptionHeading}>{endDate}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

            </View>
        </SafeAreaView>
    );
};

export default UserSubscriptionScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: styleConstants.colors.primary,
    },
    header: {
        backgroundColor: styleConstants.colors.primary,
        alignItems: 'center',
        paddingBottom: styleConstants.spacing.custom.s10,
        paddingTop: Platform.OS === 'android' ? styleConstants.spacing.custom.s10 : 0,
    },
    title: {
        fontSize: styleConstants.typography.fontSizes.xl,
        fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
        color: styleConstants.colors.black,
    },
    contentScrollArea: {
        flex: 1,
        paddingHorizontal: styleConstants.spacing.custom.s20,
    },
    contentContainer: {
        paddingBottom: styleConstants.spacing.custom.s20,
    },
    optionsSection: {
        marginTop: styleConstants.spacing.custom.s20,
    },
    sectionTitle: {
        fontSize: styleConstants.typography.fontSizes.md,
        color: styleConstants.colors.black,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    },
    optionTouchable: {
        paddingVertical: styleConstants.spacing.custom.s15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
        flex: 1,
        marginRight: styleConstants.spacing.custom.s10,
    },
    subHeading: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
        color: 'red',
    },
    buttonText: {
        color: styleConstants.colors.black,
        fontSize: styleConstants.typography.fontSizes.md,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    },
    subscriptionHeading: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
        marginRight: styleConstants.spacing.custom.s5,
    }
});