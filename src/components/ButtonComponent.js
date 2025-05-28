import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styleConstants } from '../utils/styleConstants';

const ButtonComponent = ({
  bgColor = styleConstants.colors.buttonBg,
  text = 'Button', 
  textSize = 16, 
  borderRadius = 5,
  redirectPath = '',
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (redirectPath) {
      navigation.reset({
        index: 0,
        routes: [{ name: redirectPath }], 
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor, borderRadius }]}
      onPress={handlePress}
    >
      <Text style={[styles.text, { fontSize: textSize }]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: styleConstants.spacing.custom.s25,
  },

  text: {
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsSemiBold,
  },
});

export default ButtonComponent;
