import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Modal, Linking, Platform, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser, updateUserProfileRequest, getUserByIdRequest, selectUserSubscriptions } from '../redux/slices/auth/authSlice';
import { useNavigation } from '@react-navigation/native';
import { styleConstants } from '../utils/styleConstants';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import storage from '@react-native-firebase/storage';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import CustomDropdown from '../components/DropDownComponent';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector(selectUser);
  const userSubscriptions = useSelector(selectUserSubscriptions);
  const [userName, setUserName] = useState('');
  const [tempUserName, setTempUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loggedInUser, setUserID] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [password, setPassword] = useState('');
  const { t, i18n: i18nInstance } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  const languageOptions = [
    { label: t('ProfileScreen.english'), value: 'en' },
    { label: t('ProfileScreen.dutch'), value: 'de' },
  ];

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('userLanguage');
        if (storedLanguage) {
          setSelectedLanguage(storedLanguage);
          i18nInstance.changeLanguage(storedLanguage);
        } else {
          setSelectedLanguage('en');
        }
      } catch (error) {
        console.error('Error loading language:', error);
        setSelectedLanguage('en');
      } finally {
        setIsLanguageLoaded(true);
      }
    };

    loadLanguage();
    if (user) {
      setUserName(user.name);
      setUserEmail(user.email);
      setUserID(user.uid);
      setProfileImage(user.photoBase64);
      logEvent('view_screen', { screen_name: 'ProfileScreen', user_id: user.uid });
      crashlytics().log(`ProfileScreen viewed by user: ${user.displayName} (UID: ${user.uid})`);
    }
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      dispatch(getUserByIdRequest(loggedInUser));
    }
  }, [loggedInUser, dispatch]);
  useEffect(() => {
    if (isModalVisible) {
      setTempUserName(userName);
    }
  }, [isModalVisible, userName]);


  const logEvent = async (eventName, params) => {
    try {
      await analytics().logEvent(eventName, params);
      crashlytics().log(`Event logged: ${eventName}`);
    } catch (error) {
      console.error(`Error logging event: ${eventName}`, error);
      crashlytics().recordError(error, `Error logging event: ${eventName}`);
    }
  };

  const handleProfileUpdate = () => {
    if (!tempUserName || tempUserName.trim() === '') {
      alert(t('ProfileScreen.nameRequired'));
      return;
    }
     if (tempUserName === userName && !profileImage) {
       setModalVisible(false);
       return;
     }
    const updatedData = {
      uid: loggedInUser,
      name: tempUserName,
      ...(profileImage && { image: profileImage }),
    };
    dispatch(updateUserProfileRequest(updatedData));
    setUserName(tempUserName);
    dispatch(getUserByIdRequest(loggedInUser));
    logEvent('profile_updated', { user_id: loggedInUser });
    crashlytics().log(`Profile updated by user: ${loggedInUser}`);
    setModalVisible(false);
  };
  const handleImagePicker = async () => {
    ImagePicker.openPicker({
      width: 200,
      height: 200,
      cropping: true,
      // cropperCircleOverlay: true,
      mediaType: 'photo',
      // compressImageQuality: 0.8,
    })
      .then(async (image) => {
        if (!image || !image.path) {
          return;
        }
        const imageUri = image.path;
        const fileName = `profileImages/${loggedInUser}_${Date.now()}`;
        const reference = storage().ref(fileName);

        setUploading(true);
      try {
        await reference.putFile(imageUri);
        const downloadUrl = await reference.getDownloadURL();

        setProfileImage(downloadUrl);
    } catch (uploadError) {
      console.error('Error uploading image: ', uploadError);
      crashlytics().recordError(uploadError, 'Error uploading cropped image');
    } finally {
      setUploading(false);
    }
    })
    .catch((error) => {
      if (error.code === 'E_PICKER_CANCELLED') {
        // console.log('User cancelled image picker.');
      } else {
        console.error('ImagePicker Error: ', error);
        crashlytics().recordError(error, 'Error in image picker/cropper');
        alert(t('ProfileScreen.imagePickError'));
      }
      setUploading(false);
    });
  };

  const deleteTokenFromFirestore = async () => {
    try {
      const token = await AsyncStorage.getItem('deviceToken');
      const userId = loggedInUser;

      if (token && userId) {
        const tokenRef = firestore()
          .collection('users')
          .doc(userId)
          .collection('userdevicetoken');

        const snapshot = await tokenRef.get();

        if (!snapshot.empty) {
          snapshot.forEach(async (doc) => {
            await doc.ref.delete();
            logEvent('logout_token_deleted', { user_id: userId, token_deleted: true });
            crashlytics().log('FCM token deleted successfully from Firestore');
          });
        } else {
          logEvent('logout_token_deleted', { user_id: userId, token_deleted: false });
          crashlytics().log('No FCM token found to delete in Firestore');
        }
      } else {
        crashlytics().log('No token or user ID found during logout process');
      }
    } catch (error) {
      console.error('Error deleting token from Firestore:', error);
      crashlytics().recordError(error, 'Error deleting FCM token from Firestore');
    }
  };
  const handleLogout = async () => {
    try {
      setLoading(true);
      await deleteTokenFromFirestore();
      const token = await AsyncStorage.getItem('deviceToken');
      auth().signOut().then(() => console.log('User signed out!'));
      dispatch(logout());
      logEvent('user_logout', { user_id: loggedInUser });
      crashlytics().log(`User logged out: ${loggedInUser}`);
      // navigation.getParent()?.replace('Login');

    } catch (error) {
      console.error('Error during logout process:', error);
      crashlytics().recordError(error, 'Error during logout process');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteAccount = async (password) => {
    try {
      const currentUser = auth().currentUser;
      const credential = auth.EmailAuthProvider.credential(userEmail, password);
      await currentUser.reauthenticateWithCredential(credential);

      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      if (userDoc.exists) {
        await firestore().collection('deletedUsers').doc(currentUser.uid).set(userDoc.data());
      }

      await firestore().collection('users').doc(currentUser.uid).delete();

      await currentUser.delete();
      await handleLogout();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleLanguageChange = async (value) => {
    setSelectedLanguage(value);
    i18nInstance.changeLanguage(value);
    try {
      await AsyncStorage.setItem('userLanguage', value);
    } catch (error) {
      crashlytics().recordError(error, 'Error saving user language');
    }
  };

  const handleModalClose = () => {
    if (!isLoading && !isUploading) {
      setTempUserName(userName);
      setModalVisible(false);
    }
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>{userName ? userName : t('ProfileScreen.user')}</Text>
      </View>

      <ScrollView style={styles.contentScrollArea} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrapper}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.profileImageWrapper}>
            {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
            ) : (
              <View style={styles.profileImagePlaceholderTouchable}>
                <Text style={styles.profileImagePlaceholderText}>
                  {userName ? userName.charAt(0).toUpperCase() : t('ProfileScreen.user').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <MaterialIcons name='edit' size={20} color={styleConstants.colors.black} />
            </View>
            </TouchableOpacity>
          </View>
          {/* <Text style={styles.userName}>{userName ? userName : t('ProfileScreen.user')}</Text> */}
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>{t('ProfileScreen.accountSettings')}</Text>

          <TouchableOpacity style={styles.optionTouchable} onPress={() => {
            navigation.navigate('UserSubscription');
          }}>
            <View style={styles.optionItem}>
              <Text style={styles.optionText}>{t('ProfileScreen.yourSubscription')}</Text>
              <MaterialIcons name='chevron-right' size={24} color={styleConstants.colors.black} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionTouchable} onPress={() => {
            navigation.navigate('ReminderSettings');
            logEvent('navigate_to_reminder', { user_id: user.uid });
          }}>
            <View style={styles.optionItem}>
              <Text style={styles.optionText}>{t('ProfileScreen.reminderSettings')}</Text>
              <MaterialIcons name='chevron-right' size={24} color={styleConstants.colors.black} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionTouchable} onPress={() => {
            navigation.navigate('SupportInfo');
            logEvent('navigate_to_privacy_policy', { user_id: user.uid });
          }}>
            <View style={styles.optionItem}>
              <Text style={styles.optionText}>{t('ProfileScreen.supportInfo')}</Text>
              <MaterialIcons name='chevron-right' size={24} color={styleConstants.colors.black} />
            </View>
          </TouchableOpacity>

          {isLanguageLoaded && (
            <CustomDropdown
              label={t('ProfileScreen.selectLanguage')}
              options={languageOptions}
              selectedValue={selectedLanguage}
              onValueChange={handleLanguageChange}
              placeholder={t('ProfileScreen.selectLanguage')}
            />
          )}
        </View>

      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.subHeading}>{t('ProfileScreen.logout')}</Text>
        </TouchableOpacity>
        {user.provider == 'google' || user.provider == 'facebook' || user.provider == 'apple' ? null : (
          <TouchableOpacity onPress={() => setDeleteModalVisible(true)} style={styles.deleteButton}>
            <Text style={styles.subHeading}>{t('ProfileScreen.deleteAccount')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('ProfileScreen.editProfile')}</Text>
            <View style={styles.modalProfileImagePreview}>
              <TouchableOpacity onPress={handleImagePicker}>
                {isUploading ? (
                  <View style={styles.modalImagePlaceholderTouchable}>
                    <ActivityIndicator size="large" color={styleConstants.colors.black} />
                  </View>
                ) : profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.modalImagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.modalImagePlaceholderTouchable}>
                    <Text style={styles.modalProfileImagePlaceholderText}>
                      {tempUserName ? tempUserName.charAt(0).toUpperCase() : t('ProfileScreen.user').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                {!isUploading && (
                  <View style={styles.editIconContainer}>
                    <MaterialIcons name='camera-alt' size={24} color={styleConstants.colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{t('ProfileScreen.name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('ProfileScreen.enterNewName')}
              value={tempUserName}
              onChangeText={setTempUserName}
              placeholderTextColor="#888"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.smlButton} onPress={handleModalClose}>
                <Text style={styles.buttonText}>{t('ProfileScreen.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smlButton} onPress={handleProfileUpdate} disabled={isLoading || isUploading}>
                 <Text style={styles.buttonText}>{t('ProfileScreen.update')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDeleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('ProfileScreen.deleteAccount')}</Text>
            <Text style={styles.modalText}>{t('ProfileScreen.enterPasswordToDeleteAccount')}</Text>
            <TextInput
              placeholder={t('ProfileScreen.enterPassword')}
              secureTextEntry
              value={password}
              onChangeText={(text) => setPassword(text)}
              style={styles.input}
              placeholderTextColor="#888"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.smlButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.buttonText}>{t('ProfileScreen.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smlButton, styles.deleteButtonModal]} onPress={handleDeleteAccount}>
                <Text style={[styles.buttonText, styles.deleteButtonModalText]}>{t('ProfileScreen.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

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
  },
  contentContainer: {
    paddingHorizontal: styleConstants.spacing.custom.s20,
    paddingBottom: styleConstants.spacing.custom.s20,
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageWrapper: {
    borderWidth: 4,
    borderRadius: 70,
    borderColor: styleConstants.colors.buttonBg,
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
  },
  profileImagePlaceholderTouchable: {
    width: 75,
    height: 75,
    borderRadius: 46,
    backgroundColor: styleConstants.colors.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -styleConstants.spacing.custom.s5,
    right: -styleConstants.spacing.custom.s5,
    alignSelf: 'center',
    backgroundColor: '#FFB200',
    borderRadius: 50,
    padding: styleConstants.spacing.custom.s5,
    // borderWidth: 1,
    // borderColor: styleConstants.colors.black,
  },
  userName: {
    fontSize: styleConstants.typography.fontSizes.lg,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
    color: styleConstants.colors.black,
    textAlign: 'center',
    marginTop: styleConstants.spacing.custom.s5,
  },
  userEmail: {
    fontSize: styleConstants.typography.fontSizes.sm,
    fontFamily: styleConstants.typography.fontFamily.PoppinsLight,
    color: styleConstants.colors.black,
    textAlign: 'center',
    marginTop: styleConstants.spacing.custom.s5,
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
  languageDropdownContainer: {
    marginTop: styleConstants.spacing.custom.s20,
    marginBottom: styleConstants.spacing.custom.s10,
  },
  bottomButtonContainer: {
    paddingHorizontal: styleConstants.spacing.custom.s20,
    paddingTop: styleConstants.spacing.custom.s20,
    paddingBottom: Platform.OS === 'ios' ? styleConstants.spacing.custom.s20 : styleConstants.spacing.custom.s20,
    backgroundColor: styleConstants.colors.primary,
  },
  logoutButton: {
    //  marginTop: styleConstants.spacing.custom.s15,
    //  marginBottom: styleConstants.spacing.custom.s15,
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: styleConstants.spacing.custom.s15,
    alignItems: 'center',
  },
  subHeading: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    color: 'red',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: styleConstants.colors.white,
    padding: styleConstants.spacing.custom.s20,
    borderRadius: 10,
    width: '85%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: styleConstants.typography.fontSizes.lg,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    textAlign: 'center',
    marginBottom: styleConstants.spacing.custom.s15,
    color: styleConstants.colors.black,
  },
  modalText: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    textAlign: 'center',
    marginBottom: styleConstants.spacing.custom.s15,
    color: styleConstants.colors.black,
  },
  modalProfileImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: styleConstants.colors.buttonBg,
    alignSelf: 'center',
    marginBottom: styleConstants.spacing.custom.s15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImagePreview: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  modalImagePlaceholderTouchable: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: styleConstants.colors.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProfileImagePlaceholderText: {
    fontSize: 40,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
  },
  modalLoadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: styleConstants.spacing.custom.s15,
  },
  label: {
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
    color: styleConstants.colors.black,
    marginBottom: styleConstants.spacing.custom.s5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
    padding: styleConstants.spacing.custom.s10,
    borderRadius: 5,
    marginBottom: styleConstants.spacing.custom.s15,
    color: styleConstants.colors.black,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: styleConstants.spacing.custom.s10,
  },
  smlButton: {
    backgroundColor: styleConstants.colors.buttonBg,
    paddingVertical: styleConstants.spacing.custom.s13,
    borderRadius: 50,
    alignItems: 'center',
    width: '48%',
  },
  buttonText: {
    color: styleConstants.colors.black,
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
  },
  deleteButtonModal: {
    backgroundColor: 'red',
  },
  deleteButtonModalText: {
    color: styleConstants.colors.white,
  },
  subscriptionHeading: {
    fontSize: styleConstants.typography.fontSizes.sml,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    marginRight: styleConstants.spacing.custom.s5,
  }
});