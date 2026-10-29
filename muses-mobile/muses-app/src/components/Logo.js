import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts } from '../theme';

// Icon hoa sen đơn giản trong vòng tròn — thay bằng SVG export từ Figma nếu muốn chính xác
export default function Logo() {
  return (
    <View style={styles.row}>
      <Svg width={34} height={34} viewBox="0 0 34 34">
        <Circle cx="17" cy="17" r="16" fill="none" stroke={colors.ink} strokeWidth="1.8" />
        <Path d="M17 26 C10 24 8 17 11 11 C14 14 16 18 17 26Z" fill={colors.ink} />
        <Path d="M17 26 C24 24 26 17 23 11 C20 14 18 18 17 26Z" fill={colors.ink} />
        <Path d="M17 26 C13 20 14 13 17 8 C20 13 21 20 17 26Z" fill={colors.ink} />
      </Svg>
      <Text style={styles.text}>MUSES</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: fonts.display, fontSize: 32, color: colors.ink, letterSpacing: 0.5 },
});
