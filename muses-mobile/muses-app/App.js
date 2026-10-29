import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BodoniModa_400Regular, BodoniModa_600SemiBold } from '@expo-google-fonts/bodoni-moda';
import { Jost_400Regular, Jost_500Medium } from '@expo-google-fonts/jost';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import TabBar from './src/components/TabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Explore" component={PlaceholderScreen} />
      <Tab.Screen name="Gallery" component={PlaceholderScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Visit" component={PlaceholderScreen} />
      <Tab.Screen name="More" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loaded] = useFonts({
    BodoniModa_400Regular,
    BodoniModa_600SemiBold,
    Jost_400Regular,
    Jost_500Medium,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
