'use client';
import React, { useEffect, useState } from 'react';
import supabase from '@/app/supabase';
import { useMyContext } from '@/app/context/createContext';
import { useRouter } from 'next/navigation';

const CheckoutPage = () => {
  const { ticketRoute,setTicketPrice} = useMyContext();
  // State to store fetched ticket options and selected quantities.
  const [ticketOptions, setTicketOptions] = useState([]); // All ticket data is stored here.
  const [selectedTickets, setSelectedTickets] = useState({}); // To store selected quantities.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  // Fetch ticket options using the event UUID (route)
  useEffect(() => {
    const fetchTickets = async () => {
      if (ticketRoute) {
        try {
          const { data, error } = await supabase
            .from('ticketdata')
            .select('*') // Fetch all columns.
            .eq('event_id', ticketRoute);

          if (error) {
            console.error('Error fetching tickets:', error);
            setError('Failed to fetch tickets. Please try again later.');
          } else {
            console.log('Fetched Ticket Data:', data);
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
          setError('An error occurred. Please try again.');
        }
      }
      setLoading(false);
    };

    fetchTickets();
  }, [ticketRoute]);

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

  const totalFees = subtotal * 0.05 + 100; // 5% of subtotal + 100 Naira fixed fee
  const total = subtotal + totalFees; // Total is subtotal + fees
  
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
                  </div>
                  <div>
                    <label htmlFor={`ticket-${ticket.uuid}`} className="block text-sm">
                      Quantity
                    </label>
                    <select
                      id={`ticket-${ticket.uuid}`} // Use uuid here
                      value={selectedTickets[ticket.uuid]} // And here
                      onChange={(e) => handleTicketQuantityChange(ticket.uuid, parseInt(e.target.value))} // And here
                      className="border p-2 rounded-md"
                    >
                      {/* Checks if the ticketType is 'group', if so limit the max value to 1 */}
                      {[...Array(ticket.ticketType === 'group' ? 2 : ticket.purchaseLimit + 1).keys()].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
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

        <button 
            className="mt-6 w-full py-2 bg-[#FFC0CB] text-white font-semibold hover:bg-transparent hover:text-black border border-[#FFC0CB] transition rounded-2xl"
            disabled={!isAnyTicketSelected()} // Disable if no tickets are selected
            onClick={() => {
              if (isAnyTicketSelected()) {
                setTicketPrice(total)
                router.push(`/events/${ticketRoute}/ticketCheckout/contactForm`); 
              }
            }}
        >
            Proceed to Payment
        </button>

      </div>
    </div>
  );
};

export default CheckoutPage;
