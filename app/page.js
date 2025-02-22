'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import heroImage from '../public/images/epasslanding.png'
import MainTickets from './components/MainTickets'

export default function Home() {
  const router = useRouter();
  const userId = useSelector(state => state.user.user_id);
  const handleCreateEvent = () => {
    if (!userId) {
      alert('login to your account.')
      router.push('/login');
    } else {
      router.push('/profile/createEvent');
    }
  }
  const currentDate = new Date();
  return (
    <main>
      <div className='hero bg-white flex flex-wrap md:flex-nowrap pt-5 md:pt-12 md:pb-4'>
        <div className='md:pl-[4rem] pl-[1rem] md:w-[60%] w-[100%] text-left md:text-left'>
          <h1 className='md:text-[2.5rem] text-[1.75rem] font-bold text-[#1E1E1E] leading-normal md:leading-normal mt-4 md:mt-6'>DISCOVER & <br/>ATTEND<br /> EVENTS WITH EASE</h1>
          <p className='text-[#8B5E3C] md:text-[1rem] text-[0.875rem] font-semibold lg:mt-6 mb-4 leading-tight md:leading-normal'>E-Pass is a website for purchasing, organizing and selling event tickets <br/>throughout Africa using a mobile device.</p>
          <div className='lg:mt-10 md:mb-2'>
            <button className='bg-[#8B5E3C] text-white rounded-[1rem] p-3 hover:bg-transparent hover:text-[#8B5E3C] border-[.15rem] hover:border-[#8B5E3C] transition text-sm md:text-base'>Learn More</button>
            <button className='text-[#8B5E3C] border-[.15rem] border-[#8B5E3C] hover:text-white hover:bg-[#8B5E3C] rounded-[1rem] p-3 ml-4 transition text-sm md:text-base' onClick={() => handleCreateEvent()}>Create Event</button>
          </div>
        </div>

        {/* Adjusting the image container to maintain quality */}
        <div className='relative h-[300px] mb-3 w-full md:w-[30%] lg:w-[35%] mt-6 md:mt-0'>
          <div className='w-full h-[300px] md:h-[450px]'>
            <Image 
              className='w-full h-full object-contain' 
              src={heroImage} 
              alt='hero Image' 
              priority 
            />
          </div>
        </div>
      </div>

      {/* Slight negative margin to bring next section into view */}
      <section className='bg-white mt-[-10px]'>
        <MainTickets />
      </section>
    </main>
  )
}
