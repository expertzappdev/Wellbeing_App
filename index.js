/**
 * @format
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import PushNotification from "react-native-push-notification";

PushNotification.configure({
    onRegister: function (token) {
    },
    onNotification: function (notification) {
    // notification.finish(PushNotificationIOS.FetchResult.NoData);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: true,
  });

AppRegistry.registerComponent(appName, () => App);
