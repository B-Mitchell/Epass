'use client';
import React from 'react'
import { useRouter } from 'next/navigation';

const Footer = () => {
  const router = useRouter();
  
  return (
    <footer className='bg-[#1E1E1E] text-white mt-2'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
                {/* Newsletter Section */}
                <div className='col-span-1 md:col-span-2'>
                    <form className='mb-4'>
                        <p className='font-bold pt-5 pb-3'>Subscribe to our Newsletter</p>
                        <p className='pb-3'>The latest news, articles, and events, sent to your inbox weekly.</p>
                        <input type='email' placeholder='enter your email' required className='p-2 w-[70%] md:w-[50%] outline-none rounded-lg text-black focus:scale-105 transition' />
                        <button type='submit' className='ml-[1.5rem] bg-black hover:bg-[#FFCOCB] hover:text-black p-2 px-3 rounded-lg hover:scale-105 transition'>Subscribe</button>
                    </form>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className='font-bold mb-4'>Quick Links</h3>
                    <ul className='space-y-2'>
                        <li className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => router.push('/')}>Home</li>
                        <li className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => router.push('/about')}>About Us</li>
                        <li className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => router.push('/events')}>Events</li>
                    </ul>
                </div>

                {/* Support */}
                <div>
                    <h3 className='font-bold mb-4'>Support</h3>
                    <ul className='space-y-2'>
                        <li className='cursor-pointer hover:text-[#FFCOCB] transition'>Contact Us</li>
                        <li className='cursor-pointer hover:text-[#FFCOCB] transition'>FAQs</li>
                        <li className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => router.push('/terms')}>Terms and Conditions</li>
                        <li className='cursor-pointer hover:text-[#FFCOCB] transition' onClick={() => router.push('/privacy')}>Privacy Policy</li>
                    </ul>
                </div>
            </div>

            <div className='text-center w-full mt-8 pt-8 border-t border-gray-700'>
                <p className='text-sm'>&copy; {new Date().getFullYear()} Epass Inc. All rights reserved.</p>
            </div>
        </div>
    </footer>
  )
}

export default Footer