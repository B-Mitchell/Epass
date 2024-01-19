'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from '../globalRedux/slices/userSlice'
import supabase from '../supabase'
import ProfileTickets from '../components/ProfileTickets'

const page = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const userId = useSelector(state => state.user.user_id);
    const first_name = useSelector(state => state.user.first_name);
    const user_email = useSelector(state => state.user.user_email);
    const last_name = useSelector(state => state.user.last_name);
    const organizer_name = useSelector(state => state.user.organizer_name);
    const phone_number = useSelector(state => state.user.phone_number);
    const authFunction = () => {
        if (userId) {
            console.log('user: ' + userId)
        } else {
            console.log("redirecting to login...");
            router.push('/login');
        }
    }
    useEffect(() => {
        authFunction();
        fetchData();
    },[userId, organizer_name, phone_number, first_name, datas]);
    const handleLogout = () => {
        dispatch(logoutUser());
        router.push('/login');
    }
    const [datas, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      setLoading(true);
      let { data, error } = await supabase.from('tickets')
      .select('*')
      .eq('user_id', userId)
      
      if (error) {
        console.error('Error fetching data:', error.message);
      } else {
        console.log(data);
        setData(data || []);
      }
    } catch (error) {
      console.error('Error in fetchData:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div >
        <div className='w-[90%] border border-[#E0BFB8] block m-auto mt-4 p-5 rounded-3xl'>
            <h2 className='text-center font-bold text-[1.4rem]'>PROFILE</h2>
            <p className='mt-3'><span className='font-semibold'>Hello</span>, {first_name} {last_name}</p>
            <br />
            <div className='md:flex block justify-between'>
                <div >
                    <p className='font-bold my-2 underline'>your details</p>
                    <p>Email: {user_email}</p>
                    <p >Organization: {organizer_name}</p>
                    <p >Phone Number: {phone_number}</p>
                </div>
                <div className='w-[20%]'>
                <button onClick={() => handleLogout()} className='hover:bg-red-500 w-[100%] block m-auto mt-7 p-2 border border-[#E0BFB8] transition rounded-2xl hover:text-white hover:scale-110 '>Logout</button>
                </div>
            </div>
        </div>

        {/* continue here */}
        <div className='w-[90%] m-auto block border border-[#E0BFB8] mt-3 rounded-3xl p-5'>
            <p className='text-center font-bold text-[1.4rem]'>Your Events</p>

            {
                datas.length === 0 ? <p className='text-center mt-5 text-red-600'>you haven't created any event yet</p> : 
                <div >
                    {
                    datas.map((data) => {
                        return <ProfileTickets data={data} key={data.user_id} />
                    })
                }
                </div>
            }
            
            
        </div>


        <button className='hover:bg-transparent bg-[#E0BFB8] w-[40%] md:w-[20%] block m-auto mt-7 p-2 py-3 border border-[#E0BFB8] transition rounded-2xl hover:text-black text-white hover:scale-110 fixed bottom-8 right-3' onClick={() => {router.push('/profile/createEvent')}}>create event</button>
    </div>
  )
}

export default page