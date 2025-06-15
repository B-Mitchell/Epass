'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../globalRedux/slices/userSlice';
import supabase from '../supabase';
import LoadingAnimation from '../components/LoadingAnimation';
import { IoSettingsOutline } from 'react-icons/io5';
import { FaCalendarAlt, FaMapMarkerAlt, FaPlus, FaTh, FaList } from 'react-icons/fa';
import Image from 'next/image';

const Page = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user.user_id);
  const first_name = useSelector((state) => state.user.first_name);
  const user_email = useSelector((state) => state.user.user_email);
  const last_name = useSelector((state) => state.user.last_name);
  const organizer_name = useSelector((state) => state.user.organizer_name);
  const phone_number = useSelector((state) => state.user.phone_number);

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isTwoColumn, setIsTwoColumn] = useState(false); // New state for toggle
  const [counts, setCounts] = useState({
    all: 0,
    published: 0,
    draft: 0,
  });

  const authFunction = () => {
    if (!userId) {
      console.log('Redirecting to login...');
      router.push('/login');
    }
  };

  useEffect(() => {
    authFunction();
    fetchEvents();
  }, [userId]);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push('/login');
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching events:', error.message);
      } else {
        const eventsData = data || [];
        const publishedCount = eventsData.filter((event) => event.publishEvent === true).length;
        const draftCount = eventsData.filter((event) => event.publishEvent === false).length;

        setCounts({
          all: eventsData.length,
          published: publishedCount,
          draft: draftCount,
        });

        setEvents(eventsData);
        setFilteredEvents(eventsData);
      }
    } catch (error) {
      console.error('Error in fetchEvents:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (uuid) => {
    router.push(`profile/${uuid}`);
  };

  const filterEvents = (status) => {
    setActiveFilter(status);
    if (status === 'all') {
      setFilteredEvents(events);
    } else {
      const isPublished = status === 'published';
      setFilteredEvents(events.filter((event) => event.publishEvent === isPublished));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const datePart = dateString.split('T')[0];
    if (datePart) {
      try {
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      } catch (e) {}
      return datePart;
    }
    return dateString;
  };

  // Toggle between one and two columns on mobile
  const toggleColumnLayout = () => {
    setIsTwoColumn((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Profile Card */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="bg-gradient-to-r from-[#FFC0CB] to-black rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-6 text-white relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold mb-1">Welcome, {first_name} {last_name}</h2>
                <p className="flex items-center">
                  <span className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold mr-2">
                    {organizer_name || 'Event Organizer'}
                  </span>
                </p>
              </div>
              <div className="absolute top-6 right-4">
                <button
                  onClick={() => router.push('/profile/payout')}
                  className="text-white hover:text-[#FFC0CB] transition-colors duration-200"
                >
                  <IoSettingsOutline className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="mt-6 border-t border-white/20 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-white/70 text-sm mb-1">Email</p>
                  <p className="font-medium">{user_email}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Phone</p>
                  <p className="font-medium">{phone_number || 'Not provided'}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-white/10 md:w-[20%] w-[30%] text-center hover:bg-white/20 border border-white/30 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="w-8 h-1 bg-[#FFC0CB] rounded-full mr-3 hidden md:block"></div>
              <h2 className="text-xl font-bold text-[#1E1E1E]">Your Events</h2>
            </div>
            <button
              onClick={toggleColumnLayout}
              className="md:hidden p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
              aria-label={isTwoColumn ? 'Switch to single-column layout' : 'Switch to two-column layout'}
            >
              {isTwoColumn ? (
                <FaList className="h-5 w-5 text-gray-700" />
              ) : (
                <FaTh className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>

          {/* Event Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-xl shadow-md p-2">
            <button
              onClick={() => filterEvents('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                activeFilter === 'all'
                  ? 'bg-gradient-to-r from-[#FFC0CB] to-black text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Events
              <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs">{counts.all}</span>
            </button>
            <button
              onClick={() => filterEvents('published')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                activeFilter === 'published'
                  ? 'bg-gradient-to-r from-[#FFC0CB] to-black text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Published
              <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs">{counts.published}</span>
            </button>
            <button
              onClick={() => filterEvents('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                activeFilter === 'draft'
                  ? 'bg-gradient-to-r from-[#FFC0CB] to-black text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Drafts
              <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs">{counts.draft}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <LoadingAnimation />
            </div>
          ) : events.length > 0 ? (
            <div className={`grid ${isTwoColumn ? 'grid-cols-2' : 'grid-cols-1'} md:grid-cols-2 lg:grid-cols-3 gap-6`}>
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  <div className={`relative ${isTwoColumn ? 'h-32' : 'h-40'} w-full bg-gray-200`}>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${event.user_id}_${event.image}`}
                      alt={event.title}
                      className="object-cover"
                      fill
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          event.publishEvent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.publishEvent ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <span className="text-xs font-medium text-white bg-[#FFC0CB]/80 px-2 py-0.5 rounded-full">
                        {event.typeOfEvent}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className={`font-bold text-[#1E1E1E] line-clamp-2 mb-2 ${isTwoColumn ? 'text-sm' : 'text-base'}`}>
                      {event.title}
                    </h3>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="h-4 w-4 text-[#FFC0CB] mr-2" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="h-4 w-4 text-[#FFC0CB] mr-2 mt-0.5 flex-shrink-0" />
                        <span className={`text-sm text-gray-600 ${isTwoColumn ? 'line-clamp-1' : 'line-clamp-2'}`}>
                          {event.address}
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEventClick(event.uuid)}
                        className="w-full py-2 bg-gradient-to-r from-[#FFC0CB] to-black hover:bg-gradient-to-r hover:from-black hover:to-[#FFC0CB] text-white rounded-lg font-medium hover:shadow-md transition duration-800"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 && events.length > 0 ? (
            <div className="text-center bg-white rounded-xl shadow-md p-8 mt-5">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-[#FFC0CB]/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-[#FFC0CB]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No {activeFilter} events found</h3>
              <p className="text-gray-600 mb-6">Try selecting a different filter or create a new event</p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => filterEvents('all')}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
                >
                  Show All Events
                </button>
                <button
                  onClick={() => router.push('/profile/createEvent')}
                  className="px-6 py-2 bg-gradient-to-r from-[#FFC0CB] to-black text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Create New Event
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center bg-white rounded-xl shadow-md p-8 mt-5">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-[#FFC0CB]/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-[#FFC0CB]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 8l-7 7-7-7M16 8h5a2 2 0 012 2v8a2 2 0 01-2 2h-5"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">You haven't created any events yet</p>
              <button
                onClick={() => router.push('/profile/createEvent')}
                className="px-6 py-2 bg-gradient-to-r from-[#FFC0CB] to-black text-white rounded-lg font-medium transition-colors duration-200"
              >
                Create Your First Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Create Event Button */}
      <button
        onClick={() => router.push('/profile/createEvent')}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-[#FFC0CB] to-black text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group z-10"
      >
        <FaPlus className="h-6 w-6" />
        <span className="absolute right-full mr-3 bg-gradient-to-r from-[#FFC0CB] to-black px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Create Event
        </span>
      </button>
    </div>
  );
};

export default Page;
