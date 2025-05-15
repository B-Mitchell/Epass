'use client';
import React, { useEffect, useState, useRef } from 'react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { useMyContext } from '@/app/context/createContext';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';

const ContactForm = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const { ticketPrice, ticketRoute, setTicketPrice, namedTicketCounts, numberOfTickets, selectedTickets, setSelectedTickets } = useMyContext();
  const router = useRouter();
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTicketsLocked, setIsTicketsLocked] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const isTicketsLockedRef = useRef(false);
  const paymentPendingRef = useRef(false);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  // Add a flag to track successful transactions
  const [isTransactionComplete, setIsTransactionComplete] = useState(false);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Monitor network status
  const [networkStatus, setNetworkStatus] = useState('');
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      toast.success('Network connection restored');
    };
    
    const handleOffline = () => {
      setNetworkStatus('offline');
      toast.error('Network connection lost');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    console.log('ContactForm mounted');
    return () => {
      console.log('ContactForm unmounted');
      (async () => {
        cleanupTimer();
        if (isTicketsLockedRef.current && paymentPendingRef.current && sessionId) {
          console.log('Unmount cleanup: Releasing tickets');
          await releaseLockedTickets(sessionId);
        }
      })();
    };
  }, [sessionId]);

  useEffect(() => {
    console.log('ContactForm mounted');
    console.log('Current state:', { ticketPrice, selectedTickets, isTransactionComplete });
    if (!isTransactionComplete) {
      if (isNaN(ticketPrice) || ticketPrice === undefined || ticketPrice === null) {
        console.error('Invalid ticket price:', ticketPrice);
        toast.error('Invalid ticket price.');
        router.back();
        return;
      }
      if (!selectedTickets || Object.keys(selectedTickets).length === 0) {
        console.error('No tickets selected.');
        toast.error('No tickets selected. Redirecting...');
        setTimeout(() => router.back(), 1000);
        return;
      }
      checkIfTicketIsSoldOut();
    }
    return () => {
      console.log('ContactForm unmounted');
      (async () => {
        cleanupTimer();
        if (isTicketsLockedRef.current && paymentPendingRef.current && sessionId) {
          console.log('Unmount cleanup: Releasing tickets');
          await releaseLockedTickets(sessionId);
        }
      })();
    };
  }, [ticketPrice, selectedTickets, sessionId, isTransactionComplete]);

  const validateForm = () => {
    if (!name.trim()) {
      toast.error('Please enter your name.');
      return false;
    }
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number.');
      return false;
    }
    if (!/^\d+$/.test(phoneNumber.trim())) {
      toast.error('Please enter a valid phone number (numbers only).');
      return false;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const lockTickets = async () => {
    console.log('lockTickets called - Current state:', { isTicketsLocked, paymentPending });
    if (validateForm()) {
      if (!isTicketsLocked && Object.keys(selectedTickets).length > 0) {
        await handleLockingTickets();
      } else {
        toast.error("An issue occurred while trying to lock the selected tickets. Please ensure you have selected tickets and try again.");
      }
    }
  };

  const handleLockingTickets = async () => {
    console.log('handleLockingTickets called', { selectedTickets });
    try {
      setIsProcessing(true);
      await checkIfTicketIsSoldOut();
      if (ticketPrice === 0) {
        await handleFreeTicket();
        return true;
      }
      const sessionId = crypto.randomUUID();
      setSessionId(sessionId);
      sessionIdRef.current = sessionId;
  
      // Build tickets array
      const tickets = Object.entries(selectedTickets)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketId, quantity]) => ({
          ticket_uuid: ticketId,
          quantity,
        }));
  
      if (tickets.length === 0) {
        throw new Error('No tickets selected');
      }
  
      console.log('Reserving tickets:', { tickets, sessionId });
  
      const { data, error } = await supabase.rpc('reserve_tickets', {
        p_tickets: tickets,
        p_session_id: sessionId,
      });
  
      if (error) {
        console.error('Error reserving tickets:', error);
        if (error.message.includes('Ticket not found')) {
          toast.error(`One or more tickets not found. Please try again.`);
        } else if (error.message.includes('Insufficient stock')) {
          toast.error('Not enough tickets available. Please try again.');
        } else {
          toast.error('An error occurred while reserving tickets.');
        }
        throw new Error(`Error reserving tickets: ${error.message}`);
      }
  
      if (data === false) {
        toast.error('Not enough tickets available. Please try again.');
        throw new Error('Failed to reserve tickets');
      }
  
      console.log('Tickets reserved successfully!');
      setIsTicketsLocked(true);
      isTicketsLockedRef.current = true;
      setPaymentPending(true);
      paymentPendingRef.current = true;
      startTimer();
      return true;
    } catch (error) {
      console.error('Reservation process error:', error);
      await releaseLockedTickets(sessionId);
      toast.error("Couldn't reserve tickets");
      setIsTicketsLocked(false);
      isTicketsLockedRef.current = false;
      setSessionId(null);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const releaseLockedTickets = async (sessionId) => {
    console.log('releaseLockedTickets called', { sessionId, isTicketsLocked: isTicketsLockedRef.current });
    if (isTicketsLockedRef.current && sessionId) {
      try {
        const retry = async (fn, retries = 3, delay = 1000) => {
          for (let i = 0; i < retries; i++) {
            try {
              return await fn();
            } catch (err) {
              console.warn(`Retry ${i + 1}/${retries} failed:`, err);
              if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
              }
              throw err;
            }
          }
        };
  
        const { data, error } = await retry(async () => {
          return await supabase.rpc('release_tickets', {
            p_session_id: sessionId,
          });
        });
  
        if (error) {
          console.error('Error releasing tickets:', error);
          toast.error(`Failed to release tickets: ${error.message}`);
        } else {
          console.log(`Tickets released successfully. Deleted ${data} reservations.`);
          toast.success(`Tickets released. Freed ${data} reservation(s).`);
        }
      } catch (error) {
        console.error('Error calling release_tickets RPC:', error);
        toast.error('Error releasing tickets.');
      } finally {
        setIsTicketsLocked(false);
        isTicketsLockedRef.current = false;
        setPaymentPending(false);
        paymentPendingRef.current = false;
        setSessionId(null);
      }
    } else {
      console.log('Skipping release: Tickets not locked or no sessionId');
    }
  };

  const config = {
    public_key: 'FLWPUBK_TEST-fd2a26787364260bda7cd02898285fb3-X',
    tx_ref: Date.now(),
    amount: ticketPrice,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email,
      phone_number: phoneNumber,
      name,
    },
    customizations: {
      title: 'PAYMENT FOR TICKET',
      description: 'Payment for tickets',
      logo: '/images/Epass.png',
    },
  };

  const fwConfig = {
    ...config,
    text: 'Pay with Flutterwave!',
    callback: async (response) => {
      console.log('Payment callback - Response:', response);
      cleanupTimer();
      setPaymentPending(false);
      paymentPendingRef.current = false;
      try {
        if (response.status === 'successful') {
          await handlePaymentSuccess(response);
        } else {
          setPaymentSuccessful(false);
          await releaseLockedTickets(sessionId);
          toast.error('Payment failed. Please try again.');
          router.back();
        }
      } catch (error) {
        console.error(error);
      } finally {
        closePaymentModal();
      }
    },
    onClose: async () => {
      if (!paymentSuccessful && paymentPendingRef.current && isTicketsLockedRef.current) {
        cleanupTimer();
        await releaseLockedTickets(sessionId);
        setPaymentPending(false);
        paymentPendingRef.current = false;
        toast.info('Payment cancelled. Tickets have been released.');
      }
    },
  };


  const handlePaymentSuccess = async (response) => {
    console.log('handlePaymentSuccess called', { response, selectedTickets, sessionId });
    try {
      // Make sure sessionId is valid before proceeding
      if (!sessionId) {
        console.error('No valid session ID for purchase confirmation');
        toast.error('Payment session expired. Please try again.');
        throw new Error('Invalid session ID');
      }
  
      // Build tickets_purchased array - FIXED FORMAT
      const tickets_purchased = Object.entries(selectedTickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketId, quantity]) => ({
        ticket_uuid: ticketId,
        quantity,
        session_id: sessionId,
      }));

      if (tickets_purchased.length === 0) {
        console.error('No tickets selected for confirmation');
        toast.error('No tickets to confirm. Please try again.');
        throw new Error('No tickets selected');
      }
  
      // Fetch event data
      const { data: eventData, error: eventError } = await supabase
        .from('tickets')
        .select('*')
        .eq('uuid', ticketRoute)
        .single();
      if (eventError) {
        console.error('Error fetching event data:', eventError);
        toast.error('Error processing payment.');
        throw new Error('Error fetching event data');
      }
  
      // Save transaction first to ensure we record the payment
      const txnData = {
        name: response.customer.name,
        email: response.customer.email,
        phone_number: response.customer.phone_number,
        transaction_id: response.transaction_id,
        tx_ref: response.tx_ref,
        charged_amount: response.amount,
        event_id: ticketRoute,
        ticketsbought: numberOfTickets,
        ticketsInfo: namedTicketCounts,
      };
      await savetxn(txnData);
  
      // Generate QR code
      // const qrCode = await QRCode.toDataURL(response.transaction_id);
      
      // Confirm purchase
      console.log('Confirming purchase:', { tickets_purchased, sessionId });
  
      console.log('Payload for confirm_purchase:', JSON.stringify(tickets_purchased, null, 2));

      //attempt 3 times incase of network issues
      const retry = async (fn, retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (err) {
            console.warn(`Retry ${i + 1}/${retries} failed:`, err);
            if (i < retries - 1) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            throw err;
          }
        }
      };
      const { deletedCount } = await retry(() => confirmPurchase(tickets_purchased));
  
      if (!deletedCount || deletedCount === 0) {
        console.warn('No reservations deleted for session_id:', tickets_purchased[0].session_id);
        toast.error('No reservations found.');
        return;
      }
      
  
      // Send ticket email
      // const emailResponse = await fetch('/api/send-ticket', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     email: response.customer.email,
      //     ticketDetails: {
      //       ticketName: namedTicketCounts?.[Object.keys(selectedTickets)[0]] || 'General Admission',
      //       quantity: numberOfTickets,
      //       ticketPrice: response.amount,
      //     },
      //     eventDetails: {
      //       title: eventData.title,
      //       date: eventData.date,
      //       startTime: eventData.startTime,
      //       endTime: eventData.endTime,
      //       address: eventData.address,
      //     },
      //     qrCodeUrl: qrCode,
      //     transaction_id: response.transaction_id,
      //   }),
      // });
  
      // if (!emailResponse.ok) {
      //   console.error('Failed to send ticket email');
      //   toast.warn('Purchase confirmed, but failed to send ticket email. Please check your email later.');
      // }
  
      console.log(`Purchase confirmed. Deleted ${deletedCount} reservations.`);
      toast.success(`Purchase confirmed! Processed ${deletedCount} ticket(s).`);

      // Set transaction complete flag
      setIsTransactionComplete(true);
      setPaymentSuccessful(true);

      // Redirect to confirmation page
      console.log('Redirecting to payment-success with transaction_id:', response.transaction_id);
      await router.push(`/payment-success?transaction_id=${response.transaction_id}`);

      // Clear state after redirection
      setIsTicketsLocked(false);
      isTicketsLockedRef.current = false;
      setPaymentPending(false);
      paymentPendingRef.current = false;
      setSessionId(null);
      setSelectedTickets({});

      return true;
    } catch (error) {
      console.error('Purchase confirmation error:', error);
      toast.error('Failed to confirm purchase. Please contact support with transaction ID: ' + response?.transaction_id);
      
      // Despite the error, we should still set payment as successful to prevent auto-release of tickets
      // This ensures we don't release tickets that were actually confirmed but had some other error
      setPaymentSuccessful(true);
      
      return false;
    }
  }

  const confirmPurchase = async (tickets_purchased) => {
    // Validate tickets_purchased before sending
    if (!tickets_purchased || tickets_purchased.length === 0) {
      console.error('Invalid tickets_purchased array:', tickets_purchased);
      throw new Error('No tickets selected for confirmation');
    }
  
    // Validate session_id consistency
    const sessionIds = tickets_purchased.map((ticket) => ticket.session_id);
    const uniqueSessionIds = [...new Set(sessionIds)];
    if (uniqueSessionIds.length > 1) {
      console.error('Multiple session_ids found:', uniqueSessionIds);
      throw new Error('All tickets must have the same session_id');
    }
  
    if (!sessionIds[0]) {
      console.error('Missing session_id in tickets_purchased');
      throw new Error('Session ID cannot be null or empty');
    }
  
    console.log('Calling confirm_purchase with:', { tickets_purchased });
  
    const { data, error } = await supabase.rpc('confirm_purchase', {
      tickets_purchased,
    });
  
    if (error) {
      console.error('confirm_purchase RPC error:', error);
      throw new Error(`Failed to confirm purchase: ${error.message}`);
    }
  
    const deletedCount = data || 0; // Fallback to 0 if data is null
  
    return { deletedCount };
  };

  const savetxn = async (txnData) => {
    const { data: existingTxn, error: existingTxnError } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', txnData.transaction_id);
    if (existingTxnError) {
      console.error('Error checking existing transaction:', existingTxnError);
      toast.error('Error checking transaction.');
      return;
    }
    if (existingTxn && existingTxn.length > 0) {
      console.warn('Duplicate transaction detected. Skipping save.');
      return;
    }
    const { data, error } = await supabase
      .from('transactions')
      .insert(txnData)
      .select();
    if (error) {
      console.error('Error saving transaction:', error);
      toast.error('Error saving transaction.');
    }
    console.log('Transaction saved:', data);
  };

  const checkIfTicketIsSoldOut = async () => {
    try {
      let { data: queryData, error: queryError } = await supabase
        .from('ticketdata')
        .select('currentStock, ticketPrice')
        .eq('event_id', ticketRoute);
      if (queryError) {
        console.log('Sold out check error:', queryError);
        toast.error('Error checking ticket availability.');
        return;
      }
  
      if (queryData && queryData.length > 0) {
        const isFreeTicket = queryData.some((ticket) => ticket.price === 0);
        const currentStock = queryData[0].currentStock;
  
        // Get total reserved quantity
        const { data: reservations, error: resError } = await supabase
          .from('reservations')
          .select('quantity')
          .eq('ticket_uuid', queryData[0].uuid)
          .gt('expires_at', new Date().toISOString());
  
        const reservedQuantity = reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0;
  
        if (currentStock - reservedQuantity <= 0 && !isFreeTicket) {
          setIsSoldOut(true);
          toast.error('Tickets have been sold out! Redirecting...');
          setTimeout(() => router.back(), 1000);
        } else {
          setIsSoldOut(false);
        }
      }
    } catch (err) {
      console.log('Sold out check exception:', err);
      toast.error('Error checking ticket availability.');
    }
  };

  const updateStock = async () => {
    try {
      setIsProcessing(true);
      for (const ticketId in selectedTickets) {
        const quantityToDecrement = selectedTickets[ticketId];
        if (quantityToDecrement > 0) {
          const { data: currentTicketData, error: fetchError } = await supabase
            .from('ticketdata')
            .select('currentStock')
            .eq('uuid', ticketId)
            .single();
          if (fetchError) {
            console.error('Error fetching current stock:', fetchError);
            toast.error('Error fetching data, Please try again.');
            return;
          }
          if (currentTicketData) {
            const newStock = currentTicketData.currentStock - quantityToDecrement;
            const { error: updateError } = await supabase
              .from('ticketdata')
              .update({ currentStock: newStock })
              .eq('uuid', ticketId);
            if (updateError) {
              console.error('Error updating stock:', updateError);
              toast.error('Error registering ticket. Please try again.');
              return;
            }
          } else {
            console.warn(`Ticket with UUID ${ticketId} not found.`);
            toast.warn(`Could not find ticket information. Please try again.`);
            return;
          }
        }
      }
      console.log('Ticket stock updated successfully.');
      toast.success('Free ticket acquired successfully!');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('An unexpected error occurred during registration.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFreeTicket = async () => {
    try {
      if (validateForm()) {
        try {
          const { data: eventData, error: eventError } = await supabase
            .from('tickets')
            .select('*')
            .eq('uuid', ticketRoute)
            .single();
          if (eventError) {
            console.error('Error fetching event data:', eventError);
            toast.error('Error fetching event data. Please try again.');
            return;
          }
          await updateStock();
          const emailResponse = await fetch('/api/send-ticket', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              ticketDetails: {
                ticketName: selectedTickets.ticketName,
                quantity: numberOfTickets,
                ticketPrice: 0
              },
              eventDetails: {
                title: eventData.title,
                date: eventData.date,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                address: eventData.address
              }
            })
          });
          if (!emailResponse.ok) {
            console.error('Failed to send ticket email');
            toast.error('Failed to send ticket email. Please try again.');
            return;
          }
          toast.success('Free ticket registered successfully! Check your email for confirmation.');
          router.push('/payment-success');
        } catch (error) {
          console.error('Error processing free ticket:', error);
          toast.error('An error occurred while processing your ticket. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error handling free ticket:', error);
      toast.error('An error occurred while processing your ticket. Please try again.');
    }
  };

  const startTimer = () => {
    cleanupTimer();
    const paymentTimeout = 4 * 60 * 1000;
    setTimeLeft(240);
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = setTimeout(() => {
      console.log('Timeout triggered after 4 minutes');
      handleTimeout();
    }, paymentTimeout);
  };

  const handleTimeout = async () => {
    cleanupTimer();
    if (isTicketsLockedRef.current || paymentPendingRef.current) {
      try {
        setPaymentPending(false);
        paymentPendingRef.current = false;
        if (isTicketsLockedRef.current && sessionIdRef.current) {
          await releaseLockedTickets(sessionIdRef.current);
          setIsTicketsLocked(false);
          isTicketsLockedRef.current = false;
          console.log('Tickets released due to timeout');
        } else {
          console.log('Tickets were already released or never locked');
        }
        toast.warn('Payment session expired.');
        router.back();
      } catch (error) {
        console.error('Timeout cleanup failed:', error);
        toast.error('Error during timeout cleanup');
      }
    } else {
      console.log('Timeout skipped - No tickets locked or payment pending');
      toast.info('Session expired, but no action needed.');
      router.back();
    }
  };

  const unlockTickets = async () => {
    console.log('unlockTickets called');
    try {
      setIsProcessing(true);
      await releaseLockedTickets(sessionId);
      cleanupTimer();
      setPaymentPending(false);
      paymentPendingRef.current = false;
      setIsTicketsLocked(false);
      isTicketsLockedRef.current = false;
      router.back();
    } catch (error) {
      console.error('Error unlocking tickets:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanupTimer = () => {
    console.log('Cleaning up timer');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setTimeLeft(null);
  };

  return (
    <div>
      {ticketPrice > 0 && isTicketsLocked && (
        <div className="mb-4 p-4 border rounded-md bg-gray-100">
          <div className="flex flex-col gap-2">
            <div className="flex items-center bg-green-100 text-green-700 p-3 rounded-md">
              <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Tickets reserved! Pay within{' '}
              <span className="text-red-600 font-semibold text-[1.2rem]">
                {timeLeft !== null
                  ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
                  : '0:00'}
              </span>
            </div>
            <button
              onClick={unlockTickets}
              className="bg-[#FFC0CB] hover:bg-transparent hover:text-black rounded-2xl hover:scale-110 transition border border-[#FFC0CB] text-white font-normal py-2 px-4 w-[70%] md:w-[50%] mx-auto"
              disabled={isProcessing}
            >
              Unlock Tickets
            </button>
          </div>
        </div>
      )}
      <p className="text-center font-bold text-[1.4rem] my-4">Fill the form with your contact details.</p>
      <form onSubmit={(e) => e.preventDefault()} className="border border-[#FFC0CB] md:w-[60%] w-[80%] m-auto rounded-xl p-6 mb-8">
        <p className="text-[1.2rem] my-2">Name:</p>
        <input
          type="text"
          placeholder="eg: John Doe"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-[#FFC0CB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mb-2"
        />
        <p className="text-[1.2rem] my-2">Phone Number:</p>
        <input
          type="text"
          placeholder="eg: 81********65"
          required
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="border border-[#FFC0CB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mb-2"
        />
        <p className="text-[1.2rem] my-2">Email:</p>
        <input
          type="email"
          placeholder="eg: johnDoe@gmail.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-[#FFC0CB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition"
        />
        {isSoldOut && ticketPrice > 0 ? (
          <button className="hover:bg-transparent bg-[red] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110">
            SOLD OUT!
          </button>
        ) : ticketPrice === 0 ? (
          <button
            className="hover:bg-transparent bg-[#FFC0CB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110"
            disabled={isProcessing}
            onClick={handleFreeTicket}
          >
            Register
          </button>
        ) : !isTicketsLocked ? (
          <button
            className="hover:bg-transparent bg-[#FFC0CB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-black mb-1 hover:scale-110"
            onClick={lockTickets}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="animate-pulse">Locking Tickets...</span>
            ) : (
              'Lock Tickets'
            )}
          </button>
        ) : (
          <FlutterWaveButton
            className="hover:bg-transparent bg-[#FFC0CB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110"
            disabled={isProcessing || isSoldOut}
            {...fwConfig}
            title="Secure payment with Flutterwave"
          />
        )}
      </form>
    </div>
  );
};

export default ContactForm;
