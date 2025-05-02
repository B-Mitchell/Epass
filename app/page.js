'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import heroImage from '../public/images/epasslanding.png'
import MainTickets from './components/MainTickets'
import { useState, useEffect } from 'react'

export default function Home() {
  const router = useRouter();
  const userId = useSelector(state => state.user.user_id);
  const [isVisible, setIsVisible] = useState(false);

  const handleCreateEvent = () => {
    if (!userId) {
      alert('login to your account.')
      router.push('/login');
    } else {
      router.push('/profile/createEvent');
    }
  }

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main>
      <div className='relative overflow-hidden bg-gradient-to-br from-white via-pink-50 to-white'>
        {/* Simplified decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -bottom-[50px] left-[15%] w-[250px] h-[250px] rounded-full bg-[#FFC0CB]/30 blur-[70px] opacity-60"></div>
        </div>

        <div className='container mx-auto px-4 py-8 md:py-12 relative z-10'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8'>
            
            {/* Text content - simplified */}
            <div className={`w-full md:w-1/2 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E1E1E] leading-tight mb-4'>
                <span className="block">Discover & Attend</span>
                <span className="relative">
                  Events With Ease
                  <svg className="absolute -bottom-2 left-0 w-full h-2 text-[#FFC0CB]/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 15" preserveAspectRatio="none">
                    <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="6" />
                  </svg>
                </span>
              </h1>
              
              <p className='text-base md:text-lg text-gray-600 mb-6'>
                Your one-stop platform for discovering, purchasing, and organizing event tickets across Africa.
              </p>
              
              {/* Buttons always side by side */}
              <div className='flex flex-row gap-4'>
                <button 
                  onClick={() => router.push('/about')}
                  className='px-4 py-2 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white font-medium rounded-xl transition-all'
                >
                  Learn More
                </button>
                <button 
                  onClick={handleCreateEvent}
                  className='px-4 py-2 bg-white hover:bg-[#FFC0CB]/10 text-[#8B5E3C] font-medium border border-[#8B5E3C] rounded-xl transition-all'
                >
                  Create Event
                </button>
              </div>
            </div>
            
            {/* Image container - simplified */}
            <div className={`relative w-full md:w-[45%] mt-6 md:mt-0 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="relative rounded-xl overflow-hidden border-0 ">
                <div className="w-full h-[300px] md:h-[400px]">
            <Image 
                    className='w-full h-full object-cover' 
              src={heroImage} 
                    alt='E-Pass event ticketing platform' 
              priority 
            />
                </div>
              </div>
              
              {/* Single floating element for visual interest */}
              <div className="absolute -bottom-3 -right-3 bg-white rounded-lg shadow p-2 hidden md:block">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs font-medium">Live Events</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className='bg-white'>
        <MainTickets />
      </section>
    </main>
  )
}
