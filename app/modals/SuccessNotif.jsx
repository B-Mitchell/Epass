import React from 'react'
import { useMyContext } from '../context/createContext'
import { useRouter } from 'next/navigation';

const SuccessNotif = () => {
    const { accountCreation, setAccountCreation } = useMyContext();
    const router = useRouter();
  return (
    <div >
        <div className='bg-black fixed inset-0 items-center z-50 bg-opacity-50' >
        <div className='bg-white rounded-[2rem] md:w-[50%] w-[80%] m-auto md:mt-[15%] mt-[40%] p-4 border border-[#E0BFB8]'>
            <button className='p-2 rounded-[1rem] block text-right hover:scale-110 transition ml-auto text-[#A0A4A8]' onClick={() => {setAccountCreation(!accountCreation)}}>X</button>

            <div className='w-[100%] text-center p-2'>
                <h2 className='font-bold text-[1.5rem]'>Account created successfully!</h2>
            </div>

            <div className='w-[80%] pb-2 m-auto'>
                <button className='hover:bg-[#E0BFB8] w-[80%] block mt-7 p-2 m-auto border border-[#E0BFB8] transition rounded-2xl hover:text-white hover:scale-105' onClick={() => {router.push('/profile'); setAccountCreation(!accountCreation)}}>go to login</button>
            </div>

        </div>
       
    </div>
    </div>
  )
}

export default SuccessNotif
