



/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { api } from '~/utils/api'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Stack as ExpoStack } from "expo-router";
import { Text, Box, FormControl, Input, Container, Actionsheet, Button, Modal } from 'native-base'
import { Keyboard, RefreshControl, ScrollView, TouchableOpacity } from 'react-native'
import { AuthState } from '~/app/_layout'
import { AtSign, Banknote, CircleDollarSign, Globe, ListIcon, Nfc, Send, UserCircle2, Wallet } from 'lucide-react-native';
import getflag from '~/data/flag';
import { all } from 'country-codes-list'
import { CurrencySymbols } from '~/data/currency';
import { data as CurrencyData } from 'currency-codes'
import Toast from 'react-native-toast-message';

export default function WalletTransactions() {
  const router = useRouter()
  const [auth, setAuth] = useAtom(AuthState);
  const { id } = useLocalSearchParams()
  const { data, error, isLoading, isRefetching, refetch } = api.general.getWalletInformation.useQuery({
    accountId: auth ? auth.id : 'unauthed',
    walletId: id as string
  })
  const [currencyChoose, setCurrencyChoose] = useState<boolean>(false)
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const { mutate, isLoading: proceduresLoading } = api.general.pay.useMutation();
  const [loading, setLoading] = useState<boolean>(false)

  // Inputs
  const [finConnectAddress, setFinConnectAddress] = useState<string>()
  const [currency, setCurrency] = useState<string>()
  const [amount, setAmount] = useState<string>()

  useEffect(() => {
    if (!auth) return router.push('/')

    navigation.addListener('state', (e) => {
      refetch()
    });
  }, [])

  if (!auth) return <></>

  if (!data) return (
    <ScrollView refreshControl={<RefreshControl refreshing={isLoading || isRefetching} />} />
  )
  const { allWallets, currencyWallet } = data;

  return (
    <></>
  )
}