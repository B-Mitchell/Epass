import React from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

export default function Flutterwave(props) {
  const {price} = props;
  const config = {
    public_key: 'FLWPUBK_TEST-f92ac262ad3164da150459f68f41988f-X',
    tx_ref: Date.now(),
    amount: price,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: 'mitchellonuorah77@gmail.com',
       phone_number: '08124146345',
      name: 'Big Mitch',
    },
    customizations: {
      title: 'Payment for ticket',
      description: 'ticketssssss',
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  return (
    <div className="App">
      <button className='hover:bg-transparent bg-[#E0BFB8] w-[40%] md:w-[20%] block m-auto mt-7 p-2 py-3 border border-[#E0BFB8] transition rounded-2xl hover:text-black text-white mb-4 hover:scale-110 '
        onClick={() => {
          handleFlutterPayment({
            callback: (response) => {
               console.log(response);
                closePaymentModal() // this will close the modal programmatically
            },
            onClose: () => {},
          });
        }}
      >
        proceed to pay
      </button>
    </div>
  );
}