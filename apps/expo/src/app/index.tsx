/* eslint-disable */
import 'react-native-get-random-values';
import { useFonts } from 'expo-font';
import { Stack as ExpoStack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { AuthState } from "./_layout";
import * as SecureStore from 'expo-secure-store';
import { Text, Box, Button, FormControl, Input, Stack, Modal, ScrollView, Container } from "native-base";
import Toast from 'react-native-toast-message'
import { ArrowLeftRight, BadgePlus, FolderOpen, Globe, KeySquare, LayoutGrid, LogOut, Nfc, PenSquare, UserCircle, WalletCards } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { Keyboard } from 'react-native'
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';

const Login = () => {
  const { mutate, error, isLoading } = api.auth.login.useMutation()
  const { mutate: register, isLoading: isLoading2 } = api.auth.register.useMutation()
  const [email, setEmail] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [, setAuth] = useAtom(AuthState)
  const [loading, setLoading] = useState<boolean>(false)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [name, setName] = useState<string>()

  const login = async (type: 'login' | 'autoLogin') => {
    const id = await SecureStore.getItemAsync('APP_DEVICE_ID')
    if (!id) {
      await SecureStore.setItemAsync('APP_DEVICE_ID', uuidv4())
    }

    const id2 = await SecureStore.getItemAsync('APP_DEVICE_ID')

    const result = await SecureStore.getItemAsync('ACCOUNT_LOGIN');

    if (type == 'autoLogin' && !result) return;

    const emailF = type == 'autoLogin' ? result!.split('_')[0] : email
    const passwordF = type == 'autoLogin' ? result!.split('_')[1] : password

    if (!emailF || !passwordF) return;

    Keyboard.dismiss()
    setLoading(true)

    mutate({
      deviceType: Platform.OS,
      deviceId: id2 ? id2 : 'failure',
      email: emailF,
      password: passwordF,
      autoLogin: type == 'autoLogin'
    }, {
      async onSuccess(data) {
        Toast.show({
          text1: 'Login',
          text2: `Welcome back ${data.name}!`,
          type: 'success',
          visibilityTime: 2500
        })

        await SecureStore.setItemAsync('ACCOUNT_LOGIN', `${data.email}_${data.password}`)

        setTimeout(() => {
          setAuth(data);
        }, 3000);
      },
      onError(e) {
        setLoading(false)

        Toast.show({
          text1: 'Error',
          text2: e.message,
          type: 'error'
        })
      }
    })
  }

  const signUp = () => {
    if (!email || !password) return;

    Keyboard.dismiss()

    setModalVisible(true)
  }

  const continueRegistration = () => {
    // alert(JSON.stringify({ email, password, name }));
    if (!email || !password || !name) return;

    setModalVisible(false)
    setLoading(true)

    Keyboard.dismiss()

    register({
      email,
      name,
      password
    }, {
      onSuccess(data) {
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: 'New account has been successfully created!'
        })

        setTimeout(() => {
          setLoading(false)
          setEmail(undefined)
          setPassword(undefined)
          setName(undefined)
        }, 2000);
      },
      onError(error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message
        })

        setTimeout(() => {
          setLoading(false)
        }, 1000);
      }
    })
  }

  const setupDeviceId = async () => {
    const id = await SecureStore.getItemAsync('APP_DEVICE_ID');
    if (!id) await SecureStore.setItemAsync('APP_DEVICE_ID', uuidv4())
  }

  useEffect(() => {
    login('autoLogin');
    setupDeviceId()
  }, [])

  return (
    <>
      <Toast />

      <ExpoStack.Screen options={{
        headerTitle() {
          return (
            <Box className="flex flex-row">
              <KeySquare color="gray" size={18} className="self-center" />

              <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="ml-2 self-center text-gray-600 text-md">Login</Text>
            </Box>
          )
        },
      }} />

      <Box alignItems="center" className='my-auto flex'>
        <Box w="100%" maxWidth="300px">
          <FormControl isRequired>
            <Stack mx="4">
              <Box className='flex flex-row'>
                <FormControl.Label>Email</FormControl.Label>
              </Box>
              <Input value={email} type="text" keyboardType="email-address" autoCapitalize="none" onChangeText={(id) => setEmail(id)} background="white" placeholder="me@example.com" />
            </Stack>
            <Stack mx="4" mt={4}>
              <Box className='flex flex-row'>
                <FormControl.Label>Password</FormControl.Label>
              </Box>
              <Input value={password} type="password" autoCapitalize='none' onChangeText={(password) => setPassword(password)} background="white" placeholder="*****" />
            </Stack>
            <Button isLoading={loading} onPress={() => login('login')} isDisabled={!email || !password} mx={4} mt={4} size="sm" variant="solid">
              L O G I N
            </Button>
            <Button isLoading={loading} onPress={() => signUp()} isDisabled={!email || !password} mx={4} mt={4} size="sm" variant="outline" background="gray.200">
              R E G I S T E R
            </Button>
          </FormControl>
        </Box>
      </Box>

      <Modal isOpen={modalVisible} onClose={setModalVisible} size="lg">
        <Modal.Content maxH="500">
          <Modal.CloseButton />
          <Modal.Header>Registration</Modal.Header>
          <Modal.Body>
            <FormControl>
              <FormControl.Label>Name</FormControl.Label>
              <Input onChangeText={(n) => setName(n)} />
            </FormControl>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => {
                setEmail(undefined)
                setPassword(undefined)
                setName(undefined)
                setModalVisible(false)
              }}>
                Cancel
              </Button>
              <Button onPress={() => continueRegistration()}>
                Continue
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  )
}







