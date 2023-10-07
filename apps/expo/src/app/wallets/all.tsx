/* eslint-disable @typescript-eslint/no-floating-promises */

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { api } from '~/utils/api'
import { AuthState } from '../_layout'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Actionsheet, Box, Container, ScrollView, Text, addTextAndPropsToStrings } from 'native-base'
import { RefreshControl, TouchableOpacity } from 'react-native'
import { Asterisk, BadgePlus, LogOut, Wallet2 } from 'lucide-react-native'
import { Stack as ExpoStack } from "expo-router";
import type { CurrencySymbolsType } from '~/data/currency';
import { CurrencySymbols } from '~/data/currency'
import { data as CurrenyCodes } from 'currency-codes'
import cn from 'classnames'
import Toast from 'react-native-toast-message'

const AllWallets = () => {
  const router = useRouter()
  const params = useLocalSearchParams();
  const [auth, setAuth] = useAtom(AuthState);
  const { data, error, isLoading, refetch, isRefetching } = api.general.getWallets.useQuery({
    account: auth?.id ? auth.id : 'unauthed'
  }, {
    refetchInterval: 5000
  })
  const { mutate: setDefaultWalletMutation } = api.general.setDefaultWallet.useMutation()
  const navigation = useNavigation()
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!auth) return router.push('/')

    navigation.addListener('state', (e) => {
      refetch()
    });
  }, [])

  if (!auth) return <></>

  if (!data) {
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading || isRefetching} />} />
    )
  }

  type Wallet = typeof data.currencyWallets[number]
  const WalletComponent = ({ w, i }: { w: Wallet, i: number }) => {
    const [actionSheet, setActionSheet] = useState<boolean>(false);

    const setDefaultWallet = () => {
      setActionSheet(false);

      setLoading(true)

      setDefaultWalletMutation({
        userId: auth.id,
        walletId: w.id
      }, {
        onSuccess(data) {
          Toast.show({
            type: 'success',
            text1: 'Set Default Wallet',
            text2: `Successfully set ${w.currency} as the Default Wallet for International Payments`
          })
          setLoading(false)
        },
        onError(e) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message
          })
          setLoading(false)
        }
      })
    }

    return (
      <>
        <Container key={i} className={cn(i == 0 ? "pt-6" : "pt-3", "flex flex-row gap-1 mx-auto")}>
          <TouchableOpacity onLongPress={() => setActionSheet(true)} onPress={() => router.push(`wallets/${w.id}`)} className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
            <Text className="text-center text-xl" fontWeight={700} fontFamily="ProductSansBold">
              {CurrencySymbols[w.currency as CurrencySymbolsType]} {w.balance.toLocaleString('en-US')}
            </Text>
            <Text mt={1} className="text-center" fontSize={12} fontFamily="Inter">
              {CurrenyCodes.find((c) => c.code == w.currency)!.currency}
            </Text>
            <Text mt={1} className="text-center flex flex-row" fontSize={10} fontFamily="Inter">
              Wallet Pin:
              {w.pin.toString().match(/.{1,1}/g)?.map((a, i) => <Asterisk key={i} size={12} className='' stroke='black' />)}
            </Text>
          </TouchableOpacity>
        </Container>
        <Actionsheet isOpen={actionSheet} onClose={() => setActionSheet(false)}>
          <Actionsheet.Content>
            <ScrollView className='w-full'>
              <Actionsheet.Item onPress={() => setDefaultWallet()}>
                <Box className='flex flex-row gap-2'>

                  <Wallet2 size={20} stroke='black' />
                  <Text className='self-center' fontFamily="ProductSans">Set as Default Wallet (for Int'l Payments)</Text>
                </Box>
              </Actionsheet.Item>
            </ScrollView>
          </Actionsheet.Content>
        </Actionsheet>
      </>
    )
  }

  return (
    <>
      <ExpoStack.Screen options={{
        headerRight() {
          return (
            <TouchableOpacity onPress={() => router.push('wallets/create')}>
              <BadgePlus color="gray" size={18} className="self-center mr-4" />
            </TouchableOpacity>
          )
        },
      }} />

      <ScrollView refreshControl={<RefreshControl refreshing={loading || isLoading || isRefetching} onRefresh={refetch} />}>
        {(!data.currencyWallets.length) && (
          <Container className="pt-6 flex flex-row gap-1 mx-auto">
            <TouchableOpacity onPress={() => router.push('wallets/create')} className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
              <BadgePlus color="gray" size={30} className="mx-auto" />
              <Text mt={2} className="text-center text-sm" fontWeight={700} fontFamily="ProductSansBold">Add a Currency Wallet</Text>
              <Text mt={0.9} className="text-center" fontSize={10} fontFamily="Inter">you currently have no wallets!</Text>
            </TouchableOpacity>
          </Container>
        )}

        {data.currencyWallets.map((w, i) => (
          <WalletComponent w={w} i={i} key={i} />
        ))}
      </ScrollView>
      <Toast />
    </>
  )
}

export default AllWallets