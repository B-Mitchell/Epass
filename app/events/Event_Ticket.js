import React from 'react'
import Image from 'next/image';
import { useRouter } from 'next/navigation'

const Event_Ticket = (props) => {
    const router = useRouter();
    const { user_id, address, time, date , title, image, typeOfEvent, price, uuid } = props.data
  return (
    // <div className='w-[100%] border border-[#E0BFB8] md:flex block p-4 rounded-3xl mt-4 cursor-pointer relative transition shadow-md hover:shadow-black' >
    //     <div className='md:w-[40%] w-[100%] h-[15rem] bg-black rounded-t-3xl overflow-hidden md:relative z-0'>
    //         <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${user_id}_${image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[15rem] h-full' width={400} height={400}/>
    //     </div>
    //     <p className='font-bold text-[1.5rem] md:hidden'>{title}</p>
    //     <div className='md:ml-4 ml-0 md:block flex justify-between'>
    //         <div >
    //         <p className='font-bold text-[1.5rem] md:block hidden '>{title}</p>
    //           <p className=' border border-[#E0BFB8] w-fit p-1 rounded-md text-[#E0BFB8] font-bold'>{typeOfEvent}</p>
    //           <p className='mt-1'>{address}</p>
    //           <p className='mt-1'>{time}</p>
    //           <p className='mt-1'>{date}</p>
    //           <p className='font-bold text-[1rem]'>NGN {price}</p>
    //         </div>

    //         <div className='relative lg:mt-4 md:block flex md:items-start items-end'>
    //           <button className='md:absolute  bg-[#E0BFB8] text-white md:p-1 p-3 rounded-lg hover:scale-110 transition' onClick={() => {router.push(`events/${uuid}`)}}>View Ticket details</button>
    //         </div>
    //     </div>
    // </div>
    
    <div  className='w-[100%] h-[27rem] md:w-[23rem] border border-[#E0BFB8]  rounded-lg overflow-hidden hover:scale-105 transition cursor-pointer' onClick={() => {router.push(`events/${uuid}`)}}>
      <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${user_id}_${image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[15rem] h-full' width={400} height={400}/>
      <div className='px-2 py-2'>
        <p className='font-bold text-[1.1rem] uppercase'>{title}</p>
        <p className=' border border-[#E0BFB8] w-fit p-1 rounded-md text-[#E0BFB8] font-bold'>{typeOfEvent}</p>
        <p className='text-[.9rem] w-[9rem] whitespace-nowrap overflow-ellipsis'>{address}</p>
        <p >NGN{price}</p>
        <div className='flex  justify-between mt-1'>
          <p className='text-[.9rem]'>{time}</p>
          <p className='text-[.9rem]'>{date}</p>
        </div>
      </div>
    </div>
  )
}

export default Event_Ticket