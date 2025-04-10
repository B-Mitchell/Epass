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
  const paymentTimeout = 3 * 60 * 1000; // 3 minutes timeout
  const [timeLeft, setTimeLeft] = useState(paymentTimeout / 1000); // in seconds
  const countdownInterval = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTicketsLocked, setIsTicketsLocked] = useState(false);
  const paymentTimeoutId = useRef(null);
  const paymentPendingRef = useRef(false);

  useEffect(() => {
    // Validation checks moved here
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

    // Release tickets on unmount and beforeunload
    const handleBeforeUnload = () => {
      if (isTicketsLocked && paymentPending) {
        console.log('User leaving page, releasing locked tickets.');
        releaseLockedTickets();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (paymentTimeoutId.current) {
        clearTimeout(paymentTimeoutId.current); // Clear timeout
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isTicketsLocked && paymentPending) {
        console.log('Component unmounted, releasing locked tickets.');
        releaseLockedTickets();
      }
    };
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
    // Basic phone number format check (you might want a more robust one)
    if (!/^\d+$/.test(phoneNumber.trim())) {
        toast.error('Please enter a valid phone number (numbers only).');
        return false;
    }
    if (!email.trim()) {
        toast.error('Please enter your email address.');
        return false;
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        toast.error('Please enter a valid email address.');
        return false;
    }
    return true;
};

  const lockTickets = async () => {
    if (validateForm()) { // First, validate the form data
        if (!isTicketsLocked && Object.keys(selectedTickets).length > 0) {
            await handleLockingTickets();
        } else {
            toast.error("An issue occurred while trying to lock the selected tickets. Please ensure you have selected tickets and try again.");
        }
    }
    // If validation fails, validateForm() will show a toast error, and this function will simply return.
};

  const config = {
    // public_key: 'FLWPUBK-f2046835e3ac43d0aa83b4d751157c6b-X',
    public_key: 'FLWPUBK_TEST-fd2a26787364260bda7cd02898285fb3-X', // Ensure this is your correct public key
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
      logo: '/images/Epass.png', // Corrected logo path
    },
  };

  const releaseLockedTickets = async () => {
    if (isTicketsLocked) {
      console.log('Releasing locked tickets...');
      try {
        // Transform selectedTickets into the required format
        const ticketsToRelease = Object.entries(selectedTickets).map(([ticketId, quantity]) => ({
          ticket_uuid: ticketId,
          quantity: quantity,
        }));

        const { error } = await supabase.rpc('release_locked_tickets', {
          tickets_to_release: ticketsToRelease,
        });

        if (error) {
          console.error('Error releasing locked tickets:', error);
          toast.error('Failed to release locked tickets.');
        } else {
          console.log('Locked tickets released.');
          toast.success('Locked tickets released.');
        }
      } catch (error) {
        console.error('Error calling release_locked_tickets RPC:', error);
        toast.error('Error releasing locked tickets.');
      } finally {
        setIsTicketsLocked(false); // Update local state on release attempt
      }
    }
  };

  const fwConfig = {
    ...config,
    text: 'Pay with Flutterwave!',
    callback: async (response) => {
      console.log(response);
      setPaymentPending(false);
      paymentPendingRef.current = false;
      if (paymentTimeoutId.current) {
        clearTimeout(paymentTimeoutId.current);
      }

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
            // Handle error (e.g., alert user, log error)
          } else {
            console.log('Purchase confirmed successfully.');
            toast.success('Purchase confirmed successfully.');
          }
        } catch (error) {
          console.error('Error calling confirm_purchase RPC:', error);
          toast.error('Error processing purchase.');
          // Handle error
        }

        router.push(`/payment-success?transaction_id=${response.transaction_id}`);
        return true;
      } else {
        await releaseLockedTickets();
        toast.error('Payment failed. Please try again.');
        router.back();
      }
      closePaymentModal();
    },
    onClose: async () => {
      if (paymentPendingRef.current && isTicketsLocked) {
        console.log('User closed the payment modal without paying.');
        await releaseLockedTickets();
        setIsTicketsLocked(false);
        if (paymentTimeoutId.current) {
          clearTimeout(paymentTimeoutId.current);
        }
      }

      // Email service
    },
  };

  const savetxn = async (txnData) => {
    const { data, error } = await supabase.from('transactions').insert(txnData).select();

    if (error) {
      console.error('Error saving transaction:', error);
      toast.error('Error saving transaction.');
    }
    console.log(data);
  };

  //check if the ticket is sold out
  const checkIfTicketIsSoldOut = async () => {
    try {
      let { data: queryData, error: queryError } = await supabase.from('ticketdata').select('currentStock').eq('event_id', ticketRoute);
      if (queryError) {
        console.log(queryError);
      } else {
        // check if ticket is sold out and update state
        if (queryData && queryData.length > 0) {
          const currentStock = queryData[0].currentStock;
          if (currentStock === 0) {
            setIsSoldOut(true);
            toast.error('Tickets have been sold out! redirecting...');
            setTimeout(() => router.back(), 1000);
          }
        }
      }
    } catch (err) {
      console.log('your error is: ' + err);
    }
  };

  // Add this function to your ContactForm component
    const handleLockingTickets = async () => {
      try {
          setIsProcessing(true);

          await checkIfTicketIsSoldOut();

          console.log('Attempting to lock tickets...');
          let allTicketsLocked = true; // Flag to track overall success
          for (let ticketId in selectedTickets) {
              const quantity = selectedTickets[ticketId];
              if (quantity > 0) {
                  const { data, error } = await supabase.rpc('purchase_tickets', {
                      ticket_uuid: ticketId,
                      quantity: quantity,
                  });
                  if (error) {
                      allTicketsLocked = false; // Set flag to false if any error occurs
                      throw new Error(`Error purchasing ticket ${ticketId}: ${error.message}`);
                  }
              }
          }

          if (allTicketsLocked) {
              console.log('Tickets locked successfully!');
              setIsTicketsLocked(true);
              setPaymentPending(true);
              paymentPendingRef.current = true;

              // Start countdown
              setTimeLeft(paymentTimeout / 1000); // Reset countdown
              countdownInterval.current = setInterval(() => {
                setTimeLeft(prev => {
                  if (prev <= 1) {
                    clearInterval(countdownInterval.current);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);

              // Set payment timeout only after successful lock
              paymentTimeoutId.current = setTimeout(() => {
                  if (paymentPending && isTicketsLocked) {
                      console.log('Payment time expired.');
                      setPaymentPending(false);
                      paymentPendingRef.current = false;
                      setIsTicketsLocked(false);
                      releaseLockedTickets();
                      toast.warn('Your payment session has expired. Please try again.');
                      router.back();
                  }
              }, paymentTimeout);
              return true;
          } else {
              // If not all tickets locked, release them
              await releaseLockedTickets();
              toast.error("Couldn't reserve all tickets. Please try again.");
              return false;
          }
      } catch (error) {
          console.error('Payment process error:', error);
          toast.error(`Couldn't reserve tickets: ${error.message}`);
          setIsTicketsLocked(false);
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  const updateStock = async () => {
    try {
        setIsProcessing(true); // Indicate processing

        for (const ticketId in selectedTickets) {
            const quantityToDecrement = selectedTickets[ticketId];
            if (quantityToDecrement > 0) {
                // Fetch the current stock
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

                    // Update the stock
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
        setIsProcessing(false); // Reset processing state
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

  return (
    <div>
      {ticketPrice > 0 ? 
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
          Tickets Locked! Pay within {Math.floor(timeLeft / 60)}m {timeLeft % 60}s.
        </div>
      )}
    </div> : null}

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
            className="hover:bg-transparent bg-[#FFC0CB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110" disabled={isProcessing || isSoldOut}
            onClick={handleFreeTicket}
          >
            Register
          </button>
        ) : (
          <FlutterWaveButton className="hover:bg-transparent bg-[#FFC0CB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110 " disabled={isProcessing || isSoldOut}
          {...fwConfig} title="Secure payment with Flutterwave" />
        )}
      </form>
    </div>
  );
};

export default ContactForm;