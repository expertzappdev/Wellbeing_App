import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { styleConstants } from '../utils/styleConstants';
import Icon from 'react-native-vector-icons/Feather'

const CustomDropdown = ({
    options,
    selectedValue,
    onValueChange,
    placeholder = 'Select an option',
    label,
    error,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;
    const containerRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(0);

    const measureContainerHeight = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.measure((_x, _y, height) => {
                setContainerHeight(height);
            });
        }
    }, []);

    useEffect(() => {
        measureContainerHeight();
    }, []);

    const toggleDropdown = () => {
        if (isOpen) {
            Animated.timing(animation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start(() => setIsOpen(false));
        } else {
            setIsOpen(true);
            Animated.timing(animation, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    };

    const maxHeight = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, options.length * 40],
    });

    const selectedOption = options.find((option) => option.value === selectedValue);

    return (
        <View style={styles.container} ref={containerRef} onLayout={measureContainerHeight}>
            <TouchableOpacity onPress={toggleDropdown}>
            <View style={styles.horizontalContainer}>
                {label && <Text style={styles.label}>{label}</Text>}
                <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
                    <Text style={selectedValue ? styles.selectedText : styles.placeholderText}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </Text>
                    <Icon
                        name={isOpen ? 'chevron-down' : 'chevron-right'}
                        size={20}
                        color={styleConstants.colors.black}
                        style={styles.icon}
                    />
                </TouchableOpacity>
            </View>
            </TouchableOpacity>

            <Animated.View >
                {isOpen && (
                    <View style={styles.optionsList}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={styles.option}
                                onPress={() => {
                                    onValueChange(option.value);
                                    toggleDropdown();
                                }}
                            >
                                <Text style={styles.optionText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </Animated.View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    horizontalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: styleConstants.spacing.custom.s13,
    },
    errorBorder: {
        borderColor: 'red',
    },
    icon: {
        marginLeft: 8,
      },
      placeholderText: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: '#888',
      },
      selectedText: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
      },
    optionsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: styleConstants.colors.white,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
        zIndex: 10,
        borderWidth: 1,
        borderColor: styleConstants.colors.inputBorder || '#ccc',
        borderTopWidth: 0,
        marginTop: 1,
      },
      optionsList: {
        paddingVertical: 0,
      },
      option: {
        paddingHorizontal: styleConstants.spacing.custom.s10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
      optionText: {
        fontSize: styleConstants.typography.fontSizes.sml,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
        color: styleConstants.colors.black,
      },
      errorText: {
        color: 'red',
        fontSize: styleConstants.typography.fontSizes.sml,
        marginTop: 4,
        fontFamily: styleConstants.typography.fontFamily.PoppinsRegular,
      },
});

export default CustomDropdown;
