import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_SCALE = 5;
// Pinching below 1x rubber-bands down to this, then snaps back on release
const MIN_RUBBER_BAND_SCALE = 0.5;
const SETTLE_DURATION = 200;
// At 1x, a vertical drag past this distance (or a fast flick) dismisses
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1000;

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

interface ZoomableImageProps {
  source: string;
  // A smaller, already-cached version of the same image shown until `source` loads
  placeholder?: string;
  accessibilityLabel?: string;
  onDismiss?: () => void;
}

// Full-window image with pinch to zoom, pan, and swipe to dismiss at 1x.
// Must be rendered inside a GestureHandlerRootView.
export function ZoomableImage({ source, placeholder, accessibilityLabel, onDismiss }: ZoomableImageProps) {
  const { width, height } = useWindowDimensions();
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dismissY = useSharedValue(0);
  const didPinch = useSharedValue(false);

  // Size of the image as drawn at 1x with contentFit="contain", used to keep panning within its edges.
  // Until the image loads, fall back to the window size.
  const fitScale = imageSize ? Math.min(width / imageSize.width, height / imageSize.height) : 1;
  const fitWidth = imageSize ? imageSize.width * fitScale : width;
  const fitHeight = imageSize ? imageSize.height * fitScale : height;

  const gesture = useMemo(() => {
    const getMaxTranslate = (forScale: number) => {
      'worklet';
      return {
        x: Math.max(0, (fitWidth * forScale - width) / 2),
        y: Math.max(0, (fitHeight * forScale - height) / 2),
      };
    };

    // Snap back to 1x, or keep the zoomed image covering the screen up to its edges
    const settle = () => {
      'worklet';
      if (scale.value <= 1) {
        scale.value = withTiming(1, { duration: SETTLE_DURATION });
        translateX.value = withTiming(0, { duration: SETTLE_DURATION });
        translateY.value = withTiming(0, { duration: SETTLE_DURATION });
        return;
      }
      const max = getMaxTranslate(scale.value);
      translateX.value = withTiming(clamp(translateX.value, -max.x, max.x), { duration: SETTLE_DURATION });
      translateY.value = withTiming(clamp(translateY.value, -max.y, max.y), { duration: SETTLE_DURATION });
    };

    const pinch = Gesture.Pinch()
      .onStart(() => {
        // Fingers drifting at the start of a pinch can count as a dismiss drag, so undo it
        didPinch.value = true;
        dismissY.value = withTiming(0, { duration: SETTLE_DURATION });
      })
      .onChange((e) => {
        const nextScale = clamp(scale.value * e.scaleChange, MIN_RUBBER_BAND_SCALE, MAX_SCALE);
        const factor = nextScale / scale.value;
        // Keep the point under the fingers in place (focal point relative to the center)
        const focalX = e.focalX - width / 2;
        const focalY = e.focalY - height / 2;
        translateX.value = focalX - (focalX - translateX.value) * factor;
        translateY.value = focalY - (focalY - translateY.value) * factor;
        scale.value = nextScale;
      })
      .onEnd(() => {
        settle();
      });

    const pan = Gesture.Pan()
      .averageTouches(true)
      .onBegin(() => {
        // Fires on first touch-down, so each new touch sequence starts without a pinch
        didPinch.value = false;
      })
      .onChange((e) => {
        // Only a one-finger drag at 1x dismisses; anything else moves the image
        if (scale.value > 1 || didPinch.value || e.numberOfPointers > 1) {
          translateX.value += e.changeX;
          translateY.value += e.changeY;
        } else if (onDismiss) {
          dismissY.value += e.changeY;
        }
      })
      .onEnd((e) => {
        if (dismissY.value !== 0 && !didPinch.value) {
          if (Math.abs(dismissY.value) > DISMISS_DISTANCE || Math.abs(e.velocityY) > DISMISS_VELOCITY) {
            if (onDismiss) { scheduleOnRN(onDismiss); }
          } else {
            dismissY.value = withTiming(0, { duration: SETTLE_DURATION });
          }
          return;
        }
        dismissY.value = withTiming(0, { duration: SETTLE_DURATION });
        settle();
      });

    return Gesture.Simultaneous(pinch, pan);
  }, [width, height, fitWidth, fitHeight, onDismiss]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(dismissY.value), [0, height / 2], [1, 0], Extrapolation.CLAMP),
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + dismissY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.container}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
        <Animated.View style={[styles.container, imageStyle]}>
          <Image
            source={source}
            placeholder={placeholder}
            placeholderContentFit="contain"
            contentFit="contain"
            transition={200}
            style={styles.image}
            accessible
            accessibilityLabel={accessibilityLabel}
            onLoad={(e) => setImageSize({ width: e.source.width, height: e.source.height })}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'black',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
