'use client'
import React, { useState } from 'react'
import supabase from '../supabase'
import Link from 'next/link'
import { toast } from 'react-toastify';

const page = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        emailRedirectTo: 'https://www.e-pass.xyz/resetPassword',
      })
      if (error) {
        setMessage('Error: ' + error.message)
      } else {
       toast.success('Password reset link sent to your email.')
        setEmail('')
      }
    } catch (error) {
      setMessage('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='border border-[#FFCOCB] md:w-1/2 w-[80%] block m-auto mt-[5rem] rounded-3xl p-5'>
      <h2 className='text-center font-bold text-[1.4rem]'>Reset Your Password</h2>
      <p className='text-center mt-2'>Enter your email address to receive a password reset link.</p>
      <form onSubmit={handleSubmit}>
        <p className='text-[1.2rem] my-2'>Email: </p>
        <input
          placeholder='Enter your email'
          required
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='border border-[#FFCOCB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition'
        />
        <button
          type='submit'
          disabled={loading}
          className='hover:bg-[#FFC0CB] hover:bg-gradient-to-r from-[#FFC0CB] to-black w-[70%] block m-auto mt-6 p-2 border border-[#FFCOCB] transition rounded-2xl hover:text-white hover:scale-110'
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <p className='text-center mt-4'>{message}</p>
      <p className='text-center mt-4'>
        <Link href="/login" className='text-[#FFC0CB] font-extrabold'>Back to Login</Link>
      </p>
    </div>
  )
}

export default page