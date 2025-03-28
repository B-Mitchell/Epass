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

    // Ticket card component for reusability
    const TicketCard = ({ data }) => {
        // Format time to show only HH:MM (without seconds)
        const formatTime = (timeString) => {
            if (!timeString) return "";
            
            // If time is in HH:MM:SS format, remove the seconds part
            if (timeString.includes(':')) {
                const parts = timeString.split(':');
                if (parts.length >= 2) {
                    return `${parts[0]}:${parts[1]}`;
                }
            }
            return timeString; // Return original if not in expected format
        };
        
        // Format date to be more concise
        const formatDate = (dateString) => {
            if (!dateString) return "";
            
            // If the date contains time information, remove it
            const datePart = dateString.split('T')[0];
            if (datePart) {
                // Convert YYYY-MM-DD to DD/MM/YYYY or keep original format
                try {
                    const [year, month, day] = datePart.split('-');
                    if (year && month && day) {
                        return `${day}/${month}/${year}`;
                    }
                } catch (e) {
                    // If any error in parsing, return original date part
                }
                return datePart;
            }
            return dateString; // Return original if not in expected format
        };
        
        return (
            <div 
                className='flex-shrink-0 w-[17rem] md:w-[22rem] mr-4 bg-white rounded-xl overflow-hidden 
                          hover:scale-[1.02] transition-all duration-300 cursor-pointer relative 
                          shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)]'
                onClick={() => {router.push(`events/${data.uuid}`)}}
            >
                <div className="relative">
                    <Image 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${data.user_id}_${data.image}`} 
                        alt='event image' 
                        className='w-full h-[180px] object-cover' 
                        width={400} 
                        height={400}
                    />
                    <div className="absolute top-3 right-3">
                        <span className='bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[#8B5E3C] text-sm font-medium'>
                            {data?.typeOfEvent}
                        </span>
                    </div>
                </div>
                
                <div className='px-4 py-4'>
                    <h2 className='font-bold text-[1.15rem] text-[#1E1E1E] uppercase overflow-hidden whitespace-nowrap text-ellipsis mb-2'>
                        {data?.title}
                    </h2>
                    
                    <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8B5E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className='text-[.9rem] ml-1 text-gray-600 overflow-hidden whitespace-nowrap text-ellipsis max-w-[17rem]'>
                            {data?.address}
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8B5E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className='text-[.9rem] ml-1 text-gray-600'>{formatTime(data?.startTime)}</p>
                        </div>
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8B5E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className='text-[.9rem] ml-1 text-gray-600'>{formatDate(data?.date)}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

  return (
    <div className="py-6 px-4 md:px-8 bg-gray-50">
        {/* FREE TICKETS */}
        <div className="mb-10">
            <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-[1px] bg-[#FFC0CB] hidden md:block"></div>
                <h2 className='mx-4 text-center font-bold text-[1.5rem] text-[#1E1E1E] flex items-center'>
                    <span className="mr-2">🎟️</span>Free Events
                </h2>
                <div className="w-16 h-[1px] bg-[#FFC0CB] hidden md:block"></div>
            </div>
            
            {loadingFree ? (
                <LoadingAnimation />
            ) : freeTickets.length > 0 ? (
                <div className='flex w-full overflow-x-auto py-4 scrollbar-hide'>
                    <div className="flex px-2">
                        {freeTickets.map((data) => (
                            <TicketCard key={data.id} data={data} />
                        ))}
                    </div>
            </div>
        ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className='text-bold text-gray-500'>No free tickets available at the moment</p>
                </div>
            )}
        </div>

        {/* PAID TICKETS */}
        <div className="mb-6">
            <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-[1px] bg-[#FFC0CB] hidden md:block"></div>
                <h2 className='mx-4 text-center font-bold text-[1.5rem] text-[#1E1E1E] flex items-center'>
                    <span className="mr-2">🎟️</span>Paid Events
                </h2>
                <div className="w-16 h-[1px] bg-[#FFC0CB] hidden md:block"></div>
            </div>
            
            {loadingPaid ? (
            <LoadingAnimation />
            ) : paidTickets.length > 0 ? (
                <div className='flex w-full overflow-x-auto py-4 scrollbar-hide'>
                    <div className="flex px-2">
                {paidTickets.map((data) => (
                            <TicketCard key={data.id} data={data} />
                        ))}
                    </div>
            </div>
        ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className='text-bold text-gray-500'>No paid tickets available at the moment</p>
                </div>
            )}
        </div>
    </div>
  )
}

export default MainTickets