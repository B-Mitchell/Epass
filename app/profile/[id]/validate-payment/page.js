'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Html5QrcodeScanner } from "html5-qrcode";
import supabase from '@/app/supabase';
import { FaCheckCircle, FaExclamationCircle, FaQrcode, FaUser } from 'react-icons/fa';
import { Dialog } from '@headlessui/react';

const Page = () => {
  const { id } = useParams(); // Get event ID from URL
  const [transactionId, setTransactionId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [transactionData, setTransactionData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scannerRef = useRef(null);
  const [ticketsInfo, setTicketsInfo] = useState([]);
  // search functionality
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter(
    (txn) =>
      txn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.tx_ref.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Fetch all transactions for the event
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('event_id', id);

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data);
      }
      setLoading(false);
    };

    if (id) {
      fetchTransactions();
    }
  }, [id]);

  // Initialize QR Scanner
  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      });

      scannerRef.current.render(
        (decodedText) => {
          console.log("QR Code Scanned:", decodedText);
          setTransactionId(decodedText.trim()); // Trim spaces
          setIsModalOpen(true);
        },
        (error) => console.error("QR Error:", error)
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.log("Scanner cleanup error:", err));
        scannerRef.current = null;
      }
    };
  }, []);
  // Fetch a single transaction based on scanned ID
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId || !id) return;

      setTransactionData(null);
      setError('');

      console.log("Fetching transaction for:", transactionId, "Event ID:", id);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .eq('event_id', id)
        .single();

      if (error) {
        console.error("Transaction fetch error:", error);
        setError('Transaction id not found.');
      } else {
        console.log("Transaction found:", data);
        setTransactionData(data);
        setIsModalOpen(true);
      }
    };

    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId, id]);

    // Function to update the confirmed status in Supabase
  const confirmTransaction = async (transactionId) => {
    const { error } = await supabase
      .from('transactions')
      .update({ confirmed: true }) // Set confirmed to true
      .eq('transaction_id', transactionId);

    if (error) {
      console.error("Error confirming transaction:", error);
    } else {
      console.log("Transaction confirmed successfully");
      setTransactions((prev) =>
        prev.map((txn) =>
          txn.transaction_id === transactionId ? { ...txn, confirmed: true } : txn
        )
      );
      setTransactionData((prev) => prev ? { ...prev, confirmed: true } : prev);
    }
  };

  return (
    <div className="p-6 text-center bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold mt-6 text-gray-800">Validate Payment</h2>
      <div className="mt-4">
        <FaQrcode className="text-gray-600 text-4xl mx-auto" />
      </div>
      <p className="mt-2 text-gray-600">Scan a QR Code to validate a transaction</p>

      <div id="reader" className="mt-4"></div>

      <input
        type="text"
        value={transactionId}
        onChange={(e) => setTransactionId(e.target.value)}
        placeholder="Enter Transaction ID"
        className="border focus:scale-105 focus:p-4 p-2 mt-4 w-[70%] m-auto border-[#FFC0CB] outline-none transition rounded-2xl"
      />

      {error && <p className="text-red-600 mt-4 flex items-center"><FaExclamationCircle className="mr-2" />{error}</p>}
      
      <h2 className="text-2xl font-bold mb-6 text-gray-800 mt-6">Attendee List</h2>

      <input
        type="text"
        placeholder="Search attendees by name, email, or txn ref..."
        className="border p-2 mb-4 w-full rounded"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-600 italic">Loading attendee list...</div>
        ) : filteredTransactions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredTransactions.map((txn) => (
              <li key={txn.transaction_id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-blue-100 text-blue-500 h-8 w-8 flex items-center justify-center">
                      <FaUser className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{txn.name}</p>
                    <p className="text-sm text-gray-500 truncate">{txn.email}</p>
                    <p className="text-xs text-gray-500">Txn: {txn.tx_ref}</p>
                    <p className="text-xs text-gray-500">Quantity: {txn.ticketsbought}</p>
                    <p className="text-xs text-gray-500">Amount: <span className="text-green-600">NGN</span>{txn.charged_amount}</p>
                    {txn.ticketsInfo && Array.isArray(txn.ticketsInfo) && txn.ticketsInfo.length > 0 && (
                      <div className="mt-1 text-xs text-gray-600">
                        {txn.ticketsInfo.map((ticket, index) => (
                          <p key={index}>
                            {Object.entries(ticket)
                              .map(([ticketName, quantity]) => `${ticketName}: ${quantity}`)
                              .join(', ')}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {txn.confirmed ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaCheckCircle className="mr-1 h-3 w-3 fill-current" />
                      Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => confirmTransaction(txn.transaction_id)}
                      className="inline-flex items-center px-3 py-2 border border-blue-500 rounded-md shadow-sm text-sm font-medium text-blue-500 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-gray-600 italic">No attendees match your search.</div>
        )}
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            {transactionData ? (
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
                <h3 className="text-2xl font-semibold text-blue-700 mb-6">Transaction Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700">Name:</p>
                    <p className="text-gray-900">{transactionData.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Email:</p>
                    <p className="text-gray-900">{transactionData.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Phone:</p>
                    <p className="text-gray-900">{transactionData.phone_number}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Transaction ID:</p>
                    <p className="text-gray-900">{transactionData.transaction_id}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Amount:</p>
                    <p className="text-gray-900">${transactionData.charged_amount}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">quantity:</p>
                    <p className="text-gray-900">${transactionData.ticketsbought}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Charged Amount:</p>
                    <p className="text-gray-900">${transactionData.charged_amount}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Ticket Info:</p>
                    <ul className="text-gray-900">
                      {transactionData.ticketsInfo && Array.isArray(transactionData.ticketsInfo) ? (
                        transactionData.ticketsInfo.map((ticket, index) => (
                          <li key={index} className="flex justify-between">
                            <span>
                              {Object.entries(ticket)
                                .map(([ticketName, quantity]) => `${ticketName}: ${quantity}`)
                                .join(', ')}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li>No ticket information available</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Status:</p>
                    {transactionData.confirmed ? (
                      <span className="text-green-600 font-semibold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Payment Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => confirmTransaction(transactionData.transaction_id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Confirm Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No transaction details available.</p>
            )}
            <button onClick={() => setIsModalOpen(false)} className="mt-4 bg-red-500 text-white p-2 rounded w-full">Close</button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Page;
