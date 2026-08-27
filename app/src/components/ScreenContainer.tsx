import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";

/**
 * Height of the on-screen keyboard, 0 when hidden.
 *
 * `KeyboardAvoidingView` alone is not enough here: with a navigation header its
 * `padding` behaviour needs an offset it cannot know from inside this component,
 * so the bottom of the screen stayed under the keyboard and the Save button was
 * unreachable. Padding the scroll content by the real keyboard height instead
 * always leaves enough room to scroll to the very last control, header or not.
 */
type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}>;

export function ScreenContainer({ children, scroll = true, style, contentStyle }: ScreenContainerProps) {
  const { palette } = useAppTheme();
  const keyboardHeight = useKeyboardHeight();
  const safeStyle = [styles.safe, { backgroundColor: palette.background }, style];

  if (!scroll) {
    return (
      <SafeAreaView style={safeStyle}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeStyle}>
      {/*
        Every screen scrolls through here, so keyboard handling belongs here too.
        Adding the keyboard's height as extra bottom padding means the content can
        always scroll clear of it — including the Save button, which otherwise sits
        permanently underneath and leaves a written note with no way to save.
      */}
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle, keyboardHeight > 0 && { paddingBottom: keyboardHeight + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
        // Let the first tap hit a button instead of being swallowed by the
        // keyboard dismissal — otherwise "Save" needs tapping twice.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.xl
  }
});
