'use client'
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/app/supabase';
import Image from 'next/image';
import QRCode from 'qrcode';
import { toast } from 'react-toastify';

const PaymentConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transaction_id");
  const isFreeTicket = searchParams.get("free") === "true";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false); // State for copy feedback
  // QR CODE
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQRCode = async () => {
    try {
      if (!transactionId && !isFreeTicket) return null;
      
      // For free tickets, generate a simpler QR code
      const url = transactionId || `free-ticket-${Date.now()}`;
      const qrCode = await QRCode.toDataURL(url);
      setQrCodeUrl(qrCode);
      return qrCode;
    } catch (error) {
      console.error('Error generating QR Code:', error);
      return null;
    }
  };

  useEffect(() => {
    // If it's a free ticket, we don't need to verify payment
    if (isFreeTicket) {
      generateQRCode();
      setLoading(false);
      return;
    }
    
    // For paid tickets, verify the transaction
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

        if (error) throw error;
        if (!data || data.length === 0) {
          setError("Transaction not found.");
          setLoading(false);
          return;
        }
        
        console.log(data);
        generateQRCode();
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError("Error verifying payment.");
      }
      setLoading(false);
    };

    verifyPayment();
  }, [transactionId, isFreeTicket]);

  return (
    <div className="text-center p-6 my-10">
      {loading ? <p>Verifying Payment...</p> : error ? <p className="text-red-500">{error}</p> : 
      <div>
        <p className='text-green-600 text-[1.3rem] font-bold'>
          {isFreeTicket ? 'Registration Successful!' : 'Payment Successful!'}
        </p>
        <p className="text-gray-600 mt-2">Your ticket has been sent to your email.</p>
      </div>}
      
      {qrCodeUrl && !isFreeTicket && (
        <div className="mt-4 block m-auto">
          <Image src={qrCodeUrl} alt="Generated QR Code"
            width={150}
            height={150}
            className='block m-auto'
          />
          <p className="mt-2 text-gray-600 text-sm">transaction id: {transactionId}</p>
          <p className="mt-2 text-gray-600">please screenshot this QR Code, it would be used to validate payment at the event check in.</p>
        </div>
      )}
      
      {isFreeTicket && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
          <p className="text-gray-600">Your free ticket registration is complete!</p>
          <p className="text-gray-600 mt-2">Please check your email for confirmation.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentConfirmation;

// next step, add qr code scanner in the event details page to verify the transactions
