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
  const [availableBalance, setAvailableBalance] = useState(0.0);
  const [paidOutAmount, setPaidOutAmount] = useState(0.0);
  const [totalRevenue, setTotalRevenue] = useState(0.0);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
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

  // Fetch balance, paid-out amount, and total revenue
  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      // Fetch event IDs for the user
      const { data: events, error: eventsError } = await supabase
        .from('tickets')
        .select('uuid')
        .eq('user_id', userId);

      if (eventsError) {
        console.error('Error fetching events:', eventsError.message);
        setAvailableBalance(0);
        setPaidOutAmount(0);
        setTotalRevenue(0);
        return;
      }

      if (!events || events.length === 0) {
        setAvailableBalance(0);
        setPaidOutAmount(0);
        setTotalRevenue(0);
        return;
      }

      const eventIds = events.map(event => event.uuid);

      // Fetch transaction data for user's events
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('charged_amount')
        .in('event_id', eventIds);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError.message);
        setAvailableBalance(0);
        setPaidOutAmount(0);
        setTotalRevenue(0);
        return;
      }

      // Fetch ticketdata for cross-checking revenue
      const { data: ticketData, error: ticketDataError } = await supabase
        .from('ticketdata')
        .select('uuid, ticketPrice, currentStock, ticketStock')
        .in('event_id', eventIds);

      if (ticketDataError) {
        console.error('Error fetching ticketdata:', ticketDataError.message);
        // Continue with transactions data if ticketdata fails
      }

      // Fetch completed withdrawals
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('userId', userId)
        .eq('status', 'completed');

      if (withdrawalsError) {
        console.error('Error fetching withdrawals:', withdrawalsError.message);
        setAvailableBalance(0);
        setPaidOutAmount(0);
        setTotalRevenue(0);
        return;
      }

      // Calculate total revenue from transactions
      const transactionRevenue = transactions.reduce((sum, t) => sum + Number(t.charged_amount || 0), 0);

      // Calculate total revenue from ticketdata (for cross-checking)
      let ticketDataRevenue = 0;
      if (ticketData) {
        ticketDataRevenue = ticketData.reduce((sum, ticket) => {
          const ticketsSold = (Number(ticket.ticketStock) || 0) - (Number(ticket.currentStock) || 0);
          return sum + (ticketsSold * Number(ticket.ticketPrice || 0));
        }, 0);
      }

      // Use transactionRevenue as primary, log ticketDataRevenue for debugging
      const totalRevenue = transactionRevenue;
      console.log('Transaction Revenue:', transactionRevenue, 'TicketData Revenue:', ticketDataRevenue);

      // Calculate paid-out amount
      const paidOut = withdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);

      // Calculate available balance
      const availableBalance = Math.max(0, totalRevenue - paidOut);

      setTotalRevenue(totalRevenue);
      setPaidOutAmount(paidOut);
      setAvailableBalance(availableBalance);
    } catch (error) {
      console.error('Error calculating balance:', error);
      setAvailableBalance(0);
      setPaidOutAmount(0);
      setTotalRevenue(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    authFunction();
    fetchBankDetails();
    fetchPayoutHistory();
    fetchBalance();
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
        .eq('userId', userId)
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
      bankname: bankName,
      accountname: accountName,
      accountnumber: accountNumber
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

  // Payout request function - always sets status to pending
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
      
      // Fetch bank_account_uuid from userBankDetails
      const { data: bankDetails, error: bankError } = await supabase
        .from('userBankDetails')
        .select('uuid')
        .eq('uuid', userId)
        .single();

      if (bankError || !bankDetails) {
        console.error('Error fetching bank details:', bankError?.message || 'No bank details found');
        alert('Failed to submit payout request. Bank details not found.');
        return;
      }

      // Insert payout request into database
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([{
          userId: userId,
          amount: payoutAmount,
          status: 'pending',
          bank_account_uuid: bankDetails.uuid,
          bankname: bankName,
          accountname: accountName,
          accountnumber: accountNumber,
          reference: reference,
          transaction_reference: reference, // Assuming transaction_reference is same as reference
          createdat: new Date().toISOString(),
          completedat: null
        }])
        .select();
      
      if (error) {
        console.error('Error submitting payout request:', error);
        alert('Failed to submit payout request. Please try again.');
        return;
      }
      
      console.log('Payout request submitted:', data[0]);
      
      // Refresh payout history and balance
      await Promise.all([fetchPayoutHistory(), fetchBalance()]);
      
      alert('Payout request submitted successfully! Your funds are being processed and will be completed within 24 hours.');
      
    } catch (error) {
      console.error('Error submitting payout request:', error);
      alert('Failed to submit payout request. Please try again.');
    } finally {
      setLoading(false);
      setShowPayoutModal(false);
    }
  }

  // Support request modal
  const SupportModal = () => {
    const [supportMessage, setSupportMessage] = useState('');
    
    const handleSupportRequest = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('support_requests')
          .insert([{
            user_id: userId,
            message: supportMessage,
            status: 'pending'
          }])
          .select();
        
        if (error) {
          console.error('Error submitting support request:', error.message);
          alert('Failed to submit support request. Please try again.');
          return;
        }
        
        console.log('Support request submitted:', data[0]);
        alert('Your request has been submitted. Our support team will contact you shortly.');
        setShowSupportModal(false);
        setSupportMessage('');
      } catch (error) {
        console.error('Error submitting support request:', error);
        alert('Failed to submit support request. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
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
            {/* Left Column - Balance & Financial Overview */}
            <div className="lg:col-span-1 space-y-6">
              {/* Financial Overview Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="bg-gradient-to-r from-[#FFC0CB] to-black p-2 rounded-lg mr-3">
                    <FiDollarSign className="text-white" size={16} />
                  </div>
                  Financial Overview
                </h3>
                {loadingBalance ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC0CB] mx-auto"></div>
                    <p className="text-gray-500 text-sm mt-2">Loading financial data...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">NGN {totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <p className="text-sm text-gray-600">Total Paid Out</p>
                      <p className="text-2xl font-bold text-green-600">NGN {paidOutAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-r from-[#FFC0CB] to-black rounded-xl p-4 text-white">
                      <p className="text-sm text-white/80">Available Balance</p>
                      <p className="text-2xl font-bold">NGN {availableBalance.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setShowPayoutModal(true)}
                  className="w-full bg-gradient-to-r from-[#FFC0CB] to-black text-white font-semibold py-3 px-6 rounded-2xl hover:shadow-lg transition-all duration-200 flex items-center justify-center text-sm disabled:opacity-50 mt-4"
                  disabled={loadingBalance || availableBalance <= 0}
                >
                  <BsCashStack className="mr-2" size={16} />
                  {availableBalance <= 0 ? 'No Balance Available' : 'Request Payout'}
                </button>
              </div>

              {/* Payout Summary */}
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
                                {formatDate(payout.createdat)} • Ref: {payout.reference}
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
                <div className="mb-6">
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <select
                    id="bankName"
                    name="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Select your bank</option>
                    {bankNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                  <input
                    type="text"
                    id="accountName"
                    name="accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent text-sm"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div className="mb-8">
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent text-sm"
                    placeholder="e.g., 0123456789"
                    maxLength="10"
                    pattern="\d{10}"
                    title="Account number must be 10 digits"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#FFC0CB] to-black text-white font-semibold py-3 px-6 rounded-2xl hover:shadow-lg transition-all duration-200 flex items-center justify-center text-base disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Saving Details...' : 'Save Bank Details'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showSupportModal && <SupportModal />}
      {showPayoutModal && <PayoutModal />}
    </div>
  );
}

export default Page;

