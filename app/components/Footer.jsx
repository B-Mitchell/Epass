import React from 'react'

const Footer = () => {
  return (
    <footer className='bg-[#1E1E1E] text-white mt-2'>
        <form className='pl-3 mb-4 w-[100%] md:w-[60%]'>
            <p className='font-bold pt-5 pb-3'>Subscribe to our Newsletter</p>
            <p className='pb-3'>The latest news, articles, and events, sent to your inbox weekly.</p>
            <input type='email' placeholder='enter your email' required className='p-2 w-[70%] md:w-[50%] outline-none rounded-lg text-black focus:scale-105 transition' />
            <button type='submit' className='ml-[1.5rem] bg-black hover:bg-[#FFC0CB] hover:text-black p-2 px-3 rounded-lg hover:scale-105 transition'>Subscribe</button>
        </form>

        <div className='text-center w-[80%] m-auto h-full  border-t-[.1rem] border-white'>
            <p className='text-[.8rem] p-2'>&copy; Epass Inc, all rights reserved.</p>
        </div>
    </footer>
  )
}

export default Footer