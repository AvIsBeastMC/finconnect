/* eslint-disable */
import classNames from "classnames";
import { Tabs as ExpoTab, useLocalSearchParams, useRouter } from "expo-router";
import { useAtom, useAtomValue } from "jotai"
import { BadgeCheck, KeySquare, ShieldCheck, SquareAsterisk, UserCircle, WalletCards } from "lucide-react-native";
import { Box, Button, Container, FormControl, Input, Modal, Spinner, Text } from "native-base";
import React, { useEffect, useState } from "react"
import { TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";
import { AuthState } from "~/app/_layout"
import { api } from "~/utils/api";

export default function ProcessInternationalPayments() {
  const auth = useAtomValue(AuthState);
  const router = useRouter()
  const { id } = useLocalSearchParams();
  const { mutate: validatePinMutation } = api.general.validatePin.useMutation();
  const { mutate: processPaymentMutation } = api.general.processInternationalPayment.useMutation()
  const { data, error } = api.general.getInternationalPayment.useQuery({
    id: typeof id == 'string' ? id : 'bad'
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [validatePin, setValidatePin] = useState<boolean>(false)

  const [processingInternationalPayment, setProcessingInternationalPayment] = useState<boolean>(false);

  const [success, setSuccess] = useState<boolean>(false);

  // Inputs
  const [pin, setPin] = useState<string>()

  useEffect(() => {
    if (!auth || error) return router.push('/')
  }, [])

  if (!auth) return <></>

  if (!data) return (
    <Box alignItems="center" className='my-auto flex'>
      <Box w="100%">
        <Spinner size={40} color="black" />
      </Box>
    </Box>
  )

  const verifyPin = () => {
    if (!pin) return;
    const p = parseInt(pin)

    setValidatePin(false)
    setLoading(true);

    validatePinMutation({
      id: data.sender.id,
      pin: p
    }, {
      onSuccess() {
        Toast.show({
          type: 'success',
          text1: 'PIN Validated',
          text2: 'Please wait as we process and complete the payment...'
        });

        processInternationalPayment()

        setProcessingInternationalPayment(true);
      },
      onError(e) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e.message
        });
        setLoading(false)
      }
    })
  };

  const processInternationalPayment = () => {
    setProcessingInternationalPayment(true);

    processPaymentMutation({
      id: data.id,
    }, {
      onSuccess() {
        setSuccess(true);

        Toast.show({
          type: 'success',
          text1: 'Payment Successful',
          text2: `${data.receiver.currency} ${data.conversion.toFixed(2)} transferred to ${data.receiver.account.name}!`
        })
      },
      onError(e) {
        setProcessingInternationalPayment(false);

        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e.message
        })
      }
    })
  }

  return (
    <>
      <ExpoTab.Screen options={{

      }} />
      <Box className={classNames(!success ? "bg-green-500" : "bg-blue-300", "py-4")}>
        <Box className="pl-8">
          <Text fontFamily="ProductSans">
            Currency Conversion
            {"\n"}
            <Text fontFamily="ProductSansBold" mt={2} fontSize={16}>{data.sender.currency} {data.amountInCurrency1}</Text> {"->"} <Text fontFamily="ProductSansBold" fontSize={16}>{data.receiver.currency} {data.conversion.toFixed(3)}</Text>
          </Text>
          <Text fontSize={12} mt={1.5}>
            to <Text fontFamily="ProductSansBold">{data.receiver.account.name}</Text> ({data.receiver.account.email})
          </Text>
        </Box>
      </Box>

      <Text fontSize={16} className="text-center mt-4" fontFamily="ProductSansBold">International Wallet Transfer</Text>
      <Box className="h-1 mt-1 w-20 bg-indigo-500 rounded flex mx-auto"></Box>

      <Container className="mx-12 mt-4 flex flex-row">
        <Box className="mr-auto">
          <Text fontFamily='PoppinsSemiBold'>
            Current Exchange Rate
          </Text>
          <Text fontSize={10} fontFamily='Inter'>
            {data.sender.currency} to {data.receiver.currency}
          </Text>

          {/* <Text mt={3} fontFamily='PoppinsSemiBold'>
            {data.receiver.account.name.split(' ')[0]} will receive
          </Text>
          <Text fontSize={10} fontFamily='Inter'>
            {data.receiver.currency}
          </Text> */}
        </Box>
        <Box className="ml-auto">
          <Text fontFamily='Poppins'>
            {data.exchangeRate1to2.toFixed(2)}
          </Text>

          {/* <Text mt={7} fontFamily='Poppins'>
            {data.conversion.toFixed(1)}
          </Text> */}
        </Box>
      </Container>
      <Box className="mx-12">
        {!processingInternationalPayment ? (
          <Button isLoading={loading} onPress={() => setValidatePin(true)} isDisabled={loading || processingInternationalPayment} mt={6} className='w-full' variant="solid">
            <Box className='flex flex-row'>
              <BadgeCheck className='self-center' size={20} stroke='white' />
              <Text className='text-white self-center ml-1.5' fontFamily="ProductSansBold">Pay {data.sender.currency} {data.amountInCurrency1}</Text>
            </Box>
          </Button>
        ) : !success ? (
          <Button mt={6} className='bg-gray-100 w-full' variant="solid">
            <Box className='flex flex-row'>
              <Spinner className='self-center mx-auto flex' size={20} color='green' />
            </Box>
          </Button>
        ) : (
          <Button mt={6} className='bg-gray-100 w-full' variant="solid">
            <Box className='flex flex-row'>
              <BadgeCheck className='self-center mx-auto flex' size={20} color='green' />
            </Box>
          </Button>
        )}
      </Box>

      <Modal isOpen={validatePin} onClose={() => {
        setPin(undefined)
        setValidatePin(false)
      }} size="lg">
        <Modal.Content maxH="500">
          <Modal.CloseButton />
          <Modal.Header className='flex flex-row'>
            <KeySquare size={12} stroke="black" className='self-center mr-2' />
            Account Verification
          </Modal.Header>
          <Modal.Body>
            <FormControl className='mb-2'>
              <FormControl.Label>
                <SquareAsterisk size={12} stroke="black" className='self-center mr-1' />
                Enter your Wallet PIN
              </FormControl.Label>
              <Input autoCapitalize='none' keyboardType='number-pad' value={pin} onChangeText={(n) => setPin(n)} />
            </FormControl>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => {
                setPin(undefined)
                setValidatePin(false)
              }}>
                Cancel
              </Button>
              <Button isLoading={loading} onPress={() => verifyPin()} variant="subtle" className='bg-gray-200' isDisabled={pin ? false : true}>
                <ShieldCheck size={16} stroke="black" className='self-center' />
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      <Toast />
    </>
  )
}