'use client'
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/app/supabase';
import Image from 'next/image';
import QRCode from 'qrcode';
import { toast } from 'react-toastify';
// SVG icons instead of lucide-react

const PaymentConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transaction_id");
  const isFreeTicket = searchParams.get("free") === "true";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [transactionDetails, setTransactionDetails] = useState(null);

  const generateQRCode = async () => {
    try {
      if (!transactionId && !isFreeTicket) return null;
      
      const url = transactionId || `free-ticket-${Date.now()}`;
      const qrCode = await QRCode.toDataURL(url);
      setQrCodeUrl(qrCode);
      return qrCode;
    } catch (error) {
      console.error('Error generating QR Code:', error);
      return null;
    }
  };

  const copyTransactionId = () => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      setCopied(true);
      toast.success("Transaction ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `ticket-qr-${transactionId || 'free'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR Code downloaded!");
    }
  };

  useEffect(() => {
    if (isFreeTicket) {
      generateQRCode();
      setLoading(false);
      return;
    }
    
    if (!transactionId) {
      setError("Invalid transaction ID.");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('transaction_id', transactionId);

        if (error) throw error;
        if (!data || data.length === 0) {
          setError("Transaction not found.");
          setLoading(false);
          return;
        }
        
        setTransactionDetails(data[0]);
        generateQRCode();
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError("Error verifying payment.");
      }
      setLoading(false);
    };

    verifyPayment();
  }, [transactionId, isFreeTicket]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 font-medium">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 rounded-lg shadow-md">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Verification Failed</h2>
          <p className="mt-2 text-red-600">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 overflow-hidden bg-white rounded-xl shadow-md">
      <div className="bg-gradient-to-r from-[#FFC0CB] to-black py-6 px-4">
        <div className="flex justify-center">
          <div className="bg-white rounded-full p-3 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-white text-center text-2xl font-bold mt-4">
          {isFreeTicket ? 'Registration Successful!' : 'Payment Confirmed!'}
        </h1>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-center bg-gray-50 py-3 rounded-lg mb-4">
          <svg className="text-gray-500 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600">Ticket sent to your email</p>
        </div>

        {qrCodeUrl && (
          <div className="flex flex-col items-center mt-6 mb-4">
            <div className="p-4 bg-white shadow-md rounded-lg border border-gray-100">
              <Image 
                src={qrCodeUrl} 
                alt="Ticket QR Code" 
                width={180} 
                height={180} 
                className="rounded-md" 
              />
            </div>
            
            <div className="mt-4 flex gap-3">
              <button 
                onClick={downloadQRCode}
                className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Save</span>
              </button>
              
              {!isFreeTicket && (
                <button 
                  onClick={copyTransactionId}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {copied ? (
                    <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span>{copied ? "Copied!" : "Copy ID"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {!isFreeTicket && transactionId && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-200 break-all">
              {transactionId}
            </p>
          </div>
        )}

        <div className="mt-6 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-blue-800 text-sm font-medium">Important</p>
          <p className="text-blue-700 text-sm mt-1">
            Please screenshot this QR code for verification at the event check-in.
          </p>
        </div>

        <div className="mt-6">
          <button 
            onClick={() => router.push('/')} 
            className="w-full py-3 bg-gray-100 text-gray-800 font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;

