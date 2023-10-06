/* eslint-disable react-hooks/exhaustive-deps */
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom, useAtomValue } from "jotai"
import React, { useEffect } from "react"
import { AuthState } from "~/app/_layout"

export default function ProcessInternationalPayments() {
  const auth = useAtomValue(AuthState);
  const router = useRouter()
  const { id } = useLocalSearchParams();

  useEffect(() => {
    if (!auth) return router.push('/')
  }, [])

  if (!auth) return <></>

  return (
    <>

    </>
  )
}