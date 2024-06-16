'use client'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import supabase from '@/app/supabase';

const page = () => {
  // check if authenticated
    const authFunction = () => {
      if (userId) {
          console.log('user is logged in')
      } else {
          console.log("redirecting to login...");
          router.push('/login');
      }
      }
    useEffect(() => {
        authFunction();
        fetchBankDetails();
    },[userId]);
    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    const [loading, setLoading] = useState(false);
    // initialize data needed to fetch and push data
    const userId = useSelector(state => state.user.user_id);

    const handleSubmit = async (e) => {
      setLoading(true);
      e.preventDefault();
      const Data = {
        uuid: userId,
        bankName: bankName,
        accountName: accountName,
        accountNumber: accountNumber
      }
      try {
        const { data: existingData, error: fetchError } = await supabase
        .from('userBankDetails')
        .select('*')
        .eq('uuid', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 indicates no data was found, which is fine in this context
        console.error('Error fetching existing data:', fetchError.message);
      }

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('userBankDetails')
          .update(Data)
          .eq('uuid', userId);

        if (error) {
          console.error('Error updating data:', error.message);
        } else {
          console.log('Data updated successfully');
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('userBankDetails')
          .insert([Data])
          .select();

        if (error) {
          console.error('Error uploading data:', error.message);
        } else {
          console.log('Data uploaded successfully');
        }
      }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false);
      }
    }
    // fetch data if details exist
    const [fetchedDetails, setFetchedDetails] = useState({});
    const fetchBankDetails = async () => {
      try {
        let { data, error } = await supabase.from('userBankDetails')
        .select('*')
        .eq('uuid', userId);

        if (error) {
          console.error('Error fetching data:', error.message);
        } else {
          if (data && data.length > 0) {
            setFetchedDetails(data[0]);
          }
        }
        
      } catch(err) {
        console.log('error:' + err)
      }
    }
    useEffect(() => {
      if (fetchedDetails) {
        setBankName(fetchedDetails.bankName || '');
        setAccountName(fetchedDetails.accountName || '');
        setAccountNumber(fetchedDetails.accountNumber || '');
      }
    }, [fetchedDetails]);
  return (

    <div>
        <h2 className='text-center font-bold text-[1.4rem] my-3'>Settings</h2>
        <div  className='bg-[#E0BFB8] md:w-1/2 w-[90%] m-auto p-4 text-center rounded-xl mb-4'>
            <p>Pending Payout so far:  <span className='font-bold'>{`NGN1000`}</span></p>
        </div>

        <form onSubmit={handleSubmit} className='border border-[#E0BFB8] md:w-1/2 w-[90%] block m-auto rounded-3xl p-5 '>
          <p className='text-[1.2rem] my-2'>Account Details:</p>

          <p className='text-[.9rem] mt-3'>bank name:</p>
          <input className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' placeholder='Bank name' required onChange={(e) => setBankName(e.target.value)} value={bankName}/>

          <p className='text-[.9rem] mt-3'>account name:</p>
          <input className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' placeholder='account name' required onChange={(e) => setAccountName(e.target.value)} value={accountName}/>

          <p className='text-[.9rem] mt-3'>account number:</p>
          <input className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' placeholder='account number' required onChange={(e) => setAccountNumber(e.target.value)} value={accountNumber}/>

          <button type='submit'  className='hover:bg-[#E0BFB8] md:w-1/2 w-[80%] block m-auto mt-7 p-2 border border-[#E0BFB8] transition rounded-2xl hover:text-white hover:scale-110'>{loading ? 'please wait...' : 'submit'} </button>
        </form>
        
    </div>
  )
}

export default page