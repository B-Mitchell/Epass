'use client'
import {useRouter} from 'next/navigation'
import React, {useState, useEffect} from 'react'
import Image from 'next/image'
import supabase from '../supabase'
import LoadingAnimation from './LoadingAnimation'
import { FaMapMarkerAlt, FaClock, FaCalendarAlt, FaTicketAlt, FaGift, FaDollarSign, FaArrowRight, FaStar } from 'react-icons/fa'
import { IoSparkles } from 'react-icons/io5'
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

                    // console.log(ticketData,'this is the data')
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

    // Enhanced Ticket card component
    const TicketCard = ({ data, isFree = false }) => {
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
                className='group flex-shrink-0 w-[18rem] md:w-[24rem] mr-6 bg-white rounded-2xl overflow-hidden hover:scale-[105%] transition-all duration-500 cursor-pointer relative shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-gray-100 hover:border-[#FFC0CB]/30'
                onClick={() => {router.push(`events/${data.uuid}`)}}>
                <div className="relative overflow-hidden">
                    <Image 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${data.user_id}_${data.image}`} 
                        alt='event image' 
                        className='w-full h-[200px] object-cover group-hover:scale-110 transition-transform duration-500' 
                        width={400} 
                        height={400}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Enhanced badges */}
                    <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm ${
                            isFree 
                                ? 'bg-green-500/90 text-white'
                                : 'bg-gradient-to-r from-[#FFC0CB] to-[#FFC0CB]/80 text-white'
                        }`}>
                            {isFree ? <FaGift className="w-3 h-3" /> : <FaDollarSign className="w-3 h-3" />}
                            {isFree ? 'FREE' : 'PAID'}
                        </span>
                    </div>
                    
                    <div className="absolute top-4 right-4">
                        <span className='bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[#8B5E3C] text-sm font-medium border border-white/20'>
                            {data?.typeOfEvent}
                        </span>
                    </div>

                    {/* Floating star rating */}
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-1">
                            <FaStar className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs font-medium">4.8</span>
                        </div>
                    </div>
                </div>
                
                <div className='px-5 py-5'>
                    <div className="flex items-start justify-between mb-3">
                        <h2 className='font-bold text-lg text-[#1E1E1E] uppercase overflow-hidden whitespace-nowrap text-ellipsis flex-1 pr-2 group-hover:text-[#FFC0CB] transition-colors duration-300'>
                            {data?.title}
                        </h2>
                        <IoSparkles className="w-5 h-5 text-[#FFC0CB] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <div className="flex items-center mb-3 group/location hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200">
                        <FaMapMarkerAlt className="w-4 h-4 text-[#FFC0CB] flex-shrink-0" />
                        <p className='text-sm ml-2 text-gray-600 overflow-hidden whitespace-nowrap text-ellipsis'>
                            {data?.address}
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 hover:bg-[#FFC0CB]/10 transition-colors duration-200">
                            <FaClock className="w-4 h-4 text-[#8B5E3C]" />
                            <p className='text-sm ml-2 text-gray-600 font-medium'>{formatTime(data?.startTime)}</p>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 hover:bg-[#FFC0CB]/10 transition-colors duration-200">
                            <FaCalendarAlt className="w-4 h-4 text-[#8B5E3C]" />
                            <p className='text-sm ml-2 text-gray-600 font-medium'>{formatDate(data?.date)}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Enhanced Section Header Component
    const SectionHeader = ({ title, icon, isFree = false }) => (
        <div className="relative mb-8">
            <div className="flex items-center justify-center">
                <div className="hidden md:block w-20 h-px bg-gradient-to-r from-transparent to-[#FFC0CB]"></div>
                <div className="mx-6 flex items-center bg-white rounded-2xl px-6 py-3 shadow-lg border border-[#FFC0CB]/20">
                    <span className="text-2xl mr-3">{icon}</span>
                    <h2 className='font-bold text-2xl text-[#1E1E1E] bg-gradient-to-r from-[#1E1E1E] to-[#8B5E3C] bg-clip-text'>
                        {title}
                    </h2>
                    <IoSparkles className="w-5 h-5 text-[#FFC0CB] ml-2" />
                </div>
                <div className="hidden md:block w-20 h-px bg-gradient-to-l from-transparent to-[#FFC0CB]"></div>
            </div>
        </div>
    );

    // Enhanced Empty State Component
    const EmptyState = ({ message, isFree = false }) => (
        <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative inline-block mb-6">
                <FaTicketAlt className="h-16 w-16 text-gray-300 mx-auto" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FFC0CB] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Events Available</h3>
            <p className='text-gray-500 max-w-md mx-auto'>{message}</p>
            <button className="mt-4 px-6 py-2 bg-gradient-to-r from-[#FFC0CB] to-black hover:from-black hover:to-[#FFC0CB] text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
                Browse All Events
            </button>
        </div>
    );

  return (
    <div className="py-12 px-4 md:px-8 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-32 h-32 bg-[#FFC0CB]/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 left-10 w-40 h-40 bg-[#FFC0CB]/5 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10">
            {/* FREE TICKETS */}
            <div className="mb-16">
                <SectionHeader title="Free Events" icon="🎁" isFree={true} />
                
                {loadingFree ? (
                    <div className="flex justify-center py-12">
                        <LoadingAnimation />
                    </div>
                ) : freeTickets.length > 0 ? (
                    <div className='relative'>
                        <div className='flex w-full overflow-x-auto py-6 scrollbar-hide'>
                            <div className="flex px-4">
                                {freeTickets.map((data) => (
                                    <TicketCard key={data.id} data={data} isFree={true} />
                                ))}
                            </div>
                        </div>
                        {/* Gradient fade on scroll */}
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                    </div>
                ) : (
                    <EmptyState message="No free events available at the moment. Check back soon for exciting free events!" isFree={true} />
                )}
            </div>

            {/* PAID TICKETS */}
            <div className="mb-8">
                <SectionHeader title="Premium Events" icon="💎" />
                
                {loadingPaid ? (
                    <div className="flex justify-center py-12">
                        <LoadingAnimation />
                    </div>
                ) : paidTickets.length > 0 ? (
                    <div className='relative'>
                        <div className='flex w-full overflow-x-auto py-6 scrollbar-hide'>
                            <div className="flex px-4">
                                {paidTickets.map((data) => (
                                    <TicketCard key={data.id} data={data} isFree={false} />
                                ))}
                            </div>
                        </div>
                        {/* Gradient fade on scroll */}
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                    </div>
                ) : (
                    <EmptyState message="No premium events available at the moment. Discover amazing paid experiences soon!" />
                )}
            </div>
        </div>
    </div>
  )
}

export default MainTickets;