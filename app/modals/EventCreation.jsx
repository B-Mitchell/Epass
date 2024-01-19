import React from 'react'
import { useMyContext } from '../context/createContext'
import { useRouter } from 'next/navigation';

const EventCreation = () => {
    const { createEventModal, setCreateEventModal } = useMyContext();
    const router = useRouter();
  return (
    <div >
        <div className='bg-black fixed inset-0 items-center z-50 bg-opacity-50' >
        <div className='bg-white rounded-[2rem] md:w-[50%] w-[80%] m-auto md:mt-[15%] mt-[40%] p-4 border border-[#E0BFB8]'>
            <button className='p-2 rounded-[1rem] block text-right hover:scale-110 transition ml-auto text-[#A0A4A8]' onClick={() => {setCreateEventModal(!createEventModal)}}>X</button>

            <div className='w-[100%] text-center p-2'>
                <h2 className='font-bold text-[1.5rem]'>Event Creation Successful!</h2>
            </div>

            <div className='flex justify-between w-[100%] pb-2'>
                <button className='hover:bg-[#E0BFB8] w-[100%] block mt-7 p-2 border border-[#E0BFB8] transition rounded-2xl hover:text-white hover:scale-110 mr-2' onClick={() => router.push('/profile')}>back to profile</button>
                <button className='hover:bg-[#E0BFB8] w-[100%] block mt-7 p-2 border border-[#E0BFB8] transition rounded-2xl hover:text-white hover:scale-110 ml-2' onClick={() => setCreateEventModal(!createEventModal)}>create another event</button>
            </div>

        </div>
       
    </div>
    </div>
  )
}

export default EventCreation