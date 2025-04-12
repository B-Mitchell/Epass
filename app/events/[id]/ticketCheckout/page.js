'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import supabase from '@/app/supabase';
import { useMyContext } from '@/app/context/createContext';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
  const params = useParams();
  const { id } = params; //fetched the ticket ID from the url, it doesn't lose state
  const { ticketRoute, setTicketPrice, setTicketCheckoutData, setNumberOfTickets, selectedTickets, setSelectedTickets, setNamedTicketCounts} = useMyContext();
  // State to store fetched ticket options and selected quantities.
  const [ticketOptions, setTicketOptions] = useState([]); // All ticket data is stored here.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [ isProcessing, setIsProcessing ] = useState(false);
  // Fetch ticket options using the event UUID (route)

  useEffect(() => {
    if (ticketRoute === "") {
      router.push('/events');
    }
    console.log("ticket route:" + ticketRoute);
    const fetchTickets = async () => {
      if (id) {
        try {
          const { data, error } = await supabase
            .from('ticketdata')
            .select('*') // Fetch all columns.
            .eq('event_id', id);

          if (error) {
            console.error('Error fetching tickets:', error);
            setError('Failed to fetch tickets. Please try again later.');
          } else {
            console.log('successful');
            console.log('Ticket data received:', data);
            
            // Log each ticket's currentStock and purchaseLimit
            data.forEach(ticket => {
              console.log(`Fetched ticket ${ticket.ticketName}: currentStock=${ticket.currentStock}, purchaseLimit=${ticket.purchaseLimit}`);
            });
            
            setTicketOptions(data); // Set the entire fetched data to ticketOptions.

            // Initialize selectedTickets with 0 quantities for each ticket.
            const initialSelectedTickets = {};
            data.forEach((ticket) => {
              initialSelectedTickets[ticket.uuid] = 0; // Initialize all ticket quantities to 0 using uuid
            });
            setSelectedTickets(initialSelectedTickets);
            setError('');
          }
        } catch (err) {
          console.error('An error occurred while fetching tickets:', err);
          toast.error('An error occurred. Please try again.');
        }
      }
      setLoading(false);
    };

    fetchTickets();
  }, [id]);

  // Handle ticket quantity changes.
  const handleTicketQuantityChange = (ticketId, quantity) => {
    setSelectedTickets({ ...selectedTickets, [ticketId]: quantity });
  };
  const isAnyTicketSelected = () => {
    return Object.values(selectedTickets).some((quantity) => quantity > 0);
  };

  // Calculate subtotal, total fees, and total.
  const subtotal = Object.keys(selectedTickets).reduce((sum, ticketId) => {
    const ticket = ticketOptions.find((t) => t.uuid === ticketId); // Use uuid for lookup
    if (ticket && selectedTickets[ticketId] > 0) {
      return sum + ticket.ticketPrice * selectedTickets[ticketId];
    }
    return sum;
  }, 0);

  const totalFees = subtotal > 0 ? subtotal * 0.05 + 100 : 0;  // 5% of subtotal + 100 Naira fixed fee
  const total = subtotal + totalFees; // Total is subtotal + fees

  const handleProceedToCheckout = async () => {
    if (isAnyTicketSelected()) {
      setTicketCheckoutData(selectedTickets);
      // Calculate total number of tickets bought
      const totalTicketsBought = Object.values(selectedTickets).reduce(
        (sum, quantity) => sum + quantity,
        0
      );
      // Store the number of tickets in context
      setNumberOfTickets(totalTicketsBought);
        // New part: map UUIDs to names and quantities
        const nameQuantityMap = {};
        ticketOptions.forEach(ticket => {
          const quantity = selectedTickets[ticket.uuid];
          if (quantity > 0) {
            nameQuantityMap[ticket.ticketName.toLowerCase()] = quantity;
          }
        });

       // Save this to context or state
        setNamedTicketCounts([nameQuantityMap]);
      }
      if (total === 0) {
        router.push(`/events/${ticketRoute}/ticketCheckout/contactForm`);
      } else {
        setTicketPrice(total);
        router.push(`/events/${ticketRoute}/ticketCheckout/contactForm`);
      }
  };
  
  
  return (
    <div className="flex flex-col lg:flex-row justify-between max-w-7xl mx-auto p-6 space-y-8 lg:space-y-0 lg:space-x-8">
      {/* Left side: Ticket Details */}
      <div className="lg:w-3/5 space-y-6">
        {loading ? (
          <p>Loading tickets...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          ticketOptions.length > 0 ? (
            ticketOptions.map((ticket) => (
              <div key={ticket.uuid} className="border p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{ticket.ticketName}</h2>
                    <p className="text-red-500">
                      ₦{ticket.ticketPrice}{' '}
                      <span className="text-sm text-gray-500">includes ₦{totalFees.toFixed(2)} fee</span>
                    </p>
                    <p className="mt-2 text-gray-600">{ticket.ticketDescription}</p>
                    {/* Show remaining tickets if 10 or fewer */}
                    {parseInt(ticket.currentStock) <= 10 && (
                      <p className={`mt-1 text-sm ${parseInt(ticket.currentStock) <= 3 ? 'text-red-500 font-medium' : 'text-orange-500'}`}>
                        {parseInt(ticket.currentStock) === 0 
                          ? 'Sold Out!' 
                          : `${parseInt(ticket.currentStock)} ticket${parseInt(ticket.currentStock) > 1 ? 's' : ''} remaining`}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`ticket-${ticket.uuid}`} className="block text-sm">
                      Quantity
                    </label>
                    {console.log(`Ticket ${ticket.ticketName}: currentStock=${ticket.currentStock}, purchaseLimit=${ticket.purchaseLimit}`)}
                    <select
                      id={`ticket-${ticket.uuid}`} 
                      value={selectedTickets[ticket.uuid]} 
                      onChange={(e) => handleTicketQuantityChange(ticket.uuid, parseInt(e.target.value))} 
                      className="border p-2 rounded-md"
                    >
                      {(() => {
                        // Ensure we have the correct values
                        const maxLimit = parseInt(ticket.purchaseLimit) || 10;
                        const availableStock = parseInt(ticket.currentStock) || 0;
                        
                        // Important: Use strict comparison to ensure we get the right minimum
                        let maxOptions;
                        if (ticket.ticketType === 'group') {
                          maxOptions = 2; // 0 or 1 for group tickets
                        } else {
                          // Make explicit calculation for clarity
                          const limitPlusOne = maxLimit + 1;
                          const stockPlusOne = availableStock + 1;
                          maxOptions = limitPlusOne < stockPlusOne ? limitPlusOne : stockPlusOne;
                        }
                        
                        console.log(`Generating options for ${ticket.ticketName}: maxOptions=${maxOptions}, from min(${maxLimit + 1}, ${availableStock + 1})`);
                        
                        // Generate array manually to avoid any issues
                        const options = [];
                        for (let i = 0; i < maxOptions; i++) {
                          options.push(
                            <option key={i} value={i}>
                              {i}
                            </option>
                          );
                        }
                        return options;
                      })()}
                    </select>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No tickets available for this event.</p>
          )
        )}
      </div>

      {/* Right side: Summary */}
      <div className="lg:w-2/5 p-6 border rounded-lg shadow-md bg-gray-50 space-y-6">
        <h2 className="text-2xl font-semibold">Summary</h2>
        <div className="space-y-4">
          {ticketOptions.map(
            (ticket) =>
              selectedTickets[ticket.uuid] > 0 && ( // Use uuid here
                <div key={ticket.uuid} className="flex justify-between">
                  <p>
                    {selectedTickets[ticket.uuid]} × {ticket.ticketName}
                  </p>
                  <p>₦{(ticket.ticketPrice * selectedTickets[ticket.uuid]).toLocaleString()}</p>
                </div>
              )
          )}
          <div className="flex justify-between text-gray-600">
            <p>Fees</p>
            <p>₦{totalFees.toLocaleString()}</p>
          </div>
          <div className="flex justify-between font-semibold">
            <p>Subtotal</p>
            <p>₦{subtotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-between text-xl font-bold">
          <p>Total</p>
          <p>₦{total?.toLocaleString()}</p>
        </div>

        {isProcessing ? 
          <button className="mt-6 w-full py-2 bg-gray-600 text-white font-semibold cursor-pointer hover:bg-transparent hover:text-black border border-[#FFC0CB] rounded-2xl animate-pulse transition">processing...</button> 
        : 
          <button className={`mt-6 w-full py-2 ${isAnyTicketSelected() ? 'bg-[#FFC0CB]' : 'bg-gray-500 border-gray-500 text-black'} text-white font-semibold cursor-pointer hover:bg-transparent hover:text-black border transition rounded-2xl border-[#FFC0CB]`}
            disabled={!isAnyTicketSelected()} // Disable if no tickets are selected
            onClick={() => handleProceedToCheckout()}>
            Proceed to Checkout
          </button>
        }
      </div>
    </div>
  );
};

export default CheckoutPage;
