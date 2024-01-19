import './globals.css'
import NavBar from './components/Navbar'
import { Providers } from './globalRedux/Provider'
import { MyContextProvider } from './context/createContext'

export const metadata = {
  title: 'Epass',
  description: 'Your favourite ticket app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MyContextProvider >
      <Providers >
        <NavBar />
        {children}
        </Providers>
        </MyContextProvider>
        </body>
    </html>
  )
}
