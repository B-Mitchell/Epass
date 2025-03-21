'use client'
import {useRouter} from 'next/navigation'
import React, {useState, useEffect} from 'react'
import Image from 'next/image'
import supabase from '../supabase'
import LoadingAnimation from './LoadingAnimation'
import { data } from 'autoprefixer'

const MainTickets = () => {
    const router = useRouter();
    const [loadingFree, setLoadingFree] = useState(false);
    const [loadingPaid, setLoadingPaid] = useState(false);
    const [freeTickets, setFreeTickets] = useState([]);
    const [paidTickets, setPaidTickets] = useState([]);

   
    // FETCHING FREE TICKETS
        const fetchFreeTickets = async () => {
            setLoadingFree(true);
            try {
                // Step 1: Fetch ticketdata with pricingType as 'free'
                let { data: ticketData, error: ticketError } = await supabase
                    .from('ticketdata')
                    .select('*')
                    .eq('pricingType', 'free');

                    console.log(data,'this is the data')
                if (ticketError) {
                    console.error('Error fetching ticket data:', ticketError);
                    return;
                }

                if (ticketData.length === 0) {
                    setFreeTickets([]);
                    return;
                }

                // Step 2: Get all eventIds from the fetched ticketData
                const eventIds = ticketData.map((ticket) => ticket.event_id);

                // Step 3: Fetch the corresponding events from the tickets table
                let { data: eventData, error: eventError } = await supabase
                    .from('tickets')
                    .select('*')
                    .in('uuid', eventIds)
                    .eq('publishEvent', true); // Fetch only events with matching .order('created_at', { ascending: false });

                    if (eventError) {
                        console.log('Error fetching event data:', eventError);
                        return;
                    }
            
                    // Set the eventData directly since you only want those events
                    setFreeTickets(eventData);
                    console.log(eventData)
                } catch (error) {
                    console.error('Main page error is:', error);
                } finally {
                    setLoadingFree(false);
                }
        };

    
   // FETCHING PAID TICKETS
        const fetchPaidTickets = async () => {
            setLoadingPaid(true);
            try {
                // Step 1: Fetch ticketdata with pricingType as 'paid'
                let { data: ticketData, error: ticketError } = await supabase
                    .from('ticketdata')
                    .select('*')
                    .eq('pricingType', 'paid');

                console.log(ticketData, 'this is the paid ticket data');
                if (ticketError) {
                    console.error('Error fetching ticket data:', ticketError);
                    return;
                }

                if (ticketData.length === 0) {
                    setPaidTickets([]);
                    return;
                }

                // Step 2: Get all eventIds from the fetched ticketData
                const eventIds = ticketData.map((ticket) => ticket.event_id);

                // Step 3: Fetch the corresponding events from the tickets table
                let { data: eventData, error: eventError } = await supabase
                    .from('tickets')
                    .select('*')
                    .in('uuid', eventIds)
                    .eq('publishEvent', true); // Fetch only events with matching eventIds

                if (eventError) {
                    console.error('Error fetching event data:', eventError);
                    return;
                }

                // Set the eventData directly since you only want those events
                setPaidTickets(eventData);
                console.log(eventData, 'this is the paid event data');
            } catch (error) {
                console.error('Main page error is:', error);
            } finally {
                setLoadingPaid(false);
            }
        };

    useEffect(() => {
        fetchFreeTickets();
        fetchPaidTickets();
    }, []);

  return (
    <div>
        {/* FREE TICKETS */}

        <p className='mt-6 text-center font-bold text-[1.4rem]'>
            
            🎟️Free tickets
        <span className='block w-[20%] h-[3px] bg-[#FFC0CB] mt-1 mx-auto'></span>
        </p>
        
        
        {
            loadingFree ? <LoadingAnimation /> : 
            ( freeTickets.length > 0 ? (
                <div className='flex w-[100%] overflow-x-auto text-black p-3 '>
                {freeTickets.map((data) => (
                    <div key={data.id} className='flex-shrink-0 w-[17rem] md:w-[23rem] mr-3 border border-[#FFC0CB]  rounded-lg overflow-hidden hover:scale-105 transition cursor-pointer relative' onClick={() => {router.push(`events/${data.uuid}`)}}>
                        <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${data.user_id}_${data.image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[15rem] h-full' width={400} height={400}/>
                        
                        <div className='px-2 py-2'>
                            <h2 className='font-bold text-[1.1rem] uppercase overflow-hidden whitespace-nowrap text-ellipsis'>{data?.title}</h2>
                            <p className=' border border-[#FFC0CB] w-fit p-1 rounded-md text-[#FFC0CB] font-bold'>{data?.typeOfEvent}</p>
                            
                            <p className='text-[.9rem] w-[9rem] overflow-hidden whitespace-nowrap overflow-ellipsis '>{data?.address}</p>
                            
                            <div className='flex  justify-between mt-1'>
                            <p className='text-[.9rem]'>{data?.startTime}</p>
                            <p className='text-[.9rem]'>{data?.date}</p>
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
        <p className='mt-4 text-center font-bold text-[1.4rem]'>
            
            🎟️Paid tickets
        <span className='block w-[20%] h-[3px] bg-[#FFC0CB] mt-1 mx-auto'></span>
        </p>
        {
            loadingPaid ? 
            <LoadingAnimation />
            : 
            ( paidTickets.length > 0 ? (
            <div className='flex gap-3 w-[100%] overflow-x-auto  text-black p-3'>
                {paidTickets.map((data) => (
                    <div key={data.id} className='flex-shrink-0 w-[17rem] md:w-[23rem] mr-3 border border-[#FFC0CB]  rounded-lg overflow-hidden hover:scale-105 transition cursor-pointer relative' onClick={() => {router.push(`events/${data.uuid}`)}}>
                        <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${data.user_id}_${data.image}`} alt='event image' className='w-[100%] min-h-[10rem] max-h-[15rem] h-full' width={400} height={400}/>
                        
                        <div className='px-2 py-2'>
                            <h2 className='font-bold text-[1.1rem] uppercase overflow-hidden whitespace-nowrap text-ellipsis'>{data?.title}</h2>
                            <p className=' border border-[#FFC0CB] w-fit p-1 rounded-md text-[#FFC0CB] font-bold'>{data?.typeOfEvent}</p>
                            
                            <p className='text-[.9rem] w-[9rem] overflow-hidden whitespace-nowrap overflow-ellipsis '>{data?.address}</p>
                            
                            <div className='flex  justify-between mt-1'>
                            <p className='text-[.9rem]'>{data?.startTime}</p>
                            <p className='text-[.9rem]'>{data?.date}</p>
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