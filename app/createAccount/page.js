'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useMyContext } from '../context/createContext';
import supabase from '../supabase';
import { useDispatch, useSelector } from "react-redux";
import { setUserId, setEmail, setFirstName, setLastName, setOrganizerName, setPhoneNumber } from "../globalRedux/slices/userSlice";
import SuccessNotif from '../modals/SuccessNotif';

const page = () => {
    const router = useRouter();
    const { accountCreation, setAccountCreation } = useMyContext();
    const [loading, setLoading] = useState(false);
    //user authentication: check if user has logged in, if not redirect to home page
    const userId = useSelector(state => state.user.user_id);
    const authFunction = () => {
        if (!userId) {
            console.log('user is not logged in');
        } else {
            console.log("redirecting to profile...");
            router.push('/profile');
        }
    }
    useEffect(() => {
        authFunction();
    },[]);
    
    const dispatch = useDispatch();
    //useState to manage inputs
    const [ emailU, setEmailU ] = useState('');
    const [ firstNameU, setFirstNameU ] = useState('');
    const [ lastNameU, setLastNameU ] = useState('');
    const [ organizersNameU, setOrganizersNameU ] = useState('');
    const [ phoneNumberU, setPhoneNumberU ] = useState('');
    const [ passwordU, setPasswordU ] = useState();
    // this function runs once the form is submitted
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const formData = {
                email: emailU,
                password: passwordU,
                options: {
                    data: {
                    first_name: firstNameU,
                    last_name: lastNameU,
                    organizer_name: organizersNameU,
                    phone_number: phoneNumberU,
                    }
                }
            }
            
            const { data , error } = await supabase.auth.signUp(formData)
            if (error) {
                console.log(error);
                return;
            } else {
                const User = data.user;
                console.log(User.identities[0].user_id)
                console.log(User.user_metadata);
                setAccountCreation(!accountCreation);
                // saveUserData(data)
            }
            const user = data.user;
            if (user) {
                const { error: dbError } = await supabase
                .from('userDatabase')
                .insert([{
                    id: user.id,
                    email: emailU,
                    first_name: firstNameU,
                    last_name: lastNameU,
                    organizer_name: organizersNameU,
                    phone_number: phoneNumberU
                }]);
                if (dbError) {
                    console.log(dbError);
                    return;
                }
            };
            
            

        } catch(error) {
            console.error('Error is :' + error)
        } finally {
            setLoading(false);
        }
        function saveUserData (data) {
            dispatch(setEmail(registeredUserEmail));
            dispatch(setUserId(data.user.identities[0].user_id));
            dispatch(setEmail(data.user.email));
            dispatch(setFirstName(data.user.user_metadata.first_name));
            dispatch(setLastName(data.user.user_metadata.last_name));
            dispatch(setOrganizerName(data.user.user_metadata.organizer_name));
            dispatch(setPhoneNumber(data.user.user_metadata.phone_number));
        }
    }

  return (
    <div className='pb-[2rem]'>
        {accountCreation && <SuccessNotif />}
    <form onSubmit={handleSubmit} className='border border-[#FFCOCB] md:w-[70%] w-[90%] block m-auto mt-[3rem] rounded-3xl p-5 '>
    <h2 className='text-center font-bold text-[1.4rem]'>Create an  Account</h2>
    <div className='md:flex block justify-between mt-6'>

        <div className='w-[100%] md:mr-3'>
            <p className='text-[1.2rem] my-2'>Email</p>
            <input placeholder='eg: johnDoe@gmail.com' required value={emailU} onChange={(e) => {setEmailU(e.target.value)}} className='p-3 w-[100%] border border-[#FFCOCB] outline-none bg-transparent rounded-xl focus:scale-105 transition' />
        </div>
        <div className='md:w-[80%] w-[100%]'>
            <p className='text-[1.2rem] my-2'>Organizer Name</p>
        <input placeholder='eg: John Events' required  value={organizersNameU} onChange={(e) => {setOrganizersNameU(e.target.value)}} className='md:w-[80%] p-3 w-[100%] border border-[#FFCOCB] outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        </div>
    </div>

    <div className='md:flex block justify-between md:mt-6'>
        <div className='w-[100%]'>
        <p className='text-[1.2rem] my-2'>First Name</p>
        <input placeholder='eg: Doe' required  value={firstNameU} onChange={(e) => {setFirstNameU(e.target.value)}} className='p-3 md:w-[90%] w-[100%] border border-[#FFCOCB] outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        </div>
        <div className='w-[100%]'>
        <p className='text-[1.2rem] my-2'>Last Name</p>
            <input placeholder='eg: John' required  value={lastNameU} onChange={(e) => {setLastNameU(e.target.value)}} className='p-3 md:w-[90%] w-[100%] border border-[#FFCOCB] outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        </div>
    </div>

    <div className='md:flex block justify-between md:mt-6'>
        <div className='w-[100%]'>
        <p className='text-[1.2rem] my-2'>Phone Number</p>
        <input placeholder='eg: 09034*****76' required type='number'  value={phoneNumberU} onChange={(e) => {setPhoneNumberU(e.target.value)}} className='p-3 md:w-[90%] w-[100%] border border-[#FFCOCB] outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        </div>
        <div className='w-[100%]'>
        <p className='text-[1.2rem] my-2'>Password</p>
        <input placeholder='**********' required type='password' value={passwordU} onChange={(e) => {setPasswordU(e.target.value)}} className='p-3 md:w-[90%] w-[100%] border border-[#FFCOCB] outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        </div>
    </div>
        <button className='hover:bg-[#FFC0CB] hover:bg-gradient-to-r from-[#FFC0CB] to-black w-[70%] block m-auto mt-7 p-2 border border-[#FFCOCB] transition rounded-2xl hover:text-white hover:scale-110'>{loading ? 'Registering...' : 'Register' }</button>
        <br />
        <p onClick={() => {router.push('/login')}} className='text-center'>already have an account ? <span className='cursor-pointer text-[#FFC0CB] font-extrabold'>login to your Account</span></p>
    </form>
    <button className='hover:bg-[#FFC0CB] hover:bg-gradient-to-r from-[#FFC0CB] to-black md:w-1/2 w-[80%] block m-auto mt-7 p-2 border border-[#FFCOCB] transition rounded-2xl hover:text-white hover:scale-110' onClick={() => router.push('/')}>Continue as guest</button>
    </div>
  )
}

export default page