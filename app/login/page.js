'use client'
import React, { useEffect, useState } from 'react'
import supabase from '../supabase';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {  setUserId, setEmail, setFirstName, setLastName, setOrganizerName, setPhoneNumber } from '../globalRedux/slices/userSlice';

const page = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(false);
    const [emailU, setEmailU] = useState('');
    const [passwordU, setPasswordU] = useState('');
    const authFunction = () => {
        if (!user_id) {
            console.log('user: ' + user_id)
        } else {
            console.log("redirecting to profile...");
            router.push('/profile');
        }
    }
    useEffect(() => {
        authFunction();
    },[]);

    const loginToAccount = async (e) => {
        e.preventDefault();
        const formData = {
            email: emailU,
            password: passwordU
        }
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword(formData)
            if (error) {
                console.log('login error: ' + error)
                // alert(error)
                if ( error == 'AuthApiError: Invalid login credentials') {
                    setEmailU('');
                    setPasswordU('');
                    setErrorMsg(true);
                }
            } else {
                console.log(data);
                console.log(data.user.identities[0].user_id);
                dispatch(setUserId(data.user.identities[0].user_id));
                dispatch(setEmail(data.user.email));
                dispatch(setFirstName(data.user.user_metadata.first_name));
                dispatch(setLastName(data.user.user_metadata.last_name));
                dispatch(setOrganizerName(data.user.user_metadata.organizer_name));
                dispatch(setPhoneNumber(data.user.user_metadata.phone_number));
                router.push('/profile');
            }
        } catch (error) {
            console.log('Error is:' + error);
        } finally {
            setLoading(false);
        }
    }
    const user_id = useSelector(state => state.user.user_id);
    const user_email = useSelector(state => state.user.user_email);
    const first_name = useSelector(state => state.user.first_name);
    const last_name = useSelector(state => state.user.last_name);
    const organizer_name = useSelector(state => state.user.organizer_name);
    const phone_number = useSelector(state => state.user.phone_number);
    useEffect(() => {
        // dispatch(logoutUser());
        const data = {
            userId: user_id,
            email: user_email,
            firstName: first_name,
            lastName: last_name,
            organizerName: organizer_name,
            phoneNumber: phone_number
        }
        console.log(data);
    },[user_email, first_name, last_name, organizer_name]);

  return (
    <div className=''>
    <form onSubmit={loginToAccount} className='border border-[#FFCOCB] md:w-1/2 w-[80%] block m-auto mt-[5rem] rounded-3xl p-5 '>
    
        <h2 className='text-center font-bold text-[1.4rem]'>Login to your Account</h2>
        <p className='text-[1.2rem] my-2'>Email: </p>
        <input placeholder='eg: johndoe@gmail.com' required value={emailU} type='email' autoComplete="email" name="email" onChange={(e) => {setEmailU(e.target.value)}} className='border border-[#FFCOCB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition'/>

        <p className='text-[1.2rem] my-2'>Password: </p>
        <input placeholder='*************' required value={passwordU} type='password' name="password" onChange={(e) => {setPasswordU(e.target.value)}} className='border border-[#FFCOCB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        <p className='mt-2 text-left text-sm'>
            <span className='cursor-pointer text-red-400 font-extrabold' onClick={() => router.push('/forgotPassword')}>Forgot Password ?</span>
        </p>
        <p className='text-red-400 text-[.9rem] mt-2'>{errorMsg && 'Invalid login credentials, please try again'}</p>

        <button type='submit' className='hover:bg-[#FFC0CB] hover:bg-gradient-to-r from-[#FFC0CB] to-black w-[70%] block m-auto mt-6 p-2 border border-[#FFCOCB] transition rounded-2xl hover:text-white hover:scale-110' >{loading ? 'logging in...' : 'Login to your account'}</button>
        <br />
        <p onClick={() => {router.push('/createAccount')}} className='text-center'>you don't have an account ? <span className='cursor-pointer text-[#FFC0CB] font-extrabold'>Create an Account</span></p>

    </form>
    <button className='hover:bg-[#FFC0CB] md:w-1/2 w-[80%] block m-auto mt-7 p-2 border border-[#FFCOCB] transition rounded-2xl hover:text-white hover:scale-110' onClick={() => router.push('/')}>Continue as guest</button>
    </div>
  )
}

export default page
