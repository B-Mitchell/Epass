'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../globalRedux/slices/userSlice';
import LogoImage from '../../public/images/Epass.png'
import Image from 'next/image';

const NavBar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = useSelector(state => state.user.user_id);
  const loginOut = userId ? 'logout' : 'login';
  const handleLoginOut = () => {
    if ( loginOut == 'login' ) {
        if (!userId) {
            router.push('/login')
        }
    } else {
        dispatch(logoutUser());
        alert('you are logged out');
        router.push('/login');
    }
  }
  const [active , setIsActive] = useState(false);

  const dynamicNav = active ? 'transition transform rotate-90' : 'transition';

  return (
    <nav className='bg-[#1E1E1E] text-white w-full flex justify-between pb-3'>
        <div className='mt-5 -mb-1 ml-3 md:ml-6 relative w-[120px] h-[40px]'>
            <Image 
                src={LogoImage} 
                alt="E-Pass Logo"
                fill
                className='object-contain'
                priority
            />
        </div>

        {/* DESKTOP VIEW*/}
        <ul className='hidden md:flex justify-between w-[50%] mt-5 mr-4'>
            <li className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => {router.push('/')}}>Home</li>
            <li  className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => {userId ? null : alert('please login'); router.push('/profile')}}>Profile</li>
            {/* ONLY LOGGED IN USERS SHOULD BE ABLE TO ACCESS THE EVENTA PAGE */}
            {userId ? <li  className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => {router.push('/events')}}>Events</li> : null}
            <li  className={`cursor-pointer transition ${loginOut == 'logout' ? 'hover:text-red-600' : 'hover:text-[#FFCOCB]'}`} onClick={() => {handleLoginOut()}}>{loginOut}</li>
            {
                loginOut == 'login' ? 
                <li  className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => router.push('/createAccount')}>Create Account</li> : null
            }
        </ul>

        {/* MOBILE VIEW */}
        <svg onClick={() => setIsActive(!active)}  className={`mr-3 md:hidden flex mt-5 cursor-pointer m-3 ${dynamicNav}`} xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 19 14" fill="none">
            <path d="M1.35714 0H8.14286C8.50279 0 8.84799 0.1475 9.1025 0.410051C9.35701 0.672601 9.5 1.0287 9.5 1.4C9.5 1.7713 9.35701 2.1274 9.1025 2.38995C8.84799 2.6525 8.50279 2.8 8.14286 2.8H1.35714C0.997206 2.8 0.652012 2.6525 0.397498 2.38995C0.142984 2.1274 0 1.7713 0 1.4C0 1.0287 0.142984 0.672601 0.397498 0.410051C0.652012 0.1475 0.997206 0 1.35714 0ZM10.8571 11.2H17.6429C18.0028 11.2 18.348 11.3475 18.6025 11.6101C18.857 11.8726 19 12.2287 19 12.6C19 12.9713 18.857 13.3274 18.6025 13.5899C18.348 13.8525 18.0028 14 17.6429 14H10.8571C10.4972 14 10.152 13.8525 9.8975 13.5899C9.64298 13.3274 9.5 12.9713 9.5 12.6C9.5 12.2287 9.64298 11.8726 9.8975 11.6101C10.152 11.3475 10.4972 11.2 10.8571 11.2ZM1.35714 5.6H17.6429C18.0028 5.6 18.348 5.7475 18.6025 6.01005C18.857 6.2726 19 6.6287 19 7C19 7.3713 18.857 7.7274 18.6025 7.98995C18.348 8.2525 18.0028 8.4 17.6429 8.4H1.35714C0.997206 8.4 0.652012 8.2525 0.397498 7.98995C0.142984 7.7274 0 7.3713 0 7C0 6.6287 0.142984 6.2726 0.397498 6.01005C0.652012 5.7475 0.997206 5.6 1.35714 5.6Z" fill="WHITE"/>
        </svg>

        {
          active ?
         <ul className={`md:hidden block absolute m-0 w-[100%] mt-[4.56rem] bg-[#1E1E1E] text-center pb-5 z-50`}>
              <li className='cursor-pointer hover:text-[#FFCOCB] transition mt-3 text-[1.3rem]' onClick={() => {router.push('/') ; setIsActive(!active)}}>Home</li>

              <li  className='cursor-pointer hover:text-[#FFCOCB] transition mt-6 text-[1.3rem]' onClick={() => {userId ? null : alert('please login'); router.push('/profile'); setIsActive(!active)}}>Profile</li>

              {/* ONLY LOGGED IN USERS SHOULD BE ABLE TO ACCESS THE EVENTA PAGE */}
              {userId ? <li  className='cursor-pointer hover:text-[#FFCOCB] transition mt-6 text-[1.3rem]' onClick={() => {router.push('/events'); setIsActive(!active)}}>Events</li> : null}

              <li  className={`cursor-pointer transition mt-6 text-[1.3rem] ${loginOut == 'logout' ? 'hover:text-red-600' : 'hover:text-[#FFCOCB]'}`} onClick={() => {
                handleLoginOut(); 
                setIsActive(!active)}
                }>{loginOut}</li>
            {
                loginOut == 'login' ? 
                <li  className='cursor-pointer hover:text-[#FFCOCB] transition mt-6 text-[1.3rem] mb-5' onClick={() => {router.push('/createAccount'); setIsActive(!active)}}>Create Account</li> : null
            }
          </ul> : null
        }
    </nav>
  )
}

export default NavBar