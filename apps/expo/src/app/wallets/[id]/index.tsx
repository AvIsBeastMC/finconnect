



/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { api } from '~/utils/api'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Stack as ExpoStack } from "expo-router";
import { Text, Box, FormControl, Input, Container, Actionsheet, Button, Modal, Spinner } from 'native-base'
import { Keyboard, RefreshControl, ScrollView, TouchableOpacity } from 'react-native'
import { AuthState } from '~/app/_layout'
import { AtSign, Banknote, CircleDollarSign, Globe, ListIcon, Nfc, Send, UserCircle2, Wallet } from 'lucide-react-native';
import getflag from '~/data/flag';
import { all } from 'country-codes-list'
import { CurrencySymbols } from '~/data/currency';
import { data as CurrencyData } from 'currency-codes'
import Toast from 'react-native-toast-message';

export default function WalletInfo() {
  const router = useRouter()
  const [auth, setAuth] = useAtom(AuthState);
  const { id } = useLocalSearchParams()
  const { data, error, isLoading, isRefetching, refetch } = api.general.getWalletInformation.useQuery({
    accountId: auth ? auth.id : 'unauthed',
    walletId: id as string
  }, {
    refetchInterval: 15000
  })
  const [currencyChoose, setCurrencyChoose] = useState<boolean>(false)
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [canDoIntl, setCanDoIntl] = useState<string>()
  const { mutate } = api.general.pay.useMutation();
  const [loading, setLoading] = useState<boolean>(false)
  const { mutate: intlMutate } = api.general.initiateInternationalPayment.useMutation()

  // Inputs
  const [finConnectAddress, setFinConnectAddress] = useState<string | undefined>()
  const [currency, setCurrency] = useState<string | undefined>()
  const [amount, setAmount] = useState<string | undefined>()

  useEffect(() => {
    if (!auth) return router.push('/')

    navigation.addListener('state', (e) => {
      refetch()
    });
  }, [])

  if (!auth) return <></>

  if (!data) return (
    <Box alignItems="center" className='my-auto flex'>
      <Box w="100%">
        <Spinner size={40} color="black" />
      </Box>
    </Box>
  )
  const { allWallets, currencyWallet } = data;

  //@ts-ignore
  const getCountryOfCurrency = (c: string) => all().filter((country) => country.currencyCode == c);

  const payProcedures = () => {
    if (!amount || !finConnectAddress) return;

    if (parseInt(amount) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Bad Input',
        text2: 'Balance should be above 0!'
      })
    }

    setLoading(true)

    mutate({
      amount: parseInt(amount),
      currency: currencyWallet.currency,
      payerId: auth.id,
      receiverEmail: finConnectAddress
    }, {
      onSuccess(data) {
        Toast.show({
          type: 'success',
          text1: 'Transfer Successful',
          text2: `${currencyWallet.currency} ${amount} transfered to '${data}' wallet of ${finConnectAddress}!`
        })

        refetch()

        setModalVisible(false)
        setLoading(false)
      },
      onError(e) {
        setModalVisible(false);
        // console.log(e.message);
        if (e.message.includes('CAN_DO_INTL')) {

          setCanDoIntl(e.message)

          setLoading(false)

          return;
        }

        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e.message
        })

        setLoading(false)
      }
    })
  }

  const payInternational = () => {
    if (!amount || !finConnectAddress || !canDoIntl) return;

    setLoading(true);

    intlMutate({
      amount: parseInt(amount),
      payerWallet: currencyWallet.id,
      receiverWallet: canDoIntl.split(' ')[1]!
    }, {
      onSuccess(data) {
        setCanDoIntl(undefined)
        router.push(`international/${data.id}`)
      },
      onError(e) {
        alert(e.message)
        setLoading(false);
      }
    })
  }

  return (
    <ScrollView refreshControl={<RefreshControl onRefresh={() => refetch()} refreshing={loading || isLoading || isRefetching} />}>
      <Box className='rounded-md m-6 px-6 py-4 bg-cyan-300'>
        <Box className='flex flex-row gap-2'>
          <Box className='w-1/2'>
            <UserCircle2 size={22} stroke='black' className='mb-2' />
            <Text className='text-xs' mb={-1}>Wallet belongs to</Text>
            <Text className='text-xl' fontFamily="ProductSansBold">
              {currencyWallet.account.name}
            </Text>

            <Text className='text-xs' mt={4} mb={-1}>Balance</Text>
            <Text className='text-xl' fontFamily="ProductSansBold">
              {currencyWallet.balance.toLocaleString('en-US')}
            </Text>
          </Box>
          <Box className='w-1/2'>
            <Box className='ml-auto mr-4'>
              <Text className='text-xs text-right' mb={-1}>Currency</Text>
              <Text className='text-xl text-right' fontFamily="ProductSansBold">
                {currencyWallet.currency}
              </Text>
            </Box>
            <Box className='mt-auto mr-4'>
              <Text className='mt-auto text-xs text-right' mb={-1}>Currency Regions</Text>
              <Text mt={1} className='text-sm text-right' fontFamily="ProductSansBold">
                {/* {data.} */}
                {getCountryOfCurrency(currencyWallet.currency).map((c) => c.flag).slice(0, 7).join('')}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Container className='flex mx-auto'>
        <Container className="flex flex-row gap-1 min-w-full justify-center">
          <TouchableOpacity onPress={() => setModalVisible(true)} className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
            <Nfc color="gray" size={30} className="mx-auto" />
            <Text mt={2} className="text-center text-xs" fontFamily="Inter">User-to-User Pay</Text>
          </TouchableOpacity>
        </Container>

        <Container className="pt-3 flex flex-row gap-1 min-w-full justify-center">
          <TouchableOpacity onPress={() => setModalVisible(true)} className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
            <ListIcon color="gray" size={30} className="mx-auto" />
            <Text mt={2} className="text-center text-xs" fontFamily="Inter">Recent Transactions</Text>
          </TouchableOpacity>
        </Container>

      </Container>

      <Modal isOpen={modalVisible} onClose={() => {
        setFinConnectAddress(undefined)
        setCurrency(undefined)
        setAmount(undefined)
        setModalVisible(false)
      }} size="lg">
        <Modal.Content maxH="500">
          <Modal.CloseButton />
          <Modal.Header className='flex flex-row'>
            <Send size={12} stroke="black" className='self-center mr-2' />
            Pay to a User Wallet
          </Modal.Header>
          <Modal.Body>
            <FormControl className='mb-2'>
              <FormControl.Label>
                <AtSign size={12} stroke="black" className='self-center mr-1' />
                FinConnect Address
              </FormControl.Label>
              <Input autoCapitalize='none' keyboardType='email-address' value={finConnectAddress} onChangeText={(n) => setFinConnectAddress(n)} />
            </FormControl>
            <FormControl mb={4}>
              <FormControl.Label>
                <CircleDollarSign size={12} stroke="black" className='self-center mr-1' />
                Amount
              </FormControl.Label>
              <Input value={amount} keyboardType="number-pad" onChangeText={(n) => setAmount(n)} />
            </FormControl>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => {
                setFinConnectAddress(undefined)
                setCurrency(undefined)
                setAmount(undefined)
                setModalVisible(false)
              }}>
                Cancel
              </Button>
              <Button isLoading={loading} onPress={() => payProcedures()} variant="subtle" className='bg-gray-200' isDisabled={!finConnectAddress || !currency || !amount}>
                <Send size={12} stroke="black" className='self-center' />
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      <Modal isOpen={canDoIntl ? true : false} onClose={() => setCanDoIntl(undefined)} size="lg">
        <Modal.Content maxH="500">
          <Modal.CloseButton />
          <Modal.Header className='flex flex-row'>
            <Globe size={12} stroke="black" className='self-center mr-2' />
            Currency Conversion
          </Modal.Header>
          <Modal.Body>
            <Text className='mb-2' fontFamily="Inter">
              Hey! Even though the User does not have a '{currencyWallet.currency}' Wallet, you can choose to convert your amount to the currency of their Default Wallet i.e. {canDoIntl?.split(' ')[2]}!
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => {
                setFinConnectAddress(undefined)
                setCurrency(undefined)
                setAmount(undefined)
                setModalVisible(false)
                setCanDoIntl(undefined)
              }}>
                Cancel
              </Button>
              <Button isLoading={loading} onPress={() => payInternational()} variant="subtle" className='bg-gray-200' isDisabled={!finConnectAddress || !amount}>
                <Send size={12} stroke="black" className='self-center' />
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

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
    </ScrollView>
  )
}