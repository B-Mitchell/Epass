import React from 'react'
import Image from 'next/image';

const ProfileTickets = (props) => {
    const { user_id, address, time, date , title, image, typeOfEvent, price } = props.data;
  return (
    <div className='w-[100%] border border-[#E0BFB8] md:flex block p-4 rounded-3xl mt-4'>
        <div className='md:w-[40%] w-[100%] bg-black'>
            <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${user_id}_${image}`} alt='event image' className='w-[100%] min-h-[10rem] h-full' width={400} height={400}/>
        </div>

        <div className='md:ml-4 ml-0'>
            <p className='font-bold text-[1.5rem] '>{title}</p>
            <p className='bg-[#E0BFB8] w-fit p-1 rounded-md text-white font-bold'>{typeOfEvent}</p>
            <p className='mt-1'>{address}</p>
            <p className='mt-1'>{time}</p>
            <p className='mt-1'>{date}</p>
            <p className='mt-1 font-bold text-[1.2rem]'>NGN {price}</p>
        </div>

    </div>
  )
}

export default ProfileTickets