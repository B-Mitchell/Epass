'use client'
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/app/supabase';
import Image from 'next/image';
import QRCode from 'qrcode';

const PaymentConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transaction_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false); // State for copy feedback
  // QR CODE
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQRCode = async () => {
    try {
      const url = transactionId; // Get the current URL
      const qrCode = await QRCode.toDataURL(url); // Generate QR code
      setQrCodeUrl(qrCode); // Set the QR code URL
    } catch (error) {
      console.error('Error generating QR Code:', error);
    }
  };

  useEffect(() => {
    if (!transactionId) {
      setError("Invalid transaction ID.");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase
        .from('transactions')
        .select('*') // Fetch all columns.
        .eq('transaction_id', transactionId);

        if (error) return error;
        console.log(data);
        generateQRCode();
      } catch (err) {
        setError("Error verifying payment.");
      }
      setLoading(false);
    };

    verifyPayment();
  }, [transactionId]);


  return (
    <div className="text-center p-6 my-10">
      {loading ? <p>Verifying Payment...</p> : error ? <p className="text-red-500">{error}</p> : 
      <div>
        <p className='text-green-600 text-[1.3rem] font-bold'>Payment Successful!</p></div>}
        {qrCodeUrl && (
        <div className="mt-4 block m-auto">
          <Image src={qrCodeUrl} alt="Generated QR Code"
            width={150}
            height={150}
            className='block m-auto'
          />
          <p className="mt-2 text-gray-600">please screenshot this QR Code, it would be used to validate payment at the event check in.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentConfirmation;

// next step, add qr code scanner in the event details page to verify the transactions
