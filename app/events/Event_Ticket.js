import React from 'react'
import Image from 'next/image';
import { useRouter } from 'next/navigation'

const Event_Ticket = (props) => {
    const router = useRouter();
    const { user_id, address, startTime, date, title, image, typeOfEvent, price, uuid } = props.data;
    const isCompact = props.isCompact || false;
    
    // Format time to show only HH:MM
    const formatTime = (timeString) => {
        if (!timeString) return "";
        
        if (timeString.includes(':')) {
            const parts = timeString.split(':');
            if (parts.length >= 2) {
                return `${parts[0]}:${parts[1]}`;
            }
        }
        return timeString;
    };
    
    // Format date to be more concise
    const formatDate = (dateString) => {
        if (!dateString) return "";
        
        const datePart = dateString.split('T')[0];
        if (datePart) {
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
        return dateString;
    };
    
    return (
        <div className={`w-full h-auto bg-white rounded-xl overflow-hidden 
                        hover:scale-[1.02] transition-all duration-300 cursor-pointer 
                        shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)]
                        ${isCompact ? 'compact-ticket' : ''}`}
            onClick={() => {router.push(`events/${uuid}`)}}>

            <div className="relative">
                <Image 
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${user_id}_${image}`} 
                    alt='event image' 
                    className={`w-full object-cover ${isCompact ? 'h-[120px]' : 'h-[180px]'}`}
                    width={400} 
                    height={400}
                />
                <div className="absolute top-3 right-3">
                    <span className={`bg-white/80 backdrop-blur-sm rounded-full text-[#8B5E3C] text-sm font-medium ${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'}`}>
                        {typeOfEvent}
                    </span>
                </div>
                {price && price !== '0' && (
                    <div className="absolute bottom-3 left-3">
                        <span className={`bg-[#FFC0CB]/90 backdrop-blur-sm rounded-full text-white text-sm font-medium ${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'}`}>
                            {price} NAIRA
                        </span>
                    </div>
                )}
            </div>

            <div className={`${isCompact ? 'px-3 py-3' : 'px-4 py-4'}`}>
                <h2 className={`font-bold text-[#1E1E1E] uppercase overflow-hidden whitespace-nowrap text-ellipsis mb-2 ${isCompact ? 'text-[0.9rem]' : 'text-[1.15rem]'}`}>
                    {title}
                </h2>
                
                <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFC0CB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className={`ml-1 text-gray-600 overflow-hidden whitespace-nowrap text-ellipsis ${isCompact ? 'text-[0.8rem]' : 'text-[.9rem]'}`}>
                        {address ? address:"Undisclosed"}
                    </p>
                </div>
                
                {/* In compact view, date and time are displayed in a single row */}
                {isCompact ? (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[0.75rem]">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#FFC0CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className='ml-1 text-gray-600'>{formatDate(date)}</p>
                        </div>
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#FFC0CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className='ml-1 text-gray-600'>{formatTime(startTime)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFC0CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className='text-[.9rem] ml-1 text-gray-600'>{formatTime(startTime)}</p>
                        </div>
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFC0CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className='text-[.9rem] ml-1 text-gray-600'>{formatDate(date)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Event_Ticket