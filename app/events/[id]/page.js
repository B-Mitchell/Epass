'use client'
import React, { useEffect, useState } from 'react'
import supabase from '@/app/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMyContext } from '@/app/context/createContext';
import LoadingAnimation from '@/app/components/LoadingAnimation';

const page = ({ params }) => {
  const { ticketPrice, setTicketPrice, ticketRoute, setTicketRoute } = useMyContext();
  const router = useRouter();
  const route = params.id;
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState();

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
      } else {
        console.log(data);
        setFetchedData(data);
      }
    } catch (err) {
      console.error('error is: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketPrice = () => {
    setTicketPrice(fetchedData?.[0]?.price + 200 ?? 0);
  };
  updateTicketPrice();

  useEffect(() => {
    setTicketRoute(route);
    fetchSpecificData();
  }, []);

  return (
    <div>
      <p className='text-center font-bold text-[1.4rem] my-4'>Event/Ticket Details</p>
      {
        loading ? <LoadingAnimation /> : 
        <div className='border border-[#FFC0CB] md:w-[90%] w-[95%] m-auto md:flex justify-between block'>
        <div>
          {fetchedData && fetchedData.length > 0 ? (
            <div className='p-2 m-2 md:w-[100%]'>
              <div className='md:w-[100%] w-[100%] h-[10rem] overflow-hidden md:relative'>
                <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${fetchedData[0].user_id}_${fetchedData[0].image}`} alt='event image' className='w-fit min-h-[10rem] max-h-[15rem] h-full' width={400} height={400} />
              </div>
              <p className='text-[1.2rem] my-2 font-bold'>{fetchedData[0].title}</p>
              <p className='text-[1rem] my-1'>Address: {fetchedData[0].address}</p>
              <p className='text-[1rem] my-1'>Time: {fetchedData[0].startTime} - {fetchedData[0].endTime}</p>
              <p className='text-[1rem] my-1'>Date: {fetchedData[0].date}</p>
              <p className='text-[1rem] my-1'>Type of Event: {fetchedData[0].typeOfEvent}</p>

              {/* Conditional Rendering for Recurring Event */}
              {fetchedData[0].eventFrequency && (
                <>
                  <p className='text-[1rem] my-1'>Event Frequency: {fetchedData[0].eventFrequency}</p>
                </>
              )}

              {fetchedData[0].endCondition === 'endDate' && (
                <>
                  <p className='text-[1rem] my-1'>Event Ends On: {fetchedData[0].endDate}</p>
                </>
              )}

              {fetchedData[0].endCondition === 'occurrences' && fetchedData[0].occurrences && (
                <>
                  <p className='text-[1rem] my-1'>Occurrences: {fetchedData[0].occurrences}</p>
                </>
              )}
            </div>
          ) : (
            <p className='mt-4 text-center font-light italic block ml-4'>loading...</p>
          )}
        </div>

        
      </div>
      }
      

      <button
        className='hover:bg-transparent bg-[#FFC0CB] w-[40%] md:w-[20%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-4 hover:scale-110'
        onClick={() => router.push(`/events/${route}/ticketCheckout`)}
      >
        Get Ticket
      </button>
    </div>
  );
};

export default page;
