import { api } from "~/utils/api"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Head from "next/head"
import { Inter } from 'next/font/google';
import cn from 'classnames'

const InterFont = Inter({
  weight: '500',
  subsets: ['latin']
})

const InterBold = Inter({
  weight: '700',
  subsets: ['latin']
})

export default function HomePage() {
  const { data, error } = api.general.getPrivacyPolicy.useQuery()

  if (error) return <h1 className={cn(InterBold.className, "text-center pt-4 text-xl text-red-500")}>An Error Occurred: {error.message}</h1>

  if (!data) return <h1 className={cn(InterBold.className, "text-center pt-4 text-xl")}>Please wait...</h1>

  return (
    <>
      <Head>
        <title>Privacy Policy - FinConnect - App owned and managed by Individual - Arunnya Varma</title>
        <link rel="shortcut icon" href="/icon.png" type="image/x-icon" />
      </Head>
      <div className="flex mx-auto justify-center">
        <div className={cn(InterFont.className, "px-6 py-4 w-full flexcontainer prose prose-sm md:prose-md")}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{`${data}`}</ReactMarkdown>
        </div>
      </div>
    </>
  )
}