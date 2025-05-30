'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import heroImage from '../public/images/epasslanding.png'
import MainTickets from './components/MainTickets'
import { useState, useEffect } from 'react'
import { FaStar, FaCalendarAlt, FaUsers, FaMapMarkerAlt, FaArrowRight, FaGlobe, FaShieldAlt, FaBolt } from 'react-icons/fa'
import { IoSparkles } from 'react-icons/io5'

export default function Home() {
  const router = useRouter();
  const userId = useSelector(state => state.user.user_id);
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

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
    
    // Auto-cycle through features
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: FaGlobe, title: "Global Reach", desc: "Events across Africa" },
    { icon: FaShieldAlt, title: "Secure Payment", desc: "Safe transactions" },
    { icon: FaBolt, title: "Instant Booking", desc: "Quick & easy tickets" }
  ];

  const stats = [
    { number: "8K+", label: "Events Hosted" },
    { number: "50k+", label: "Tickets Sold" },
    { number: "5+", label: "Countries" },
    { number: "98%", label: "Happy Customers" }
  ];

  return (
    <main>
      {/* Enhanced Hero Section */}
      <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-pink-50 to-white'>
        {/* Enhanced decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {/* Your original pink blur element */}
          <div className="absolute -bottom-[50px] left-[15%] w-[250px] h-[250px] rounded-full bg-[#FFC0CB]/30 blur-[70px] opacity-60"></div>
          
          {/* Additional animated floating shapes */}
          <div className="absolute top-20 right-[20%] w-20 h-20 bg-[#FFC0CB]/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 left-[10%] w-16 h-16 bg-[#FFC0CB]/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-40 right-[30%] w-24 h-24 bg-[#FFC0CB]/20 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Large gradient orbs */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-[#FFC0CB]/20 to-black/10 rounded-full blur-3xl"></div>
        </div>

        <div className='container mx-auto px-4 py-12 md:py-20 relative z-10'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12'>
            
            {/* Enhanced Text content */}
            <div className={`w-full md:w-1/2 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-[#FFC0CB]/30">
                <IoSparkles className="w-4 h-4 text-[#FFC0CB]" />
                <span className="text-sm font-medium text-gray-700">#Top rated Event Platform</span>
              </div>
              
              <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E1E1E] leading-tight mb-4'>
                <span className="block">Discover & Attend</span>
                <span className="relative">
                  Events With Ease
                  <svg className="absolute -bottom-2 left-0 w-full h-2 text-[#FFC0CB]/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 15" preserveAspectRatio="none">
                    <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="6" />
                  </svg>
                </span>
              </h1>
              
              <p className='text-base md:text-lg text-gray-600 mb-8'>
                Your one-stop platform for discovering, purchasing, and organizing event tickets across Africa.
              </p>
              
              {/* Enhanced Buttons with your colors */}
              <div className='flex flex-col sm:flex-row gap-4 mb-8'>
                <button 
                  onClick={() => router.push('/about')}
                  className='group px-6 py-3 bg-gradient-to-r from-[#FFC0CB] to-black hover:from-black hover:to-[#FFC0CB] text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                >
                  <span className="flex items-center gap-2">
                    Learn More
                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button 
                  onClick={handleCreateEvent}
                  className='px-6 py-3 bg-white hover:bg-[#FFC0CB]/10 text-[#8B5E3C] font-medium border border-[#8B5E3C] hover:border-[#FFC0CB] rounded-xl transition-all duration-300 shadow-sm hover:shadow-md'
                >
                  Create Event
                </button>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all duration-500 ${
                      activeFeature === index 
                        ? 'bg-white/80 backdrop-blur-sm shadow-lg transform scale-105 border border-[#FFC0CB]/30' 
                        : 'bg-white/40 backdrop-blur-sm'
                    }`}
                  >
                    <feature.icon className={`w-6 h-6 mb-2 ${activeFeature === index ? 'text-[#FFC0CB]' : 'text-gray-500'}`} />
                    <h3 className="font-semibold text-xs text-gray-700">{feature.title}</h3>
                    <p className="text-xs text-gray-500 text-center">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Enhanced Image container with your original image */}
            <div className={`relative w-full md:w-[45%] mt-6 md:mt-0 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="relative">
                {/* Enhanced container for your original image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#FFC0CB]/20 backdrop-blur-sm">
                  <div className="w-full h-[300px] md:h-[400px] relative">
                    <Image 
                      className='w-full h-full object-cover' 
                      src={heroImage} 
                      alt='E-Pass event ticketing platform' 
                      priority 
                    />
                    {/* Overlay for better text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    
                    {/* Featured badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-sm font-semibold text-[#FFC0CB]">Featured</span>
                    </div>
                    
                    {/* Star badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <FaStar className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                </div>

                {/* Enhanced floating element with your original styling */}
                <div className="absolute -bottom-3 -right-3 bg-white rounded-lg shadow-lg p-3 border border-[#FFC0CB]/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Live Events</p>
                      <p className="text-xs text-gray-500">Updated real-time</p>
                    </div>
                  </div>
                </div>

                {/* Additional floating stats card */}
                {/* <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-[#FFC0CB]/20 backdrop-blur-sm hidden md:block">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#FFC0CB]">8K+</p>
                    <p className="text-xs text-gray-500">Events</p>
                  </div>
                </div> */} 
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {/* <div className="absolute hidden md:block bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-[#FFC0CB]/20">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-[#1E1E1E]">{stat.number}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>

      {/*mobile view */}
      {/* <div className="bg-white/80 backdrop-blur-sm border-t border-[#FFC0CB]/20 block md:hidden">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-[#1E1E1E]">{stat.number}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div> */}

      {/* Your original MainTickets section */}
      <section className='bg-white'>
        <MainTickets />
      </section>
    </main>
  )
}
