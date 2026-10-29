import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors, fonts } from '../theme';

export default function PlaceholderScreen() {
  const route = useRoute();
  return (
    <View style={styles.c}>
      <Text style={styles.t}>{route.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  t: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
});
