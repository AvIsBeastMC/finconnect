/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { api } from '~/utils/api'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Stack as ExpoStack } from "expo-router";
import { Text, Box, FormControl, Input, Container, Actionsheet, Button } from 'native-base'
import { Keyboard, RefreshControl, ScrollView } from 'react-native'
import { AuthState } from '~/app/_layout'
import { UserCircle2 } from 'lucide-react-native';
import getflag from '~/data/flag';
import { all } from 'country-codes-list'

export default function WalletInfo() {
  const router = useRouter()
  const [auth, setAuth] = useAtom(AuthState);
  const { id } = useLocalSearchParams()
  const { data, error, isLoading, isRefetching, refetch } = api.general.getWalletInformation.useQuery({
    accountId: auth ? auth.id : 'unauthed',
    walletId: id as string
  })

  useEffect(() => {
    if (!auth) return router.push('/')
  }, [])

  if (!auth) return <></>

  if (!data) return (
    <ScrollView refreshControl={<RefreshControl refreshing={isLoading || isRefetching} />} />
  )
  //@ts-ignore
  const getCountryOfCurrency = (c: string) => all().filter((country) => country.currencyCode == c)

  return (
    <>
      <Box className='rounded-md m-6 px-6 py-4 bg-cyan-200'>
        <Box className='flex flex-row gap-2'>
          <Box className='w-1/2'>
            <UserCircle2 size={22} stroke='black' className='mb-2' />
            <Text className='text-xs' mb={-1}>Wallet belongs to</Text>
            <Text className='text-xl' fontFamily="ProductSansBold">
              {data.account.name}
            </Text>

            <Text className='text-xs' mt={4} mb={-1}>Balance</Text>
            <Text className='text-xl' fontFamily="ProductSansBold">
              {data.balance.toLocaleString('en-US')}
            </Text>
          </Box>
          <Box className='w-1/2'>
            <Box className='ml-auto mr-4'>
              <Text className='text-xs text-right' mb={-1}>Currency</Text>
              <Text className='text-xl text-right' fontFamily="ProductSansBold">
                {data.currency}
              </Text>
            </Box>
            <Box className='mt-auto mr-4'>
              <Text className='mt-auto text-xs text-right' mb={-1}>Currency Regions</Text>
              <Text mt={1} className='text-sm text-right' fontFamily="ProductSansBold">
                {/* {data.} */}
                {getCountryOfCurrency(data.currency).map((c) => c.flag)}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}