import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styleConstants } from '../utils/styleConstants';
import LottieView from 'lottie-react-native';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { useTranslation } from 'react-i18next';
import FastImage from 'react-native-fast-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
    markCardCompletedRequest,
    toggleFavoriteRequest,
} from '../redux/slices/explore/exploreSlice';
import auth from '@react-native-firebase/auth';


const CardDetail = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { item } = route.params;

    const user = useSelector((state) => state.auth.user);
    const userCompletedCards = useSelector((state) => state.explore.userCompletedCards);
    const userFavoriteCards = useSelector((state) => state.explore.userFavoriteCards);
    const userName = useSelector((state) => state.auth.user?.name || 'User');

    const { t } = useTranslation();

    const [modalVisible, setModalVisible] = useState(false);

    const isFavorite = (userFavoriteCards ?? []).includes(item.id);

    const logEvent = async (eventName, params) => {
        try {
            await analytics().logEvent(eventName, params);
            crashlytics().log(`Event logged: ${eventName}`);
        } catch (error) {
            console.error(`Error logging event: ${eventName}`, error);
            crashlytics().recordError(error, `Error logging event: ${eventName}`);
        }
    };

    const showModal = () => {
        setModalVisible(true);
        logEvent('modal_opened', { item_id: item.id, item_title: item.title });
        crashlytics().log(`Modal opened for: ${item.title}`);
    };

    const closeModal = () => {
        setModalVisible(false);
        logEvent('modal_closed', { item_id: item.id, item_title: item.title });
        crashlytics().log(`Modal closed for: ${item.title}`);
    };

    const handleHeartToggle = () => {
        const newState = !isFavorite;
        if (user?.uid) {
            dispatch(toggleFavoriteRequest({ cardId: item.id, userId: user.uid, isFavorite: newState }));
        } else {
             console.warn("Cannot toggle favorite: User not logged in.");
        }
        logEvent('toggle_favorite', { item_id: item.id, item_title: item.title, is_favorite: newState });
        crashlytics().log(`Toggled favorite for: ${item.title} to ${newState}`);
    };

    const handleExploreMore = () => {
         if (user?.uid) {
            dispatch(markCardCompletedRequest({ cardId: item.id, userId: user.uid }));
            logEvent('mark_card_completed', { card_id: item.id, user_id: user.uid });
            crashlytics().log(`Card marked completed: ${item.id} by user ${user.uid}`);
         } else {
             console.warn("Cannot mark card completed: User not logged in.");
         }
        closeModal();
        navigation.goBack();
    };

    const handleGoBack = () => {
         logEvent('close_card_detail', { card_id: item.id, userName:userName,  user_id: user?.uid || 'anonymous' });
         crashlytics().log(`Card detail closed for: ${item.title} (ID: ${item.id}) using back button`);
         navigation.goBack();
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: item.backgroundColor }]}>
            <View style={styles.greetingContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={handleGoBack}>
                    <Icon name="arrow-back" size={25} color="#000" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                <TouchableOpacity style={styles.favoriteButton} onPress={handleHeartToggle}>
                    <Icon
                        name={isFavorite ? "favorite" : "favorite-border"}
                        size={25}
                        color={isFavorite ? 'red' : '#000'}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.Subcontent}>
                    <FastImage
                        source={{ uri: item.image,
                            priority: FastImage.priority.high,
                         }}
                        style={styles.cardImage}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                    <Text style={styles.cardSubtitle}>{item.subheading}</Text>
                    <Text style={styles.cardText}>{item.content}</Text>
                </View>
                <TouchableOpacity style={styles.buttonOutline} onPress={showModal}>
                    <Text style={styles.buttonText}>{t('CardDetailScreen.done')}</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <LottieView
                            source={require('../assets/images/Animation3.json')}
                            autoPlay
                            loop={false}
                            style={styles.lottie}
                        />
                        <Text style={styles.modalTitle}>{t('CardDetailScreen.congratulations')} {userName}</Text>
                        <Text style={styles.modalSubtitle}>
                            {t('CardDetailScreen.youHaveSuccessfullyCompleted')} "{item.title}"
                        </Text>
                        <TouchableOpacity style={styles.buttonOutline} onPress={handleExploreMore}>
                            <Text style={styles.buttonText}>{t('CardDetailScreen.exploreMore')}</Text>
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
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: styleConstants.spacing.custom.s10,
        paddingHorizontal: styleConstants.spacing.custom.s20,
    },
    // closeButton: {
    //     padding: styleConstants.spacing.custom.s10,
    //     position: 'absolute',
    //     left: 10,
    // },
    cardTitle: {
        fontSize: styleConstants.typography.fontSizes.lg,
        fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
        color: styleConstants.colors.black,
        textAlign: 'center',
    },
    content: {
        paddingHorizontal: styleConstants.spacing.custom.s20,
        paddingBottom: styleConstants.spacing.custom.s20,
    },
    Subcontent: {
        alignItems: 'center',
    },
    cardImage: {
        width: 250,
        height: 250,
        borderRadius: 10,
        marginBottom: styleConstants.spacing.custom.s20,
    },
    cardSubtitle: {
        fontSize: styleConstants.typography.fontSizes.md,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
        textAlign: 'center',
        marginBottom: styleConstants.spacing.custom.s15,
    },
    cardText: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
        lineHeight: 24,
        textAlign: 'justify',
        marginBottom: styleConstants.spacing.custom.s20,
    },
    buttonOutline: {
        paddingVertical: styleConstants.spacing.custom.s10,
        backgroundColor: '#37B7C3',
        // backgroundColor: styleConstants.colors.buttonBg,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
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
        justifyContent: 'center',
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
    lottie: {
        alignSelf: 'center',
        zIndex: 100,
        width: 120,
        height: 120,
    },
});

export default CardDetail;
