'use client';
import React, { useEffect, useState, useRef } from 'react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { useMyContext } from '@/app/context/createContext';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';

const ContactForm = () => {
  const [contacts, setContacts] = useState([{ name: '', phoneNumber: '', email: '', ticket_uuid: '' }]);
  const [useSingleEmail, setUseSingleEmail] = useState(false);
  const [ticketOptions, setTicketOptions] = useState([]);
  const { ticketPrice, ticketRoute, setTicketPrice, namedTicketCounts, numberOfTickets, selectedTickets, setSelectedTickets,refCode } = useMyContext();
  const router = useRouter();
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTicketsLocked, setIsTicketsLocked] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [isTransactionComplete, setIsTransactionComplete] = useState(false);
  const isTicketsLockedRef = useRef(false);
  const paymentPendingRef = useRef(false);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const handleOnline = () => {
      toast.success('Network connection restored');
    };
    const handleOffline = () => {
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
    const handleBeforeUnload = async (event) => {
      setSelectedTickets({});
      if (isTicketsLockedRef.current && paymentPendingRef.current && sessionIdRef.current) {
        await releaseLockedTickets(sessionIdRef.current);
      }
      // Show browser confirmation dialog
      event.preventDefault();
      event.returnValue = '';
    };
  
    if (!isTransactionComplete) {
      if (isNaN(ticketPrice) || ticketPrice === undefined || ticketPrice === null) {
        toast.error('Invalid ticket price.');
        router.back();
        return;
      }
      if (!selectedTickets || Object.keys(selectedTickets).length === 0) {
        toast.error('No tickets selected. Redirecting...');
        setTimeout(() => router.back(), 100);
        return;
      }
      checkIfTicketIsSoldOut();
      fetchTicketOptions();
    }
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      (async () => {
        cleanupTimer();
        if (isTicketsLockedRef.current && paymentPendingRef.current && sessionId) {
          await releaseLockedTickets(sessionId);
        }
      })();
    };
  }, [ticketPrice, selectedTickets, sessionId, isTransactionComplete]);

  const fetchTicketOptions = async () => {
    try {
      const ticketIds = Object.keys(selectedTickets).filter((id) => selectedTickets[id] > 0);
      const { data, error } = await supabase
        .from('ticketdata')
        .select('uuid, ticketName')
        .in('uuid', ticketIds);
      if (error) throw error;
      setTicketOptions(data.map((t) => ({ uuid: t.uuid, name: t.ticketName })));
    } catch (error) {
      console.error('Error fetching ticket options:', error);
      toast.error('Error loading ticket types.');
    }
  };

  const validateForm = () => {
    if (useSingleEmail && contacts.length !== 1) {
      toast.error('Please provide one contact for single email delivery.');
      return false;
    }
    if (!useSingleEmail && contacts.length !== numberOfTickets) {
      toast.error(`Please provide contact details for all ${numberOfTickets} tickets.`);
      return false;
    }

    for (let i = 0; i < contacts.length; i++) {
      const { name, phoneNumber, email, ticket_uuid } = contacts[i];
      if (!name.trim()) {
        toast.error(`Please enter a name for contact ${i + 1}.`);
        return false;
      }
      if (!phoneNumber.trim()) {
        toast.error(`Please enter a phone number for contact ${i + 1}.`);
        return false;
      }
      if (!/^\d+$/.test(phoneNumber.trim())) {
        toast.error(`Please enter a valid phone number (numbers only) for contact ${i + 1}.`);
        return false;
      }
      if (!email.trim()) {
        toast.error(`Please enter an email address for contact ${i + 1}.`);
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        toast.error(`Please enter a valid email address for contact ${i + 1}.`);
        return false;
      }
      if (!useSingleEmail && !ticket_uuid) {
        toast.error(`Please select a ticket type for contact ${i + 1}.`);
        return false;
      }
    }

    if (!useSingleEmail) {
      const ticketCounts = {};
      contacts.forEach((contact) => {
        ticketCounts[contact.ticket_uuid] = (ticketCounts[contact.ticket_uuid] || 0) + 1;
      });
      for (const ticketId in selectedTickets) {
        const selectedCount = ticketCounts[ticketId] || 0;
        if (selectedCount !== selectedTickets[ticketId]) {
          toast.error(`Selected ${selectedCount} ${ticketOptions.find((t) => t.uuid === ticketId)?.name || 'tickets'}, but ${selectedTickets[ticketId]} were purchased.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleAddContact = () => {
    if (useSingleEmail) {
      toast.error('Cannot add more contacts when using single email delivery.');
      return;
    }
    if (contacts.length < numberOfTickets) {
      setContacts([...contacts, { name: '', phoneNumber: '', email: '', ticket_uuid: '' }]);
    } else {
      toast.error(`Cannot add more contacts. You have selected ${numberOfTickets} tickets.`);
    }
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index][field] = value;
    setContacts(updatedContacts);
  };

  const handleSingleEmailToggle = () => {
    setUseSingleEmail(!useSingleEmail);
    if (!useSingleEmail) {
      setContacts([{ name: '', phoneNumber: '', email: '', ticket_uuid: '' }]);
    } else if (contacts.length === 1) {
      setContacts([{ name: '', phoneNumber: '', email: '', ticket_uuid: '' }]);
    }
  };

  const lockTickets = async () => {
    if (validateForm()) {
      if (!isTicketsLocked && Object.keys(selectedTickets).length > 0) {
        await handleLockingTickets();
      } else {
        toast.error("An issue occurred while trying to lock the selected tickets.");
      }
    }
  };

  const handleLockingTickets = async () => {
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

      const tickets = Object.entries(selectedTickets)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketId, quantity]) => ({
          ticket_uuid: ticketId,
          quantity,
        }));

      if (tickets.length === 0) {
        throw new Error('No tickets selected');
      }

      const { data, error } = await supabase.rpc('reserve_tickets', {
        p_tickets: tickets,
        p_session_id: sessionId,
      });

      if (error) {
        toast.error(error.message.includes('Ticket not found') ? 'One or more tickets not found.' : 'Not enough tickets available.');
        throw new Error(`Error reserving tickets: ${error.message}`);
      }

      if (data === false) {
        toast.error('Not enough tickets available.');
        throw new Error('Failed to reserve tickets');
      }

      setIsTicketsLocked(true);
      isTicketsLockedRef.current = true;
      setPaymentPending(true);
      paymentPendingRef.current = true;
      startTimer();
      return true;
    } catch (error) {
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
    if (isTicketsLockedRef.current && sessionId) {
      try {
        const retry = async (fn, retries = 3, delay = 1000) => {
          for (let i = 0; i < retries; i++) {
            try {
              return await fn();
            } catch (err) {
              console.warn(`Retry ${i + 1}/${retries} failed:`, err);
              if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, delay));
              else throw err;
            }
          }
        };
        
        const { data, error } = await retry(async () => {
          return await supabase.rpc('release_tickets', {
            p_session_id: sessionId,
          });
        });

        if (error) {
          toast.error(`Failed to release tickets: ${error.message}`);
        } else {
          toast.success(`Tickets released. Freed ${data} reservation(s).`);
          setSelectedTickets({});
        }
      } catch (error) {
        toast.error('Error releasing tickets.');
      } finally {
        setIsTicketsLocked(false);
        isTicketsLockedRef.current = false;
        setPaymentPending(false);
        paymentPendingRef.current = false;
        setSessionId(null);
      }
    }
  };

  const config = {
    //public_key: 'FLWPUBK_TEST-fd2a26787364260bda7cd02898285fb3-X',
    public_key: 'FLWPUBK-f2046835e3ac43d0aa83b4d751157c6b-X',
    tx_ref: Date.now().toString(),
    amount: ticketPrice,
    currency: 'NGN',
    payment_options: 'card,banktransfer,mobilemoney,ussd',
    customer: {
      email: contacts[0].email,
      phone_number: contacts[0].phoneNumber,
      name: contacts[0].name,
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
      cleanupTimer();
      setPaymentPending(false);
      paymentPendingRef.current = false;
    try {
      console.log('Flutterwave callback response:', response); // Debug log
      if (['completed', 'pending', 'successful'].includes(response.status?.toLowerCase())) {
        await handlePaymentSuccess(response);
      } else {
        setPaymentSuccessful(false);
        console.log(response)
        await releaseLockedTickets(sessionId);
        toast.error('Payment failed. Please try again.');
        router.back();
      }
    } catch (error) {
      console.error('Callback error:', error);
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

  const savetxn = async (txnData) => {
    const { data: existingTxn, error: existingTxnError } = await supabase
      .from('transactions')
      .select('transaction_id')
      .eq('transaction_id', txnData.transaction_id);
    if (existingTxnError) {
      console.error('Error checking transaction:', existingTxnError);
      toast.error('Error checking transaction.');
      return null;
    }
    if (existingTxn && existingTxn.length > 0) {
      console.warn('Duplicate transaction detected. Skipping save.');
      return null;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(txnData)
      .select('transaction_id')
      .single();
    if (error) {
      console.error('Error saving transaction:', error);
      toast.error('Error saving transaction.');
      return null;
    }
    console.log('Transaction saved:', data);
    return data.transaction_id;
  };

  const retry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        console.warn(`Retry ${i + 1}/${retries} failed:`, {
          message: err.message,
          details: err.details,
          hint: err.hint
        });
        if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, delay));
        else throw err;
      }
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      console.log('Flutterwave response:', {
        transaction_id: response.transaction_id,
        type: typeof response.transaction_id,
        tx_ref: response.tx_ref,
        amount: response.amount,
      });
      if (!sessionIdRef.current) {
        toast.error('Payment session expired. Please try again.');
        throw new Error('Invalid session ID');
      }
  
      // Validate session_id format
      if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sessionIdRef.current)) {
        console.error('Invalid session_id:', sessionIdRef.current);
        toast.error('Invalid session ID format. Please try again.');
        throw new Error(`Invalid session ID format: ${sessionIdRef.current}`);
      }
  
      // Fetch ticketDetails first
      const ticketDetails = await Promise.all(
        Object.entries(selectedTickets)
          .filter(([_, quantity]) => quantity > 0)
          .map(async ([ticketId, quantity]) => {
            const { data: ticketData, error: ticketError } = await supabase
              .from('ticketdata')
              .select('ticketName, ticketPrice')
              .eq('uuid', ticketId)
              .single();
            if (ticketError) throw new Error(`Error fetching ticket data: ${ticketError.message}`);
            return { ticketName: ticketData.ticketName, quantity, ticketPrice: ticketData.ticketPrice, ticket_uuid: ticketId };
          })
      );
  
      // Construct tickets_purchased
      const tickets_purchased = useSingleEmail
        ? Object.entries(selectedTickets)
            .filter(([_, quantity]) => quantity > 0)
            .flatMap(([ticketId, quantity]) =>
              Array.from({ length: quantity }, () => ({
                ticket_uuid: ticketId,
                quantity: 1,
                email: contacts[0].email,
                ticket_name: ticketDetails.find((t) => t.ticket_uuid === ticketId)?.ticketName || 'Unknown',
              }))
            )
        : contacts.map((contact) => ({
            ticket_uuid: contact.ticket_uuid,
            quantity: 1,
            email: contact.email,
            ticket_name: ticketDetails.find((t) => t.ticket_uuid === contact.ticket_uuid)?.ticketName || 'Unknown',
          }));
  
      if (tickets_purchased.length === 0) {
        toast.error('No tickets selected. Please try again.');
        throw new Error('No tickets selected');
      }
  
      // Validate ticket_uuid and ticket_name
      tickets_purchased.forEach((ticket, index) => {
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ticket.ticket_uuid)) {
          console.error(`Invalid ticket_uuid at index ${index}:`, ticket.ticket_uuid);
          throw new Error(`Invalid ticket UUID format: ${ticket.ticket_uuid}`);
        }
        if (!ticket.ticket_name || typeof ticket.ticket_name !== 'string') {
          console.warn(`Invalid ticket_name at index ${index}:`, ticket.ticket_name);
          ticket.ticket_name = 'Unknown';
        }
      });
  
      console.log('Tickets purchased for confirm_purchase:', JSON.stringify(tickets_purchased, null, 2));
  
      const { data: eventData, error: eventError } = await supabase
        .from('tickets')
        .select('*')
        .eq('uuid', ticketRoute)
        .single();
      if (eventError) {
        toast.error('Error processing payment.');
        throw new Error('Error fetching event data');
      }
  
      const txnData = {
        name: contacts[0].name,
        email: contacts[0].email,
        phone_number: contacts[0].phoneNumber,
        transaction_id: parseInt(response.transaction_id),
        tx_ref: response.tx_ref,
        referral_code:refCode || null,
        charged_amount: response.amount,
        event_id: ticketRoute,
        ticketsbought: numberOfTickets,
        ticketsInfo: tickets_purchased.map((ticket) => ({
          unique_ticket_id: null, // Placeholder
          ticketName: ticket.ticket_name,
          email: ticket.email,
        })),
      };
  
      const transactionId = await savetxn(txnData);
      if (!transactionId) throw new Error('Failed to save transaction');
  
      const { data: ticketInstanceData, error: createError } = await retry(async () => {
        return await supabase.rpc('create_ticket_instances', {
          p_tickets_purchased: tickets_purchased,
          p_transaction_id: transactionId,
          p_email: contacts[0].email,
        });
      });
      if (createError) {
        console.error('Create ticket instances error:', createError.message, createError.details, createError.hint);
        toast.error(`Failed to create tickets: ${createError.message}`);
        throw new Error(`Failed to create ticket instances: ${createError.message}`);
      }
  
      // Extract tickets_created and unique_ticket_ids
      const { tickets_created, unique_ticket_ids } = ticketInstanceData;
      if (!unique_ticket_ids || unique_ticket_ids.length !== tickets_purchased.length) {
        console.error('Mismatch in unique_ticket_ids:', unique_ticket_ids, tickets_purchased);
        throw new Error('Invalid unique_ticket_ids returned from create_ticket_instances');
      }
  
      // Construct individualTickets using server-generated unique_ticket_ids
      const individualTickets = tickets_purchased.map((ticket, index) => ({
        unique_ticket_id: unique_ticket_ids[index],
        ticket_uuid: ticket.ticket_uuid,
        ticketName: ticket.ticket_name,
        contact: useSingleEmail ? contacts[0] : contacts[index],
      }));
  
      // Update txnData.ticketsInfo with correct unique_ticket_ids
      txnData.ticketsInfo = individualTickets.map((t) => ({
        unique_ticket_id: t.unique_ticket_id,
        ticketName: t.ticketName,
        email: t.contact.email,
      }));
  
      // Update transaction with correct ticketsInfo
      const { error: updateTxnError } = await supabase
        .from('transactions')
        .update({ ticketsInfo: txnData.ticketsInfo })
        .eq('transaction_id', transactionId);
      if (updateTxnError) {
        console.error('Error updating transaction:', updateTxnError);
        toast.error('Error updating transaction data.');
      }
  
      const { deletedCount } = await retry(async () => {
        console.log('Calling confirm_purchase with:', {
          p_tickets_purchased: JSON.stringify(tickets_purchased, null, 2),
          p_session_id: sessionIdRef.current,
        });
        const { data, error } = await supabase.rpc('confirm_purchase', {
          p_tickets_purchased: tickets_purchased,
          p_session_id: sessionIdRef.current,
        });
        if (error) {
          console.error('Confirm purchase error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Failed to confirm purchase: ${error.message}`);
        }
        return { deletedCount: data || 0 };
      });
      if (deletedCount === 0) {
        console.warn('No reservations deleted. Checking reservations table...');
        const { data: reservations, error: resError } = await supabase
          .from('reservations')
          .select('*')
          .eq('session_id', sessionIdRef.current)
          .gt('expires_at', new Date().toISOString());
        console.log('Current reservations:', reservations, 'Error:', resError);
        toast.error('No valid reservations found. Tickets may have expired or been released.');
        throw new Error('No reservations found');
      }
  
      // Email sending
      for (const ticket of individualTickets) {
        try {
          // Generate QR code with just the ticket ID
          const qrCode = await QRCode.toDataURL(ticket.unique_ticket_id);
          
          // Get the actual ticket price from ticketDetails
          const ticketDetail = ticketDetails.find(t => t.ticket_uuid === ticket.ticket_uuid);
          const actualTicketPrice = ticketDetail ? ticketDetail.ticketPrice : 0;
          
          const emailResponse = await fetch('/api/send-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: ticket.contact.email,
              ticketDetails: {
                ticketName: ticket.ticketName,
                quantity: 1,
                ticketPrice: actualTicketPrice
              },
              eventDetails: {
                title: eventData.title,
                date: eventData.date,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                address: eventData.address
              },
              qrCodeUrl: qrCode,
              uniqueTicketId: ticket.unique_ticket_id
            })
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.text();
            console.error(`Failed to send email to ${ticket.contact.email}:`, errorData);
            toast.warn(`Ticket confirmed, but email delivery to ${ticket.contact.email} failed. Please contact support.`);
          } else {
            console.log(`Email sent successfully to ${ticket.contact.email}`);
          }
        } catch (err) {
          console.error(`Error sending email to ${ticket.contact.email}:`, err);
          toast.warn(`Ticket confirmed, but email delivery to ${ticket.contact.email} failed. Please contact support.`);
        }
      }
  
      toast.success(`Purchase confirmed! Processed ${tickets_created} ticket(s).`);
      setIsTransactionComplete(true);
      setPaymentSuccessful(true);
      router.push(`/payment-success?transaction_id=${response.transaction_id}`);
      setIsTicketsLocked(false);
      isTicketsLockedRef.current = false;
      setPaymentPending(false);
      paymentPendingRef.current = false;
      setSessionId(null);
      setSelectedTickets({});
      setContacts([{ name: '', phoneNumber: '', email: '', ticket_uuid: '' }]);
    } catch (error) {
      console.error('Error confirming purchase:', error.message, error.stack);
      toast.error(`Failed to confirm purchase. Contact support with transaction ID: ${response?.transaction_id}`);
      setPaymentSuccessful(true);
    }
  };


  const checkIfTicketIsSoldOut = async () => {
    console.log('running bro...');
    try {
      let { data: queryData, error: queryError } = await supabase
        .from('ticketdata')
        .select('currentStock, ticketPrice')
        .eq('event_id', ticketRoute);
  
      if (queryError) {
        toast.error('Error checking ticket availability.');
        return;
      }
  
      if (queryData && queryData.length > 0) {
        const isFreeTicket = queryData.some((ticket) => ticket.ticketPrice === 0);
        const currentStock = queryData[0].currentStock;
  
        if (currentStock <= 0 && !isFreeTicket) {
          setIsSoldOut(true);
          toast.error('Tickets have been sold out! Redirecting...');
          setTimeout(() => router.back(), 1000);
        } else {
          setIsSoldOut(false);
          console.log(queryData);
        }
      }
    } catch (err) {
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
              toast.error('Error registering ticket. Please try again.');
              return;
            }
          } else {
            toast.warn(`Could not find ticket information. Please try again.`);
            return;
          }
        }
      }
      toast.success('Free ticket acquired successfully!');
    } catch (error) {
      toast.error('An unexpected error occurred during registration.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFreeTicket = async () => {
    try {
      if (validateForm()) {
        const { data: eventData, error: eventError } = await supabase
          .from('tickets')
          .select('*')
          .eq('uuid', ticketRoute)
          .single();
        if (eventError) {
          toast.error('Error fetching event data. Please try again.');
          return;
        }

        const ticketDetails = await Promise.all(
          Object.entries(selectedTickets)
            .filter(([_, quantity]) => quantity > 0)
            .map(async ([ticketId, quantity]) => {
              const { data: ticketData, error: ticketError } = await supabase
                .from('ticketdata')
                .select('ticketName')
                .eq('uuid', ticketId)
                .single();
              if (ticketError) throw new Error(`Error fetching ticket data: ${ticketError.message}`);
              return { ticketName: ticketData.ticketName, quantity, ticket_uuid: ticketId };
            })
        );

        const individualTickets = useSingleEmail
          ? Object.entries(selectedTickets)
              .filter(([_, quantity]) => quantity > 0)
              .flatMap(([ticketId, quantity]) => {
                const ticketName = ticketDetails.find((t) => t.ticket_uuid === ticketId)?.ticketName || 'Unknown';
                return Array.from({ length: quantity }, () => ({
                  unique_ticket_id: crypto.randomUUID(),
                  ticket_uuid: ticketId,
                  ticketName,
                  contact: contacts[0],
                }));
              })
          : contacts.map((contact) => ({
              unique_ticket_id: crypto.randomUUID(),
              ticket_uuid: contact.ticket_uuid,
              ticketName: ticketDetails.find((t) => t.ticket_uuid === contact.ticket_uuid)?.ticketName || 'Unknown',
              contact,
            }));

        const tickets_purchased = individualTickets.map((ticket) => ({
          ticket_uuid: ticket.ticket_uuid,
          session_id: crypto.randomUUID(),
          quantity: 1,
          email: ticket.contact.email,
          ticket_name: ticket.ticketName,
        }));

        const txnData = {
          name: contacts[0].name,
          email: contacts[0].email,
          phone_number: contacts[0].phoneNumber,
          transaction_id: parseInt(Date.now()),
          tx_ref: 'FREE_' + Date.now(),
          charged_amount: 0,
          event_id: ticketRoute,
          ticketsbought: numberOfTickets,
          ticketsInfo: individualTickets.map((t) => ({
            unique_ticket_id: t.unique_ticket_id,
            ticketName: t.ticketName,
            email: t.contact.email,
          })),
        };

        const transactionId = await savetxn(txnData);
        if (!transactionId) throw new Error('Failed to save transaction');

        const { data: ticketsCreated, error: createError } = await supabase.rpc('create_ticket_instances', {
          p_tickets_purchased: tickets_purchased,
          p_transaction_id: transactionId,
          p_email: contacts[0].email,
        });
        if (createError) {
          toast.error('Failed to create tickets.');
          throw new Error(`Failed to create ticket instances: ${createError.message}`);
        }

        await updateStock();

        for (const ticket of individualTickets) {
          try {
            // Generate QR code with just the ticket ID
            const qrCode = await QRCode.toDataURL(ticket.unique_ticket_id);
            
            // Get the actual ticket price from ticketDetails
            const ticketDetail = ticketDetails.find(t => t.ticket_uuid === ticket.ticket_uuid);
            const actualTicketPrice = ticketDetail ? ticketDetail.ticketPrice : 0;
            
            const emailResponse = await fetch('/api/send-ticket', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: ticket.contact.email,
                ticketDetails: {
                  ticketName: ticket.ticketName,
                  quantity: 1,
                  ticketPrice: actualTicketPrice
                },
                eventDetails: {
                  title: eventData.title,
                  date: eventData.date,
                  startTime: eventData.startTime,
                  endTime: eventData.endTime,
                  address: eventData.address
                },
                qrCodeUrl: qrCode,
                uniqueTicketId: ticket.unique_ticket_id
              })
            });

            if (!emailResponse.ok) {
              const errorData = await emailResponse.text();
              console.error(`Failed to send email to ${ticket.contact.email}:`, errorData);
              toast.warn(`Ticket confirmed, but email delivery to ${ticket.contact.email} failed. Please contact support.`);
            } else {
              console.log(`Email sent successfully to ${ticket.contact.email}`);
            }
          } catch (err) {
            console.error(`Error sending email to ${ticket.contact.email}:`, err);
            toast.warn(`Ticket confirmed, but email delivery to ${ticket.contact.email} failed. Please contact support.`);
          }
        }

        toast.success('Free ticket registered successfully! Check your email for confirmation.');
        router.push('/');
      }
    } catch (error) {
      console.error('Error processing free ticket:', error);
      toast.error('An error occurred while processing your ticket. Please try again.');
    }
  };

  const startTimer = () => {
    cleanupTimer();
    const paymentTimeout = 15 * 60 * 1000;
    setTimeLeft(900);
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
        }
        toast.warn('Payment session expired.');
        router.back();
      } catch (error) {
        toast.error('Error during timeout cleanup');
      }
    } else {
      toast.info('Session expired, but no action needed.');
      router.back();
    }
  };

  const unlockTickets = async () => {
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
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {useSingleEmail
            ? 'Ticket Reservation'
            : `Reserve ${numberOfTickets} Ticket${numberOfTickets > 1 ? 's' : ''}`}
        </h2>
        <p className="text-gray-600 mt-1">
          {useSingleEmail
            ? 'Provide your contact details for ticket delivery'
            : 'Assign tickets to individual attendees'}
        </p>
      </div>

      {/* Reservation Timer */}
      {ticketPrice > 0 && isTicketsLocked && (
        <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-green-50 text-green-700 p-4 rounded-lg border border-green-100">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Tickets reserved!</span>
              </div>
              <div className="bg-white px-3 py-1 rounded-md shadow-sm border border-green-100">
                <span className="mr-1 text-gray-600 text-sm">Pay within:</span>
                <span className="text-red-600 font-semibold text-lg">
                  {timeLeft !== null
                    ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
                    : '0:00'}
                </span>
              </div>
            </div>
            
            <button
              onClick={unlockTickets}
              className="bg-white text-gray-700 hover:bg-gray-50 rounded-lg py-2 px-4 border border-gray-300 transition-all shadow-sm hover:shadow font-medium text-sm flex items-center justify-center"
              disabled={isProcessing}
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Unlock Tickets
            </button>
          </div>
        </div>
      )}

      {/* Email Toggle Option */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={useSingleEmail}
              onChange={handleSingleEmailToggle}
              className="sr-only"
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${useSingleEmail ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${useSingleEmail ? 'translate-x-4' : 'translate-x-0'}`}></div>
          </div>
          <span className="ml-3 text-blue-900 font-medium">Send all tickets to one email</span>
        </label>
      </div>

      {/* Contact Forms */}
      <div className="space-y-6">
        {contacts.map((contact, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="bg-gray-50 p-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-700">
                {useSingleEmail ? 'Contact Information' : `Attendee ${index + 1}`}
              </h3>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="p-4 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  required
                  value={contact.name}
                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC0CB] focus:border-none outline-none transition-all"
                />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  required
                  value={contact.phoneNumber}
                  onChange={(e) => handleContactChange(index, 'phoneNumber', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC0CB] focus:border-none outline-none transition-all"
                />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  autoComplete="email"
                  required
                  value={contact.email}
                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC0CB] focus:border-none outline-none transition-all"
                />
              </div>
              
              {!useSingleEmail && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">Ticket Type</label>
                  <select
                    value={contact.ticket_uuid}
                    onChange={(e) => handleContactChange(index, 'ticket_uuid', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC0CB] focus:border-none outline-none transition-all"
                    required
                  >
                    <option value="">Select Ticket Type</option>
                    {ticketOptions.map((option) => (
                      <option key={option.uuid} value={option.uuid}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </form>
          </div>
        ))}
      </div>

      {/* Add Contact Button */}
      {!useSingleEmail && contacts.length < numberOfTickets && (
        <button
          onClick={handleAddContact}
          className="mt-6 w-full flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 py-3 px-4 rounded-lg border border-blue-100 transition-all"
        >
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Another Attendee
        </button>
      )}

      {/* Action Buttons */}
      <div className="mt-8">
        {isSoldOut && ticketPrice > 0 ? (
          <button className="w-full bg-red-500 text-white py-4 px-6 rounded-lg font-bold text-lg uppercase cursor-not-allowed opacity-80">
            Sold Out
          </button>
        ) : ticketPrice === 0 ? (
          <button
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all font-bold text-lg"
            disabled={isProcessing}
            onClick={handleFreeTicket}
          >
            Register Now
          </button>
        ) : !isTicketsLocked ? (
          <button
            className="w-full bg-gradient-to-r transition from-[#FFC0CB] to-black hover:from-black hover:to-[#FFC0CB] text-white py-4 px-6 rounded-lg shadow-md hover:shadow-lg font-bold text-lg"
            onClick={lockTickets}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Reserving Tickets...
              </div>
            ) : (
              'Reserve Tickets'
            )}
          </button>
        ) : (
          <FlutterWaveButton
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all font-bold text-lg flex items-center justify-center"
            disabled={isProcessing || isSoldOut}
            {...fwConfig}
          >
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Complete Secure Payment
          </FlutterWaveButton>
        )}
      </div>

      {/* Additional Info */}
      {ticketPrice > 0 && !isSoldOut && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          {isTicketsLocked ? 
            "Complete your payment to secure your tickets" : 
            "Tickets will be reserved for 10 minutes after locking"}
        </div>
      )}
      <p className="mt-4 text-center text-blue-600 text-sm font-semibold bg-blue-50 py-2 rounded-lg">
        More payment services coming soon...
      </p>
    </div>
  );
};

export default ContactForm;

