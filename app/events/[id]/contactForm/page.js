'use client'
import React, { useEffect, useState } from 'react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { useMyContext } from '@/app/context/createContext';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import EmailTemplate from '@/app/components/Email-Template';
import { Resend } from 'resend';

const ContactForm = () => {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Initialize Resend client with API key
  const resend = new Resend("re_e5R5nccX_FW8SzLnUuohv74sy3UZyobMB");
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const { ticketPrice,  ticketRoute , setTicketRoute } = useMyContext();
  const router = useRouter();
  // state handling if ticket is sold out
  const [isSoldOut, setIsSoldOut] = useState(false);
  // const flutterwaveApiKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
  // API MESSAGES
  const [transactionMessage, setTransactionMessage] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const config = {
    public_key: 'FLWPUBK-f2046835e3ac43d0aa83b4d751157c6b-X',
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
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
    },
  };

  const fwConfig = {
    ...config,
    text: 'Pay with Flutterwave!',
    callback: async (response) => {
      console.log(response);
      
      if (response.status === "successful") {
        try {
          const verificationResponse = await fetch(
            `https://api.flutterwave.com/v3/transactions/${response.transaction_id}/verify`,
            {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
  
          const verificationData = await verificationResponse.json();
  
          if (verificationData.status === 'success') {
            setTransactionMessage('Payment was successful!');
            updateNops();
            await sendEmail();
            // Perform additional actions such as updating your database or notifying the user
          } else {
            setTransactionMessage('Payment verification failed.');
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          alert('Error verifying payment.');
        }
      } else {
        alert('Payment failed.');
      }
  
      closePaymentModal(); // Close the modal programmatically
    },
    onClose: () => {
      if (isPaymentProcessing) {
        setTransactionMessage('Payment was not completed.');
      }
      console.log('Payment modal closed');
      setIsPaymentProcessing(false);
    },
  };
  const sendEmail = async () => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: email,
        subject: "Transaction successful",
        react: EmailTemplate({ firstName: name }),
      });
  
      if (error) {
        console.log(error)
      }
  
      return data;
    } catch(error) {
      console.log(error)
    }
  }

  const checkData = () => {
    if (!ticketPrice || isNaN(ticketPrice)) {
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
      .from('tickets')
      .select('nops')
      .eq('uuid', ticketRoute)
      if (queryError) {
        console.log(queryError)
      } else {
        // check if ticket is sold out and update state
        if (queryData && queryData.length > 0) {
          const currentNops = queryData[0].nops;
          if (currentNops === 0) {
            setIsSoldOut(!isSoldOut)
          } 
        }

      }

    } catch (err) {
      console.log('your error is: ' + err)
    }
  }
  //update nops (number of people that paid for the ticket)
  const updateNops = async () => {
    try {
      // Retrieve the current value of nops from Supabase
      let { data: queryData, error: queryError } = await supabase
        .from('tickets')
        .select('nops')
        .eq('uuid', ticketRoute);
  
      if (queryError) {
        console.log(queryError);
      } else if (queryData && queryData.length > 0) {
        const updatedNops = queryData[0].nops - 1;
        let { data: updateData, error: updateError } = await supabase
          .from('tickets')
          .update({ nops: updatedNops })
          .eq('uuid', ticketRoute);
  
        if (updateError) {
          console.log('Error updating column:', updateError.message);
        } else {
          console.log('nops updated successfully:', updateData);
        }
      } else {
        console.log('No data found for the given UUID.');
      }
    } catch (error) {
      console.error('Error updating nops:', error.message);
    }
  };
  

  return (
    <div >
      <p  className='text-center font-bold text-[1.4rem] my-4'>Fill the form with your contact details.</p>
      <form onSubmit={(e) => e.preventDefault()} className='border border-[#E0BFB8] md:w-[60%] w-[80%] m-auto rounded-xl p-6 mb-8'>
        <p className='text-[1.2rem] my-2'>Name:</p>
        <input type="text" placeholder="eg: John Doe" required value={name} onChange={(e) => setName(e.target.value)} className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mb-2'/>

        <p className='text-[1.2rem] my-2'>Phone Number:</p>
        <input type="text" placeholder="eg: 81********65" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mb-2'/>

        <p className='text-[1.2rem] my-2'>Email:</p>
        <input type="email" placeholder="eg: johnDoe@gmail.com" required value={email} onChange={(e) => setEmail(e.target.value)} className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        {
          isSoldOut ? <button className='hover:bg-transparent bg-[red] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#E0BFB8] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110 '>SOLD OUT!</button> 
          :
          <FlutterWaveButton className='hover:bg-transparent bg-[#E0BFB8] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#E0BFB8] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110 ' {...fwConfig} onClick={() => setIsPaymentProcessing(true) } />
        }
        

        
      </form>
    </div>
  );
};

export default ContactForm;
