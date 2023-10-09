/* eslint-disable */

import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Stack as ExpoStack } from "expo-router";
import { Text, Box, FormControl, Input, Container, Actionsheet, Button, Spinner, ScrollView } from 'native-base'
import Toast from 'react-native-toast-message'
import { atom, useAtom } from 'jotai';
import { AuthState } from './_layout';
import { api } from '~/utils/api';
import { ChevronLeftCircle, LockKeyhole, LogOut, Smartphone, TabletSmartphone, TextIcon, UserCircle2 } from 'lucide-react-native';
import { RefreshControl, TouchableOpacity } from 'react-native';
import moment from 'moment';
import { Account, CurrencyWallet, Device } from '../../../../packages/db';
import { Image } from 'native-base';

const ScreenTypeAtom = atom<'home' | 'devices'>('home');
const Profile = atom<Account & {
  currencyWallets: CurrencyWallet[];
  devices: Device[];
} | undefined>(undefined)

const ManageDevices = () => {
  const [screenType, setScreenType] = useAtom(ScreenTypeAtom);
  const [profile, setProfile] = useAtom(Profile);

  if (!profile) return;

  const DeviceComponent = ({ d }: { d: Device }) => {
    const [actionSheet, setActionSheet] = useState<boolean>(false);

    return (
      <>
        <Container className="pt-3 flex flex-row gap-1 min-w-full justify-center">
          <TouchableOpacity onPress={() => setActionSheet(true)} className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
            <Image src={`https://img.icons8.com/color/48/${d.platform == 'ios' ? "mac-os--v1.png" : "android-os.png"}`} width={30} height={30} className='mx-auto' />
            <Text mt={2} className="text-center text-xs" fontFamily="Inter">
              {d.platform == 'ios' ? 'iOS' : 'Android'} Phone
            </Text>
          </TouchableOpacity>
        </Container>

        <Actionsheet isOpen={actionSheet} onClose={() => setActionSheet(false)}>
          <Actionsheet.Content>
            <ScrollView className='w-full'>
              <Actionsheet.Item>
                <Box className='flex flex-row gap-2'>
                  <LogOut size={20} stroke='black' />
                  <Text className='self-center' fontFamily="ProductSans">
                    Log out from this Account
                  </Text>
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
      <Container className='flex mx-auto'>
        {profile.devices.map((d, i) => (
          <DeviceComponent d={d} />
        ))}

        <Container className="pt-3 flex flex-row gap-1 min-w-full justify-center">
          <TouchableOpacity onPress={() => setScreenType('home')} className="w-full py-4 border-2 border-gray-200 bg-gray-200 rounded-md">
            <ChevronLeftCircle color="gray" size={30} className="mx-auto" />
            <Text mt={2} className="text-center text-xs" fontFamily="Inter">
              Go Back
            </Text>
          </TouchableOpacity>
        </Container>
      </Container>
    </>
  )
}

const AccountComponent = () => {
  const [auth, setAuth] = useAtom(AuthState);
  const router = useRouter();
  const [screenType, setScreenType] = useAtom(ScreenTypeAtom);
  const [loading, setLoading] = useState<boolean>(false)
  const { data, error, refetch, isLoading, isRefetching } = api.general.getProfileInfo.useQuery({
    id: auth ? auth.id : 'unauthed'
  }, {
    refetchInterval: 15000,
    onSuccess(data) {
      setProfile(data.account)
    },
  })
  const [profile, setProfile] = useAtom(Profile)
  const navigation = useNavigation()

  useEffect(() => {
    if (!auth || error) return router.push('/')

    navigation.addListener('state', () => {
      refetch()
    })
  }, [])

  if (!auth) return <></>

  if (!data) return (
    <Box alignItems="center" className='my-auto flex'>
      <Box w="100%">
        <Spinner size={40} color="black" />
      </Box>
    </Box>
  )

  const { account, lastTransactionMade, defaultWallet } = data;

  if (screenType == 'devices') return <ManageDevices />

  return (
    <ScrollView refreshControl={<RefreshControl onRefresh={() => refetch()} refreshing={isLoading || isRefetching} />}>
      <Box className='rounded-md m-6 px-6 py-4 bg-blue-100'>
        <Box className='flex flex-row gap-2'>
          <Box className='w-1/2'>
            <UserCircle2 size={22} stroke='black' className='mb-2' />
            <Text className='text-xs' mb={-1}>Account Name</Text>
            <Text className='text-xl' fontFamily="ProductSansBold">
              {account.name}
            </Text>

            {lastTransactionMade && (
              <>
                <Text className='text-xs' mt={4} mb={-1}>Last Transaction Made</Text>
                <Text className='text-xl' fontFamily="ProductSansBold">
                  {moment(lastTransactionMade?.time).format(`hh:mm A`)}
                </Text>
                <Text className='text-sm' fontFamily="ProductSans">
                  {moment(lastTransactionMade?.time).format(`Do MMM YY`)}
                </Text>
              </>
            )}
          </Box>
          <Box className='w-1/2'>
            <Box className='ml-auto mr-4'>
              <Text className='text-xs text-right' mb={-1}>Default Wallet</Text>
              <Text className='text-xl text-right' fontFamily="ProductSansBold">
                {defaultWallet ? defaultWallet.currency : 'Not Set'}
              </Text>
            </Box>
            <Box className='pt-4 mt-auto mr-4'>
              <Text className='mt-auto text-xs text-right' mb={-1}>FinConnect Address</Text>
              <Text mt={1} className='text-sm text-right' fontFamily="ProductSansBold">
                {account.email}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Container className='flex mx-auto'>
        <Container className="flex flex-row gap-1 min-w-full justify-center">
          <TouchableOpacity onPress={() => null} className="w-1/2 py-4 border-2 border-gray-200 bg-white rounded-md">
            <LockKeyhole color="gray" size={30} className="mx-auto" />
            <Text mt={2} className="text-center text-xs" fontFamily="Inter">Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreenType('devices')} className="w-1/2 py-4 border-2 border-gray-200 bg-white rounded-md">
            <TabletSmartphone color="gray" size={30} className="mx-auto" />
            <Text mt={2} className="text-center text-xs" fontFamily="Inter">Manage Devices</Text>
          </TouchableOpacity>
        </Container>

        <Container className="pt-3 flex flex-row gap-1 min-w-full justify-center">
          <TouchableOpacity onPress={() => null} className="w-full py-4 border-2 border-gray-200 bg-white rounded-md">
            <TextIcon color="gray" size={30} className="mx-auto" />
            <Text mt={2} className="text-center text-xs" fontFamily="Inter">Check Logs</Text>
          </TouchableOpacity>
        </Container>
      </Container>
    </ScrollView>
  )
}

export default AccountComponent