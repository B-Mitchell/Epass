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
  const [copied, setCopied] = useState(false); // State for copy feedback
  // QR CODE
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQRCode = async () => {
    try {
      const url = window.location.href; // Get the current URL
      const qrCode = await QRCode.toDataURL(url); // Generate QR code
      setQrCodeUrl(qrCode); // Set the QR code URL
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
        setTimeout(() => setCopied(false), 2000); // Reset the feedback after 2 seconds
      })
      .catch((err) => console.error('Failed to copy URL:', err));
  };
  

  useEffect(() => {
    setTicketRoute(route);
    fetchSpecificData();
  }, []);

  return (
    <div>
      <p className="text-center font-bold text-[1.4rem] my-4">Event/Ticket Details</p>
      {loading ? (
        <LoadingAnimation />
      ) : (
        <div className="border border-[#FFC0CB] md:w-[90%] w-[95%] m-auto flex flex-wrap gap-4 p-4 rounded-lg">
          {fetchedData ? (
            <>
              <div className="w-full md:w-[40%] flex-shrink-0">
                <div className="w-full md:h-[15rem] h-[15rem] overflow-hidden relative">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${fetchedData.user_id}_${fetchedData.image}`}
                    alt="event image"
                    className="w-full h-full object-cover rounded-lg"
                    width={400}
                    height={400}
                  />
                </div>
              </div>
              <div className="w-full md:w-[55%] space-y-4 text-gray-800">
                  <>
                    <p className="text-[1.5rem] font-bold text-[#333]">{fetchedData.title}</p>
                    <p>
                      <span className="font-semibold">Address:</span> {fetchedData.address}
                    </p>
                    <p>
                      <span className="font-semibold">Time:</span> {fetchedData.startTime} - {fetchedData.endTime}
                    </p>
                    <p>
                      <span className="font-semibold">Date:</span> {fetchedData.date}
                    </p>
                    <p>
                      <span className="font-semibold">Type of Event:</span> {fetchedData.typeOfEvent}
                    </p>
                    <button className='hover:bg-transparent bg-[#FFC0CB] w-[40%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-4 hover:scale-110'
                    onClick={() => router.push(`/events/${route}/ticketCheckout`)}>
                      Get Ticket
                      </button>
                  </>
              </div>
            </>
          ) : (
            <p className="mt-4 text-center font-light italic w-full">No data available</p>
          )}
        </div>
      )}
    
      <button
        onClick={generateQRCode}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-5"
      >
        Generate QR Code
      </button>
      {qrCodeUrl && (
        <div className="mt-4">
          <Image src={qrCodeUrl} alt="Generated QR Code"
            width={150}
            height={150} 
          />
          <p className="mt-2 text-gray-600">Scan this QR code to visit the URL.</p>
        </div>
      )}
      {/* Copy Link Button */}
       <div className="text-center mt-5 m-auto fixed text-xs top-14 right-0 mt">
         <button
           onClick={handleCopy}
           className="flex items-center hover:bg-[#ff9dbd] p-2 px-2 rounded-lg border border-[#FFC0CB] transition bg-[#f7a8b5] text-white py-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white mr-1" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M11 6H4a2 2 0 00-2 2v8a2 2 0 002 2h7a2 2 0 002-2V8a2 2 0 00-2-2zm-1 9H5V9h5v6z" clipRule="evenodd" />
           </svg>
           {copied ? 'Event Link Copied!' : 'Copy Event Link'}
         </button>
       </div>
    </div>
  );
};

export default Page;