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
  
      totalRevenueSum += (ticketStock - currentStock) * ticketPrice;
      realizedRevenueSum += currentStock * ticketPrice;
      console.log(ticketPrice)
    });
  
    setTotalRevenue(totalRevenueSum);
    setRealizedRevenue(realizedRevenueSum);
  }

  useEffect(() => {
    calculateRevenue();

    setTicketRoute(ticketId);
    fetchTickets();
    fetchEventData();
  }, []);


  return (
    <div className="p-4 w-[100%] block justify-between md:flex">
      <div className="p-4">
      <h1 className="text-center text-2xl font-bold my-2">Event Details</h1>
      {loading ? (
        <p></p>
      ) : (
        <div className="bg-white shadow-lg rounded-xl p-6 md:w-3/4 w-full mx-auto">
      {/* Event Details */}
      <div className="bg-gray-100 p-6 rounded-lg">
        {EventData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Event Text Information */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-blue-700">{EventData.title}</h2>
              <p className="text-gray-700">
                <span className="font-semibold">📍 Address:</span> {EventData.address}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">⏰ Time:</span> {EventData.startTime} - {EventData.endTime}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">📅 Date:</span> {EventData.date}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">🎭 Event Type:</span> {EventData.typeOfEvent}
              </p>
            </div>

            {/* Event Image */}
            <div className="flex justify-center max-h-[15rem]">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${EventData.user_id}_${EventData.image}`}
                alt="Event image"
                className="rounded-lg shadow-md object-cover"
                width={300}
                height={100}
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 italic">No event data available.</p>
        )}
      </div>

      {/* Revenue Section */}
      <div className="bg-blue-50 p-4 mt-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">💰 Revenue</h3>
        <div className="text-gray-800 mt-2 space-y-1">
          <p>Total Potential Revenue: <span className="font-bold text-blue-600">NGN {totalRevenue}</span></p>
          <p>Current Revenue: <span className="font-bold text-green-600">NGN {realizedRevenue}</span></p>
        </div>
      </div>
    </div>
      )}
    </div>
      {loading ? (
        <LoadingAnimation />
      ) : (
        <div className="border border-gray-300 rounded-lg p-6 md:w-4/5 w-full mx-auto bg-white">
          {eventTickets.length > 0 ? (
            <>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Tickets</h2>
                <ul>
                  {eventTickets.map((ticket) => (
                    <li key={ticket.uuid} className="border-b py-4">
                      {editTicketId === ticket.uuid ? (
                        <form className="space-y-4">
                          <input
                            type="text"
                            name="ticketName"
                            value={editFormData.ticketName || ""}
                            onChange={(e) => handleInputChange(e, setEditFormData)}
                            className="border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                            required
                          />
                          <textarea
                            name="ticketDescription"
                            value={editFormData.ticketDescription || ""}
                            onChange={(e) => handleInputChange(e, setEditFormData)}
                            className="border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                            required
                          />
                          <input
                            type="number"
                            name="ticketPrice"
                            value={editFormData.ticketPrice || ""}
                            onChange={(e) => handleInputChange(e, setEditFormData)}
                            className="border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                            required
                          />
                          <input
                            type="number"
                            name="ticketStock"
                            disabled
                            value={editFormData.ticketStock || ""}
                            onChange={(e) => handleInputChange(e, setEditFormData)}
                            className="border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                            required
                          />
                          <button
                          onClick={(e) => {
                            e.preventDefault();
                            saveTicketEdits(ticket.uuid);
                          }}
                            className="px-4 py-2 w-[20%] mt-6  bg-[#FFC0CB] text-white font-semibold cursor-pointer hover:bg-transparent hover:text-black border border-[#FFC0CB] transition rounded-2xl"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditTicketId(null)}
                            className="ml-2 text-red-500"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        // START
                        <div className="flex justify-between items-center">
                          <span>{ticket.ticketName}</span>
                          {isOwner && (
                            <div className="relative">
                            {/* Kebab Menu Trigger */}
                            <button
                              onClick={() =>
                                setActiveMenu(ticket.uuid === activeMenu ? null : ticket.uuid)
                              }
                              className="text-gray-900 text-2xl hover:text-black"
                            >
                              &#x22EE; {/* Vertical Ellipsis */}
                            </button>
          
                            {/* Dropdown Menu */}
                            {activeMenu === ticket.uuid && (
                              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 shadow-md rounded-lg z-10"
                              >
                                <button
                                  onClick={() => {
                                    setEditTicketId(ticket.uuid);
                                    setEditFormData(ticket);
                                    setActiveMenu(null);
                                  }}
                                  className="block px-4 py-2 w-full text-left text-gray-700 hover:bg-gray-100"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    alert("Sell clicked!");
                                    setActiveMenu(null);
                                  }}
                                  className="block px-4 py-2 w-full text-left text-gray-700 hover:bg-gray-100"
                                >
                                  Sell Out
                                </button>
                                <button
                                  onClick={() => handleDelete(ticket)}
                                  className="block px-4 py-2 w-full text-left text-red-500 hover:bg-gray-100"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {isOwner && (
                <form className="mt-6 bg-gray-100 p-4 rounded-lg" 
                onSubmit={(e) => addNewTicket(e)} >
                  <h3 className="font-bold text-lg mb-2">Add New Ticket</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="ticketName"
                      placeholder="Ticket Name"
                      value={newTicket.ticketName}
                      onChange={(e) => handleInputChange(e, setNewTicket)}
                      className="border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                      required
                    />
                    <textarea
                      name="ticketDescription"
                      placeholder="Description"
                      value={newTicket.ticketDescription}
                      onChange={(e) => handleInputChange(e, setNewTicket)}
                      className="border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                      required
                    />
                    <h2 className="text-lg font-bold">pricing Type:</h2>
                      <div className="flex justify-start">
                        {/* Option 1 */}
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="free"
                            value="free"
                            checked={selectedOption === "free"}
                            onChange={() => handleOptionClick("free")}
                            className="w-4 h-4"
                          />
                          Free
                        </label>

                        {/* Option 2 */}
                        <label className="flex items-center gap-1 mx-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paid"
                            value="paid"
                            checked={selectedOption === "paid"}
                            onChange={() => handleOptionClick("paid")}
                            className="w-4 h-4"
                          />
                          Paid
                        </label>
                      </div>
                    {/* Show Selected Option */}
                    {/* <p className="mt-4 text-gray-600">
                      Selected: <span className="font-bold">{selectedOption || "None"}</span>
                    </p> */}
                    <input
                      type="number"
                      name="ticketPrice"
                      placeholder="Price"
                      disabled = {selectedOption === 'free' ? true : false}
                      value={newTicket.ticketPrice}
                      onChange={(e) => handleInputChange(e, setNewTicket)}
                      className="border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                      required
                    />
                    <input
                      type="number"
                      name="ticketStock"
                      placeholder="Stock"
                      value={newTicket.ticketStock}
                      onChange={(e) => handleInputChange(e, setNewTicket)}
                      className="border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]"
                      required
                    />
                  </div>
                  <button
                  type="submit"
                    className="mt-6 w-full py-2 bg-[#FFC0CB] text-white font-semibold cursor-pointer hover:bg-transparent hover:text-black border border-[#FFC0CB] transition rounded-2xl"
                  >
                    Add Ticket
                  </button>
                </form>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 italic">
              No tickets available for this event.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketDashboard;
