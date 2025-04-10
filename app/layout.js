import './globals.css'
import NavBar from './components/Navbar'
import Footer from './components/Footer'
import { Providers } from './globalRedux/Provider'
import { MyContextProvider } from './context/createContext'
import { Analytics } from "@vercel/analytics/react"
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify'

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
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Analytics />
        <Footer />
        </Providers>
        </MyContextProvider>
        </body>
    </html>
  )
}
