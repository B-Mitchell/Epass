'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import heroImage from '../public/images/hero-image.png'
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
    <main >

      <div className='bg-[#FFCOCB] md:flex block pt-6 pb-3' >
            <div  className='md:pl-[4rem] pl-[.5rem] md:w-[70%] w-[100%]'>
                <h1 className='text-[2.5rem] font-bold text-[#1E1E1E]'>EVENTS<br /> HAVE NEVER BEEN<br /> EASIER TO FIND &<br /> ATTEND.</h1>
                <p className='text-[#6F624A] text-[1rem] font-semibold lg:mt-6 mb-4'>E-Pass is a website for purchasing event tickets for trips throughout Africa.Organize events live or virtual sell tickets, and accept money using a mobile device.</p>
                <div  className='lg:mt-10 md:mb-2 '>
                    <button  className='bg-[#6F624A] text-white rounded-[1rem] p-3 hover:bg-transparent hover:text-[#6F624A] border-[.15rem] hover:border-[#6F624A] transition'>Learn More</button>

                    <button className=' text-[#6F624A] border-[.15rem] border-[#6F624A] hover:text-white hover:bg-[#6F624A] rounded-[1rem] p-3 ml-4 transition' onClick={() => handleCreateEvent()}>Create Event</button>
                </div>

            </div>

            <div className='relative w-[30%] md:flex hidden'>
                <Image className='w-[100%] h-[100%]' src={heroImage} alt='hero Image' />

                <div >
                    <p className='absolute top-0 left-2 bg-[#D9D9D9A6] rounded-[2rem] p-2 animate-bounce'>PROMOTE YOUR EVENT<br /> on the map</p>
                    <p className='absolute top-28 right-4 bg-[#D9D9D9A6] rounded-[2rem] p-2'>CREATE AN EVENT<br /> Host your event</p>
                    <p className='absolute bottom-20 right-2 bg-[#D9D9D9A6] rounded-[2rem] p-2 animate-bounce'>FIND EVENTS<br /> far and near</p>
                    <p className='absolute bottom-4 left-2 bg-[#D9D9D9A6] rounded-[2rem] p-2'>SELL YOUR TICKETS<br />Exclusive sales</p>
                </div>
            </div>
        </div>
      
      <section className='bg-white'>
      <div className='flex justify-between mt-3 mb-3'>
                <p className='border-l-4 border-solid border-[#6F624A] pl-3'>Today's Schedule</p>
                <p className='flex'><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 35 35" fill="none"><path d="M10.1212 2.91669C10.7278 2.91669 11.2193 3.38919 11.2193 3.97252V6.10169C12.1935 6.08419 13.2857 6.08419 14.5151 6.08419H20.3703C21.5982 6.08419 22.6905 6.08419 23.6647 6.10315V3.97398C23.6647 3.39065 24.1562 2.91669 24.7628 2.91669C25.3695 2.91669 25.861 3.38919 25.861 3.97252V6.19794C27.9682 6.35981 29.3522 6.75794 30.3672 7.73648C31.3851 8.71356 31.7993 10.0436 31.967 12.0706L32.0837 13.125H2.91699V12.0692C3.08616 10.0421 3.50033 8.7121 4.51678 7.73502C5.53324 6.75794 6.91574 6.35835 9.02303 6.19648V3.97252C9.02303 3.38919 9.51449 2.91669 10.1212 2.91669Z" fill="#6F624A"/><path opacity="0.5" d="M32.0831 20.4167V17.5C32.0831 16.2765 32.0773 14.0948 32.0583 13.125H2.93104C2.91208 14.0948 2.91645 16.2765 2.91645 17.5V20.4167C2.91645 25.916 2.91645 28.6665 4.62562 30.3742C6.33333 32.0833 9.08229 32.0833 14.5831 32.0833H20.4165C25.9144 32.0833 28.6648 32.0833 30.374 30.3742C32.0831 28.6665 32.0831 25.916 32.0831 20.4167Z" fill="#6F624A"/>
