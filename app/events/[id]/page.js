'use client';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import supabase from '@/app/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMyContext } from '@/app/context/createContext';
import LoadingAnimation from '@/app/components/LoadingAnimation';
import QRCode from 'qrcode';

const Page = ({ params }) => {
  const userId = useSelector((state) => state.user.user_id);
  const { ticketPrice, setTicketPrice, ticketRoute, setTicketRoute } = useMyContext();
  const router = useRouter();
  const route = params.id;
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [formData, setFormData] = useState({});
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

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

  const generateQRCode = async () => {
    try {
      const url = window.location.href;
      const qrCode = await QRCode.toDataURL(url);
      setQrCodeUrl(qrCode);
    } catch (error) {
      console.error('Error generating QR Code:', error);
    }
  };

  const fetchSpecificData = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('uuid', route);

      if (error) {
        console.error(error);
        router.back();
      } else if (data.length > 0) {
        setFetchedData(data[0]);
        setFormData(data[0]);
        setIsOwner(data[0].user_id === userId);
      }
    } catch (err) {
      console.error('Error fetching ticket data:', err);
    } finally {
      setLoading(false);
    }
  };

    const handleCopy = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Failed to copy URL:', err));
  };

  useEffect(() => {
    setTicketRoute(route);
    fetchSpecificData();
    // Generate QR code on load
    setTimeout(() => {
      generateQRCode();
    }, 1000);
  }, []);

  if (loading) {
  return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#1E1E1E]">
          Event Details
        </h1>

          {fetchedData ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Event Information with side image layout */}
            <div className="flex flex-col md:flex-row">
              {/* Left side - Event image */}
              <div className="md:w-2/5 relative">
                <div className="h-[250px] md:h-full w-full relative">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${fetchedData.user_id}_${fetchedData.image}`}
                    alt={fetchedData.title}
                    className="object-cover"
                    fill
                    priority
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/50 to-transparent"></div>
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm transition hover:bg-white/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>
              </div>

              {/* Right side - Event details */}
              <div className="md:w-3/5 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] mb-4">
                  {fetchedData.title}
                </h2>
                
                {/* Event Type Badge */}
                <div className="mb-6">
                  <span className="inline-block bg-pink-50 text-[#FFC0CB] font-medium px-3 py-1 rounded-full">
                    {fetchedData.typeOfEvent}
                  </span>
                </div>
                
                {/* Date, Time and Location details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFC0CB] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-700">Date</p>
                      <p className="text-gray-600">{formatDate(fetchedData.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFC0CB] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-700">Time</p>
                      <p className="text-gray-600">{formatTime(fetchedData.startTime)} - {formatTime(fetchedData.endTime)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFC0CB] mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-600">{fetchedData.address}</p>
                  </div>
                </div>
                
                {/* Event Description Section - Collapsible */}
                {fetchedData.eventDescription && (
                  <div className="mb-6">
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="flex items-center gap-2 text-[#FFC0CB] font-medium hover:text-pink-400 transition-colors focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                      {showFullDescription ? 'Hide Details' : 'Read about this event'}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${showFullDescription ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showFullDescription && (
                      <div className="mt-3 p-4 bg-pink-50 rounded-xl border-l-4 border-[#FFC0CB] animate-fadeIn">
                        <div 
                          className="text-gray-700" 
                          dangerouslySetInnerHTML={{ __html: fetchedData.eventDescription }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Get Tickets Button - Prominently positioned */}
                <div className="mb-8">
                  <button
                    onClick={() => router.push(`/events/${route}/ticketCheckout`)}
                    className="w-full bg-[#FFC0CB] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#FFC0CB]/90 transition-all shadow-sm hover:shadow-md flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    Get Tickets
                  </button>
                </div>
                
                {/* QR Code integrated into main content */}
                {qrCodeUrl && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">Event QR Code</h3>
                      <p className="text-sm text-gray-500">Scan to share this event</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Image src={qrCodeUrl} alt="Event QR Code" width={80} height={80} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Event not found</h3>
            <p className="text-gray-500 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <button onClick={() => router.push('/events')} className="px-4 py-2 bg-[#FFC0CB] text-white rounded-lg hover:bg-[#FFC0CB]/90 transition">
              Browse Events
            </button>
          </div>
        )}
       </div>
    </div>
  );
};

export default Page;