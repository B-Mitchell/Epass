import React from 'react'
import Image from 'next/image';
import { useRouter } from 'next/navigation'

const Event_Ticket = (props) => {
    const router = useRouter();
    const { user_id, address, time, date , title, image, typeOfEvent, price, uuid } = props.data
  return (
    <div className='w-[100%] border border-[#E0BFB8] md:flex block p-4 rounded-3xl mt-4 cursor-pointer relative' onClick={() => {router.push(`events/${uuid}`)}}>
        <div className='md:w-[40%] w-[100%] h-[15rem] bg-black rounded-t-3xl overflow-hidden md:relative'>
            <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${user_id}_${image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[15rem] h-full' width={400} height={400}/>
        </div>

        <div className='md:ml-4 ml-0'>
            <p className='font-bold text-[1.5rem] '>{title}</p>
            <p className='bg-[#E0BFB8] w-fit p-1 rounded-md text-white font-bold'>{typeOfEvent}</p>
            <p className='mt-1'>{address}</p>
            <p className='mt-1'>{time}</p>
            <p className='mt-1'>{date}</p>
            <p className='mt-1 font-bold text-[1.2rem] md:absolute md:bottom-3'>NGN {price}</p>
        </div>

    </div>
  )
}

export default Event_Ticket