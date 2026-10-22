import React, { useState } from 'react';
import {
  View, Text, ScrollView, FlatList, Image, Pressable,
  useWindowDimensions, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/Logo';
import WaveImage from '../components/WaveImage';
import { colors, fonts } from '../theme';
import { slides, highlights } from '../data';

const pad = (n) => String(n).padStart(2, '0');

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const imgW = width * 0.66;
  const imgH = imgW * (440 / 290);
  const cardW = width * 0.39;

  const renderSlide = ({ item }) => (
    <View style={{ width }}>
      <View style={{ height: imgH }}>
        <View style={styles.waveWrap}>
          <WaveImage source={item.image} width={imgW} height={imgH} />
        </View>

        <View style={styles.sideText}>
          <View style={styles.vline} />
          <Text style={styles.collection}>{item.collection}</Text>
          <View style={[styles.vline, { height: 30, marginTop: 14 }]} />
          <Text style={styles.counter}>{pad(index + 1)}{'\n'}/{'\n'}{pad(slides.length)}</Text>
          <View style={styles.dots}>
            {slides.map((s, i) => (
              <View key={s.id} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.tag}>{item.tag}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <Logo />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Feather name="search" size={30} color={colors.ink} />
          </View>
        </View>

        <FlatList
          data={slides}
          keyExtractor={(s) => s.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          extraData={index}
        />

        <Pressable style={styles.exploreRow}>
          <Text style={styles.exploreText}>Explore</Text>
          <View style={styles.circleBtn}>
            <Feather name="arrow-right" size={20} color={colors.ink} />
          </View>
        </Pressable>

        <View style={styles.highlightHead}>
          <View>
            <Text style={styles.highlightLabel}>HIGHLIGHT</Text>
            <Text style={styles.curated}>Curated for you</Text>
          </View>
          <Pressable style={styles.seeAll}>
            <Text style={styles.seeAllText}>See all</Text>
            <View style={styles.circleBtn}>
              <Feather name="arrow-right" size={20} color={colors.ink} />
            </View>
          </Pressable>
        </View>

        <FlatList
          data={highlights}
          keyExtractor={(h) => h.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}
          renderItem={({ item }) => (
            <Image source={item.image} style={{ width: cardW, height: cardW * 0.62 }} resizeMode="cover" />
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 56 },
  waveWrap: { position: 'absolute', right: 0, top: 0 },
  sideText: { position: 'absolute', left: 40, top: 0, width: 130 },
  vline: { width: 1, height: 60, backgroundColor: colors.ink, marginBottom: 14 },
  collection: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 23, color: colors.ink },
  counter: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 26, color: colors.ink, marginTop: 14 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 14 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.dotOff },
  dotOn: { backgroundColor: colors.ink },
  titleBlock: { paddingHorizontal: 40, marginTop: -4 },
  title: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, color: colors.ink },
  tag: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, marginTop: 14, letterSpacing: 0.5 },
  exploreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 44, marginTop: 32 },
  exploreText: { fontFamily: fonts.sansMedium, fontSize: 22, color: colors.ink },
  circleBtn: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, borderColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  highlightHead: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 28, marginBottom: 12,
  },
  highlightLabel: { fontFamily: fonts.sans, fontSize: 13, letterSpacing: 1, color: colors.muted },
  curated: { fontFamily: fonts.sansMedium, fontSize: 18, color: colors.ink },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seeAllText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
});
