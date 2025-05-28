import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import Logo from '../assets/images/launch_screen.png';
import { styleConstants } from '../utils/styleConstants';

const CustomSplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image source={Logo} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: styleConstants.colors.primary,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

export default CustomSplashScreen;