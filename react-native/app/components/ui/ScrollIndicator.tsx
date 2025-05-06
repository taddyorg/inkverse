import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, PanResponder, GestureResponderEvent, PanResponderGestureState, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface ScrollIndicatorProps {
  scrollPosition: number;
  contentHeight: number;
  screenHeight: number;
  headerHeight: number;
  footerHeight: number;
  onScrollTo: (position: number) => void;
  isVisible: boolean;
}

export function ScrollIndicator({ scrollPosition, contentHeight, screenHeight, headerHeight, footerHeight, onScrollTo, isVisible }: ScrollIndicatorProps) {
  // Track if user is currently interacting with the scroll indicator
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Use Animated values for smoother transitions
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedPosition = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  
  // Track current position for hit testing
  const currentPositionRef = useRef(0);
  
  const totalScrollable = Math.max(0, contentHeight - screenHeight);
  // Adjust container height to account for footer height and add a buffer to prevent overlap
  const containerHeight = screenHeight - headerHeight - footerHeight - 20; // Add buffer to prevent overlap
  
  // Set usable track height - on Android we use a different calculation to ensure accessibility (Hack)
  const usableTrackHeight = Platform.OS === 'android'
    ? containerHeight + footerHeight - 10 // Reserve some space at the bottom to ensure indicator remains touchable
    : containerHeight - 10;
  
  // Update animated position when scrollPosition changes (when not controlled by pan)
  useEffect(() => {
    // Calculate indicator position based on scroll percentage
    const scrollPercentage = totalScrollable > 0 ? scrollPosition / totalScrollable : 0;
    
    // Apply clamping to keep indicator accessible
    const clampedPercentage = Math.min(1.0, scrollPercentage);
    
    // Calculate position - for Android, we adjust the range to ensure indicator stays touchable
    const newPosition = clampedPercentage * usableTrackHeight;
    
    // Store current position for hit testing
    currentPositionRef.current = newPosition;
    
    // Use setValue for immediate updates during scrolling instead of animation
    animatedPosition.setValue(newPosition);
    
  }, [scrollPosition, totalScrollable, usableTrackHeight, animatedPosition]);

  // Update opacity when visibility changes, but stay visible during interaction
  useEffect(() => {
    // Only hide if not currently interacting
    const shouldBeVisible = isVisible || isInteracting;
    
    Animated.timing(animatedOpacity, {
      toValue: shouldBeVisible ? 1 : 0,
      duration: 50,
      useNativeDriver: true
    }).start();
  }, [isVisible, isInteracting, animatedOpacity]);
  
  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (evt: GestureResponderEvent) => {
      // Check if touch is on the scroll indicator button
      const touchY = evt.nativeEvent.pageY;
      const buttonPosition = currentPositionRef.current;
      const buttonTop = headerHeight + buttonPosition;
      const buttonBottom = buttonTop + 40; // Height of the scroll tip
      
      return touchY >= buttonTop && touchY <= buttonBottom;
    },
    onMoveShouldSetPanResponder: () => isInteracting, // Only allow moves if initially interacting
    onPanResponderGrant: () => {
      // Set interaction state to true when user starts dragging
      setIsInteracting(true);
      
      // Scale up when touch starts - use timing for more direct control
      Animated.timing(animatedScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true
      }).start();
    },
    onPanResponderMove: (evt: GestureResponderEvent, _: PanResponderGestureState) => {
      // Get the touch position relative to the container
      const touchY = evt.nativeEvent.pageY;
      
      // Calculate container bounds with exact header position
      const containerTop = headerHeight;
      
      // Calculate the percentage of the touch within the usable area
      let touchPercentage = Math.max(0, Math.min(1.0, 
        (touchY - containerTop) / usableTrackHeight
      ));
      
      // Convert to scroll position
      const newScrollPos = touchPercentage * totalScrollable;
      
      // Update current position ref for hit testing
      currentPositionRef.current = touchPercentage * usableTrackHeight;
      
      // Update animated position directly for immediate visual feedback
      animatedPosition.setValue(touchPercentage * usableTrackHeight);
      
      // Update scroll position in parent
      onScrollTo(newScrollPos);
    },
    onPanResponderRelease: () => {
      // Set interaction state to false when user stops dragging
      setIsInteracting(false);
      
      // Scale down when touch ends
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
    },
    onPanResponderTerminate: () => {
      // Set interaction state to false when touch is terminated
      setIsInteracting(false);
      
      // Scale down when touch is terminated
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
    },
  }), [containerHeight, totalScrollable, onScrollTo, animatedPosition, animatedScale, headerHeight, usableTrackHeight, isInteracting]);
  
  // Don't show scroll tip if content fits in screen
  if (contentHeight <= screenHeight) {
    return null;
  }
  
  // Position exactly at header edge with no gap
  return (
    <Animated.View style={[
      styles.scrollIndicatorContainer, 
      { 
        top: headerHeight,
        // Set a fixed height instead of using bottom property to avoid footer overlap
        height: containerHeight,
        opacity: animatedOpacity,
      }
    ]}>
      <View style={styles.touchArea} {...panResponder.panHandlers}>
        <Animated.View 
          style={[
            styles.scrollTip,
            { 
              transform: [
                { translateY: animatedPosition },
                { scale: animatedScale }
              ] 
            }
          ]}
        >
          <Feather 
            name="chevron-up" 
            size={14} 
            color="rgba(255, 255, 255, 0.7)" 
            style={styles.upIcon}
          />
          <Feather 
            name="chevron-down" 
            size={14} 
            color="rgba(255, 255, 255, 0.7)" 
            style={styles.downIcon}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrollIndicatorContainer: {
    position: 'absolute',
    right: 8,
    width: 24,
    zIndex: 10,
    marginTop: -10
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -10, // Extend touch area to the left
    right: 0,
    width: 44, // Wider touch area
  },
  scrollTip: {
    position: 'absolute',
    right: 0,
    width: 24,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upIcon: {
    marginBottom: 4,
  },
  downIcon: {
    marginTop: -4,
  },
}); 