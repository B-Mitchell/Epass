import './globals.css'
import NavBar from './components/Navbar'
import Footer from './components/Footer'
import { Providers } from './globalRedux/Provider'
import { MyContextProvider } from './context/createContext'
import { Analytics } from "@vercel/analytics/react"
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify'
import FloatingTickets from './components/floatingTickets'

export const metadata = {
  title: 'Epass',
  description: 'Your favourite ticket app',
  openGraph: {
    title: 'Epass',
    description: 'Your favourite ticket app for discovering and buying event tickets.',
    url: 'https://www.e-pass.xyz/', // replace with your actual domain
    siteName: 'Epass',
    images: [
      {
        url: 'https://www.e-pass.xyz/Epass.png', // must be full URL
        width: 1200,
        height: 630,
        alt: 'Epass preview image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body >
        <MyContextProvider >
      <Providers >
        <NavBar />
        {children}
        <FloatingTickets />
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
