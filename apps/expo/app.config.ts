import type { ExpoConfig } from "@expo/config";

const defineConfig = (): ExpoConfig => ({
  name: "FinConnect",
  slug: "finconnect",
  scheme: "expo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/F.jpg",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/F.jpg",
    resizeMode: "contain",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "your.bundle.identifier",
  },
  android: {
    package: 'com.arunnya.finconnect',
    adaptiveIcon: {
      foregroundImage: "./assets/F.jpg",
      backgroundColor: "#1F104A",
    },
  },
  extra: {
    eas: {
      projectId: "c3884e8b-c2fc-444c-b279-b9aaa8385c22",
    },
  },
  plugins: ["./expo-plugins/with-modify-gradle.js"],
});

export default defineConfig;
