"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import supabase from "@/app/supabase";
import { useRouter } from "next/navigation";
import { useMyContext } from "@/app/context/createContext";
import { nanoid } from 'nanoid';
import LoadingAnimation from "@/app/components/LoadingAnimation";
import Image from "next/image";
import ProgressCircle from "@/app/components/ProgressCircle";
import dynamic from "next/dynamic";
import { toast } from 'react-toastify';
import GuestList from "@/app/components/GuestList";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

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
  const [transactions, setTransactions] = useState([]);  // State for guests/transactions
    // Function to copy referral link to clipboard
  const copyReferralLink = (code) => {
    const referralLink = `${window.location.origin}/events/${ticketId}?ref=${code}`;
    try {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy referral link:', err);
      toast.error('Failed to copy referral link.');
    }
  };
  const [referralStats, setReferralStats] = useState([]);
  const [newTicket, setNewTicket] = useState({
    ticketName: "",
    ticketDescription: "",
    ticketPrice: 0,
    ticketStock: "",
    ticketType: "",
    groupSize: null,
    pricingType: "free",
    purchaseLimit: "",
    isUnlimited: false,
  });
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventData, setEditEventData] = useState({
    title: "",
    address: "",
    date: "",
    startTime: "",
    endTime: "",
    eventDescription: ""
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
        // Check if the current user is the owner of the event
        setIsOwner(data[0].user_id === userId);
        // Reset edit form when new data is fetched
        if (isEditingEvent) {
          setEditEventData({
            title: data[0].title || "",
            address: data[0].address || "",
            date: data[0].date ? new Date(data[0].date).toISOString().split('T')[0] : "",
            startTime: data[0].startTime || "",
            endTime: data[0].endTime || "",
            eventDescription: data[0].eventDescription || ""
          });
        }
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
  
  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const { data: refCodes, error: refError } = await supabase
        .from('referral_codes')
        .select('code, event_id')
        .eq('user_id', userId)
        .eq('event_id', ticketId);
      if (refError) throw refError;

      const eventIds = [...new Set(refCodes.map(rc => rc.event_id))];
      const { data: events, error: eventError } = await supabase
        .from('tickets')
        .select('uuid, title')
        .in('uuid', eventIds);
      if (eventError) throw eventError;

      const codes = refCodes.map(rc => rc.code);
      const { data: transactions, error: txnError } = await supabase
        .from('transactions')
        .select('referral_code, ticketsInfo, event_id')
        .in('referral_code', codes);
      if (txnError) throw txnError;

      const calculatedStats = refCodes.map(rc => {
        const codeTransactions = transactions.filter(t => t.referral_code === rc.code);
        const ticketCounts = {};
        codeTransactions.forEach(txn => {
          txn.ticketsInfo.forEach(ticket => {
            const name = ticket.ticketName;
            ticketCounts[name] = (ticketCounts[name] || 0) + 1;
          });
        });
        const eventTitle = events.find(e => e.uuid === rc.event_id)?.title || 'Unknown Event';
        return {
          code: rc.code,
          eventTitle,
          ticketCounts,
        };
      });
      setReferralStats(calculatedStats);
    } catch (err) {
      console.error('Error fetching referral stats:', err);
      toast.error('Failed to load referral statistics.');
    } finally {
      setLoading(false);
    }
  };
   const generateReferralCode = async (eventId) => {
    const code = nanoid(6);
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .insert([{ code, user_id: userId, event_id: eventId }]);
      if (error) throw error;
      toast.success(`Referral code generated: ${code}`);
      const referralLink = `${window.location.origin}/events/${eventId}?ref=${code}`;
      navigator.clipboard.writeText(referralLink);
      toast.info('Referral link copied to clipboard!');
      fetchReferralStats();
    } catch (err) {
      console.error('Error generating referral code:', err);
      toast.error('Failed to generate referral code.');
    }
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
    
    // Validate all required fields and focus on any missing fields
    if (!validateAndFocusOnMissingField()) {
      return; // Stop if validation fails
    }
    
    // If we get here, all required fields are filled - proceed with data submission
    // Create a cleaned ticket data object without isUnlimited property
    const { isUnlimited, ...ticketDataWithoutFlag } = newTicket;
    
    const ticketData = {
      ...ticketDataWithoutFlag,
      user_id: userId,
      event_id: ticketId,
      ticketPrice: newTicket.pricingType === 'free' ? 0 : parseFloat(newTicket.ticketPrice),
      // For unlimited tickets, store null in ticketStock
      ticketStock: isUnlimited ? null : parseInt(newTicket.ticketStock),
      // For unlimited tickets, use a very high number for currentStock
      currentStock: isUnlimited ? 999999 : parseInt(newTicket.ticketStock),
      purchaseLimit: newTicket.ticketType === 'single' ? parseInt(newTicket.purchaseLimit) : null,
      groupSize: newTicket.ticketType === 'group' ? parseInt(newTicket.groupSize) : null,
    };
    
    try {
      setLoading(true);
      console.log("Sending ticket data:", ticketData);
      const { error } = await supabase
        .from("ticketdata")
        .insert(ticketData);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

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
        isUnlimited: false,
      });
      setSelectedOption("");
    } catch (err) {
      console.error("Error adding new ticket:", err);
      alert("Failed to add ticket: " + err.message);
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
      const isUnlimited = ticket.ticketStock === null;
      const ticketPrice = ticket.ticketPrice ?? 0;
      
      if (isUnlimited) {
        // For unlimited tickets, only count realized revenue from sold tickets
        const currentStock = ticket.currentStock ?? 999999;
        const soldTickets = 999999 - currentStock;
        if (soldTickets > 0) {
          realizedRevenueSum += soldTickets * ticketPrice;
        }
        // Don't add to total potential revenue (it's unlimited)
      } else {
        // For limited tickets
        const ticketStock = ticket.ticketStock ?? 0;
        const currentStock = ticket.currentStock ?? 0;
        
        // Only add to total if stock is positive
        if (ticketStock > 0) {
          totalRevenueSum += ticketStock * ticketPrice;
        }
        
        // Calculate sold tickets (handle case where currentStock might be higher)
        const soldTickets = ticketStock >= currentStock ? ticketStock - currentStock : 0;
        realizedRevenueSum += soldTickets * ticketPrice;
      }
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

  // Helper function to check if all required fields are filled
  const validateAndFocusOnMissingField = () => {
    // Basic required fields for all ticket types
    if (!newTicket.ticketType) {
      const element = document.querySelector('input[name="ticketType"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        alert('Please select a Ticket Type');
      } else {
        alert('Please select a Ticket Type');
      }
      return false;
    }
    
    if (!newTicket.ticketName) {
      const element = document.querySelector('input[name="ticketName"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        alert('Please enter a Ticket Name');
      } else {
        alert('Please enter a Ticket Name');
      }
      return false;
    }
    
    if (!newTicket.ticketDescription) {
      const element = document.querySelector('textarea[name="ticketDescription"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        alert('Please provide a Ticket Description');
      } else {
        alert('Please provide a Ticket Description');
      }
      return false;
    }
    
    // Check ticket stock if not unlimited
    if (!newTicket.isUnlimited && !newTicket.ticketStock) {
      const element = document.querySelector('input[name="ticketStock"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        alert('Please specify the Ticket Stock');
      } else {
        alert('Please specify the Ticket Stock');
      }
      return false;
    }
    
    // Check single ticket purchase limit
    if (newTicket.ticketType === 'single' && !newTicket.purchaseLimit) {
      const element = document.querySelector('input[name="purchaseLimit"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        alert('Please specify a Purchase Limit for single tickets');
      } else {
        alert('Please specify a Purchase Limit for single tickets');
      }
      return false;
    }
    
    // Check group ticket group size
    if (newTicket.ticketType === 'group' && !newTicket.groupSize) {
      const element = document.querySelector('input[name="groupSize"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        alert('Please specify the Group Size');
      } else {
        alert('Please specify the Group Size');
      }
      return false;
    }
    
    // Check pricing selection
    if (!selectedOption) {
      const element = document.querySelector('input[name="pricing"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        alert('Please select a Pricing Type (Free or Paid)');
      } else {
        alert('Please select a Pricing Type (Free or Paid)');
      }
      return false;
    }
    
    // Check price for paid tickets
    if (selectedOption === 'paid' && !newTicket.ticketPrice) {
      const element = document.querySelector('input[name="ticketPrice"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        alert('Please specify the Ticket Price');
      } else {
        alert('Please specify the Ticket Price');
      }
      return false;
    }
    
    return true; // All required fields are filled
  };

  // Function to handle event update
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Format date and time for database
      const formattedDate = editEventData.date ? new Date(editEventData.date).toISOString().split('T')[0] : EventData.date;
      
      const { error } = await supabase
        .from("tickets")
        .update({
          title: editEventData.title || EventData.title,
          address: editEventData.address || EventData.address,
          date: formattedDate,
          startTime: editEventData.startTime || EventData.startTime,
          endTime: editEventData.endTime || EventData.endTime,
          eventDescription: editEventData.eventDescription || EventData.eventDescription
        })
        .eq("uuid", ticketId);

      if (error) throw error;
      
      // Refresh event data
      await fetchEventData();
      setIsEditingEvent(false);
      
      // Show success message
      alert("Event details updated successfully!");
    } catch (err) {
      console.error("Error updating event:", err);
      alert("Failed to update event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to start editing event
  const startEditingEvent = () => {
    setEditEventData({
      title: EventData.title || "",
      address: EventData.address || "",
      date: EventData.date ? new Date(EventData.date).toISOString().split('T')[0] : "",
      startTime: EventData.startTime || "",
      endTime: EventData.endTime || "",
      eventDescription: EventData.eventDescription || ""
    });
    setIsEditingEvent(true);
  };

  // Fetch transactions (guests) for the event
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('event_id', ticketId);

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRevenue();
    fetchReferralStats();
    setTicketRoute(ticketId);
    fetchTickets();
    fetchEventData();
    fetchTransactions(); // Fetch transactions for guest list
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
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-700 border border-green-400/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></div>
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-700 border border-yellow-400/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                    Draft
                  </span>
                  )}
                </p>
              </div>
            )}

            {/* Navigation Tabs - Compact design for mobile */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="grid grid-cols-5 -mb-px">
                <button
                  onClick={() => setActiveTab('details')}
                    className={`py-3 px-1 text-xs sm:text-sm font-medium flex flex-col items-center justify-center ${
                    activeTab === 'details'
                      ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Details</span>
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                    className={`py-3 px-1 text-xs sm:text-sm font-medium flex flex-col items-center justify-center ${
                    activeTab === 'sales'
                      ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Sales</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('guests')}
                    className={`py-3 px-1 text-xs sm:text-sm font-medium flex flex-col items-center justify-center ${
                      activeTab === 'guests'
                        ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Guests</span>
                </button>
                <button
                  onClick={() => setActiveTab('scan')}
                    className={`py-3 px-1 text-xs sm:text-sm font-medium flex flex-col items-center justify-center ${
                    activeTab === 'scan'
                      ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span>Scan</span>
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                    className={`py-3 px-1 text-xs sm:text-sm font-medium flex flex-col items-center justify-center ${
                    activeTab === 'tickets'
                      ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <span>Tickets</span>
                </button>
                <button
                onClick={() => setActiveTab('referrals')}
                className={`py-3 px-1 text-xs sm:text-sm font-medium flex flex-col items-center justify-center ${
                  activeTab === 'referrals'
                    ? 'border-b-2 border-[#FFC0CB] text-[#FFC0CB]'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-4.553a2 2 0 112.828 2.828L17.828 13H15v-3zM9 10H6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-3l-5-5z" />
                </svg>
                <span>Referrals</span>
              </button>
              </nav>
              </div>
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
                        <div className="mt-4 space-y-3">
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
                          
                          <button
                            onClick={startEditingEvent}
                            className="flex items-center justify-center w-full space-x-2 px-4 py-2 rounded-lg bg-[#FFC0CB] hover:bg-[#FFC0CB]/90 text-white transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit Event</span>
                          </button>
                          <button
                            onClick={() => generateReferralCode(ticketId)}
                            className="flex items-center justify-center w-full space-x-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-4.553a2 2 0 112.828 2.828L17.828 13H15v-3zM9 10H6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-3l-5-5z" />
                            </svg>
                            <span>Generate Referral Code</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Event Details */}
                    <div className="md:w-2/3">
                      {isEditingEvent ? (
                        <form onSubmit={handleUpdateEvent} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                            <input
                              type="text"
                              value={editEventData.title}
                              onChange={(e) => setEditEventData({...editEventData, title: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              value={editEventData.address}
                              onChange={(e) => setEditEventData({...editEventData, address: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                              <input
                                type="date"
                                value={editEventData.date}
                                onChange={(e) => setEditEventData({...editEventData, date: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                                required
                                min={new Date().toISOString().split("T")[0]}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                              <input
                                type="time"
                                value={editEventData.startTime}
                                onChange={(e) => setEditEventData({...editEventData, startTime: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                                required
                                
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                              <input
                                type="time"
                                value={editEventData.endTime}
                                onChange={(e) => setEditEventData({...editEventData, endTime: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                                required
                               
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Description</label>
                            <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#FFC0CB] overflow-hidden">
                              <style jsx global>{`
                                .quill {
                                  border: none;
                                }
                                .ql-container {
                                  border: none !important;
                                  font-size: 16px;
                                }
                                .ql-toolbar {
                                  border: none !important;
                                  border-bottom: 1px solid #e5e7eb !important;
                                  flex-wrap: wrap;
                                }
                                .ql-toolbar .ql-formats {
                                  margin-right: 8px;
                                  margin-bottom: 4px;
                                }
                                @media (max-width: 640px) {
                                  .ql-snow .ql-toolbar {
                                    padding: 4px;
                                  }
                                  .ql-toolbar .ql-formats {
                                    margin-right: 4px;
                                    margin-bottom: 4px;
                                  }
                                  .ql-editor {
                                    min-height: 120px !important;
                                    padding: 8px;
                                  }
                                }
                              `}</style>
                              <ReactQuill 
                                value={editEventData.eventDescription} 
                                onChange={(content) => setEditEventData({...editEventData, eventDescription: content})}
                                style={{ minHeight: '150px' }}
                                modules={{
                                  toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['link'],
                                    ['clean']
                                  ]
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-2 mt-6">
                            <button
                              type="button"
                              onClick={() => setIsEditingEvent(false)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 text-sm font-medium text-white bg-[#FFC0CB] rounded-md hover:bg-[#FFC0CB]/90"
                              disabled={loading}
                            >
                              {loading ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </form>
                      ) : (
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

                          {/* Event Description Section */}
                          {EventData.eventDescription && (
                            <div className="flex flex-col md:flex-row md:items-start mt-4">
                              <div className="flex items-center mb-2 md:mb-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFC0CB] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                <p className="font-medium text-gray-700 md:hidden">Description</p>
                              </div>
                              <div className="w-full md:w-auto md:flex-1">
                                <p className="font-medium text-gray-700 hidden md:block mb-1">Description</p>
                                <div className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 w-full">
                                  {typeof EventData.eventDescription === 'string' && EventData.eventDescription.includes('<') ? (
                                    <div className="event-description-content" dangerouslySetInnerHTML={{ __html: EventData.eventDescription }} />
                                  ) : (
                                    <p>{EventData.eventDescription}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Global style for event description content */}
                          <style jsx global>{`
                            .event-description-content {
                              word-break: break-word;
                              overflow-wrap: break-word;
                            }
                            .event-description-content p {
                              margin-bottom: 0.75rem;
                            }
                            .event-description-content h1,
                            .event-description-content h2,
                            .event-description-content h3 {
                              margin-top: 1rem;
                              margin-bottom: 0.5rem;
                              font-weight: 600;
                            }
                            .event-description-content ul,
                            .event-description-content ol {
                              margin-left: 1.5rem;
                              margin-bottom: 0.75rem;
                            }
                            .event-description-content img {
                              max-width: 100%;
                              height: auto;
                            }
                            /* Mobile specific styles */
                            @media (max-width: 640px) {
                              .event-description-content h1 {
                                font-size: 1.25rem;
                              }
                              .event-description-content h2 {
                                font-size: 1.125rem;
                              }
                              .event-description-content h3 {
                                font-size: 1rem;
                              }
                            }
                          `}</style>
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
                      
                      {/* Desktop view - table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {eventTickets.map((ticket, index) => {
                              // Handle unlimited tickets case
                              const isUnlimited = ticket.ticketStock === null;
                              
                              // Calculate sold tickets 
                              let sold = 0;
                              if (isUnlimited) {
                                // For unlimited tickets, calculate based on initial stock of 999999
                                sold = 999999 - (ticket.currentStock || 999999);
                                if (sold < 0) sold = 0; // Ensure no negative values
                              } else {
                                // For limited tickets
                                const initialStock = ticket.ticketStock || 0;
                                const currentStock = ticket.currentStock || 0;
                                // Handle case where currentStock might be higher than ticketStock
                                sold = initialStock >= currentStock ? initialStock - currentStock : 0;
                              }
                              
                              const revenue = sold * (ticket.ticketPrice || 0);
                              const totalTickets = isUnlimited ? 999999 : (ticket.ticketStock || 0);
                              const percentageSold = isUnlimited 
                                ? (sold / 999999) * 100  // Special handling for unlimited
                                : totalTickets > 0 ? (sold / totalTickets) * 100 : 0;
                              
                              return (
                                <tr key={ticket.uuid}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.ticketName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">NGN {ticket.ticketPrice || 0}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{isUnlimited ? 'Unlimited' : ticket.currentStock}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sold}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <ProgressCircle 
                                      percentage={percentageSold} 
                                      size={45} 
                                      strokeWidth={5}
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">NGN {revenue}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Mobile view - cards */}
                      <div className="md:hidden space-y-4">
                        {eventTickets.map((ticket, index) => {
                          // Handle unlimited tickets case
                          const isUnlimited = ticket.ticketStock === null;
                          
                          // Calculate sold tickets 
                          let sold = 0;
                          if (isUnlimited) {
                            // For unlimited tickets, calculate based on initial stock of 999999
                            sold = 999999 - (ticket.currentStock || 999999);
                            if (sold < 0) sold = 0; // Ensure no negative values
                          } else {
                            // For limited tickets
                            const initialStock = ticket.ticketStock || 0;
                            const currentStock = ticket.currentStock || 0;
                            // Handle case where currentStock might be higher than ticketStock
                            sold = initialStock >= currentStock ? initialStock - currentStock : 0;
                          }
                          
                          const revenue = sold * (ticket.ticketPrice || 0);
                          const totalTickets = isUnlimited ? 999999 : (ticket.ticketStock || 0);
                          const percentageSold = isUnlimited 
                            ? (sold / 999999) * 100  // Special handling for unlimited
                            : totalTickets > 0 ? (sold / totalTickets) * 100 : 0;
                          
                          return (
                            <div key={ticket.uuid} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                              {/* Header with ticket name and price */}
                              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                <h4 className="font-semibold text-gray-900 text-lg">{ticket.ticketName}</h4>
                                <span className="text-sm font-medium bg-gray-50 px-3 py-1 rounded-full text-gray-700">
                                  NGN {ticket.ticketPrice || 0}
                                </span>
                              </div>
                              
                              {/* Progress section with visual indicator */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-sm font-medium text-gray-700">Sales Progress</p>
                                  <span className="text-xs font-medium text-gray-500">
                                    {sold} {isUnlimited ? '' : `of ${totalTickets}`} sold
                                  </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <ProgressCircle 
                                    percentage={percentageSold} 
                                    size={40} 
                                    strokeWidth={4}
                                  />
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        percentageSold > 80 ? 'bg-red-500' : 
                                        percentageSold > 50 ? 'bg-amber-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${percentageSold}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Stats grid */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1">Available</p>
                                  <p className="text-sm font-semibold text-gray-900">{ticket.ticketStock === null ? 'Unlimited' : ticket.currentStock}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1">Revenue</p>
                                  <p className="text-sm font-semibold text-gray-900">NGN {revenue}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Guest List Tab Content */}
              {activeTab === 'guests' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Guest List</h2>
                  
                  {loading ? (
                    <div className="flex justify-center my-8">
                      <LoadingAnimation />
                    </div>
                  ) : transactions.length > 0 ? (
                    <GuestList transactions={transactions} />
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Guests Yet</h3>
                      <p className="text-gray-500">Your guest list will appear here once tickets are purchased</p>
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
                                      {ticket.ticketStock === null ? 'Unlimited' : `${ticket.currentStock} remaining`}
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
                                      <div className="absolute right-0 -mt-4 z-[100] w-48 border border-gray-200 bg-white rounded-md shadow-lg">
                                        <button
                                          onClick={() => {
                                            setEditTicketId(ticket.uuid);
                                            setEditFormData(ticket);
                                            setActiveMenu(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                                        >
                                          Edit Ticket
                                        </button>
                                        <button
                                          onClick={() => handleDelete(ticket)}
                                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-md"
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
                        {/* Ticket Type Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Type</label>
                          <div className="flex space-x-4 mb-4">
                            <label className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                name="ticketType" 
                                value="single" 
                                checked={newTicket.ticketType === 'single'} 
                                onChange={(e) => handleInputChange(e, setNewTicket)}
                                className="text-[#FFC0CB] focus:ring-[#FFC0CB]" 
                                required
                              />
                              <span>Single Ticket</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                name="ticketType" 
                                value="group" 
                                checked={newTicket.ticketType === 'group'} 
                                onChange={(e) => handleInputChange(e, setNewTicket)}
                                className="text-[#FFC0CB] focus:ring-[#FFC0CB]" 
                                required
                              />
                              <span>Group Ticket</span>
                            </label>
                          </div>
                        </div>

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
                            <div className="flex flex-col space-y-2">
                              <input
                                type="number"
                                name="ticketStock"
                                placeholder="Number of tickets available"
                                value={newTicket.ticketStock}
                                onChange={(e) => handleInputChange(e, setNewTicket)}
                                className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                                disabled={newTicket.isUnlimited}
                                required={!newTicket.isUnlimited}
                              />
                              <label className="flex items-center space-x-2 mt-1">
                                <input 
                                  type="checkbox" 
                                  name="isUnlimited"
                                  checked={newTicket.isUnlimited}
                                  onChange={(e) => setNewTicket(prev => ({
                                    ...prev,
                                    isUnlimited: e.target.checked,
                                    ticketStock: e.target.checked ? '' : prev.ticketStock
                                  }))}
                                  className="text-[#FFC0CB] focus:ring-[#FFC0CB]"
                                />
                                <span className="text-sm">Unlimited</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        {/* Ticket Description */}
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
                        
                        {/* Conditional fields based on ticket type */}
                        {newTicket.ticketType === 'single' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Limit</label>
                            <input
                              type="number"
                              name="purchaseLimit"
                              placeholder="Maximum tickets per purchase"
                              value={newTicket.purchaseLimit}
                              onChange={(e) => handleInputChange(e, setNewTicket)}
                              className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                              required
                            />
                          </div>
                        )}
                        
                        {newTicket.ticketType === 'group' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Group Size</label>
                            <input
                              type="number"
                              name="groupSize"
                              placeholder="Number of people in each group"
                              value={newTicket.groupSize}
                              onChange={(e) => handleInputChange(e, setNewTicket)}
                              className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                              required
                            />
                          </div>
                        )}
                        
                        {/* Pricing Type */}
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
              {activeTab === 'referrals' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">My Referral Codes</h2>
                    <p className="text-gray-600">Track your referral performance and earnings</p>
                  </div>
                  
                  {referralStats.length > 0 ? (
                    <div className="grid gap-6">
                      {referralStats.map(stat => (
                        <div key={stat.code} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-4.553a2 2 0 112.828 2.828L17.828 13H15v-3zM9 10H6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-3l-5-5z" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{stat.eventTitle}</h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-sm text-gray-500">Referral Code:</span>
                                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-mono font-medium">
                                      {stat.code}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-50 rounded-lg" onClick={() => copyReferralLink(stat.code)}>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>

                              </button>
                            </div>
                            
                            <div className="border-t border-gray-100 pt-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Tickets Sold
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(stat.ticketCounts).map(([name, count]) => (
                                  <div key={name} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700">{name}</span>
                                      <span className="bg-white text-gray-900 px-2 py-1 rounded-md text-sm font-bold shadow-sm">
                                        {count}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="max-w-md mx-auto">
                        <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-4.553a2 2 0 112.828 2.828L17.828 13H15v-3zM9 10H6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-3l-5-5z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">No Referral Codes Yet</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          Start earning by generating your first referral code.<br />
                          Track ticket sales and grow your network effortlessly.
                        </p>
                        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                          Generate First Code
                        </button>
                      </div>
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
