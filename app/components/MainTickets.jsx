'use client'
import {useRouter} from 'next/navigation'
import React, {useState, useEffect} from 'react'
import Image from 'next/image'
import supabase from '../supabase'
import LoadingAnimation from './LoadingAnimation'

const MainTickets = () => {
    const router = useRouter();
    const [loadingFree, setLoadingFree] = useState(false);
    const [loadingPaid, setLoadingPaid] = useState(false);
    const [freeTickets, setFreeTickets] = useState([]);
    const [paidTickets, setPaidTickets] = useState([]);

    // FETCHING PAID TICKETS
    const fetchFreeTickets = async () => {
        setLoadingFree(true);
        try {
            let { data , error } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false })
            .eq('pricingType', 'free')

            if (error) {
                console.log('error fetching tickets');
            } else {
                setFreeTickets(data);
            }
        } catch(error) {
            console.error('main page error is:' + error)
        } finally {
            setLoadingFree(false);
        }
    }
    // FETCHING PAID TICKETS
    const fetchPaidTickets = async () => {
        setLoadingPaid(true);
        try {
            let { data , error } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false })
            .eq('pricingType', 'paid')

            if (error) {
                console.log('error fetching tickets');
            } else {
                setPaidTickets(data);
            }
        } catch(error) {
            console.error('main page error is:' + error)
        } finally {
            setLoadingPaid(false);
        }
    }
    useEffect(() => {
        fetchFreeTickets();
        fetchPaidTickets();
    }, []);

  return (
    <div>
        {/* FREE TICKETS */}

        <p className='mt-4 text-center font-bold text-[1.4rem]'>Free tickets</p>
        
        {
            loadingFree ? <LoadingAnimation /> : 
            ( freeTickets.length > 0 ? (
                <div className='flex w-[100%] overflow-x-auto  text-black p-3 '>
                {freeTickets.map((data) => (
                    <div key={data.id} className='flex-shrink-0 w-[17rem] md:w-[23rem] mr-3 border border-[#FFCOCB]  rounded-lg overflow-hidden hover:scale-105 transition cursor-pointer relative' onClick={() => {router.push(`events/${data.uuid}`)}}>
                        <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${data.user_id}_${data.image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[15rem] h-full' width={400} height={400}/>
                        <p className='text-[.9rem] absolute top-0 right-0 bg-[#FFCOCB] p-1 rounded-md'>{data.nops} left</p>
                        <div className='px-2 py-2'>
                        <p className='font-bold text-[1.1rem] uppercase'>{data.title}</p>
                        <p >{data.address}</p>
                        <div className='flex  justify-between mt-1'>
                            <p >{data.time}</p>
                            <p >{data.date}</p>
                        </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className='text-bold text-center animate-pulse text-[#1E1E1E] mt-3'>No Free tickets available</p>
            )
        )
        }
        {/* PAID TICKETS */}
        <p className='mt-4 text-center font-bold text-[1.4rem]'>Paid Tickets</p>
        {
            loadingPaid ? 
            <LoadingAnimation />
            : 
            ( paidTickets.length > 0 ? (
            <div className='flex justify-between w-[100%] overflow-x-auto  text-black p-3'>
                {paidTickets.map((data) => (
                    <div key={data.id} className='flex-shrink-0 w-[17rem] md:w-[23rem] mr-3 border border-[#FFCOCB]  rounded-lg overflow-hidden hover:scale-105 transition cursor-pointer relative' onClick={() => {router.push(`events/${data.uuid}`)}}>
                        <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${data.user_id}_${data.image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[15rem] h-full' width={400} height={400}/>
                        <p className='text-[.9rem] absolute top-0 right-0 bg-[#FFCOCB] p-1 rounded-md'>{data.nops} left</p>
                        <div className='px-2 py-2'>
                        <p className='font-bold text-[1.1rem] uppercase'>{data.title}</p>
                        <p >{data.address}</p>
                        <div className='flex  justify-between mt-1'>
                            <p >{data.time}</p>
                            <p >{data.date}</p>
                        </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className='text-bold text-center animate-pulse text-[#1E1E1E] mt-3'>No Paid tickets available</p>
            )
        )
        }
    </div>
  )
}

export default MainTickets