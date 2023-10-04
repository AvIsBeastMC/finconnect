/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAtom } from 'jotai'
import React, { useEffect } from 'react'
import { api } from '~/utils/api'
import { AuthState } from '../_layout'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Container, ScrollView, Text } from 'native-base'
import { RefreshControl, TouchableOpacity } from 'react-native'
import { Asterisk, BadgePlus, LogOut } from 'lucide-react-native'
import { Stack as ExpoStack } from "expo-router";
import type { CurrencySymbolsType } from '~/data/currency';
import { CurrencySymbols } from '~/data/currency'
import { data as CurrenyCodes } from 'currency-codes'
import cn from 'classnames'

const AllWallets = () => {
  const router = useRouter()
  const params = useLocalSearchParams();
  const [auth, setAuth] = useAtom(AuthState);
  const { data, error, isLoading, refetch, isRefetching } = api.general.getWallets.useQuery({
    account: auth?.id ? auth.id : 'unauthed'
  })

  useEffect(() => {
    if (!auth) return router.push('/')
    refetch()
  }, [])

  if (!auth) return <></>

  if (!data) {
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading || isRefetching} />} />
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

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}>
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
          <Container key={i} className={cn(i == 0 ? "pt-6" : "pt-3", "flex flex-row gap-1 mx-auto")}>
            <TouchableOpacity onPress={() => router.push(`wallets/${w.id}`)} className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
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
        ))}
      </ScrollView>
    </>
  )
}

export default AllWallets