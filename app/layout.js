import './globals.css'
import NavBar from './components/Navbar'
import Footer from './components/Footer'
import { Providers } from './globalRedux/Provider'
import { MyContextProvider } from './context/createContext'

export const metadata = {
  title: 'Epass',
  description: 'Your favourite ticket app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className=''>
        <MyContextProvider >
      <Providers >
        <NavBar />
        {children}
        <Footer />
        </Providers>
        </MyContextProvider>
        </body>
    </html>
  )
}
