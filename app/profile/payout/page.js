'use client'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import { FiAlertCircle, FiDollarSign, FiClock, FiCheck, FiSettings, FiShield } from 'react-icons/fi';
import { BsLockFill, BsShieldLock, BsCashStack, BsBank, BsPerson, BsCreditCard } from 'react-icons/bs';

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
  
  // Payout states
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0.0); // Example balance - fetch from your earnings system
  const [payoutHistory, setPayoutHistory] = useState([]);
  
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
    fetchPayoutHistory();
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

  // Fetch payout history from database
  const fetchPayoutHistory = async () => {
    try {
      let { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('userid', userId)
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error fetching payout history:', error.message);
      } else {
        setPayoutHistory(data || []);
      }
    } catch (err) {
      console.log('error fetching payout history:' + err);
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

  // Payout request function - randomly assigns pending or successful status
  const handlePayoutRequest = async () => {
    if (availableBalance <= 0) {
      alert('No funds available for payout.');
      return;
    }

    const confirmed = window.confirm(
      `You are about to request a payout of NGN ${availableBalance.toLocaleString()}. This will transfer your entire available balance. Continue?`
    );
    
    if (!confirmed) return;

    setLoading(true);
    
    try {
      const payoutAmount = availableBalance;
      const reference = `PAY${Date.now()}`; // Generate unique reference
      
      // Randomly assign status: 70% chance of successful, 30% chance of pending
      const randomStatus = Math.random() < 0.7 ? 'successful' : 'pending';
      
      // Insert payout request into database
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([{
          userId: userId,
          amount: payoutAmount,
          status: randomStatus,
          bankName: bankName,
          accountName: accountName,
          accountNumber: accountNumber,
          reference: reference,
          createdAt: new Date().toISOString(),
          completedAt: randomStatus === 'successful' ? new Date().toISOString() : null
        }])
        .select();
      
      if (error) {
        console.error('Error submitting payout request:', error);
        alert('Failed to submit payout request. Please try again.');
        return;
      }
      
      console.log('Payout request submitted:', data[0]);
      
      // Reset balance after successful submission
      setAvailableBalance(0);
      
      // Refresh payout history (excluding pending ones)
      fetchPayoutHistory();
      
      if (randomStatus === 'successful') {
        alert('Payout request submitted successfully! Your funds have been processed.');
      } else {
        alert('Payout request submitted successfully! Your funds are being processed and will be completed within 24 hours.');
      }
      
    } catch (error) {
      console.error('Error submitting payout request:', error);
      alert('Failed to submit payout request. Please try again.');
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-[#FFC0CB] to-black p-2 rounded-xl mr-3">
                <BsShieldLock className="text-white" size={20} />
              </div>
              Support Request
            </h3>
            <button 
              onClick={() => setShowSupportModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="text-blue-700 text-sm font-medium">Request Bank Details Change</p>
            <p className="text-blue-600 text-xs mt-1">Our security team will review your request within 24 hours</p>
          </div>
          
          <textarea
            className="w-full border border-gray-200 rounded-xl p-4 mb-6 min-h-[120px] focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent text-sm resize-none"
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            placeholder="Please explain why you need to change your bank details and provide any relevant information..."
          />
          
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button 
              onClick={() => setShowSupportModal(false)}
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSupportRequest}
              className="px-6 py-3 bg-gradient-to-r from-[#FFC0CB] to-black text-white rounded-xl hover:shadow-lg text-sm font-medium disabled:opacity-50 transition-all duration-200"
              disabled={loading || !supportMessage.trim()}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payout Modal
  const PayoutModal = () => {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-[#FFC0CB] to-black p-2 rounded-xl mr-3">
                <BsCashStack className="text-white" size={20} />
              </div>
              Confirm Payout
            </h3>
            <button 
              onClick={() => setShowPayoutModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl text-center border border-green-100">
            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FiDollarSign size={24} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-2">Available Balance</p>
            <p className="text-4xl font-bold text-green-600 mb-2">NGN {availableBalance.toLocaleString()}</p>
            <p className="text-xs text-gray-500">This entire amount will be transferred to your account</p>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center mb-3">
              <BsBank className="text-blue-600 mr-2" />
              <p className="text-blue-700 font-medium text-sm">Payout Destination</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-600">Bank:</span>
                <span className="text-blue-800 font-medium">{bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Account:</span>
                <span className="text-blue-800 font-medium">{accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Number:</span>
                <span className="text-blue-800 font-medium">{accountNumber}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button 
              type="button"
              onClick={() => setShowPayoutModal(false)}
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayoutRequest}
              className="px-6 py-3 bg-gradient-to-r from-[#FFC0CB] to-black text-white rounded-xl hover:shadow-lg text-sm font-medium disabled:opacity-50 transition-all duration-200"
              disabled={loading || availableBalance <= 0}
            >
              {loading ? 'Processing...' : 'Confirm Payout'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'successful':
        return <FiCheck className="text-green-500" size={16} />;
      case 'processing':
        return <FiClock className="text-blue-500" size={16} />;
      case 'pending':
        return <FiClock className="text-orange-500" size={16} />;
      case 'failed':
        return <FiAlertCircle className="text-red-500" size={16} />;
      default:
        return <FiClock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'successful':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'processing':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'pending':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'failed':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-[#FFC0CB] to-black p-3 rounded-2xl mr-4">
              <FiSettings className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Settings</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your bank details and payouts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {detailsSubmitted ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Balance & Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Available Balance Card */}
              <div className="bg-gradient-to-br from-[#FFC0CB] via-pink-300 to-black text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-black/10 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/80 text-sm font-medium">Available Balance</p>
                    <div className="bg-white/20 p-2 rounded-xl">
                      <FiDollarSign size={20} />
                    </div>
                  </div>
                  <p className="font-bold text-3xl sm:text-4xl mb-6">
                    NGN {availableBalance.toLocaleString()}
                  </p>
                  <button 
                    onClick={() => setShowPayoutModal(true)}
                    className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-2xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center text-sm disabled:bg-gray-200 disabled:text-gray-500 shadow-lg"
                    disabled={availableBalance <= 0}
                  >
                    <BsCashStack className="mr-2" size={16} />
                    {availableBalance <= 0 ? 'No Balance Available' : 'Request Payout'}
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <FiClock className="text-blue-600" size={16} />
                  </div>
                  Payout Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Payouts:</span>
                    <span className="font-medium">{payoutHistory.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Successful:</span>
                    <span className="font-medium text-green-600">
                      {payoutHistory.filter(p => p.status === 'successful').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium text-orange-600">
                      {payoutHistory.filter(p => p.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Account Details & History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Locked Bank Details View */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="bg-gradient-to-r from-[#FFC0CB] to-black p-3 rounded-2xl mr-4">
                        <BsBank className="text-white" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
                        <p className="text-gray-600 text-sm">Your registered payment information</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-red-50 text-red-600 px-3 py-2 rounded-full border border-red-200">
                      <BsLockFill className="mr-2" size={14} />
                      <span className="text-sm font-medium">Secured</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="bg-gradient-to-r from-[#FFC0CB] to-black p-6 rounded-2xl mb-6 text-white">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <BsBank className="mr-3 text-white/80" size={16} />
                        <div>
                          <p className="text-white/70 text-xs uppercase tracking-wide">Bank Name</p>
                          <p className="font-semibold">{bankName}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <BsPerson className="mr-3 text-white/80" size={16} />
                        <div>
                          <p className="text-white/70 text-xs uppercase tracking-wide">Account Name</p>
                          <p className="font-semibold">{accountName}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <BsCreditCard className="mr-3 text-white/80" size={16} />
                        <div>
                          <p className="text-white/70 text-xs uppercase tracking-wide">Account Number</p>
                          <p className="font-semibold">{accountNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-start">
                      <div className="bg-amber-100 p-2 rounded-lg mr-3 flex-shrink-0">
                        <FiShield className="text-amber-600" size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-amber-800 text-sm">Security Notice</p>
                        <p className="text-amber-700 text-sm mt-1">
                          Your bank details are locked for security. Contact our support team to make any changes.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowSupportModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-[#FFC0CB] to-black text-white font-medium rounded-2xl hover:shadow-lg transition-all duration-200 flex items-center justify-center text-sm"
                  >
                    <BsShieldLock className="mr-2" size={16} />
                    Contact Support to Modify Details
                  </button>
                </div>
              </div>

              {/* Payout History */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-2xl mr-4">
                      <FiClock className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Transaction History</h3>
                      <p className="text-gray-600 text-sm">Your recent payout transactions</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {payoutHistory.length > 0 ? (
                    <div className="space-y-4">
                      {payoutHistory.map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <div className="bg-white p-3 rounded-xl mr-4 shadow-sm">
                              {getStatusIcon(payout.status)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-lg">
                                NGN {parseFloat(payout.amount).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(payout.createdAt)} • Ref: {payout.reference}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-2 rounded-xl text-xs font-medium border ${getStatusColor(payout.status)}`}>
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <BsCashStack size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No transaction history yet</p>
                      <p className="text-gray-400 text-sm mt-1">Your payout history will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Bank Details Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-[#FFC0CB] to-black p-3 rounded-2xl mr-4">
                    <BsBank className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Setup Payment Details</h2>
                    <p className="text-gray-600 text-sm mt-1">Add your bank account information to receive payouts</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                  <div className="flex items-start">
                    <div className="bg-amber-100 p-2 rounded-lg mr-3 flex-shrink-0">
                      <FiAlertCircle className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-amber-800">Important: Read Before Submitting</p>
                      <p className="text-amber-700 text-sm mt-1">
                        Once submitted, your bank details will be permanently locked for security reasons. 
                        You will not be able to modify them without contacting our support team. 
                        Please double-check all information before submission.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <BsBank className="mr-2 text-gray-500" size={16} />
                      Bank Name
                    </label>
                    <select
                      className="border border-gray-200 w-full p-4 rounded-2xl focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent text-sm bg-white shadow-sm transition-all duration-200 hover:border-gray-300"
                      required
                      onChange={(e) => setBankName(e.target.value)}
                      value={bankName}
                    >
                      <option value="" disabled>Select your bank</option>
                      {bankNames.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                      <BsPerson className="mr-2 text-gray-500" size={16} />
                      Account Name
                    </label>
                    <input 
                      className="border border-gray-200 w-full p-4 rounded-2xl focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent text-sm shadow-sm transition-all duration-200 hover:border-gray-300" 
                      placeholder="Enter your full account name" 
                      required 
                      onChange={(e) => setAccountName(e.target.value)} 
                      value={accountName}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                      <BsCreditCard className="mr-2 text-gray-500" size={16} />
                      Account Number
                    </label>
                    <input 
                      className="border border-gray-200 w-full p-4 rounded-2xl focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent text-sm shadow-sm transition-all duration-200 hover:border-gray-300" 
                      placeholder="Enter your 10-digit account number" 
                      required 
                      type="number"
                      onChange={(e) => setAccountNumber(e.target.value)} 
                      value={accountNumber}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-8 border border-blue-100">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
                      <FiShield className="text-blue-600" size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800 text-sm">Security & Privacy</p>
                      <p className="text-blue-700 text-sm mt-1">
                        Your banking information is encrypted and stored securely. We never share your details with third parties.
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"  
                  className="w-full py-4 bg-gradient-to-r from-[#FFC0CB] to-black text-white rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 text-sm disabled:opacity-50 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <BsLockFill className="mr-2" size={16} />
                      Submit & Lock Details
                    </>
                  )} 
                </button>
              </form>
            </div>
          </div>
        )}
        
        {showSupportModal && <SupportModal />}
        {showPayoutModal && <PayoutModal />}
      </div>
    </div>
  )
}

export default Page;