<path d="M26.25 24.7917C26.25 25.1784 26.0964 25.5494 25.8229 25.8229C25.5494 26.0964 25.1784 26.25 24.7917 26.25C24.4049 26.25 24.034 26.0964 23.7605 25.8229C23.487 25.5494 23.3333 25.1784 23.3333 24.7917C23.3333 24.4049 23.487 24.034 23.7605 23.7605C24.034 23.487 24.4049 23.3333 24.7917 23.3333C25.1784 23.3333 25.5494 23.487 25.8229 23.7605C26.0964 24.034 26.25 24.4049 26.25 24.7917ZM26.25 18.9583C26.25 19.3451 26.0964 19.716 25.8229 19.9895C25.5494 20.263 25.1784 20.4167 24.7917 20.4167C24.4049 20.4167 24.034 20.263 23.7605 19.9895C23.487 19.716 23.3333 19.3451 23.3333 18.9583C23.3333 18.5716 23.487 18.2006 23.7605 17.9271C24.034 17.6536 24.4049 17.5 24.7917 17.5C25.1784 17.5 25.5494 17.6536 25.8229 17.9271C26.0964 18.2006 26.25 18.5716 26.25 18.9583ZM18.9583 24.7917C18.9583 25.1784 18.8047 25.5494 18.5312 25.8229C18.2577 26.0964 17.8868 26.25 17.5 26.25C17.1132 26.25 16.7423 26.0964 16.4688 25.8229C16.1953 25.5494 16.0417 25.1784 16.0417 24.7917C16.0417 24.4049 16.1953 24.034 16.4688 23.7605C16.7423 23.487 17.1132 23.3333 17.5 23.3333C17.8868 23.3333 18.2577 23.487 18.5312 23.7605C18.8047 24.034 18.9583 24.4049 18.9583 24.7917ZM18.9583 18.9583C18.9583 19.3451 18.8047 19.716 18.5312 19.9895C18.2577 20.263 17.8868 20.4167 17.5 20.4167C17.1132 20.4167 16.7423 20.263 16.4688 19.9895C16.1953 19.716 16.0417 19.3451 16.0417 18.9583C16.0417 18.5716 16.1953 18.2006 16.4688 17.9271C16.7423 17.6536 17.1132 17.5 17.5 17.5C17.8868 17.5 18.2577 17.6536 18.5312 17.9271C18.8047 18.2006 18.9583 18.5716 18.9583 18.9583ZM11.6667 24.7917C11.6667 25.1784 11.513 25.5494 11.2395 25.8229C10.966 26.0964 10.5951 26.25 10.2083 26.25C9.82156 26.25 9.45063 26.0964 9.17714 25.8229C8.90365 25.5494 8.75 25.1784 8.75 24.7917C8.75 24.4049 8.90365 24.034 9.17714 23.7605C9.45063 23.487 9.82156 23.3333 10.2083 23.3333C10.5951 23.3333 10.966 23.487 11.2395 23.7605C11.513 24.034 11.6667 24.4049 11.6667 24.7917ZM11.6667 18.9583C11.6667 19.3451 11.513 19.716 11.2395 19.9895C10.966 20.263 10.5951 20.4167 10.2083 20.4167C9.82156 20.4167 9.45063 20.263 9.17714 19.9895C8.90365 19.716 8.75 19.3451 8.75 18.9583C8.75 18.5716 8.90365 18.2006 9.17714 17.9271C9.45063 17.6536 9.82156 17.5 10.2083 17.5C10.5951 17.5 10.966 17.6536 11.2395 17.9271C11.513 18.2006 11.6667 18.5716 11.6667 18.9583Z" fill="#6F624A"/>
                </svg>{currentDate.toDateString()}</p>
            </div>
        <MainTickets />
      </section>
      
    </main>
  )
}
