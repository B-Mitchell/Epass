// 'use client';
// import { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation';
// import { Html5QrcodeScanner } from "html5-qrcode";
// import supabase from '@/app/supabase';

// const Page = () => {
//   const { id } = useParams(); // Get event_id from the URL
//   const [transactionId, setTransactionId] = useState('');
//   const [transactionData, setTransactionData] = useState(null);
//   const [error, setError] = useState('');

//   // Handle QR Scan
//   useEffect(() => {
//     const scanner = new Html5QrcodeScanner("reader", {
//       fps: 10,
//       qrbox: { width: 250, height: 250 }
//     });

//     scanner.render(
//         (decodedText) => {
//           setTransactionId(decodedText);
//         },
//         (error) => console.error(error)
//       );
      
//       return () => {
//         scanner.clear().catch(err => console.log("Scanner cleanup error:", err));
//       };
//   }, []);
//   // Fetch transaction details from Supabase
//   const fetchTransaction = async () => {
//     setError('');
//     setTransactionData(null);

//     if (!transactionId || !id) {
//       setError('Transaction ID or Event ID is missing.');
//       return;
//     }

//     const { data, error } = await supabase
//       .from('transactions')
//       .select('*')
//       .eq('transaction_id', transactionId)
//       .eq('event_id', id)
//       .single();

//     if (error || !data) {
//       setError('Transaction not found.');
//       return;
//     }

//     setTransactionData(data);
//   };

//   return (
//     <div className="p-6 text-center">
//       <h2 className="text-xl font-bold mb-4">Validate Payment</h2>
//       <p >{id}</p>
//       <p>Transaction ID: {transactionId}</p>


//       {/* Input Field for Transaction ID */}
//       <input
//         type="text"
//         value={transactionId}
//         onChange={(e) => setTransactionId(e.target.value)}
//         placeholder="Enter Transaction ID"
//         className="border p-2 mt-4 w-full"
//       />

//       {/* Verify Button */}
//       <button
//         onClick={fetchTransaction}
//         className="bg-blue-600 text-white p-2 mt-2 w-full"
//       >
//         Verify Payment
//       </button>

//       {/* Error Message */}
//       {error && <p className="text-red-600 mt-4">{error}</p>}

//       {/* Transaction Details */}
//       {transactionData && (
//         <div className="mt-6 p-4 border rounded-lg">
//           <h3 className="text-lg font-bold">Transaction Details</h3>
//           <p><strong>Name:</strong> {transactionData.name}</p>
//           <p><strong>Email:</strong> {transactionData.email}</p>
//           <p><strong>Phone:</strong> {transactionData.phone_number}</p>
//           <p><strong>Transaction ID:</strong> {transactionData.transaction_id}</p>
//           <p><strong>Amount:</strong> ${transactionData.charged_amount}</p>
//           <p className="text-green-600 font-bold mt-2">✅ Payment Verified</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Page;

'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Html5QrcodeScanner } from "html5-qrcode";
import supabase from '@/app/supabase';

const Page = () => {
  const { id } = useParams();
  const [transactionId, setTransactionId] = useState('');
  const [transactionData, setTransactionData] = useState(null);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      });

      scannerRef.current.render(
        (decodedText) => {
          setTransactionId(decodedText);
        },
        (err) => console.error("QR Error:", err)
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.log("Scanner cleanup error:", err));
        scannerRef.current = null; // Reset scannerRef
      }
    };
  }, []);

  const fetchTransaction = async () => {
    setError('');
    setTransactionData(null);

    if (!transactionId || !id) {
      setError('Transaction ID or Event ID is missing.');
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('event_id', id)
      .single();

    if (error || !data) {
    //   setError(error);
      console.log(error);
      return;
    }

    setTransactionData(data);
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold mb-4">Validate Payment</h2>
      <p>Transaction ID: {transactionId}</p>

      {/* QR Code Scanner */}
      <div id="reader" className="mt-4"></div>

      {/* Input Field for Transaction ID */}
      <input
        type="text"
        value={transactionId}
        onChange={(e) => setTransactionId(e.target.value)}
        placeholder="Enter Transaction ID"
        className="border p-2 mt-4 w-full"
      />

      {/* Verify Button */}
      <button
        onClick={fetchTransaction}
        className="bg-blue-600 text-white p-2 mt-2 w-full"
      >
        Verify Payment
      </button>

      {/* Error Message */}
      {error && <p className="text-red-600 mt-4">{error}</p>}

      {/* Transaction Details */}
      {transactionData && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-bold">Transaction Details</h3>
          <p><strong>Name:</strong> {transactionData.name}</p>
          <p><strong>Email:</strong> {transactionData.email}</p>
          <p><strong>Phone:</strong> {transactionData.phone_number}</p>
          <p><strong>Transaction ID:</strong> {transactionData.transaction_id}</p>
          <p><strong>Amount:</strong> ${transactionData.charged_amount}</p>
          <p className="text-green-600 font-bold mt-2">✅ Payment Verified</p>
        </div>
      )}
    </div>
  );
};

export default Page;
