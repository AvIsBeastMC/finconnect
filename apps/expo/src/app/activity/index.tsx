/* eslint-disable */
import { Tabs as ExpoTab, useLocalSearchParams, useRouter } from "expo-router";
import { useAtom, useAtomValue } from "jotai"
import Toast from "react-native-toast-message";
import { AuthState } from "~/app/_layout"
import { api } from "~/utils/api";

export default function AccountActivity() {
  const [auth, setAuth] = useAtom(AuthState)
  const router = useRouter();


  return (
    <>

    </>
  )
}