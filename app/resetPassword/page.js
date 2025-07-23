'use client'
import React, { useState, useEffect } from 'react'
import supabase from '../supabase'
import { useRouter } from 'next/navigation'

const page = () => {
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (type === 'recovery' && accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      setShowResetForm(true)
    } else {
      setMessage('Invalid or expired reset link.')
    }
  }, [])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setMessage('Error updating password: ' + error.message)
      } else {
        setMessage('Password updated successfully. Redirecting to profile...')
        setTimeout(() => {
          router.push('/profile')
        }, 2000)
      }
    } catch (error) {
      setMessage('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='border border-[#FFCOCB] md:w-1/2 w-[80%] block m-auto mt-[5rem] rounded-3xl p-5'>
      <h2 className='text-center font-bold text-[1.4rem]'>Set New Password</h2>
      {showResetForm ? (
        <form onSubmit={handleResetPassword}>
          <p className='text-[1.2rem] my-2'>New Password: </p>
          <input
            placeholder='Enter new password'
            required
            type='password'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className='border border-[#FFCOCB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition'
          />
          <button
            type='submit'
            disabled={loading}
            className='hover:bg-[#FFC0CB] hover:bg-gradient-to-r from-[#FFC0CB] to-black w-[70%] block m-auto mt-6 p-2 border border-[#FFCOCB] transition rounded-2xl hover:text-white hover:scale-110'
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      ) : (
        <p className='text-center mt-4'>{message}</p>
      )}
      <p className='text-center mt-4'>{message}</p>
    </div>
  )
}

export default page