export default function MainPage() {
  const [auth, setAuth] = useAtom(AuthState)
  const router = useRouter()
  const { mutate: logOut } = api.auth.logOut.useMutation()

  if (!auth) return <Login />


  return (
    <>
      <ExpoStack.Screen options={{
        title: 'Home',
        headerTitle() {
          return (
            <Box className="flex flex-row">
              <LayoutGrid color="black" size={18} className="self-center" />

              <Text style={{ fontFamily: 'Inter', fontWeight: '600' }} className="ml-2 self-center text-black text-md">Home</Text>
            </Box>
          )
        },
        headerRight() {
          const signOut = async () => {
            await SecureStore.deleteItemAsync('ACCOUNT_LOGIN');
            const deviceId = await SecureStore.getItemAsync('APP_DEVICE_ID')

            if (!deviceId || !auth) return;

            logOut({
              accountId: auth.id,
              deviceId: deviceId
            })

            setAuth(undefined);
          }
          return (
            <TouchableOpacity onPress={signOut}>
              {auth && <LogOut color="gray" size={18} className="self-center mr-4" />}
            </TouchableOpacity>
          )
        },
      }} />

      <Text fontFamily="ProductSans" className="tracking-widest text-center text-gray-700 text-xl mt-6">Welcome back, {auth.name}!</Text>
      <Box className="h-1 mt-1 w-20 bg-indigo-500 rounded flex mx-auto"></Box>

      <Container className="pt-6 flex flex-row gap-1 mx-auto">
        <TouchableOpacity onPress={() => router.push('/wallets/all')} className="w-1/2 py-4 border-2 border-gray-200 bg-white rounded-md">
          <WalletCards color="gray" size={30} className="mx-auto" />
          <Text mt={2} className="text-center text-xs" fontFamily="Inter">Multi-Currency Wallets</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-1/2 py-4 border-2 border-gray-200 bg-white rounded-md">
          <ArrowLeftRight color="gray" size={30} className="mx-auto" />
          <Text mt={2} className="text-center text-xs" fontFamily="Inter">Transactions & Deposits</Text>
        </TouchableOpacity>
      </Container>

      <Container className="pt-3 flex flex-row gap-1 mx-auto">
        <TouchableOpacity className="w-1/2 py-4 border-2 border-gray-200 bg-white rounded-md">
          <Nfc color="gray" size={30} className="mx-auto" />
          <Text mt={2} className="text-center text-xs" fontFamily="Inter">User-to-User Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-1/2 py-4 border-2 border-gray-200 bg-white rounded-md">
          <Globe color="gray" size={30} className="mx-auto" />
          <Text mt={2} className="text-center text-xs" fontFamily="Inter">International Payments</Text>
        </TouchableOpacity>
      </Container>

      <Container className="pt-3 flex flex-row gap-1 mx-auto">
        <TouchableOpacity className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
          <BadgePlus color="gray" size={30} className="mx-auto" />
          <Text mt={2} className="text-center text-xs" fontFamily="Inter">Deposit Money to a Wallet</Text>
        </TouchableOpacity>
      </Container>

      <Container className="pt-3 flex flex-row gap-1 mx-auto">
        <TouchableOpacity className="w-full py-4 border-2 border-gray-300 bg-gray-100 rounded-md">
          <UserCircle color="gray" size={30} className="mx-auto" />
          <Text mt={2} className="text-center text-xs" fontFamily="Inter">Account Details</Text>
        </TouchableOpacity>
      </Container>

      {/* <Container className="pt-3 flex flex-row gap-1 mx-auto">
        <TouchableOpacity className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
          <BarChart3 color="gray" size={30} className="mx-auto" />
          <Text mt={2} className="text-center text-xs" fontFamily="Inter">Your Test Results</Text>
        </TouchableOpacity>
      </Container> */}
    </>
  )
}