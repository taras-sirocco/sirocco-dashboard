import React from 'react'
import { Manrope } from 'next/font/google'

import './styles.css'

// next/font замість <link> на Google Fonts з прототипів: шрифт
// самохоститься і кешується сервіс-воркером офлайн-першого PWA, а не
// тягнеться з мережі щоразу.
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata = {
  title: 'Sirocco',
  description: 'Sirocco Energy — планшетний застосунок складальної дільниці',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="uk" className={manrope.variable}>
      <body>{children}</body>
    </html>
  )
}
