"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import supabase from "@/app/supabase";
import { useRouter } from "next/navigation";
import { useMyContext } from "@/app/context/createContext";
import LoadingAnimation from "@/app/components/LoadingAnimation";
import Image from "next/image";

const TicketDashboard = ({ params }) => {
  const userId = useSelector((state) => state.user.user_id);
  const { setTicketRoute } = useMyContext();
  const router = useRouter();
  const ticketId = params.id;
  const [activeMenu, setActiveMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventTickets, setEventTickets] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editTicketId, setEditTicketId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [EventData, setEventData] = useState(null);
  const [calRevenue, setCalRevenue] = useState([]);  //this is to store the tickets to calculate revenue
  const [activeTab, setActiveTab] = useState('details'); // New state for navigation tabs
  const [newTicket, setNewTicket] = useState({
    ticketName: "",
    ticketDescription: "",
    ticketPrice: 0,
    ticketStock: "",
    ticketType: "",
    groupSize: null,
    pricingType: "free",
    purchaseLimit: "",
  });
  //fetch event details
  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("uuid", ticketId);

      if (error) {
        console.error(error);
        router.back();
      } else if (data.length > 0) {
        setEventData(data[0]);
      }
    } catch (err) {
      console.error("Error fetching ticket data:", err);
    } finally {
      setLoading(false);
    }
  };
  // Fetch tickets for the event
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ticketdata")
        .select("*")
        .eq("event_id", ticketId);

      if (error) throw error;

      setEventTickets(data);
      setCalRevenue(data);
      setIsOwner(data?.[0]?.user_id === userId);
      console.log(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };
  const [selectedOption, setSelectedOption] = useState("");
  
  const handleOptionClick = (option) => {
    setSelectedOption(option);
    // Update newTicket state correctly
  setNewTicket((prevTicket) => ({
    ...prevTicket,
    pricingType: option === 'free' ? 'free' : 'paid',
  }));
  }
  // Handle ticket form input changes
  const handleInputChange = (e, setter) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  // Save ticket edits
  const saveTicketEdits = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("ticketdata")
        .update(editFormData)
        .eq("uuid", id);

      if (error) throw error;

      fetchTickets();
      setEditTicketId(null);
    } catch (err) {
      console.error("Error saving ticket edits:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (ticket) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ticketdata")
        .select("ticketStock, currentStock")
        .eq("uuid", ticket.uuid)
        .single();

      if (error) throw error;

      if (data.currentStock < data.ticketStock) {
        alert("This ticket type cannot be deleted as tickets have already been sold.");
      } else {
        const { error: deleteError } = await supabase
          .from("ticketdata")
          .delete()
          .eq("uuid", ticket.uuid);

        if (deleteError) throw deleteError;

        fetchTickets();
      }
    } catch (err) {
      console.error("Error deleting ticket:", err);
    } finally {
      setActiveMenu(null);
      setLoading(false);
    }
  };
  // Add a new ticket
  const addNewTicket = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase
        .from("ticketdata")
        .insert({
          ...newTicket,
          user_id: userId,
          event_id: ticketId,
        });

      if (error) throw error;

      fetchTickets();
      setNewTicket({
        ticketName: "",
        ticketDescription: "",
        ticketPrice: "",
        ticketStock: "",
        ticketType: "",
        groupSize: null,
        pricingType: "free",
        purchaseLimit: "",
      });
    } catch (err) {
      console.error("Error adding new ticket:", err);
    } finally {
      setLoading(false);
    }
  };
  const handlePublishToggle = async (e) => {
    // Prevent default behavior if event is provided
    if (e) e.preventDefault();
    
    try {
        setLoading(true);
        
        // If trying to unpublish (currently published), check if any tickets have been sold
        if (EventData.publishEvent) {
            // Check if any tickets have been sold by looking at currentStock vs ticketStock
            const { data, error } = await supabase
                .from('ticketdata')
                .select('currentStock, ticketStock')
                .eq('event_id', ticketId);
            
            if (error) throw error;
            
            // Check if any ticket has been sold (currentStock is less than ticketStock)
            const ticketsSold = data.some(ticket => 
                (ticket.currentStock !== null && ticket.ticketStock !== null) && 
                (ticket.currentStock < ticket.ticketStock)
            );
            
            if (ticketsSold) {
                alert('Cannot unpublish event as tickets have already been sold.');
                return; // Exit early, don't unpublish
            }
        }
        
        // If no tickets sold or we're publishing (not unpublishing), proceed with the update
        const { error } = await supabase
            .from('tickets')
            .update({ publishEvent: !EventData.publishEvent })
            .eq('uuid', ticketId);

        if (error) throw error;

        // Update local state without refreshing the page
        setEventData(prevData => ({ ...prevData, publishEvent: !prevData.publishEvent }));
    } catch (err) {
        console.error('Error toggling publish status:', err);
    } finally {
        setLoading(false);
    }
  };
  // handle rev calculation
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [realizedRevenue, setRealizedRevenue] = useState(0);
  const calculateRevenue = async () => {
    const { data, error } = await supabase.from("ticketdata").select("ticketStock, ticketPrice, currentStock").eq("event_id", ticketId);

    if (error) {
      console.log(error)
      return;
    }
    let totalRevenueSum = 0;
    let realizedRevenueSum = 0;
  
    data.forEach((ticket) => {
      const ticketStock = ticket.ticketStock ?? 0;
      const ticketPrice = ticket.ticketPrice ?? 0;
      const currentStock = ticket.currentStock ?? 0;
  
      totalRevenueSum += ticketStock * ticketPrice;
      realizedRevenueSum += (ticketStock - currentStock) * ticketPrice;
      console.log(ticketPrice)
    });
  
    setTotalRevenue(totalRevenueSum);
    setRealizedRevenue(realizedRevenueSum);
  }

  // Format time to show only HH:MM
  const formatTime = (timeString) => {
    if (!timeString) return "";
    
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }
    return timeString;
  };
  
  // Format date to be more concise
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    const datePart = dateString.split('T')[0];
    if (datePart) {
      try {
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      } catch (e) {
        // If any error in parsing, return original date part
      }
      return datePart;
    }
    return dateString;
  };

  useEffect(() => {
    calculateRevenue();

    setTicketRoute(ticketId);
    fetchTickets();
    fetchEventData();
  }, []);


  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-6xl mx-auto pt-6 px-4">
      {loading ? (
          <div className="flex justify-center my-12">
            <LoadingAnimation />
          </div>
        ) : (
          <>
            {/* Page Header with Event Title */}
            {EventData && (
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-[#1E1E1E]">{EventData.title}</h1>
                <p className="text-gray-600 mt-2">
                  {EventData.publishEvent ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Event Details
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'sales'
                      ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sales
                </button>
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'scan'
                      ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Scan Ticket
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'tickets'
                      ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tickets
                </button>
              </nav>
            </div>

            {/* Content based on active tab */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Event Details Tab Content */}
              {activeTab === 'details' && EventData && (
                <div className="p-6">
                  <div className="md:flex">
                    {/* Event Image */}
                    <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6">
                      <div className="relative h-[200px] rounded-lg overflow-hidden">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${EventData.user_id}_${EventData.image}`}
                          alt={EventData.title}
                          className="object-cover"
                          fill
                        />
                      </div>
                      
                      {isOwner && (
                        <div className="mt-4">
                    <button 
                        onClick={handlePublishToggle}
                            className="flex items-center justify-center w-full space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <div className={`w-11 h-6 relative rounded-full transition-colors ${EventData.publishEvent ? 'bg-[#FFC0CB]' : 'bg-gray-300'}`}>
                            <div 
                                className={`absolute top-0.5 left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${EventData.publishEvent ? 'translate-x-5' : ''}`}
                            ></div>
                        </div>
                        <span>{EventData.publishEvent ? 'Published' : 'Unpublished'}</span>
                    </button>
                </div>
              )}
            </div>
                    
                    {/* Event Details */}
                    <div className="md:w-2/3">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFC0CB] mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-700">Location</p>
                            <p className="text-gray-600">{EventData.address}</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFC0CB] mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-700">Date</p>
                            <p className="text-gray-600">{formatDate(EventData.date)}</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFC0CB] mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-700">Time</p>
                            <p className="text-gray-600">{formatTime(EventData.startTime)} - {formatTime(EventData.endTime)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFC0CB] mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-700">Event Type</p>
                            <p className="text-gray-600">{EventData.typeOfEvent}</p>
                          </div>
            </div>
          </div>
                      
                      {EventData.description && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                          <p className="text-gray-600 whitespace-pre-line">{EventData.description}</p>
                        </div>
        )}
      </div>
                  </div>
                </div>
              )}

              {/* Sales Tab Content */}
              {activeTab === 'sales' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Sales Overview</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-[#FFC0CB]/10 to-[#FFC0CB]/30 p-6 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Potential Revenue</h3>
                      <p className="text-3xl font-bold text-[#1E1E1E]">NGN {totalRevenue}</p>
                      <p className="text-sm text-gray-600 mt-2">Total potential revenue from all tickets</p>
      </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Revenue</h3>
                      <p className="text-3xl font-bold text-green-600">NGN {realizedRevenue}</p>
                      <p className="text-sm text-gray-600 mt-2">Revenue from tickets already sold</p>
        </div>
      </div>
                  
                  {eventTickets.length > 0 && (
                    <div className="mt-8">
                      <h3 className="font-medium text-gray-900 mb-4">Ticket Sales Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {eventTickets.map((ticket) => {
                              const sold = (ticket.ticketStock || 0) - (ticket.currentStock || 0);
                              const revenue = sold * (ticket.ticketPrice || 0);
                              
                              return (
                                <tr key={ticket.uuid}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.ticketName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">NGN {ticket.ticketPrice || 0}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.currentStock || 0}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sold}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">NGN {revenue}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
    </div>
      )}
    </div>
              )}

              {/* Scan Ticket Tab Content */}
              {activeTab === 'scan' && (
                <div className="p-6 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="bg-gradient-to-br from-[#FFC0CB]/10 to-[#FFC0CB]/30 p-8 rounded-xl mb-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#FFC0CB] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <h2 className="text-xl font-bold mb-2 text-gray-900">Scan QR Code</h2>
                      <p className="text-gray-600 mb-6">Use this feature to scan and validate tickets at the event entrance</p>
                      
                      <button 
                        onClick={() => router.push(`/profile/${ticketId}/validate-payment`)}
                        className="w-full py-3 bg-[#FFC0CB] text-white font-semibold rounded-lg hover:bg-[#FFC0CB]/90 transition shadow-md"
                      >
                        Validate Tickets
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tickets Tab Content */}
              {activeTab === 'tickets' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Manage Tickets</h2>
                  
          {eventTickets.length > 0 ? (
                    <div className="mb-8">
                      <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
                        {eventTickets.map((ticket, index) => (
                          <div 
                            key={ticket.uuid} 
                            className={`bg-white p-4 ${index !== eventTickets.length - 1 ? 'border-b border-gray-200' : ''}`}
                          >
                      {editTicketId === ticket.uuid ? (
                        <form className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Name</label>
                          <input
                            type="text"
                            name="ticketName"
                            value={editFormData.ticketName || ""}
                            onChange={(e) => handleInputChange(e, setEditFormData)}
                                      className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                            required
                          />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            name="ticketPrice"
                            value={editFormData.ticketPrice || ""}
                            onChange={(e) => handleInputChange(e, setEditFormData)}
                                      className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                            required
                          />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                  <textarea
                                    name="ticketDescription"
                                    value={editFormData.ticketDescription || ""}
                            onChange={(e) => handleInputChange(e, setEditFormData)}
                                    className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                                    rows="3"
                            required
                          />
                                </div>
                                
                                <div className="flex items-center justify-end space-x-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditTicketId(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                          <button
                                    type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            saveTicketEdits(ticket.uuid);
                          }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#FFC0CB] rounded-lg hover:bg-[#FFC0CB]/90"
                          >
                                    Save Changes
                          </button>
                                </div>
                        </form>
                      ) : (
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-gray-900">{ticket.ticketName}</h3>
                                  <p className="mt-1 text-sm text-gray-500">{ticket.ticketDescription}</p>
                                  <div className="mt-2 flex items-center">
                                    <span className="text-sm font-medium text-gray-900">
                                      {ticket.pricingType === 'free' ? 'Free' : `NGN ${ticket.ticketPrice}`}
                                    </span>
                                    <span className="mx-2 text-gray-400">•</span>
                                    <span className="text-sm text-gray-500">
                                      {ticket.currentStock} remaining
                                    </span>
                                  </div>
                                </div>
                                
                          {isOwner && (
                            <div className="relative">
                            <button
                                      onClick={() => setActiveMenu(ticket.uuid === activeMenu ? null : ticket.uuid)}
                                      className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                      </svg>
                            </button>
          
                            {activeMenu === ticket.uuid && (
                                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                <button
                                  onClick={() => {
                                    setEditTicketId(ticket.uuid);
                                    setEditFormData(ticket);
                                    setActiveMenu(null);
                                  }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          Edit Ticket
                                </button>
                                <button
                                  onClick={() => handleDelete(ticket)}
                                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                          Delete Ticket
                                </button>
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Available</h3>
                      <p className="text-gray-500 mb-6">Create your first ticket to start selling</p>
              </div>
                  )}

              {isOwner && (
                    <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Ticket</h3>
                      
                      <form onSubmit={addNewTicket} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Name</label>
                    <input
                      type="text"
                      name="ticketName"
                              placeholder="e.g. VIP, Regular, Early Bird"
                      value={newTicket.ticketName}
                      onChange={(e) => handleInputChange(e, setNewTicket)}
                              className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Stock</label>
                            <input
                              type="number"
                              name="ticketStock"
                              placeholder="Number of tickets available"
                              value={newTicket.ticketStock}
                              onChange={(e) => handleInputChange(e, setNewTicket)}
                              className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                      required
                    />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="ticketDescription"
                            placeholder="Describe what this ticket includes"
                      value={newTicket.ticketDescription}
                      onChange={(e) => handleInputChange(e, setNewTicket)}
                            className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                            rows="3"
                      required
                    />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</label>
                          <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                          <input
                            type="radio"
                                name="pricing"
                            value="free"
                            checked={selectedOption === "free"}
                            onChange={() => handleOptionClick("free")}
                                className="h-4 w-4 text-[#FFC0CB] focus:ring-[#FFC0CB] border-gray-300"
                          />
                              <span className="ml-2 text-gray-700">Free</span>
                        </label>

                            <label className="inline-flex items-center">
                          <input
                            type="radio"
                                name="pricing"
                            value="paid"
                            checked={selectedOption === "paid"}
                            onChange={() => handleOptionClick("paid")}
                                className="h-4 w-4 text-[#FFC0CB] focus:ring-[#FFC0CB] border-gray-300"
                          />
                              <span className="ml-2 text-gray-700">Paid</span>
                        </label>
                      </div>
                        </div>
                        
                        {selectedOption === "paid" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (NGN)</label>
                    <input
                      type="number"
                      name="ticketPrice"
                              placeholder="Ticket price in NGN"
                      value={newTicket.ticketPrice}
                      onChange={(e) => handleInputChange(e, setNewTicket)}
                              className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                              required={selectedOption === "paid"}
                    />
                  </div>
                        )}
                        
                        <div className="pt-4">
                  <button
                  type="submit"
                            className="w-full py-3 bg-[#FFC0CB] text-white font-semibold rounded-lg hover:bg-[#FFC0CB]/90 transition shadow-md"
                  >
                    Add Ticket
                  </button>
                        </div>
                </form>
                    </div>
                  )}
                </div>
              )}
            </div>
            </>
          )}
        </div>
    </div>
  );
};

export default TicketDashboard;
