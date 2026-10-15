import { useState } from 'react';
import { StyleProp, StyleSheet, TextLayoutEventData, TextStyle, View, NativeSyntheticEvent } from 'react-native';

import { ThemedText, ThemedTextFontFamilyMap } from './ThemedText';

interface ExpandableTextProps {
  text: string;
  numberOfLines: number;
  style?: StyleProp<TextStyle>;
}

const MORE_LABEL = 'more';
// Characters trimmed off the last visible line to make room for "… more"
const ELLIPSIS_ROOM = 8;

// Cuts long text after numberOfLines and ends it with an inline "… more" that expands it
export function ExpandableText({ text, numberOfLines, style }: ExpandableTextProps) {
  const [truncatedText, setTruncatedText] = useState<string | null>(null);
  const [isMeasured, setIsMeasured] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = event.nativeEvent;
    if (lines.length > numberOfLines) {
      const visibleLines = lines.slice(0, numberOfLines).map(line => line.text);
      const lastLine = visibleLines[numberOfLines - 1] ?? '';
      visibleLines[numberOfLines - 1] = lastLine.slice(0, Math.max(0, lastLine.length - ELLIPSIS_ROOM));
      setTruncatedText(visibleLines.join('').trimEnd());
    } else {
      setTruncatedText(null);
    }
    setIsMeasured(true);
  };

  const showTruncated = !isExpanded && truncatedText !== null;

  return (
    <View>
      {/* Hidden copy of the full text, used to find where the lines break */}
      {!isExpanded && (
        <ThemedText
          style={[style, styles.measure]}
          onTextLayout={handleTextLayout}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {text}
        </ThemedText>
      )}
      {showTruncated ? (
        <ThemedText style={style} accessibilityLabel={text} onPress={() => setIsExpanded(true)}>
          {truncatedText}…{' '}
          <ThemedText style={[style, styles.more]}>{MORE_LABEL}</ThemedText>
        </ThemedText>
      ) : (
        <ThemedText style={style} numberOfLines={isExpanded || isMeasured ? undefined : numberOfLines}>
          {text}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  measure: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
  },
  more: {
    fontFamily: ThemedTextFontFamilyMap.bold,
  },
});
