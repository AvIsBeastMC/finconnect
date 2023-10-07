/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Tabs, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Box, NativeBaseProvider } from "native-base";
import { Text } from "native-base";
import { TRPCProvider } from "~/utils/api";
import { BadgeInfo, BadgePlus, Globe, LayoutGrid, ListIcon, WalletCards } from 'lucide-react-native'
import { atom, useAtom, useAtomValue } from 'jotai'
import type { Account } from "@prisma/client";
import { useFonts } from "expo-font";
import { LogBox } from 'react-native';
type AuthState = Account;
export const AuthState = atom<AuthState | undefined>(undefined)

const RootLayout = () => {
  const auth = useAtomValue(AuthState);
  const router = useRouter()
  const [fontsLoaded] = useFonts({
    'Inter': require('../fonts/Inter.ttf'),
    // Poppins
    'Poppins': require('../fonts/Poppins-Regular.ttf'),
    'PoppinsBold': require('../fonts/Poppins-Bold.ttf'),
    'PoppinsSemiBold': require('../fonts/Poppins-SemiBold.ttf'),
    // Product Sans
    'ProductSans': require('../fonts/Product-Sans.ttf'),
    'ProductSansBold': require('../fonts/Product-Sans-Bold.ttf'),
  });
  LogBox.ignoreAllLogs()

  if (!fontsLoaded) return <></>;

  return (
    <TRPCProvider>
      <NativeBaseProvider>
        <SafeAreaProvider>
          {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
          <Tabs>
            <Tabs.Screen name="index"
              options={{
                title: 'Home',
                headerTitle() {
                  return (
                    <Box className="flex flex-row">
                      <LayoutGrid color="black" size={18} className="self-center" />

                      <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="ml-2 self-center text-black text-md">Home</Text>
                    </Box>
                  )
                },
                tabBarLabel: () => <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="-mt-2 mb-1 text-black text-xs">Home</Text>,
                tabBarIcon: ({ focused }) => <LayoutGrid color={focused ? "black" : "gray"} size={20} className="" />,
              }} />

            <Tabs.Screen name="wallets/all"
              options={{
                title: 'All Wallets',
                href: auth ? 'wallets/all' : null,
                headerTitle() {
                  return (
                    <Box className="flex flex-row">
                      <WalletCards color="black" size={18} className="self-center" />

                      <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="ml-2 self-center text-black text-md">All Wallets</Text>
                    </Box>
                  )
                },
                tabBarLabel: () => <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="-mt-2 mb-1 text-black text-xs">All Wallets</Text>,
                tabBarIcon: ({ focused }) => <WalletCards color={focused ? "black" : "gray"} size={20} className="" />,
              }} />

            <Tabs.Screen name="wallets/create"
              options={{
                title: 'Create Wallet',
                href: null,
                headerTitle() {
                  return (
                    <Box className="flex flex-row">
                      <BadgePlus color="black" size={18} className="self-center" />

                      <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="ml-2 self-center text-black text-md">Create Wallet</Text>
                    </Box>
                  )
                },
              }} />

            <Tabs.Screen name="wallets/[id]/index"
              options={{
                title: 'Wallet Information',
                href: null,
                headerTitle() {
                  return (
                    <Box className="flex flex-row">
                      <BadgeInfo color="black" size={18} className="self-center" />

                      <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="ml-2 self-center text-black text-md">Wallet Information</Text>
                    </Box>
                  )
                },
              }} />

            <Tabs.Screen name="wallets/[id]/transactions"
              options={{
                title: 'Wallet Transactions',
                href: null,
                headerTitle() {
                  return (
                    <Box className="flex flex-row">
                      <ListIcon color="black" size={18} className="self-center" />

                      <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="ml-2 self-center text-black text-md">Wallet Transactions</Text>
                    </Box>
                  )
                },
              }} />

            <Tabs.Screen name="international/[id]"
              options={{
                title: 'International Payment',
                href: null,
                headerTitle() {
                  return (
                    <Box className="flex flex-row">
                      <Globe color="black" size={18} className="self-center" />

                      <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="ml-2 self-center text-black text-md">International Payment</Text>
                    </Box>
                  )
                },
              }} />
          </Tabs>
          <StatusBar />
        </SafeAreaProvider>
      </NativeBaseProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
