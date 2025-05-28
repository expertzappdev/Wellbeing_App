import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { styleConstants } from '../utils/styleConstants';

const CardComponent = ({ image, description }) => {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.cardImage} />
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: styleConstants.spacing.custom.s25,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: 150,
    height: 110,
    resizeMode: 'cover',
  },
  cardTextContainer: {
    flex: 1,
    paddingLeft: styleConstants.spacing.custom.s25,
    justifyContent: 'start',
  },
  cardDescription: {
    fontSize: styleConstants.typography.fontSizes.sml,
    color: styleConstants.colors.black,
    fontFamily: styleConstants.typography.fontFamily.PoppinsLight,
    textAlign: 'start',
  },
});

export default CardComponent;
