import React from 'react'
import Image from 'next/image';
import { useRouter } from 'next/navigation'

const Event_Ticket = (props) => {
    const router = useRouter();
    const { user_id, address, startTime, date , title, image, typeOfEvent, price, uuid } = props.data;
    
  return (
    <div  className='w-[100%] h-auto md:w-[23rem] border border-[#FFCOCB]  rounded-lg overflow-hidden hover:scale-105 transition cursor-pointer relative' onClick={() => {router.push(`events/${uuid}`)}}>

      <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${user_id}_${image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[11rem] h-full' width={400} height={400}/>

      <div className='px-2 py-2'>
        <h2 className='font-bold text-[1.1rem] uppercase overflow-hidden whitespace-nowrap text-ellipsis'>{title}</h2>
        <p className=' border border-[#FFCOCB] w-fit p-1 rounded-md text-[#FFCOCB] font-bold'>{typeOfEvent}</p>
        
        <p className='text-[.9rem] w-[9rem] overflow-hidden whitespace-nowrap overflow-ellipsis '>{address}</p>
        
        <div className='flex  justify-between mt-1'>
          <p className='text-[.9rem]'>{startTime}</p>
          <p className='text-[.9rem]'>{date}</p>
        </div>

      </div>

    </div>
  )
}

export default Event_Ticket