import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExploreDataRequest } from '../redux/slices/explore/exploreSlice';
import { styleConstants } from '../utils/styleConstants';
import Icon from 'react-native-vector-icons/AntDesign';

const ExploreScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { exploreData, loading, error } = useSelector(state => state.explore);

  const [scrollY] = useState(new Animated.Value(0)); 

  useEffect(() => {
    dispatch(fetchExploreDataRequest());
  }, [dispatch]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }
  const bannerHeight = scrollY.interpolate({
    inputRange: [0, 250], 
    outputRange: [250, 0], 
    extrapolate: 'clamp',
  });

  const bannerOpacity = scrollY.interpolate({
    inputRange: [0, 250],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <>
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon
            name={'user'}
            size={35}
            color={styleConstants.colors.black}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.bannerContainer, { height: bannerHeight, opacity: bannerOpacity }]}>
        <Image
          source={require('../assets/images/frame.png')}
          style={styles.bannerBackground}
        />
        {/* <Image
          source={require('../assets/images/Play.png')}
          style={styles.playButton}
        /> */}
      </Animated.View>

      <Animated.ScrollView
        style={styles.contentContainer}
        // contentContainerStyle={[styles.container, { transform: [{ translateY: contentOffsetY }] }]} 
        contentContainerStyle={styles.container}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View>
          <Text style={styles.sectionTitle}>Gratitude</Text>
          <View style={styles.cardRow}>
            {exploreData?.gratitude?.map(item => (
              <Card
                key={item.id}
                text={item.heading}
                subtext={item.subtext}
                image={{ uri: item.image }}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Motivation</Text>
          <View style={styles.cardRow}>
            {exploreData?.motivation?.map(item => (
              <Card
                key={item.id}
                text={item.heading}
                subtext={item.subtext}
                image={{ uri: item.image }}
              />
            ))}
          </View>
        </View>
        { Platform.OS === 'android' ? 
        <Text style={{marginTop: 20}}>Some Text Here</Text>
        : null}
      </Animated.ScrollView>
    </SafeAreaView>
    </>
  );
};

const Card = ({ text, subtext, image }) => (
  <TouchableOpacity style={styles.card}>
    <Image source={image} style={styles.cardImage} />
    <Text style={styles.cardText}>{text}</Text>
    <Text style={styles.cardSubText}>{subtext}</Text>
  </TouchableOpacity>
);

export default ExploreScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: styleConstants.colors.secondary,
  },
  container: {
    paddingHorizontal: 30,
    backgroundColor: styleConstants.colors.primary,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 20,
    backgroundColor: styleConstants.colors.secondary,
  },
  headerTitle: {
    fontSize: styleConstants.typography.fontSizes.xl,
    fontWeight: styleConstants.typography.fontWeights.bold,
    fontFamily: styleConstants.typography.fontFamily.PoppinsBold,
    color: styleConstants.colors.black,
  },
  profileContainer: {
    position: 'absolute',
    right: 30,
  },
  profileImage: {
    top: Platform.OS === 'android' ? 15 : 10,
    width: 40,
    height: 40,
    borderRadius: 25,
    marginBottom: styleConstants.spacing.custom.s15,
    borderWidth: 2,
    borderColor: styleConstants.colors.black,
  },
  bannerContainer: {
    // position: 'relative',
    marginTop: styleConstants.spacing.md,
    zIndex: -1,
  },
  bannerBackground: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButton: {
    // position: 'absolute',
    bottom: 5,
    left: 25,
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  contentContainer: {
    flex: 1,
    zIndex: 2,
    paddingVertical: 20,
    backgroundColor: styleConstants.colors.primary,
  },
  sectionTitle: {
    fontSize: styleConstants.typography.fontSizes.lg,
    fontWeight: styleConstants.typography.fontWeights.medium,
    fontFamily: styleConstants.typography.fontFamily.PoppinsMedium,
    marginTop: styleConstants.spacing.custom.s20,
    marginBottom: styleConstants.spacing.custom.s10,
    color: styleConstants.colors.black,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  card: {
    width: '46%',
    height: 440,
    backgroundColor: styleConstants.colors.primary,
    borderRadius: 5,
    overflow: 'hidden',
    elevation: 3,
  },
  cardImage: {
    flex: 1,
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardText: {
    padding: 1,
    fontSize: styleConstants.typography.fontSizes.md,
    fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
    color: styleConstants.colors.black,
    fontWeight: styleConstants.typography.fontWeights.medium,
    textAlign: 'start',
  },
  cardSubText: {
    padding: 1,
    fontSize: styleConstants.typography.fontSizes.sm,
    fontFamily: styleConstants.typography.fontFamily.PoppinsLight,
    color: styleConstants.colors.black,
    textAlign: 'start',
  },
});
