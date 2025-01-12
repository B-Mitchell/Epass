"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import supabase from "@/app/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMyContext } from "@/app/context/createContext";
import LoadingAnimation from "@/app/components/LoadingAnimation";

const TicketDashboard = ({ params }) => {
  const userId = useSelector((state) => state.user.user_id);
  const { setTicketRoute } = useMyContext();
  const router = useRouter();
  const ticketId = params.id;

  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchTicketData = async () => {
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
        setTicketData(data[0]);
        setFormData(data[0]);
        setIsOwner(data[0].user_id === userId);
      }
    } catch (err) {
      console.error("Error fetching ticket data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .update(formData)
        .eq("uuid", ticketId);

      if (error) {
        console.error("Error updating ticket:", error);
      } else {
        setTicketData(data[0]);
        setEditMode(false);
      }
    } catch (err) {
      console.error("Error saving edits:", err);
    } finally {
      setLoading(false);
      setEditMode(false);
    }
  };

  useEffect(() => {
    setTicketRoute(ticketId);
    fetchTicketData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-center text-2xl font-bold my-4">Ticket Dashboard</h1>
      {loading ? (
        <LoadingAnimation />
      ) : (
        <div className="border border-pink-300 rounded-lg p-4 md:w-4/5 w-full mx-auto">
          {ticketData ? (
            <>
              {/* Ticket Information */}
              <div className="flex gap-4 mb-6">
              <div className="w-full md:w-3/5 text-gray-800 space-y-4">
                  <h2 className="text-xl font-bold">{ticketData.title}</h2>
                  <p><strong>Address:</strong> {ticketData.address}</p>
                  <p><strong>Time:</strong> {ticketData.startTime} - {ticketData.endTime}</p>
                  <p><strong>Date:</strong> {ticketData.date}</p>
                  <p><strong>Event Type:</strong> {ticketData.typeOfEvent}</p>
                </div>
                <div className="w-full md:w-2/5">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${ticketData.user_id}_${ticketData.image}`}
                    alt="Event image"
                    className="rounded-lg max-h-[20rem]"
                    width={400}
                    height={400}
                  />
                </div>
              </div>

              {/* Edit Section */}
              {isOwner && (
                <div className="mt-6">
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-semibold">Title:</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title || ""}
                          onChange={handleInputChange}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold">Address:</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address || ""}
                          onChange={handleInputChange}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold">Date:</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date || ""}
                          onChange={handleInputChange}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                      <button
                        onClick={saveEdits}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-pink-500 text-white px-4 py-2 rounded"
                    >
                      Edit Ticket
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 italic">No ticket data available.</p>
          )}
        </div>
      )}

    </div>
  );
};

export default TicketDashboard;
