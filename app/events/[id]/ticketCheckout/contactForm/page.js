'use client';
import React, { useEffect, useState, useRef } from 'react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { useMyContext } from '@/app/context/createContext';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import logo from '@/public/images/Epass.png';
import { toast } from 'react-toastify';

const ContactForm = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const { ticketPrice, ticketRoute, setTicketRoute, ticketCheckoutData, numberOfTickets, selectedTickets } = useMyContext();
  const router = useRouter();
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTicketsLocked, setIsTicketsLocked] = useState(false);
  const isTicketsLockedRef = useRef(false);
  const paymentPendingRef = useRef(false);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    console.log('ContactForm mounted');
    return () => {
      console.log('ContactForm unmounted');
      cleanupTimer();
      if (isTicketsLockedRef.current && paymentPendingRef.current) {
        console.log('Unmount cleanup: Releasing tickets');
        releaseLockedTickets();
      }
    };
  }, []);

  useEffect(() => {
    console.log('useEffect for validation - ticketPrice:', ticketPrice, 'selectedTickets:', selectedTickets);
    if (isNaN(ticketPrice) || ticketPrice === undefined || ticketPrice === null) {
      console.error('Invalid ticket price.');
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
  }, [ticketPrice, router, selectedTickets]);

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

  const releaseLockedTickets = async () => {
    console.log('releaseLockedTickets called - Current state:', { isTicketsLocked, isTicketsLockedRef: isTicketsLockedRef.current });
    if (isTicketsLockedRef.current) {
      try {
        const ticketsToRelease = Object.entries(selectedTickets).map(([ticketId, quantity]) => ({
          ticket_uuid: ticketId,
          quantity: quantity,
        }));

        console.log('Releasing tickets:', ticketsToRelease);
        const { error } = await supabase.rpc('release_locked_tickets', {
          tickets_to_release: ticketsToRelease,
        });

        if (error) {
          console.error('Error releasing locked tickets:', error);
          toast.error('Failed to release locked tickets.');
        } else {
          console.log('Locked tickets released successfully.');
          toast.success('Locked tickets released.');
        }
      } catch (error) {
        console.error('Error calling release_locked_tickets RPC:', error);
        toast.error('Error releasing locked tickets.');
      } finally {
        setIsTicketsLocked(false);
        isTicketsLockedRef.current = false;
        console.log('releaseLockedTickets completed - State:', { isTicketsLocked, isTicketsLockedRef: isTicketsLockedRef.current });
      }
    } else {
      console.log('releaseLockedTickets skipped - No tickets locked');
    }
  };

  const fwConfig = {
    ...config,
    text: 'Pay with Flutterwave!',
    callback: async (response) => {
      console.log('Payment callback - Response:', response);
      cleanupTimer();
      setPaymentPending(false);
      paymentPendingRef.current = false;

      if (response.status === 'successful') {
        setPaymentPending(true);
        paymentPendingRef.current = true;
        const txnData = {
          name: response.customer.name,
          email: response.customer.email,
          phone_number: response.customer.phone_number,
          transaction_id: response.transaction_id,
          tx_ref: response.tx_ref,
          charged_amount: response.amount,
          event_id: ticketRoute,
          ticketsbought: numberOfTickets,
        };
        await savetxn(txnData);

        const ticketsToConfirm = Object.entries(selectedTickets).map(([ticketId, quantity]) => ({
          ticket_uuid: ticketId,
          quantity: quantity,
        }));

        try {
          const { error: confirmError } = await supabase.rpc('confirm_purchase', {
            tickets_purchased: ticketsToConfirm,
          });

          if (confirmError) {
            console.error('Error confirming purchase:', confirmError);
            toast.error('Error confirming purchase.');
          } else {
            console.log('Purchase confirmed successfully.');
            toast.success('Purchase confirmed successfully.');
          }
        } catch (error) {
          console.error('Error calling confirm_purchase RPC:', error);
          toast.error('Error processing purchase.');
        }

        router.push(`/payment-success?transaction_id=${response.transaction_id}`);
      } else {
        await releaseLockedTickets();
        toast.error('Payment failed. Please try again.');
        router.back();
      }
      closePaymentModal();
    },
    onClose: async () => {
      if (paymentPendingRef.current && isTicketsLockedRef.current) {
        cleanupTimer();
        await releaseLockedTickets();
        setPaymentPending(false);
        paymentPendingRef.current = false;
        toast.info('Payment cancelled. Tickets have been released.');
      }
    },
  };

  const savetxn = async (txnData) => {
    const { data, error } = await supabase.from('transactions').insert(txnData).select();
    if (error) {
      console.error('Error saving transaction:', error);
      toast.error('Error saving transaction.');
    }
    console.log('Transaction saved:', data);
  };

  const checkIfTicketIsSoldOut = async () => {
    try {
      let { data: queryData, error: queryError } = await supabase.from('ticketdata').select('currentStock').eq('event_id', ticketRoute);
      if (queryError) {
        console.log('Sold out check error:', queryError);
      } else if (queryData && queryData.length > 0) {
        const currentStock = queryData[0].currentStock;
        if (currentStock <= 0) {
          setIsSoldOut(true);
          toast.error('Tickets have been sold out! Redirecting...');
          setTimeout(() => router.back(), 1000);
        }
      }
    } catch (err) {
      console.log('Sold out check exception:', err);
    }
  };

  const handleLockingTickets = async () => {
    console.log('handleLockingTickets called');
    try {
      setIsProcessing(true);
      await checkIfTicketIsSoldOut();

      console.log('Attempting to lock tickets...', { selectedTickets });
      let allTicketsLocked = true;
      for (let ticketId in selectedTickets) {
        const quantity = selectedTickets[ticketId];
        if (quantity > 0) {
          console.log(`Locking ticket ${ticketId} with quantity ${quantity}`);
          const { data, error } = await supabase.rpc('purchase_tickets', {
            ticket_uuid: ticketId,
            quantity: quantity,
          });
          if (error) {
            allTicketsLocked = false;
            console.log(`Error locking ticket ${ticketId}:`, error);
            throw new Error(`Error purchasing ticket ${ticketId}: ${error.message}`);
          }
        }
      }

      if (allTicketsLocked) {
        console.log('Tickets locked successfully!');
        setIsTicketsLocked(true);
        isTicketsLockedRef.current = true;
        setPaymentPending(true);
        paymentPendingRef.current = true;
        
        startTimer();
        return true;
      } else {
        await releaseLockedTickets();
        toast.error("Couldn't reserve all tickets. Please try again.");
        return false;
      }
    } catch (error) {
      console.error('Payment process error:', error);
      toast.error(`Couldn't reserve tickets: ${error.message}`);
      setIsTicketsLocked(false);
      isTicketsLockedRef.current = false;
      console.log('State after error:', { isTicketsLocked, paymentPending });
      return false;
    } finally {
      setIsProcessing(false);
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
        await updateStock();
        return;
      }
    } catch (error) {
      console.error('Error handling free ticket:', error);
      toast.error('An error occurred while processing your ticket. Please try again.');
    }
  };

  const startTimer = () => {
    cleanupTimer();
    const paymentTimeout = 4 * 60 * 1000; // 4 minutes
    setTimeLeft(240); //240 secs

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
      console.log('Timeout triggered after 10 seconds');
      handleTimeout();
    }, paymentTimeout);
  };

  const handleTimeout = async () => {
    cleanupTimer();

    if (isTicketsLockedRef.current || paymentPendingRef.current) {
      try {
        setPaymentPending(false);
        paymentPendingRef.current = false;
        if (isTicketsLockedRef.current) {
          await releaseLockedTickets(); // Call release first
          setIsTicketsLocked(false);
          isTicketsLockedRef.current = false; // Reset after release
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
      {ticketPrice > 0 && (
        <div className="mb-4 p-4 border rounded-md bg-gray-100">
          <p className="font-semibold text-gray-700 mb-2">Secure Your Tickets:</p>
          {!isTicketsLocked ? (
            <button
              onClick={lockTickets}
              className="bg-[#FFC0CB] hover:bg-transparent hover:text-black rounded-2xl hover:scale-110 transition border border-[#FFC0CB] text-white font-normal py-2 px-4"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="animate-pulse">Locking Tickets...</span>
              ) : (
                'Lock Tickets'
              )}
            </button>
          ) : (
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
                  : '0:10'}
              </span>
            </div>
          )}
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
        {isSoldOut ? (
          <button className="hover:bg-transparent bg-[red] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110">
            SOLD OUT!
          </button>
        ) : ticketPrice === 0 ? (
          <button
            className="hover:bg-transparent bg-[#FFC0CB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110"
            disabled={isProcessing || isSoldOut}
            onClick={handleFreeTicket}
          >
            Register
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