'use client'
import React, { useEffect, useState } from 'react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { useMyContext } from '@/app/context/createContext';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';

const ContactForm = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const { ticketPrice,  ticketRoute ,imageSrc ,ticketAddress ,ticketDate ,ticketTime ,ticketTitle } = useMyContext();
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
          console.log(verificationData.data.id);
          setTransactionId(verificationData.data.id);
          if (verificationData.status === 'success') {
            setTransactionMessage('Payment was successful!');
            updateStock();
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
        alert('Payment failed');
      }
  
      closePaymentModal(); // Close the modal programmatically
    },
    onClose: async () => {
      await sendEmail();
      if (isPaymentProcessing) {
        setTransactionMessage('Payment was not completed.');
      }
      console.log('Payment modal closed');
      setIsPaymentProcessing(false);
    },
  };
  useEffect(() => {
    console.log( 'details' + imageSrc)
  }, [])
  const sendEmail = async () => {
    const emailBody = `
    <html>
      <body>
        <p>Dear ${name},</p>
        <h1>You paid for a ticket!</h1>
        <p>Thank you for using Epass, your ticket details are below.</p>
        <p >your transaction Id is <b >${transactionId}</b> it should be presented at the gate</p>
        <br />
        <h1 >Ticket Details</h1>
        <img src=${imageSrc} style="width: 400px; height: auto;" alt="event image"/>
        <h2>${ticketTitle}</h2>
        <p >Address: ${ticketAddress}</p>
        <p >date: ${ticketDate}</p>
        <p >time: ${ticketTime}</p>
      </body>
    </html>
  `;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer sk_004238fa82b11e8614a3c67c40a9a187f77e394b8dcae5c4`
      },
      body: JSON.stringify({
        to: email,
        subject: "Epass limited: you paid for a ticket!",
        body: emailBody,
        content_type: 'text/html',
        subscribed: true,
        name: "Mitchell Onuorah",
        reply: "support@useplunk.com",
        headers:{}
      })
    };
    // WORK ON THE EMAIL BODY NEXT

    try {
      console.log('Sending email with options:', options);
      const response = await fetch('https://api.useplunk.com/v1/send', options);
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

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
      .from('ticketdata')
      .select('ticketStock')
      .eq('eventId', ticketRoute)
      if (queryError) {
        console.log(queryError)
      } else {
        // check if ticket is sold out and update state
        if (queryData && queryData.length > 0) {
          const currentStock = queryData[0].ticketStock;
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
    try {
      // Retrieve the current value of nops from Supabase
      let { data: queryData, error: queryError } = await supabase
        .from('ticketdata')
        .select('ticketStock')
        .eq('eventId', ticketRoute);
  
      if (queryError) {
        console.log(queryError);
      } else if (queryData && queryData.length > 0) {
        const updatedStock = queryData[0].ticketStock - 1;
        let { data: updateData, error: updateError } = await supabase
          .from('ticketdata')
          .update({ ticketStock: updatedStock })
          .eq('eventId', ticketRoute);
  
        if (updateError) {
          console.log('Error updating column:', updateError.message);
        } else {
          console.log('Ticket stock updated successfully:', updateData);
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
      <form onSubmit={(e) => e.preventDefault()} className='border border-[#FFCOCB] md:w-[60%] w-[80%] m-auto rounded-xl p-6 mb-8'>
        <p className='text-[1.2rem] my-2'>Name:</p>
        <input type="text" placeholder="eg: John Doe" required value={name} onChange={(e) => setName(e.target.value)} className='border border-[#FFCOCB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mb-2'/>

        <p className='text-[1.2rem] my-2'>Phone Number:</p>
        <input type="text" placeholder="eg: 81********65" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className='border border-[#FFCOCB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mb-2'/>

        <p className='text-[1.2rem] my-2'>Email:</p>
        <input type="email" placeholder="eg: johnDoe@gmail.com" required value={email} onChange={(e) => setEmail(e.target.value)} className='border border-[#FFCOCB] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition'/>
        {
          isSoldOut ? <button className='hover:bg-transparent bg-[red] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFCOCB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110 '>SOLD OUT!</button> 
          :
          <FlutterWaveButton className='hover:bg-transparent bg-[#FFCOCB] w-[70%] md:w-[50%] block m-auto mt-7 p-2 py-3 border border-[#FFCOCB] transition rounded-2xl hover:text-black text-white mb-1 hover:scale-110 ' {...fwConfig} onClick={() => setIsPaymentProcessing(true) } />
        }
        

        
      </form>
    </div>
  );
};

export default ContactForm;
