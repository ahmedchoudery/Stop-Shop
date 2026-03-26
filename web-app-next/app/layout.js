import './globals.css'
import Header from './components/Header'
import { CurrencyProvider } from './context/CurrencyContext'
import { CartBackendProvider } from './context/CartBackendProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Stop Shop</title>
      </head>
      <body>
        <CurrencyProvider>
          <CartBackendProvider>
          <Header />
          <main>{children}</main>
          </CartBackendProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
