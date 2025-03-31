'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../globalRedux/slices/userSlice';
import supabase from '../supabase';
import LoadingAnimation from '../components/LoadingAnimation';
import { IoMail, IoPhoneLandscape, IoSettingsOutline } from 'react-icons/io5';
import Image from 'next/image';
import { FaPhoneSlash } from 'react-icons/fa';

const Page = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user.user_id);
  const first_name = useSelector((state) => state.user.first_name);
  const user_email = useSelector((state) => state.user.user_email);
  const last_name = useSelector((state) => state.user.last_name);
  const organizer_name = useSelector((state) => state.user.organizer_name);
  const phone_number = useSelector((state) => state.user.phone_number);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const authFunction = () => {
    if (!userId) {
      console.log('Redirecting to login...');
      router.push('/login');
    }
  };

  useEffect(() => {
    authFunction();
    fetchEvents();
  }, [userId]);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push('/login');
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching events:', error.message);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error in fetchEvents:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (uuid) => {
    router.push(`profile/${uuid}`);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    const datePart = dateString.split('T')[0];
    if (datePart) {
      try {
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      } catch (e) {}
      return datePart;
    }
    return dateString;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Profile Card */}
      <div className="max-w-6xl mx-auto pt-4 px-4">

      <div className='w-[90%] border border-[#FFCOCB] block m-auto mt-4 p-5 rounded-3xl shadow-md bg-white'>
          <h2 className='text-center font-bold text-[1.4rem] text-[#1E1E1E]'>PROFILE</h2>
        <p className='mt-3'>
          <span className='font-semibold'>Hello</span>, <span className='italic'>{first_name} {last_name}</span>
        </p>
        <br />
        <div className='md:flex block justify-between'>
          <div>
            <p className='font-bold my-2 underline'>Your info</p>
            <p>Email: {user_email}</p>
            <p>Organization: {organizer_name}</p>
            <p>Phone Number: {phone_number}</p>
          </div>
            <div className='md:w-[20%] w-auto'>
            <button
              onClick={handleLogout}
                className='bg-red-500 w-full block m-auto mt-7 text-white p-2 transition rounded-2xl hover:text-red-500 hover:bg-transparent hover:scale-110 border hover:border-red-500 text-sm md:text-base'>
              Logout
            </button>
          </div>
        </div>
      </div>


      {/* Events Section */}
        <div className='w-[96%] m-auto block mt-7 rounded-3xl pb-5'>
          <div className='flex justify-between items-center mb-6'>
            <div className="flex items-center">
              <div className="w-10 h-[2px] bg-[#FFC0CB] hidden md:block mr-3"></div>
              <p className='font-bold text-[1.4rem] text-[#1E1E1E]'>Your Events</p>
            </div>
          <button
            className='font-bold border-[#FFCOCB] border rounded-lg p-2 hover:bg-[#FFCOCB] transition px-3'
            onClick={() => router.push('/profile/userInfo')}>
            <IoSettingsOutline className='hover:animate-spin' />
          </button>
        </div>

        {loading ? (
            <div className="flex justify-center my-12">
          <LoadingAnimation />
            </div>
        ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                              className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
                            >
                              <div className="flex p-3 pb-0 items-center gap-3">
                                <div className="relative w-[80px] h-[80px] flex-shrink-0 rounded-lg overflow-hidden">
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${event.user_id}_${event.image}`}
                                    alt={event.title}
                                    className="object-cover"
                                    fill
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="bg-white/90 px-2 py-0.5 rounded-full border border-gray-100">
                                      <span className="text-xs font-medium text-[#8B5E3C]">{event.typeOfEvent}</span>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      {event.publishEvent ? 'Published' : 'Draft'}
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-[#1E1E1E] line-clamp-2 pr-1">
                    {event.title}
                  </h3>
                                </div>
                              </div>
                              
                              <div className="p-4 pt-3 flex-1 flex flex-col">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFC0CB] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{formatDate(event.date)}</span>
                                  </div>
                                  
                                  <div className="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFC0CB] mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-sm text-gray-600 line-clamp-2">{event.address}</span>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 mt-3">
                                  <button onClick={() => handleEventClick(event.uuid)} className="bg-[#FFC0CB] text-white w-full py-2 rounded-lg transition shadow-sm hover:shadow-md font-medium hover:bg-transparent border hover:border-[#FFC0CB] hover:text-[#FFC0CB]">View Details
                    </button>
                  </div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white rounded-xl shadow-sm p-8 mt-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 8l-7 7-7-7M16 8h5a2 2 0 012 2v8a2 2 0 01-2 2h-5" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
              <p className="text-gray-500 mb-4">You haven't created any events yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Create Event Button */}
      <button
        className='hover:bg-transparent bg-[#FFC0CB] w-[40%] md:w-[20%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-black hover:scale-110 fixed bottom-8 right-3'
        onClick={() => {
          router.push('/profile/createEvent');
        }}>
        Create Event
      </button>
    </div>
  );
};

export default Page;
