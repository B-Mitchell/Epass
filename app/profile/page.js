// 'use client'
// import React, { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { useSelector, useDispatch } from 'react-redux'
// import { logoutUser } from '../globalRedux/slices/userSlice'
// import supabase from '../supabase'
// import ProfileTickets from '../components/ProfileTickets'
// import LoadingAnimation from '../components/LoadingAnimation'
// import { IoSettingsOutline } from "react-icons/io5";

// const page = () => {
//     const router = useRouter();
//     const dispatch = useDispatch();
//     const userId = useSelector(state => state.user.user_id);
//     const first_name = useSelector(state => state.user.first_name);
//     const user_email = useSelector(state => state.user.user_email);
//     const last_name = useSelector(state => state.user.last_name);
//     const organizer_name = useSelector(state => state.user.organizer_name);
//     const phone_number = useSelector(state => state.user.phone_number);
//     const authFunction = () => {
//         if (userId) {
//             console.log('user: ' + userId)
//         } else {
//             console.log("redirecting to login...");
//             router.push('/login');
//         }
//     }
//     useEffect(() => {
//         authFunction();
//         fetchData();
//     },[userId, organizer_name, phone_number, first_name, datas]);
//     const handleLogout = () => {
//         dispatch(logoutUser());
//         router.push('/login');
//     }
//     const [datas, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   async function fetchData() {
//     try {
//       setLoading(true);
//       let { data, error } = await supabase.from('tickets')
//       .select('*')
//       .eq('user_id', userId)
      
//       if (error) {
//         console.error('Error fetching data:', error.message);
//       } else {
//         console.log(data);
//         setData(data || []);
//       }
//     } catch (error) {
//       console.error('Error in fetchData:', error.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div >
//         <div className='w-[90%] border border-[#FFCOCB] block m-auto mt-4 p-5 rounded-3xl'>
//             <h2 className='text-center font-bold text-[1.4rem]'>PROFILE</h2>
//             <p className='mt-3'><span className='font-semibold'>Hello</span>, {first_name} {last_name}</p>
//             <br />
//             <div className='md:flex block justify-between'>
//                 <div >
//                     <p className='font-bold my-2 underline'>your details</p>
//                     <p>Email: {user_email}</p>
//                     <p >Organization: {organizer_name}</p>
//                     <p >Phone Number: {phone_number}</p>
//                 </div>
//                 <div className='w-[20%]'>
//                 <button onClick={() => handleLogout()} className='hover:bg-red-500 w-[100%] block m-auto mt-7 p-2 border border-[#FFCOCB] transition rounded-2xl hover:text-white hover:scale-110 '>Logout</button>
//                 </div>
//             </div>
//         </div>

//         {/* continue here */}
//         <div className='w-[96%] m-auto block mt-3 rounded-3xl pb-5'>
//           <div className='flex justify-between mb-3'>
//           <p className='text-center font-bold text-[1.4rem] mb-3'>Your Events</p>

//           <button className='font-bold border-[#FFCOCB] border rounded-lg p-2 hover:bg-[#FFCOCB] transition px-3' onClick={() => router.push('/profile/userInfo')}><IoSettingsOutline className='hover:animate-spin'/></button>
//           </div>
            
//             {
//             loading  ? <LoadingAnimation /> :
//             ( datas.length > 0 ? (
//             <div className='grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3 w-[100%] m-auto '>
//                 {
//                 datas.map((data) => {
//                   return (
//                     <div  className='flex items-center justify-center' key={data.uuid}>
//                       <ProfileTickets data={data} />
//                     </div>
//                   )
//                 })}
//             </div>
//         ) : (
//           <p className='text-center mt-5 text-red-600'>you haven't created any event yet</p>
//             )
//         )
//         }
            
            
//         </div>


//         <button className='hover:bg-transparent bg-[#FFC0CB] w-[40%] md:w-[20%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-black hover:scale-110 fixed bottom-8 right-3' onClick={() => {router.push('/profile/createEvent')}}>create event</button>
//     </div>
//   )
// }

// export default page

'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../globalRedux/slices/userSlice';
import supabase from '../supabase';
import LoadingAnimation from '../components/LoadingAnimation';
import { IoSettingsOutline } from 'react-icons/io5';
import Image from 'next/image';

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
        .from('tickets') // Replace 'events' with the name of your event table
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

  return (
    <div>
      <div className='w-[90%] border border-[#FFCOCB] block m-auto mt-4 p-5 rounded-3xl'>
        <h2 className='text-center font-bold text-[1.4rem]'>PROFILE</h2>
        <p className='mt-3'>
          <span className='font-semibold'>Hello</span>, {first_name} {last_name}
        </p>
        <br />
        <div className='md:flex block justify-between'>
          <div>
            <p className='font-bold my-2 underline'>Your Details</p>
            <p>Email: {user_email}</p>
            <p>Organization: {organizer_name}</p>
            <p>Phone Number: {phone_number}</p>
          </div>
          <div className='w-[20%]'>
            <button
              onClick={handleLogout}
              className='hover:bg-red-500 w-[100%] block m-auto mt-7 p-2 border border-[#FFCOCB] transition rounded-2xl hover:text-white hover:scale-110'>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className='w-[96%] m-auto block mt-3 rounded-3xl pb-5'>
        <div className='flex justify-between mb-3'>
          <p className='text-center font-bold text-[1.4rem] mb-3'>Your Events</p>
          <button
            className='font-bold border-[#FFCOCB] border rounded-lg p-2 hover:bg-[#FFCOCB] transition px-3'
            onClick={() => router.push('/profile/userInfo')}>
            <IoSettingsOutline className='hover:animate-spin' />
          </button>
        </div>

        {loading ? (
          <LoadingAnimation />
        ) : events.length > 0 ? (
          // <div className='grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3 w-[100%] m-auto'>
          //   {events.map((event) => (
          //     <div
          //       key={event.id}
          //       className='cursor-pointer border p-4 rounded-lg hover:shadow-lg transition'
          //       onClick={() => handleEventClick(event.id)}>
          //       <h3 className='font-bold'>{event.title}</h3>
          //       <p className='text-gray-600'>{event.description}</p>
          //     </div>
          //   ))}
          // </div>
          <div className='grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 w-[100%] m-auto p-4'>
  {events.map((event) => (
    <div
      key={event.id}
      className='cursor-pointer border border-gray-200 p-6 rounded-xl hover:shadow-xl transition-all bg-white relative group flex justify-between transition'>
        <div >
          {/* Event Title */}
      <h3 className='font-bold text-lg text-black capitalize mb-2 group-hover:uppercase transition'>
        {event.title}
      </h3>
      {/* Event CTA */}
      <div className='mt-4'>
        <button
        onClick={() => handleEventClick(event.uuid)}
          className='hover:bg-transparent bg-[#FFC0CB] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-black hover:scale-110 '>
          View Details
        </button>
      </div>
        </div>
        <div className="w-[40%] md:w-2/5">
        <Image
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${event.user_id}_${event.image}`}
          alt="Event image"
          className="rounded-lg max-h-[6rem]"
          width={200}
          height={100}
          />
      </div>
      
    </div>
  ))}
</div>

        ) : (
          <p className='text-center mt-5 text-red-600'>You haven't created any events yet</p>
        )}
      </div>

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
