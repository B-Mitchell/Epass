'use client'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import { FiAlertCircle } from 'react-icons/fi';
import { BsLockFill, BsShieldLock } from 'react-icons/bs';

const Page = () => {
  const bankNames = Array.from(
    new Set(
      Object.keys({
        'ACCESS BANK NIGERIA': '044',
        'ACCESS BANK': '044',
        'ZENITH BANK': '057',
        'ZENITH': '057',
        'GUARANTY TRUST BANK': '058',
        'GTBANK': '058',
        'FIRST BANK OF NIGERIA': '011',
        'FIRST BANK': '011',
        'UNITED BANK FOR AFRICA': '033',
        'UBA': '033',
        'STANBIC IBTC BANK': '221',
        'STANBIC IBTC': '221',
        'FIDELITY BANK': '070',
        'WEMA BANK': '035',
        'ECOBANK NIGERIA': '050',
        'ECOBANK': '050',
      }).map(name => name.replace(/ NIGERIA$/, '').replace(/^GUARANTY TRUST BANK$/, 'GTBANK').replace(/^UNITED BANK FOR AFRICA$/, 'UBA'))
    )
  ).sort();

  // check if authenticated
  const [loading, setLoading] = useState(false);
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  // initialize data needed to fetch and push data
  const userId = useSelector(state => state.user.user_id);
  const router = useRouter();

  const authFunction = () => {
    if (userId) {
      console.log('user is logged in');
    } else {
      console.log("redirecting to login...");
      router.push('/login');
    }
  }

  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [fetchedDetails, setFetchedDetails] = useState({});

  useEffect(() => {
    authFunction();
    fetchBankDetails();
  }, [userId]);

  // fetch data if details exist
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
          setDetailsSubmitted(true);
        }
      }
    } catch (err) {
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

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    
    // Ask for confirmation before submission
    const confirmed = window.confirm(
      "WARNING: Once submitted, your bank details cannot be changed without contacting support. Are you sure the information is correct?"
    );
    
    if (!confirmed) {
      setLoading(false);
      return;
    }
    
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
        console.error('Error fetching existing data:', fetchError.message);
      }

      if (existingData) {
        // This shouldn't be reachable with new restrictions, but keeping as a fallback
        const { error } = await supabase
          .from('userBankDetails')
          .update(Data)
          .eq('uuid', userId);

        if (error) {
          console.error('Error updating data:', error.message);
        } else {
          console.log('Data updated successfully');
          setDetailsSubmitted(true);
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
          setDetailsSubmitted(true);
        }
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  }

  // Support request modal
  const SupportModal = () => {
    const [supportMessage, setSupportMessage] = useState('');
    
    const handleSupportRequest = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        // Here you would handle the support request logic
        // For example, sending to a support ticket database
        
        // Example placeholder code:
        // await supabase.from('supportRequests').insert([{
        //   userId: userId,
        //   requestType: 'Bank Details Change',
        //   message: supportMessage,
        //   createdAt: new Date()
        // }]);
        
        alert('Your request has been submitted. Our support team will contact you shortly.');
        setShowSupportModal(false);
      } catch (error) {
        console.error('Error submitting support request:', error);
      } finally {
        setLoading(false);
      }
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Request Bank Details Change</h3>
          <p className="mb-4 text-gray-700">Please provide details about the changes you need to make:</p>
          
          <textarea
            className="w-full border border-gray-300 rounded-xl p-3 mb-4 min-h-32"
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            placeholder="Explain why you need to change your bank details..."
          />
          
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setShowSupportModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSupportRequest}
              className="px-4 py-2 bg-gradient-to-r from-[#FFC0CB] to-black text-white rounded-xl"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <h2 className='text-center font-bold text-2xl my-6'>Payment Settings</h2>
      
      {/* Payout Banner */}
      {/* <div className='bg-gradient-to-r from-[#FFC0CB] to-black md:w-1/2 w-[90%] m-auto p-4 text-center rounded-xl mb-8 text-white shadow-lg'>
        <p>Pending Payout: <span className='font-bold text-lg'>{`NGN1000`}</span></p>
      </div> */}

      {detailsSubmitted ? (
        /* Locked Bank Details View */
        <div className='border border-[#FFC0CB] md:w-1/2 w-[90%] block m-auto rounded-3xl p-6 bg-gradient-to-r from-[#FFC0CB] to-black bg-opacity-10'>
          <div className="flex items-center justify-between mb-4">
            <p className='text-xl font-semibold'>Account Details</p>
            <div className="flex items-center text-[#FFC0CB]">
              <BsLockFill size={16} className="mr-1" />
              <span className="text-sm font-medium">Locked</span>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 p-4 rounded-xl mb-4">
            <div className="flex justify-between items-center mb-1">
              <p className='text-sm text-gray-300'>Bank Name:</p>
              <p className='font-medium text-white'>{bankName}</p>
            </div>
            
            <div className="flex justify-between items-center mb-1">
              <p className='text-sm text-gray-300'>Account Name:</p>
              <p className='font-medium text-white'>{accountName}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <p className='text-sm text-gray-300'>Account Number:</p>
              <p className='font-medium text-white'>{accountNumber}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
            <div className="flex">
              <FiAlertCircle size={20} className="text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Important Notice</p>
                <p className="text-xs text-yellow-600">
                  For security reasons, bank details cannot be modified directly. 
                  If you need to make changes, please contact our support team.
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSupportModal(true)}
            className="w-full py-3 mt-2 bg-white text-black font-medium rounded-xl hover:bg-opacity-90 transition flex items-center justify-center"
          >
            <BsShieldLock size={18} className="mr-2" />
            Contact Support to Modify Details
          </button>
        </div>
      ) : (
        /* Bank Details Form */
        <form onSubmit={handleSubmit} className='border border-[#FFC0CB] md:w-1/2 w-[90%] block m-auto rounded-3xl p-6'>
          <p className='text-xl font-semibold mb-4'>Enter Your Bank Details</p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
            <div className="flex">
              <FiAlertCircle size={20} className="text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Important: Read Before Submitting</p>
                <p className="text-xs text-yellow-600">
                  Once submitted, your bank details will be locked for security reasons. 
                  You will not be able to modify them without contacting support.
                  Please double-check all information before submission.
                </p>
              </div>
            </div>
          </div>
          
          {/* <div className="mb-4">
            <p className='text-sm font-medium mb-1'>Bank Name:</p>
            <input 
              className='border border-[#FFC0CB] w-full p-3 outline-none bg-transparent rounded-xl focus:border-2 transition' 
              placeholder='Enter bank name' 
              required 
              onChange={(e) => setBankName(e.target.value)} 
              value={bankName}
            />
          </div> */}
          <div className="mb-4">
            <p className='text-sm font-medium mb-1'>Bank Name:</p>
            <select
              className='border border-[#FFC0CB] w-full p-3 outline-none bg-transparent rounded-xl focus:border-2 transition'
              required
              onChange={(e) => setBankName(e.target.value)}
              value={bankName}
            >
              <option value="" disabled>Select a bank</option>
              {bankNames.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <p className='text-sm font-medium mb-1'>Account Name:</p>
            <input 
              className='border border-[#FFC0CB] w-full p-3 outline-none bg-transparent rounded-xl focus:border-2 transition' 
              placeholder='Enter account name' 
              required 
              onChange={(e) => setAccountName(e.target.value)} 
              value={accountName}
            />
          </div>
          
          <div className="mb-6">
            <p className='text-sm font-medium mb-1'>Account Number:</p>
            <input 
              className='border border-[#FFC0CB] w-full p-3 outline-none bg-transparent rounded-xl focus:border-2 transition' 
              placeholder='Enter account number' 
              required 
              onChange={(e) => setAccountNumber(e.target.value)} 
              value={accountNumber}
            />
          </div>

          <button 
            type='submit'  
            className='bg-gradient-to-r from-[#FFC0CB] to-black text-white w-full py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300'
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Submit & Lock Details'} 
          </button>
        </form>
      )}
      
      {showSupportModal && <SupportModal />}
    </div>
  )
}

export default Page;
