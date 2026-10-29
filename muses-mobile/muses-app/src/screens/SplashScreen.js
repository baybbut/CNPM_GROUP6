import React from 'react';
import { View, Text, ImageBackground, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { splashImage } from '../data';

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={splashImage} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <View style={styles.titleBlock}>
        <Text style={styles.muses}>MUSES</Text>
        <Text style={styles.museum}>MUSEUM</Text>
      </View>
      <Pressable
        onPress={() => navigation.replace('Main')}
        style={[styles.button, { bottom: Math.max(insets.bottom, 24) + 40 }]}
      >
        <Text style={styles.buttonText}>EXPLORE</Text>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  titleBlock: { position: 'absolute', left: 24, right: 24, bottom: 220 },
  muses: { fontFamily: fonts.display, fontSize: 60, color: colors.paper, lineHeight: 64 },
  museum: {
    fontFamily: fonts.sansMedium,
    fontSize: 32,
    color: colors.paper,
    letterSpacing: 4,
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  button: {
    position: 'absolute',
    alignSelf: 'center',
    width: 220,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontFamily: fonts.sansMedium, fontSize: 20, letterSpacing: 3, color: colors.ink },
});
