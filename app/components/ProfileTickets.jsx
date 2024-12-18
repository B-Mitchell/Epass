import React from 'react'
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const ProfileTickets = (props) => {
  const router = useRouter();
  const { user_id, address, startTime, date , title, image, typeOfEvent, uuid} = props.data;
  return (
    
    <div className='w-[100%] h-auto pb-1 md:w-[23rem] border border-[#FFC0CB] rounded-lg overflow-hidden hover:scale-105 transition cursor-pointer relative' onClick={() => {router.push(`events/${uuid}`)}}>
  <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${user_id}_${image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[10rem] h-full' width={400} height={400}/>
  <div className='px-2 py-2'>
    <h2 className='font-bold text-[1.1rem] uppercase overflow-hidden whitespace-nowrap text-ellipsis'>{title}</h2>
    <p className='border border-[#FFC0CB] w-fit p-1 rounded-md text-[#FFC0CB] font-bold'>{typeOfEvent}</p>
    <p className='text-[.9rem] overflow-hidden whitespace-nowrap text-ellipsis'>{address}</p>
    
    
    <div className='flex justify-between mt-1'>
      <p className='text-[.9rem]'>{startTime}</p>
      <p className='text-[.9rem]'>{date}</p>
    </div>
  </div>
</div>

  )
}

export default ProfileTickets