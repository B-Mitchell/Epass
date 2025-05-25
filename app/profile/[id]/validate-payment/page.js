'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import supabase from '@/app/supabase';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaQrcode,
  FaUser,
  FaSearch,
  FaTicketAlt,
  FaEnvelope,
  FaPhone,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { Dialog } from '@headlessui/react';

const Page = () => {
  const { id } = useParams();
  const [inputValue, setInputValue] = useState('');
  const [scannedValue, setScannedValue] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [ticketData, setTicketData] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [stats, setStats] = useState({
    totalTickets: 0,
    usedTickets: 0,
    totalTransactions: 0,
  });
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirmingTicket, setIsConfirmingTicket] = useState({});
  const [isConfirmingTransaction, setIsConfirmingTransaction] = useState({});
  const [isTogglingScanner, setIsTogglingScanner] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isUUID = (value) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching data for event_id:', id);
  
        // Validate id
        if (!id || typeof id !== 'string') {
          console.error('Invalid event ID:', id);
          setError('Invalid event ID provided.');
          setLoading(false);
          return;
        }
  
        // Set a timeout for the entire fetch operation
        const timeout = setTimeout(() => {
          console.error('Fetch data timed out');
          setError('Data fetch timed out. Please try again.');
          setLoading(false);
        }, 10000); // 10 seconds
  
        // Fetch transactions
        console.log('Querying transactions for event_id:', id);
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('event_id', id);
  
        console.log('Transactions response:', { txData, txError });
  
        if (txError) {
          console.error('Error fetching transactions:', txError);
          setError('Failed to load transactions: ' + txError.message);
          clearTimeout(timeout);
          setLoading(false);
          return;
        }
  
        if (!txData || txData.length === 0) {
          console.warn('No transactions found for event_id:', id);
          setTransactions([]);
          setStats({
            totalTickets: 0,
            usedTickets: 0,
            totalTransactions: 0,
          });
          clearTimeout(timeout);
          setLoading(false);
          return;
        }
  
        // Fetch ticket instances
        console.log('Querying ticket_instances for transaction_ids:', txData.map((tx) => tx.transaction_id));
        const { data: ticketData, error: ticketError } = await supabase
          .from('ticket_instances')
          .select('unique_ticket_id, ticket_uuid, transaction_id, email, used, ticket_name, created_at')
          .in('transaction_id', txData.map((tx) => tx.transaction_id));
  
        console.log('Ticket instances response:', { ticketData, ticketError });
  
        if (ticketError) {
          console.error('Error fetching tickets:', ticketError);
          setError('Failed to load tickets: ' + ticketError.message);
          clearTimeout(timeout);
          setLoading(false);
          return;
        }
  
        // Combine data
        const combinedData = txData.map((tx) => ({
          ...tx,
          tickets: ticketData?.filter((ticket) => ticket.transaction_id === tx.transaction_id) || [],
        }));
  
        console.log('Combined data:', combinedData);
  
        setTransactions(combinedData);
        setStats({
          totalTickets: ticketData?.length || 0,
          usedTickets: ticketData?.filter((ticket) => ticket.used).length || 0,
          totalTransactions: txData.length,
        });
  
        clearTimeout(timeout);
      } catch (err) {
        console.error('Unexpected error fetching data:', err);
        setError('An unexpected error occurred: ' + err.message);
      }
      setLoading(false);
    };
  
    if (id) {
      fetchData();
    } else {
      console.error('No event ID provided');
      setError('No event ID provided.');
      setLoading(false);
    }
  }, [id]);

  const toggleScanner = async () => {
    setIsTogglingScanner(true);
    if (isScanning) {
      if (scannerRef.current) {
        await scannerRef.current.clear().catch((err) => console.log('Scanner cleanup error:', err));
        scannerRef.current = null;
      }
      setIsScanning(false);
      setIsTogglingScanner(false);
    } else {
      setIsScanning(true);
      setTimeout(() => {
        if (!scannerRef.current) {
          scannerRef.current = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 200, height: 200 },
          });

          scannerRef.current.render(
            (decodedText) => {
              console.log('QR Code Scanned:', decodedText);
              setScannedValue(decodedText.trim());
              setIsModalOpen(true);
              if (scannerRef.current) {
                scannerRef.current.clear().catch((err) => console.log('Scanner cleanup error:', err));
                scannerRef.current = null;
                setIsScanning(false);
              }
            },
            (error) => console.error('QR Error:', error)
          );
        }
        setIsTogglingScanner(false);
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.log('Scanner cleanup error:', err));
        scannerRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsValidating(true);
      setScannedValue('');
      await fetchTicketData(inputValue);
      setIsValidating(false);
    }
  };

  const fetchTicketData = async (value) => {
    if (!value) return;

    setTicketData(null);
    setTransactionData(null);
    setError('');

    if (isUUID(value)) {
      console.log('Fetching ticket for unique_ticket_id:', value, 'Event ID:', id);
      const { data: ticket, error: ticketError } = await supabase
        .from('ticket_instances')
        .select('unique_ticket_id, ticket_uuid, transaction_id, email, used, created_at')
        .eq('unique_ticket_id', value)
        .maybeSingle();

      if (ticketError) {
        console.error('Ticket fetch error:', ticketError);
        setError('Ticket not found.');
        return;
      }

      if (!ticket) {
        console.warn('No ticket found for unique_ticket_id:', value);
        setError('No ticket matches the provided ID.');
        return;
      }

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', ticket.transaction_id)
        .eq('event_id', id)
        .maybeSingle();

      if (txError) {
        console.error('Transaction fetch error:', txError);
        setError('Failed to fetch transaction details.');
        return;
      }

      if (!transaction) {
        console.warn('No transaction found for ticket:', ticket.transaction_id);
        setError('Ticket not associated with this event.');
        return;
      }

      console.log('Ticket found:', ticket);
      console.log('Transaction found:', transaction);
      setTicketData(ticket);
      setTransactionData(transaction);
    } else {
      const transactionId = parseInt(value, 10);
      if (!isNaN(transactionId)) {
        console.log('Fetching tickets for transaction_id:', transactionId, 'Event ID:', id);
        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('transaction_id', transactionId)
          .eq('event_id', id)
          .maybeSingle();

        if (!txError && transaction) {
          const { data: tickets, error: ticketsError } = await supabase
            .from('ticket_instances')
            .select('unique_ticket_id, ticket_uuid, transaction_id, email, used, created_at')
            .eq('transaction_id', transactionId);

          if (ticketsError) {
            console.error('Tickets fetch error:', ticketsError);
            setError('Failed to fetch tickets for this transaction.');
            return;
          }

          console.log('Transaction found:', transaction);
          console.log('Tickets found:', tickets);
          setTicketData(tickets.length > 0 ? tickets : []);
          setTransactionData(transaction);
          setIsModalOpen(true);
          return;
        }
      }

      console.log('Searching for ticket with email:', value, 'Event ID:', id);
      const { data: tickets, error: ticketError } = await supabase
        .from('ticket_instances')
        .select('unique_ticket_id, ticket_uuid, transaction_id, email, used, ticket_name, created_at')
        .ilike('email', value);

      if (ticketError) {
        console.error('Ticket fetch error:', ticketError);
        setError('Ticket not found. Please check the email or transaction ID.');
        return;
      }

      if (!tickets || tickets.length === 0) {
        console.warn('No ticket found for email:', value);
        setError('No ticket matches the provided information.');
        return;
      }

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', tickets[0].transaction_id)
        .eq('event_id', id)
        .maybeSingle();

      if (txError) {
        console.error('Transaction fetch error:', txError);
        setError('Failed to fetch transaction details.');
        return;
      }

      if (!transaction) {
        console.warn('No transaction found for ticket:', tickets[0].transaction_id);
        setError('Ticket not associated with this event.');
        return;
      }

      console.log('Tickets found:', tickets);
      console.log('Transaction found:', transaction);
      setTicketData(tickets.length === 1 ? tickets[0] : tickets);
      setTransactionData(transaction);
    }

    setIsModalOpen(true);
  };

  useEffect(() => {
    if (scannedValue) {
      fetchTicketData(scannedValue);
    }
  }, [scannedValue]);

  const confirmTicket = async (uniqueTicketId) => {
    setIsConfirmingTicket((prev) => ({ ...prev, [uniqueTicketId]: true }));
    const { error } = await supabase
      .from('ticket_instances')
      .update({ used: true })
      .eq('unique_ticket_id', uniqueTicketId);

    if (error) {
      console.error('Error confirming ticket:', error);
      setError('Failed to confirm ticket.');
    } else {
      console.log('Ticket confirmed successfully');
      setTransactions((prev) =>
        prev.map((txn) => ({
          ...txn,
          tickets: txn.tickets.map((ticket) =>
            ticket.unique_ticket_id === uniqueTicketId ? { ...ticket, used: true } : ticket
          ),
        }))
      );
      setTicketData((prev) => {
        if (Array.isArray(prev)) {
          return prev.map((ticket) =>
            ticket.unique_ticket_id === uniqueTicketId ? { ...ticket, used: true } : ticket
          );
        }
        return prev && prev.unique_ticket_id === uniqueTicketId ? { ...prev, used: true } : prev;
      });
      setStats((prev) => ({
        ...prev,
        usedTickets: prev.usedTickets + 1,
      }));
    }
    setIsConfirmingTicket((prev) => ({ ...prev, [uniqueTicketId]: false }));
  };

  const confirmTransaction = async (transactionId) => {
    setIsConfirmingTransaction((prev) => ({ ...prev, [transactionId]: true }));
    const { error } = await supabase
      .from('transactions')
      .update({ confirmed: true })
      .eq('transaction_id', transactionId);

    if (error) {
      console.error('Error confirming transaction:', error);
      setError('Failed to confirm transaction.');
    } else {
      console.log('Transaction confirmed successfully');
      setTransactions((prev) =>
        prev.map((txn) => (txn.transaction_id === transactionId ? { ...txn, confirmed: true } : txn))
      );
      setTransactionData((prev) => (prev ? { ...prev, confirmed: true } : prev));
    }
    setIsConfirmingTransaction((prev) => ({ ...prev, [transactionId]: false }));
  };

  const filteredTransactions = transactions.filter(
    (txn) =>
      (txn.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (txn.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (txn.tx_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      String(txn.transaction_id).includes(searchQuery.toLowerCase()) ||
      txn.tickets.some(
        (ticket) =>
          (ticket.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          (ticket.unique_ticket_id?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
  );

  const toggleExpand = (transactionId) => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-[#FFC0CB] to-black text-white py-4 px-4 sm:px-6 shadow-md">
        <h1 className="text-xl sm:text-2xl font-bold">Event Ticket Validator</h1>
        <p className="text-xs sm:text-sm opacity-90">Verify and manage your event attendees</p>
        <br />

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-[#FFC0CB]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Total Tickets</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalTickets}</p>
              </div>
              <div className="bg-[#FFC0CB]/20 p-2 sm:p-3 rounded-full">
                <FaTicketAlt className="text-[#FFC0CB] text-lg sm:text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-[#FFC0CB]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Used Tickets</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.usedTickets}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalTickets > 0
                    ? `${Math.round((stats.usedTickets / stats.totalTickets) * 100)}% attendance`
                    : '0% attendance'}
                </p>
              </div>
              <div className="bg-[#FFC0CB]/20 p-2 sm:p-3 rounded-full">
                <FaCheckCircle className="text-[#FFC0CB] text-lg sm:text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-[#FFC0CB]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Transactions</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalTransactions}</p>
              </div>
              <div className="bg-[#FFC0CB]/20 p-2 sm:p-3 rounded-full">
                <FaUser className="text-[#FFC0CB] text-lg sm:text-xl" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Scan Section */}
      <div className="p-4 sm:p-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
              <FaQrcode className="mr-2 text-[#FFC0CB]" /> Scan Ticket
            </h2>
            <button
              onClick={toggleScanner}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md ${
                isScanning ? 'bg-[#FFB6C1] hover:bg-[#FF9999]' : 'bg-[#FFC0CB] hover:bg-[#FFB6C1]'
              } text-white text-sm font-medium transition-colors flex items-center justify-center`}
              disabled={isTogglingScanner}
            >
              {isTogglingScanner ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isScanning ? 'Stopping...' : 'Starting...'}
                </>
              ) : (
                isScanning ? 'Stop Scanning' : 'Start Scanner'
              )}
            </button>
          </div>
          {isScanning && (
            <div className="mb-4">
              <div id="reader" className="border rounded-md overflow-hidden w-full max-w-[300px] mx-auto"></div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Email, Transaction ID, or Ticket ID"
                className="w-full border border-[#FFC0CB] rounded-lg py-2 px-3 pl-9 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFC0CB] focus:border-[#FFC0CB]"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FFC0CB]" />
            </div>
            <button
              type="submit"
              className="mt-3 w-full bg-[#FFC0CB] hover:bg-[#FFB6C1] text-white py-2 px-4 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center"
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Validating...
                </>
              ) : (
                'Validate'
              )}
            </button>
          </form>
          {error && (
            <div className="mt-4 bg-[#FFB6C1]/20 border-l-4 border-[#FF9999] p-3 rounded">
              <div className="flex items-center">
                <FaExclamationCircle className="text-[#FF9999] mr-2" />
                <span className="text-[#FF9999] text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendee List with Search */}
      <div className="p-4 sm:p-6 md:w-[90%] m-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Find Attendee</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, transaction ID, or ticket ID..."
                className="w-full border border-[#FFC0CB] rounded-lg py-2 px-3 pl-9 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFC0CB] focus:border-[#FFC0CB]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FFC0CB]" />
            </div>
            <div className="mt-3 text-xs sm:text-sm text-gray-600">
              <p>Quick Search Tips:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Enter full or partial name</li>
                <li>Enter email address</li>
                <li>Enter transaction reference or ID</li>
                <li>Enter ticket ID</li>
              </ul>
            </div>
          </div>
          <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Attendee List</h2>
          </div>
          {loading ? (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFC0CB]"></div>
        <p className="mt-2 text-gray-600 text-sm">Loading attendee data...</p>
      </div>
    ) : filteredTransactions.length > 0 ? (
      <>
        <ul className="divide-y divide-gray-200 md:w-[90%] m-auto">
          {filteredTransactions
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((txn) => (
              <li key={txn.transaction_id} className="hover:bg-gray-50">
                <div
                  className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between cursor-pointer transition"
                  onClick={() => toggleExpand(txn.transaction_id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div
                        className={`rounded-full h-10 w-10 flex items-center justify-center ${
                          txn.confirmed ? 'bg-[#FFC0CB]/20 text-[#FFC0CB]' : 'bg-gray-100 text-[#FFC0CB]'
                        }`}
                      >
                        <FaUser className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-md font-semibold text-gray-900 truncate">{txn.name || 'N/A'}</p>
                      <div className="flex items-center mt-1">
                        <FaEnvelope className="text-[#FFC0CB] h-3 w-3 mr-1" />
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{txn.email || 'N/A'}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-gray-500">
                        <span>ID: {txn.transaction_id}</span>
                        <span>Ref: {txn.tx_ref}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFC0CB]/20 text-[#FFC0CB]">
                      <FaTicketAlt className="mr-1 h-3 w-3" />
                      {txn.tickets ? txn.tickets.length : 0}
                    </span>
                    {txn.confirmed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#FFC0CB] to-black text-white">
                        <FaCheckCircle className="mr-1 h-3 w-3" />
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Pending
                      </span>
                    )}
                    {expandedTransaction === txn.transaction_id ? (
                      <FaChevronUp className="text-[#FFC0CB]" />
                    ) : (
                      <FaChevronDown className="text-[#FFC0CB]" />
                    )}
                  </div>
                </div>
                {expandedTransaction === txn.transaction_id && (
                  <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">Transaction Details</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Transaction ID: {txn.transaction_id}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Reference: {txn.tx_ref}</p>
                        {txn.phone_number && (
                          <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-500">
                            <FaPhone className="mr-1 h-3 w-3" />
                            <span>{txn.phone_number}</span>
                          </div>
                        )}
                      </div>
                      {!txn.confirmed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmTransaction(txn.transaction_id);
                          }}
                          className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-[#FFC0CB] rounded-md shadow-sm text-xs sm:text-sm font-medium text-[#FFC0CB] bg-white hover:bg-[#FFC0CB]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC0CB]"
                          disabled={isConfirmingTransaction[txn.transaction_id]}
                        >
                          {isConfirmingTransaction[txn.transaction_id] ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC0CB] mr-1"></div>
                              Confirming...
                            </>
                          ) : (
                            'Confirm Payment'
                          )}
                        </button>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Tickets</h3>
                      {txn.tickets && txn.tickets.length > 0 ? (
                        <div className="space-y-2">
                          {txn.tickets.map((ticket) => (
                            <div
                              key={ticket.unique_ticket_id}
                              className="bg-white p-2 sm:p-3 rounded-md border border-gray-200 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-700">
                                  ID: {ticket.unique_ticket_id.slice(0, 8)}...
                                </p>
                                <p className="text-xs text-gray-500">
                                  <FaEnvelope className="inline mr-1 h-3 w-3" />
                                  {ticket.email}
                                </p>
                                <p className="text-xs text-white w-fit px-2 rounded-xl bg-gray-600">
                                  {ticket.ticket_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Created: {new Date(ticket.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                {ticket.used ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-[#FFC0CB] to-black text-white">
                                    <FaCheckCircle className="mr-1 h-3 w-3" />
                                    Used
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmTicket(ticket.unique_ticket_id);
                                    }}
                                    className="inline-flex items-center px-2 sm:px-3 py-1 rounded-md border border-[#FFC0CB] text-xs font-medium text-[#FFC0CB] bg-white hover:bg-[#FFC0CB]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC0CB]"
                                    disabled={isConfirmingTicket[ticket.unique_ticket_id]}
                                  >
                                    {isConfirmingTicket[ticket.unique_ticket_id] ? (
                                      <>
                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC0CB] mr-1"></div>
                                        Validating...
                                      </>
                                    ) : (
                                      'Validate Entry'
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-500 italic">No tickets found for this transaction.</p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
        </ul>
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-md bg-[#FFC0CB] text-white text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#FFB6C1] transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {Math.ceil(filteredTransactions.length / itemsPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredTransactions.length / itemsPerPage)))}
            disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
            className="px-3 py-1.5 rounded-md bg-[#FFC0CB] text-white text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#FFB6C1] transition-colors"
          >
            Next
          </button>
        </div>
      </>
    ) : (
      <div className="p-6 sm:p-8 text-center">
        <FaSearch className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 text-gray-500 font-medium text-sm sm:text-base">No matching attendees found</p>
        <p className="text-xs sm:text-sm text-gray-400">Try adjusting your search terms</p>
      </div>
    )}
         
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
              <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-800">
                {Array.isArray(ticketData) ? 'Transaction Tickets' : 'Ticket Details'}
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#FFC0CB] hover:text-[#FFB6C1] flex items-center"
                disabled={isClosingModal}
              >
                {isClosingModal ? (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC0CB] mr-1"></div>
                ) : (
                  <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {ticketData && transactionData ? (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Transaction Details</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Transaction ID</p>
                        <p className="text-gray-900 text-sm sm:text-base">{transactionData.transaction_id}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Attendee Name</p>
                        <p className="text-gray-900 text-sm sm:text-base">{transactionData.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900 text-sm sm:text-base">{transactionData.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-gray-900 text-sm sm:text-base">{transactionData.phone_number || 'N/A'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Status</p>
                        {transactionData.confirmed ? (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium bg-gradient-to-r from-[#FFC0CB] to-black text-white">
                            <FaCheckCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            Payment Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => confirmTransaction(transactionData.transaction_id)}
                            className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-[#FFC0CB] rounded-md shadow-sm text-xs sm:text-sm font-medium text-[#FFC0CB] bg-white hover:bg-[#FFC0CB]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC0CB]"
                            disabled={isConfirmingTransaction[transactionData.transaction_id]}
                          >
                            {isConfirmingTransaction[transactionData.transaction_id] ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC0CB] mr-1"></div>
                                Confirming...
                              </>
                            ) : (
                              'Confirm Payment'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Ticket Details</h3>
                    {Array.isArray(ticketData) ? (
                      ticketData.length > 0 ? (
                        <ul className="space-y-3">
                          {ticketData.map((ticket) => (
                            <li
                              key={ticket.unique_ticket_id}
                              className="border border-gray-200 rounded-md p-3 sm:p-4"
                            >
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-600">Ticket ID</p>
                                  <p className="text-gray-900 text-sm sm:text-base">{ticket.unique_ticket_id}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-600">Email</p>
                                  <p className="text-gray-900 text-sm sm:text-base">{ticket.email}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-600">Ticket Name</p>
                                  <p className="text-gray-900 text-sm sm:text-base">{ticket.ticket_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-600">Status</p>
                                  <p className="text-gray-900 text-sm sm:text-base">{ticket.used ? 'Used' : 'Not Used'}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-600">Created</p>
                                  <p className="text-gray-900 text-sm sm:text-base">
                                    {new Date(ticket.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="sm:col-span-2">
                                  <p className="text-xs sm:text-sm font-medium text-gray-600">Action</p>
                                  {ticket.used ? (
                                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium bg-gradient-to-r from-[#FFC0CB] to-black text-white">
                                      <FaCheckCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                                      Ticket Used
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => confirmTicket(ticket.unique_ticket_id)}
                                      className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-[#FFC0CB] rounded-md shadow-sm text-xs sm:text-sm font-medium text-[#FFC0CB] bg-white hover:bg-[#FFC0CB]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC0CB]"
                                      disabled={isConfirmingTicket[ticket.unique_ticket_id]}
                                    >
                                      {isConfirmingTicket[ticket.unique_ticket_id] ? (
                                        <>
                                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC0CB] mr-1"></div>
                                          Validating...
                                        </>
                                      ) : (
                                        'Validate Entry'
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 text-sm">No tickets found for this transaction.</p>
                      )
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Ticket ID</p>
                          <p className="text-gray-900 text-sm sm:text-base">{ticketData.unique_ticket_id}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Email</p>
                          <p className="text-gray-900 text-sm sm:text-base">{ticketData.email}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Status</p>
                          <p className="text-gray-900 text-sm sm:text-base">{ticketData.used ? 'Used' : 'Not Used'}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Created</p>
                          <p className="text-gray-900 text-sm sm:text-base">
                            {new Date(ticketData.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Action</p>
                          {ticketData.used ? (
                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium bg-gradient-to-r from-[#FFC0CB] to-black text-white">
                              <FaCheckCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                              Ticket Used
                            </span>
                          ) : (
                            <button
                              onClick={() => confirmTicket(ticketData.unique_ticket_id)}
                              className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-[#FFC0CB] rounded-md shadow-sm text-xs sm:text-sm font-medium text-[#FFC0CB] bg-white hover:bg-[#FFC0CB]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC0CB]"
                              disabled={isConfirmingTicket[ticketData.unique_ticket_id]}
                            >
                              {isConfirmingTicket[ticketData.unique_ticket_id] ? (
                                <>
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC0CB] mr-1"></div>
                                  Validating...
                                </>
                              ) : (
                                'Validate Entry'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No ticket or transaction details available.</p>
              )}
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setIsClosingModal(true);
                  setTimeout(() => {
                    setIsModalOpen(false);
                    setIsClosingModal(false);
                  }, 300);
                }}
                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-[#FFC0CB] rounded-md shadow-sm text-xs sm:text-sm font-medium text-[#FFC0CB] bg-white hover:bg-[#FFC0CB]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC0CB]"
                disabled={isClosingModal}
              >
                {isClosingModal ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC0CB] mr-1"></div>
                    Closing...
                  </>
                ) : (
                  'Close'
                )}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Page;
