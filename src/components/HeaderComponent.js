import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styleConstants } from '../utils/styleConstants';

const Header = ({ heading, goBack }) => {
  return (
    <View style={styles.headerWrapper}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Icon name="arrow-back" size={25} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headingText}>{heading}</Text>
        <View style={styles.backButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    marginTop: Platform.OS === 'android' ? 15 : 0,
    // paddingHorizontal: styleConstants.spacing.custom.s20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: styleConstants.spacing.xxl,
    alignItems: 'flex-start',
  },
  headingText: {
    fontSize: styleConstants.typography.fontSizes.xl,
    fontWeight: 'bold',
    color: styleConstants.colors.black,
    textAlign: 'center',
  },
});

export default Header;
