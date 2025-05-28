import { Dimensions, PixelRatio } from 'react-native';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const fontScale = PixelRatio.getFontScale();
const baseWidth = 370;

const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel((size * screenWidth) / baseWidth / fontScale));

const colors = {
    primary: '#F8F8F8',   // Background color
    secondary: '#F1E1E1', // Header color
    hometext: '#3E342C',  // Home Text
    white: '#FFFFFF',
    black: '#000000',
    placeholder: '#6E7174',
    buttonBg: '#EDD4B9',
    cardBackground: '#FBE4D6',
};

const spacing = {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    custom: {
        s5: 5,  
        s10: 10, 
        s13: 13,
        s15: 15, 
        s20: 20,
        s25: 25, 
        s31: 31, 
        s34: 34,
      },
};

const typography = {
    fontSizes: {
        xs: normalize(10),
        sm: normalize(12),
        sml: normalize(14),
        md: normalize(16),
        lg: normalize(20),
        xl: normalize(24),
    },
    fontFamily: {
        PoppinsLight: 'Poppins Light',
        PoppinsMedium: 'Poppins Medium',
        PoppinsRegular: 'Poppins Regular',
        PoppinsSemiBold: 'Poppins SemiBold',
        PoppinsBold: 'Poppins Bold',
        PoppinsExtraBold: 'Poppins ExtraBold',
    },
    fontWeights: {
        light: '300',
        regular: '400',
        medium: '500',
        bold: '700',
    },
    lineHeights: {
        sm: 1.2,
        md: 1.5,
        lg: 1.75,
    },
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
    },
};

const borders = {
    width: {
        thin: normalize(1),
        medium: normalize(2),
        thick: normalize(4),
    },
    radius: {
        none: 0,
        sm: normalize(4),
        md: normalize(8),
        lg: normalize(16),
        circle: normalize(50),
    },
};

const shadows = {
    sm: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: normalize(1),
        shadowOffset: { width: 0, height: normalize(1) },
    },
    md: {
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: normalize(4),
        shadowOffset: { width: 0, height: normalize(2) },
    },
    lg: {
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: normalize(6),
        shadowOffset: { width: 0, height: normalize(4) },
    },
};

export const styleConstants = {
    colors,
    spacing,
    typography,
    borders,
    shadows,
};
