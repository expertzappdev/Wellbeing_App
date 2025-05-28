// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../../locales/en/en.json';
import de from '../../locales/de/de.json';
// Import the Dutch translation file if you have it
import nl from '../../locales/nl/nl.json';

const LANGUAGE_PERSIST_KEY = 'userLanguage';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (cb) => {
    try {
      const savedDataJSON = await AsyncStorage.getItem(LANGUAGE_PERSIST_KEY);
      const lng = savedDataJSON || 'en';
      cb(lng);
    } catch (error) {
      console.error('Error reading language from AsyncStorage', error);
      cb('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_PERSIST_KEY, lng);
    } catch (err) {
      console.error('Error caching user language', err);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      de: { translation: de },
      nl: { translation: nl }, // Add Dutch resources here
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;