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

  const [loading, setLoading] = useState(false);
  const [eventTickets, setEventTickets] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editTicketId, setEditTicketId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [EventData, setEventData] = useState(null);
  const [newTicket, setNewTicket] = useState({
    ticketName: "",
    ticketDescription: "",
    ticketPrice: "",
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
      setIsOwner(data?.[0]?.user_id === userId);
      console.log(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    setTicketRoute(ticketId);
    fetchTickets();
    fetchEventData();
  }, []);

  return (
    <div className="p-4 w-[100%] block justify-between md:flex">
      <div className="p-4">
      <h1 className="text-center text-2xl font-bold my-4">Event Details</h1>
      {loading ? (
        <p></p>
      ) : (
        <div className="border border-gray-300 rounded-lg p-6 md:w-4/5 w-full mx-auto bg-white">
          {EventData ? (
            <>
              {/* Event Information */}
              <div className="flex gap-4 mb-6">
                <div className="w-full md:w-3/5 text-gray-800 space-y-4">
                  <h2 className="text-xl font-bold text-blue-700">
                    {EventData.title}
                  </h2>
                  <p>
                    <strong>Address:</strong> {EventData.address}
                  </p>
                  <p>
                    <strong>Time:</strong> {EventData.startTime} -{" "}
                    {EventData.endTime}
                  </p>
                  <p>
                    <strong>Date:</strong> {EventData.date}
                  </p>
                  <p>
                    <strong>Event Type:</strong> {EventData.typeOfEvent}
                  </p>
                </div>
                <div className="w-full md:w-2/5">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${EventData.user_id}_${EventData.image}`}
                    alt="Event image"
                    className="rounded-lg max-h-[20rem]"
                    width={400}
                    height={400}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 italic">
              No event data available.
            </p>
          )}
        </div>
      )}
    </div>
      {loading ? (
        <LoadingAnimation />
      ) : (
        <div className="border border-gray-300 rounded-lg p-6 md:w-4/5 w-full mx-auto bg-white">
          {eventTickets.length > 0 ? (
            <>
              <div>
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
                        <div className="flex justify-between items-center">
                          <span>{ticket.ticketName}</span>
                          {isOwner && (
                            <button
                              onClick={() => {
                                setEditTicketId(ticket.uuid);
                                setEditFormData(ticket);
                              }}
                              className="text-blue-500"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {isOwner && (
                <form className="mt-6" 
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
                    <input
                      type="number"
                      name="ticketPrice"
                      placeholder="Price"
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
