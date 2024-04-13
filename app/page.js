'use client'
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import heroImage from '../public/images/hero-image.png';
import MainTickets from './components/MainTickets';

export default function Home() {
  const router = useRouter();
  const userId = useSelector(state => state.user.user_id);

  const handleCreateEvent = () => {
    if (!userId) {
      alert('Login to your account.');
      router.push('/login');
    } else {
      router.push('/profile/createEvent');
    }
  };

  return (
    <main>
      <div className='bg-[#E0BFB8] md:flex block pt-6 pb-3'>
        <div className='md:pl-[4rem] pl-[.5rem] md:w-[70%] w-full'>
          <h1 className='text-[2.5rem] font-bold text-[#1E1E1E] md:text-[1.8rem] lg:text-[2.5rem] xl:text-[3rem]'>
            EVENTS <br className="md:hidden" />
            <span className='md:inline-block md:mt-0 md:mb-0 hidden'>HAVE NEVER BEEN</span>
            <span className='md:hidden mt-0 mb-0'>HAVE NEVER BEEN</span><br className="md:hidden" />
            EASIER TO FIND &<br />
            ATTEND.
          </h1>
          <p className='text-[#6F624A] text-[1rem] font-semibold lg:mt-6 mb-4'>E-Pass is a website for purchasing,organising,selling and promoting event tickets for trips throughout Africa. </p>
          <div className='lg:mt-10 md:mb-2'>
            <button className='bg-[#6F624A] text-white rounded-[1rem] p-3 hover:bg-transparent hover:text-[#6F624A] border-[.15rem] hover:border-[#6F624A] transition'>Learn More</button>
            <button className='text-[#6F624A] border-[.15rem] border-[#6F624A] hover:text-white hover:bg-[#6F624A] rounded-[1rem] p-3 ml-4 transition' onClick={() => handleCreateEvent()}>Create Event</button>
          </div>
        </div>

        <div className='relative w-full md:w-[30%] md:flex'>
          <Image className='w-full h-auto md:w-auto md:h-auto' src={heroImage} alt='hero Image' />
          <div>
            <p className='absolute top-0 left-2 bg-[#D9D9D9A6] rounded-[2rem] p-2 animate-bounce'>PROMOTE YOUR EVENT<br /> on the map</p>
            <p className='absolute top-28 right-4 bg-[#D9D9D9A6] rounded-[2rem] p-2'>CREATE AN EVENT<br /> Host your event</p>
            <p className='absolute bottom-20 right-2 bg-[#D9D9D9A6] rounded-[2rem] p-2 animate-bounce'>FIND EVENTS<br /> far and near</p>
            <p className='absolute bottom-4 left-2 bg-[#D9D9D9A6] rounded-[2rem] p-2'>SELL YOUR TICKETS<br />Exclusive sales</p>
          </div>
        </div>
      </div>

      <section className='bg-white'>
        <MainTickets />
      </section>
    </main>
  )
}
