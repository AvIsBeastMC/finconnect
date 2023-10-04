
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { api } from '~/utils/api'
import { AuthState } from '../_layout'
import { useRouter } from 'expo-router'
import { Stack as ExpoStack } from "expo-router";
import { Text, Box, FormControl, Input, Container, Actionsheet, Button } from 'native-base'
import { Keyboard, ScrollView } from 'react-native'
import { CurrencySymbols } from '~/data/currency'
import { data as CurrencyData } from 'currency-codes'
import { BadgeCheck, KeySquare, LockKeyhole } from 'lucide-react-native'
import Toast from 'react-native-toast-message'

export default function CreateWallet() {
  const router = useRouter()
  const [auth, setAuth] = useAtom(AuthState);
  const [loading, setLoading] = useState<boolean>(false)
  const { mutate: setWallet } = api.general.setupWallet.useMutation()

  // Inputs
  const [currencyChoose, setCurrencyChoose] = useState<boolean>(false)
  const [currency, setCurrency] = useState<string>()
  const [pin, setPin] = useState<string>()
  const [moneyToAdd, setMoneyToAdd] = useState<string>()

  useEffect(() => {
    if (!auth) return router.push('/')
  }, [])

  if (!auth) return <></>

  const setUpWallet = () => {
    console.log({
      pin,
      currency,
      moneyToAdd
    })

    if (!pin || !currency || !moneyToAdd) return;

    if (pin.length < 4) return Toast.show({
      type: 'error',
      text1: 'Bad Input',
      text2: 'PIN should be of atleast 4 digits'
    })

    setLoading(true)

    setWallet({
      pin: parseInt(pin),
      currency,
      money: parseInt(moneyToAdd),
      userId: auth.id
    }, {
      onSuccess(data) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `New Currency Wallet '${data!.currency}' added!`
        });

        setTimeout(() => {
          router.push('wallets/all?toRefetch=true')
        }, 2000);
      },
      onError(error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message
        });

        setLoading(false)
      }
    })
  }

  return (
    <>
      <Text fontFamily="ProductSans" className="tracking-widest text-center text-black text-xl mt-6">
        Enter the following details
      </Text>
      <Box className="h-1 mt-2 w-20 bg-indigo-500 rounded flex mx-auto"></Box>

      <Container className='flex mx-auto w-full pt-4'>
        <FormControl>
          <FormControl.Label>Currency</FormControl.Label>
          <Input onChangeText={(e) => {
            setCurrency(undefined)
            Keyboard.dismiss()
          }} value={currency ? CurrencyData.find((c) => c.code == currency)?.currency : undefined} className='bg-gray-100' onFocus={(e) => {
            e.preventDefault();
            Keyboard.dismiss()
            setCurrencyChoose(true)
          }} />
        </FormControl>
        <FormControl pt={4}>
          <FormControl.Label>Add Money</FormControl.Label>
          <Input value={moneyToAdd ? parseInt(moneyToAdd as any).toLocaleString('en-US') : undefined} onChangeText={(t) => setMoneyToAdd(t)} keyboardType="number-pad" className='bg-gray-100' />
        </FormControl>
        <FormControl pt={4}>
          <FormControl.Label className='flex flex-row'>
            <LockKeyhole stroke='black' size={12} className='self-center mr-1.5' />
            4-Digit PIN
          </FormControl.Label>
          <Input value={pin} autoCorrect={false} onChangeText={(t) => {
            if (t.length <= 4) {
              setPin(t)
              if (t.length == 4) {
                Keyboard.dismiss()
              }
            } else {
              Keyboard.dismiss()
            }
          }} keyboardType="number-pad" className='bg-gray-100' />
        </FormControl>
        <Button isLoading={loading} onPress={() => setUpWallet()} isDisabled={!currency || !moneyToAdd || !pin} mt={6} className='w-full' variant="solid">
          <Box className='flex flex-row'>
            <BadgeCheck className='self-center' size={20} stroke='white' />
            <Text className='text-white self-center ml-1.5' fontFamily="ProductSansBold">Add Wallet</Text>
          </Box>
        </Button>
      </Container>

      <Actionsheet isOpen={currencyChoose} onClose={() => setCurrencyChoose(false)}>
        <Actionsheet.Content>
          <ScrollView className='w-full'>
            {Object.keys(CurrencySymbols).map((c, i) => (
              <Actionsheet.Item onPress={() => {
                setCurrency(c)
                setCurrencyChoose(false)
              }} key={i}>
                {c}
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>

      <Toast />
    </>
  )
}