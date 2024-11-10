'use client'
import React, { useEffect, useState } from 'react'
import supabase from '@/app/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMyContext } from '@/app/context/createContext';

const page = ({params}) => {
    const {
        ticketPrice, 
        setTicketPrice , 
        setTicketRoute, 
        setImageSrc,
        setTicketTitle,
        setTicketDate,
        setTicketTime,
        setTicketAddress,
    } = useMyContext();
    const router = useRouter();
    // const route = decodeURIComponent(params.id);
    const route = params.id;
    const [loading, setLoading] = useState(false);
    const [fetchedData, setFetchedData] = useState();

    const fetchSpecificData = async () => {
        try {
            setLoading(true);
            let { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('uuid', route)

            if (error) {
                console.error(error);
                router.back();
            } else {
                console.log(data);
                setFetchedData(data);
            }
        } catch (err) {
            console.error('error is: ' + err);
        } finally {
            setLoading(false)
        }
    }
    const updateTicketPrice = () => {
        setTicketPrice(fetchedData?.[0] ?.price + 200 ?? 0)
        console.log(ticketPrice)
        console.log(typeof ticketPrice);
        // other data
        if (fetchedData) {
            setImageSrc(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${fetchedData[0].user_id}_${fetchedData[0].image}`);
            setTicketTitle(`${fetchedData[0].title}`);
            setTicketDate(`${fetchedData[0].date}`);
            setTicketTime(`${fetchedData[0].time}`);
            setTicketAddress(`${fetchedData[0].address}`);
        }

        
    }
    updateTicketPrice();
    
    
    useEffect(() => {
        setTicketRoute(route)
        fetchSpecificData();
    },[]);
  return (
    <div>
        <p className='text-center font-bold text-[1.4rem] my-4'>Event/Ticket Details</p>
        <p className={`text-center ${loading ? 'mt-10 mb-4' : null} font-bold italic`}>{ loading ? 'loading Checkout...' : null }</p>
        <div className='border border-[#FFCOCB] md:w-[90%] w-[95%] m-auto md:flex justify-between block'>
            <div >
            {fetchedData && fetchedData.length > 0 ? (
            <div className='p-2 m-2 md:w-[100%]'>
                <div className='md:w-[100%] w-[100%] h-[10rem] overflow-hidden md:relative'>
                    <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${fetchedData[0].user_id}_${fetchedData[0].image}`} alt='event image' className='w-fit min-h-[10rem] max-h-[15rem] h-full' width={400} height={400}/>
                </div>
                {/* <p className='font-bold text-[.7rem]'>ticket id: {fetchedData[0].uuid}</p> */}
                <p className='text-[1.2rem] my-2 font-bold'>{fetchedData[0].title}</p>
                <p className='text-[1rem] my-1'>Address: {fetchedData[0].address}</p>
                <p className='text-[1rem] my-1'>Time: {fetchedData[0].time}</p>
                <p className='text-[1rem] my-1'>Date: {fetchedData[0].date}</p>
                <p className='text-[1rem] my-1' >n0. of tickets available: {fetchedData[0].nops}</p>
                <p className='text-[1rem] my-1'>Type of Event: {fetchedData[0].typeOfEvent}</p>
                <p className='text-[1rem] my-1'>Price: {fetchedData ? (fetchedData[0].pricingType === 'free' ? 0 : fetchedData[0].price) : '...'}</p>
            </div>
            ) : (
                <p className='mt-4 text-center font-light italic block ml-4'>loading...</p>
            )}
            </div>

            <div className='border border-black m-2 md:w-[30%] p-3 relative min-h-[20rem]'>
                <p className='text-[1.2rem] my-2 font-bold text-center underline'>Checkout</p>

                <div className=' mt-5 flex justify-between'>
                    <p className='text-[1.2rem] my-1'>price: </p>
                    {/* <p>{fetchedData ? fetchedData[0].price : 'no data'}</p> */}
                    <p>{fetchedData ? (fetchedData[0].pricingType === 'free' ? 0 : fetchedData[0].price) : '...'}</p>
                </div>

                <div className=' mt-5 flex justify-between'>
                    <p  className='text-[1.2rem] my-1'>charge: </p>
                    <p>0</p>
                </div>

                <div className=' mt-5 flex justify-between  w-[90%] absolute bottom-0 border-t-8 border-black'>
                    <p  className='text-[1.2rem] my-1'>Total: </p>
                    {fetchedData && fetchedData.length > 0 ? <p>{ fetchedData ? (fetchedData[0].pricingType === 'free' ? 0 : fetchedData[0].price + 200) : '...'}</p> : null}
                </div>
            </div>

        </div>

        <button className='hover:bg-transparent bg-[#FFCOCB] w-[40%] md:w-[20%] block m-auto mt-7 p-2 py-3 border border-[#FFCOCB] transition rounded-2xl hover:text-black text-white mb-4 hover:scale-110 ' onClick={() => {router.push(`/events/${route}/contactForm`)}}>get ticket</button>
    </div>
  )
}

export default page