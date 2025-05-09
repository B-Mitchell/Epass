'use client';
import { useState } from 'react';
import { FaUser, FaChevronDown, FaChevronRight, FaTicketAlt, FaEnvelope, FaCreditCard, FaClipboard, FaCheck, FaSearch } from 'react-icons/fa';

const GuestList = ({ transactions }) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Filter transactions based on search query
  const filteredTransactions = transactions?.filter(
    (txn) =>
      txn.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.tx_ref?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Toggle row expansion
  const toggleRowExpansion = (txnId) => {
    setExpandedRows(prev => ({
      ...prev,
      [txnId]: !prev[txnId]
    }));
  };

  // Copy transaction ID to clipboard
  const copyToClipboard = (text, txnId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(txnId);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
      {/* Search input */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email or transaction reference..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]/50 focus:border-[#FFC0CB] bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Guest list */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="text-gray-300 text-2xl" />
          </div>
          <h3 className="text-gray-700 font-medium mb-1">No guests found</h3>
          <p className="text-gray-500 text-sm">Try a different search term</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {filteredTransactions.map((txn) => (
            <li 
              key={txn.transaction_id} 
              className={`border-l-4 transition-all duration-200 ${expandedRows[txn.transaction_id] ? 'border-[#FFC0CB] bg-[#FFC0CB]/5' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
            >
              {/* Main row - always visible */}
              <div 
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => toggleRowExpansion(txn.transaction_id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`rounded-full h-10 w-10 flex items-center justify-center ${expandedRows[txn.transaction_id] ? 'bg-[#FFC0CB] text-white' : 'bg-[#FFC0CB]/10 text-[#FFC0CB]'}`}>
                      <FaUser className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{txn.name}</p>
                    <div className="flex items-center mt-1">
                      <FaTicketAlt className="h-3 w-3 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500 truncate">
                        {txn.ticketsbought} {txn.ticketsbought === 1 ? 'ticket' : 'tickets'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {txn.confirmed && (
                    <span className="inline-flex mr-3 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaCheck className="mr-1 h-2.5 w-2.5" /> Checked in
                    </span>
                  )}
                  <div className="text-gray-400 transition-transform duration-200 transform">
                    {expandedRows[txn.transaction_id] ? (
                      <FaChevronDown className="h-4 w-4" />
                    ) : (
                      <FaChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedRows[txn.transaction_id] && (
                <div className="px-4 pb-4 pt-1 bg-gray-50 animate-fadeIn">
                  <div className="pt-3 pb-1 border-t border-dashed border-gray-200 mb-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Guest Details</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                        <FaEnvelope className="h-4 w-4 text-[#FFC0CB] mt-0.5 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Email</p>
                          <p className="text-sm text-gray-900">{txn.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                        <FaTicketAlt className="h-4 w-4 text-[#FFC0CB] mt-0.5 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Ticket Type</p>
                          <div className="text-sm text-gray-900">
                            {txn.ticketsInfo && Array.isArray(txn.ticketsInfo) && txn.ticketsInfo.length > 0 ? (
                              txn.ticketsInfo.map((ticket, index) => (
                                <div key={index} className="flex items-center">
                                  {Object.entries(ticket).map(([ticketName, quantity], idx) => (
                                    <span key={idx} className={idx !== 0 ? "ml-2 border-l border-gray-200 pl-2" : ""}>
                                      <span className="font-medium">{ticketName}</span>: <span className="text-[#FFC0CB]">{quantity}</span>
                                    </span>
                                  ))}
                                </div>
                              ))
                            ) : (
                              <p>Standard ticket</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                        <FaCreditCard className="h-4 w-4 text-[#FFC0CB] mt-0.5 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                          <p className="text-sm font-medium text-gray-900">
                            {txn.charged_amount ? (
                              <>NGN <span className="text-green-600">{txn.charged_amount}</span></>
                            ) : (
                              <span className="text-gray-500">Free</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                        <FaClipboard className="h-4 w-4 text-[#FFC0CB] mt-0.5 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Transaction Reference</p>
                          <div className="flex items-center">
                            <p className="text-sm text-gray-900 mr-2 font-mono">{txn.tx_ref}</p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(txn.tx_ref, txn.transaction_id);
                              }}
                              className={`p-1 rounded-md ${copiedId === txn.transaction_id ? "text-green-600 bg-green-50" : "text-[#FFC0CB] hover:bg-[#FFC0CB]/10"}`}
                              title="Copy to clipboard"
                            >
                              {copiedId === txn.transaction_id ? (
                                <FaCheck className="h-3.5 w-3.5" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {txn.status && (
                        <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFC0CB] mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Status</p>
                            <div className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${txn.status === 'successful' ? 'bg-green-500' : txn.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
                              <p className="text-sm text-gray-900 capitalize">{txn.status}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default GuestList; 