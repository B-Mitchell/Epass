'use client'
import React, { useEffect, useState } from 'react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { useMyContext } from '@/app/context/createContext';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import logo from '@/public/images/Epass.png'

const ContactForm = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const { ticketPrice,  ticketRoute , setTicketRoute, ticketCheckoutData, numberOfTickets } = useMyContext();
  const router = useRouter();
  // state handling if ticket is sold out
  const [isSoldOut, setIsSoldOut] = useState(false);
  // const flutterwaveApiKey = process.env.FLUTTERWAVE_PUBLIC_KEY;

  const config = {
    // public_key: 'FLWPUBK-f2046835e3ac43d0aa83b4d751157c6b-X',
    public_key: 'FLWPUBK_TEST-fd2a26787364260bda7cd02898285fb3-X',
    tx_ref: Date.now(),
    amount: ticketPrice, // Ensure ticketPrice is valid or use a value
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
      logo: `${logo}`,
    },
  };

  const fwConfig = {
    ...config,
    text: 'Pay with Flutterwave!',
    callback: (response) => {
      console.log(response);
      if (response.status === "successful") {
        const txnData = {
          name: response.customer.name,
          email: response.customer.email,
          phone_number: response.customer.phone_number,
          transaction_id: response.transaction_id,
          tx_ref: response.tx_ref,
          charged_amount: response.charged_amount,
          amount: response.amount,
          event_id: ticketRoute,
          ticketsbought: numberOfTickets
        };
        savetxn(txnData); //save details to supabase for easy retrieval
        router.push(`/payment-success?transaction_id=${response.transaction_id}`);
        return true;
      }
      closePaymentModal();
    },
    onClose: () => {
      updateStock();
      // email service
    },
  };
  const savetxn = async (txnData) => {
    const { data, error } = await supabase
    .from('transactions')
    .insert(txnData)
    .select()

    if (error) return error;
    console.log(data);
  }
  const checkData = () => {
    if (isNaN(ticketPrice)) {
      router.back();
    }
    if (!ticketPrice && ticketPrice !== 0) {
      router.back();
    }
    if(!ticketCheckoutData){
      router.back();
    }
  };

  useEffect(() => {
    checkData();
    checkIfTicketIsSoldOut();
  }, [ticketPrice, router]);
  //check if the ticket is sold out
  const checkIfTicketIsSoldOut = async () => {
    try {
      let { data: queryData, error: queryError } = await supabase
      .from('ticketdata')
      .select('currentStock')
      .eq('event_id', ticketRoute)
      if (queryError) {
        console.log(queryError)
      } else {
        // check if ticket is sold out and update state
        if (queryData && queryData.length > 0) {
          const currentStock = queryData[0].currentStock;
          if (currentStock === 0) {
            setIsSoldOut(!isSoldOut)
          } 
        }

      }

    } catch (err) {
      console.log('your error is: ' + err)
    }
  }
  //update nops (number of people that paid for the ticket)
  const updateStock = async () => {
    console.log(ticketCheckoutData); 
  
    if (!ticketCheckoutData || typeof ticketCheckoutData !== 'object') {
      console.log('ticketCheckoutData is not valid.');
      return;
    }
  
    for (const [ticketId, quantity] of Object.entries(ticketCheckoutData)) {
      console.log(ticketId, quantity); 
  
      try {
        // Fetch the current ticket stock for the given ticket ID
        let { data: queryData, error: queryError } = await supabase
          .from('ticketdata')
          .select('currentStock')
          .eq('uuid', ticketId); // Use the ticket ID here
  
        if (queryError) {
          console.log(queryError.message);
          continue;
        }
  
        if (queryData && queryData.length > 0) {
          const currentStock = queryData[0].currentStock;
  
          // Calculate the updated stock
          const updatedStock = currentStock - quantity;
  
          // Update the stock in the database
          let { data: updateData, error: updateError } = await supabase
            .from('ticketdata')
            .update({ currentStock: updatedStock })
            .eq('uuid', ticketId);
  
          if (updateError) {
            alert(updateError.message);
          } else {
            console.log('Stock updated successfully.');
          }
        } else {
          console.log('No tickets found with this ID.');
        }
      } catch (error) {
        alert(error.message);
      }
    }
  };
  
  const handleFreeTicket = async () => {
    try {
      // Call updateStock to reduce ticket stock
      await updateStock();
     
      // Notify the user about successful ticket acquisition
      alert('Ticket successfully purchased!');
      router.push("/")
  
    } catch (error) {
      console.error('Error handling free ticket:', error);
      alert('An error occurred while processing your ticket. Please try again.');
    }
  };
  
  

  return (
    <div >
      <p  className='text-center font-bold text-[1.4rem] my-4'>Fill the form with your contact details.</p>
      <form onSubmit={(e) => e.preventDefault()} className='border border-[#FFC0CB] md:w-[60%] w-[80%] m-auto rounded-xl p-6 mb-8'>
        <p className='text-[1.2rem] my-2'>Name:</p>
        <input type="text" placeholder="eg: John Doe" required value={name} onChange={(e) => setName(e.target.value)} className='border border-[#FFC0CB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mb-2'/>

        <p className='text-[1.2rem] my-2'>Phone Number:</p>
        <input type="text" placeholder="eg: 81********65" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className='border border-[#FFC0CB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mb-2'/>

        <p className='text-[1.2rem] my-2'>Email:</p>
        <input type="email" placeholder="eg: johnDoe@gmail.com" required value={email} onChange={(e) => setEmail(e.target.value)} className='border border-[#FFC0CB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        {
          isSoldOut ? <button className='hover:bg-transparent bg-[red] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110 '>SOLD OUT!</button> 
          :ticketPrice === 0 ? (
            <button
              className="hover:bg-transparent bg-[#FFC0CB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110"
              onClick={handleFreeTicket}
            >
              Register
            </button>
          ) : 
          <FlutterWaveButton className='hover:bg-transparent bg-[#FFC0CB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFC0CB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110 ' {...fwConfig} />
        }
        

        
      </form>
    </div>
  );
};

export default ContactForm;
