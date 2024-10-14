'use client'
import React from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

export default function Flutterwave(props) {
  const {data} = props;

  const config = {
    public_key: 'FLWPUBK-f2046835e3ac43d0aa83b4d751157c6b-X',
    tx_ref: Date.now(),
    amount: parseFloat(data.ticketprice),
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: `${data.email}`,
       phone_number: `${data.phoneNumber}`,
      name: `${data.name}`,
    },
    customizations: {
      title: 'Payment for tickets',
      description: 'tickets',
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  return (
    <div className="App">
      <button className='hover:bg-transparent bg-[#FFCOCB] w-[40%] md:w-[20%] block m-auto mt-7 p-2 py-3 border border-[#FFCOCB] transition rounded-2xl hover:text-black text-white mb-4 hover:scale-110 '
        onClick={() => {
          handleFlutterPayment({
            callback: (response) => {
               console.log(response);
               //check if transaction was successful
               if (response.status === 'successful') {
                alert('success!');
               }
                closePaymentModal() // this will close the modal programmatically
            },
            onClose: () => {
              alert('modal closed!')
            },
          });
        }}
      >
        proceed to pay
      </button>
    </div>
  );
}