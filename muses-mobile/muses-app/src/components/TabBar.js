import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

const ICONS = {
  Explore: 'compass',
  Gallery: 'image',
  Home: 'home',
  Visit: 'calendar',
  More: 'menu',
};

export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const isHome = route.name === 'Home';
          const onPress = () => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              {isHome ? (
                <View style={styles.homeCircle}>
                  <Feather name="home" size={30} color={colors.ink} />
                </View>
              ) : (
                <Feather name={ICONS[route.name]} size={22} color={colors.paper} style={{ opacity: focused ? 1 : 0.85 }} />
              )}
              <Text style={styles.label}>{route.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: {
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: fonts.sans, fontSize: 9, color: colors.paper },
  homeCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -38,
    marginBottom: -2,
  },
});
