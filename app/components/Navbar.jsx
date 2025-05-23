'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../globalRedux/slices/userSlice';
import LogoImage from '../../public/images/Epass.png'
import Image from 'next/image';
import { FaHome, FaCalendarAlt, FaInfoCircle, FaDollarSign, FaUser, FaSignInAlt, FaSignOutAlt, FaUserPlus, FaTimes } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';

const NavBar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = useSelector(state => state.user.user_id);
  const loginOut = userId ? 'logout' : 'login';
  const [active, setIsActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleLoginOut = () => {
    if (loginOut == 'login') {
        if (!userId) {
            router.push('/login')
        }
    } else {
        dispatch(logoutUser());
        alert('you are logged out');
        router.push('/login');
    }
  }

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (active && !event.target.closest('nav')) {
        setIsActive(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [active]);

  const navItems = [
    { name: 'Home', path: '/', icon: FaHome },
    { name: 'Events', path: '/events', icon: FaCalendarAlt },
    { name: 'About', path: '/about', icon: FaInfoCircle },
    { name: 'Pricing', path: '/pricing', icon: FaDollarSign },
  ];

  const handleNavigation = (path) => {
    router.push(path);
    setIsActive(false);
  };

  const handleProfileClick = () => {
    if (userId) {
      router.push('/profile');
    } else {
      alert('please login');
    }
    setIsActive(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#1E1E1E]/95 backdrop-blur-md shadow-lg border-b border-[#FFC0CB]/20' 
        : 'bg-[#1E1E1E]'
    }`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className='flex justify-between items-center py-4'>
          {/* Enhanced Logo */}
          <div 
            className='relative w-[120px] h-[40px] cursor-pointer group transition-transform duration-300 hover:scale-105'
            onClick={() => handleNavigation('/')}>
            <Image 
              src={LogoImage} 
              alt="E-Pass Logo"
              fill
              className='object-contain'
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFC0CB]/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* DESKTOP VIEW - Enhanced */}
          <div className='hidden md:flex items-center space-x-8'>
            <ul className='flex items-center space-x-6'>
              {navItems.map((item) => (
                <li key={item.name}>
                  <button
                    className='group flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:text-[#FFC0CB] hover:bg-white/5 transition-all duration-300 font-medium'
                    onClick={() => handleNavigation(item.path)}
                  >
                    <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Auth Section */}
            <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-600">
              <button
                className='group flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:text-[#FFC0CB] hover:bg-white/5 transition-all duration-300 font-medium'
                onClick={handleProfileClick}
              >
                <FaUser className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>Profile</span>
              </button>
              
              <button
                className={`group flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  loginOut == 'logout' 
                    ? 'text-white hover:text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-400/40' 
                    : 'text-white hover:text-[#FFC0CB] hover:bg-[#FFC0CB]/10 border border-[#FFC0CB]/20 hover:border-[#FFC0CB]/40'
                }`}
                onClick={handleLoginOut}
              >
                {loginOut == 'logout' ? (
                  <FaSignOutAlt className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <FaSignInAlt className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                )}
                <span className="capitalize">{loginOut}</span>
              </button>

              {loginOut == 'login' && (
                <button
                  className='group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FFC0CB] to-black hover:from-black hover:to-[#FFC0CB] text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  onClick={() => handleNavigation('/createAccount')}
                >
                  <FaUserPlus className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Sign Up</span>
                  <IoSparkles className="w-3 h-3 opacity-70" />
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Mobile Menu Button */}
          <button
            onClick={() => setIsActive(!active)}
            className={`md:hidden relative w-8 h-8 flex flex-col justify-center items-center transition-all duration-300 ${
              active ? 'rotate-90' : ''
            }`}
          >
            {active ? (
              <FaTimes className="w-6 h-6 text-white hover:text-[#FFC0CB] transition-colors duration-300" />
            ) : (
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-white transition-all duration-300 hover:bg-[#FFC0CB]"></div>
                <div className="w-6 h-0.5 bg-white transition-all duration-300 hover:bg-[#FFC0CB]"></div>
                <div className="w-6 h-0.5 bg-white transition-all duration-300 hover:bg-[#FFC0CB]"></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${
        active 
          ? 'max-h-screen opacity-100' 
          : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-[#1E1E1E]/98 backdrop-blur-md border-t border-[#FFC0CB]/20">
          <div className="container mx-auto px-4 py-6">
            <ul className='space-y-4'>
              {navItems.map((item, index) => (
                <li 
                  key={item.name}
                  className={`transform transition-all duration-300 delay-${index * 100}`}
                  style={{ 
                    transform: active ? 'translateY(0)' : 'translateY(-20px)',
                    opacity: active ? 1 : 0
                  }}
                >
                  <button
                    className='group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white hover:text-[#FFC0CB] hover:bg-white/5 transition-all duration-300 font-medium text-lg border border-transparent hover:border-[#FFC0CB]/20'
                    onClick={() => handleNavigation(item.path)}
                  >
                    <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
              
              {/* Mobile Profile */}
              <li className={`transform transition-all duration-300 delay-400`}
                  style={{ 
                    transform: active ? 'translateY(0)' : 'translateY(-20px)',
                    opacity: active ? 1 : 0
                  }}>
                <button
                  className='group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white hover:text-[#FFC0CB] hover:bg-white/5 transition-all duration-300 font-medium text-lg border border-transparent hover:border-[#FFC0CB]/20'
                  onClick={handleProfileClick}
                >
                  <FaUser className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span>Profile</span>
                </button>
              </li>

              {/* Mobile Auth Buttons */}
              <li className={`transform transition-all duration-300 delay-500`}
                  style={{ 
                    transform: active ? 'translateY(0)' : 'translateY(-20px)',
                    opacity: active ? 1 : 0
                  }}>
                <button
                  className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-lg transition-all duration-300 ${
                    loginOut == 'logout' 
                      ? 'text-white hover:text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-400/40' 
                      : 'text-white hover:text-[#FFC0CB] hover:bg-[#FFC0CB]/10 border border-[#FFC0CB]/20 hover:border-[#FFC0CB]/40'
                  }`}
                  onClick={handleLoginOut}
                >
                  {loginOut == 'logout' ? (
                    <FaSignOutAlt className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <FaSignInAlt className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  <span className="capitalize">{loginOut}</span>
                </button>
              </li>

              {loginOut == 'login' && (
                <li className={`transform transition-all duration-300 delay-600`}
                    style={{ 
                      transform: active ? 'translateY(0)' : 'translateY(-20px)',
                      opacity: active ? 1 : 0
                    }}>
                  <button
                    className='group w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-[#FFC0CB] to-black hover:from-black hover:to-[#FFC0CB] text-white rounded-xl font-medium text-lg transition-all duration-300 transform hover:scale-105 shadow-lg'
                    onClick={() => handleNavigation('/createAccount')}
                  >
                    <FaUserPlus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span>Create Account</span>
                    <IoSparkles className="w-4 h-4 opacity-70" />
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar;
