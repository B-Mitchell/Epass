'use client'
import React, { useEffect, useState } from 'react';
import Event_Ticket from './Event_Ticket';
import supabase from '../supabase';
import LoadingAnimation from '../components/LoadingAnimation';

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [datas, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const fetchTickets = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.log('error fetching tickets');
      } else {
        setData(data);
      }
    } catch (err) {
      console.error('Error is: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTickets();
  }, []);
  const filterBySearchAndCategory = (ticket) => {
    const nameMatch = searchTerm ? ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const categoryMatch = selectedCategory ? ticket.typeOfEvent === selectedCategory : true;
    return nameMatch && categoryMatch;
  };
  const handleSearch = () => {
    fetchTickets();
  };
  const uniqueTypeOfEvents = [...new Set(datas.map((ticket) => ticket.typeOfEvent))];
  return (
    <div>
      <p className='text-center font-bold text-[1.4rem] mt-4'>Available Events</p>

      {/* Search Bar */}
      <div className='flex items-center justify-center mt-4 mb-2 m-auto md:w-[60%] w-[80%]'>
        <input
          type='text'
          placeholder='Search by Event Name'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='border border-gray-300 outline-[#E0BFB8] p-2 mr-2'
        />
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className='border border-gray-300 p-2 outline-[#E0BFB8]'
        >
          <option value=''>All Categories</option>
          {uniqueTypeOfEvents.map((eventType) => (
            <option key={eventType} value={eventType}>
              {eventType}
            </option>
          ))}
        </select>
        {/* Search Button */}
        <button onClick={handleSearch} className='bg-black rounded-lg  text-white p-2 ml-2 hover:text-[#E0BFB8]  hover:scale-105 transition'>Search</button>
      </div>

      <p className={`text-center ${loading ? 'mt-10' : null} font-bold italic`}>
        {loading ? <LoadingAnimation /> : null}
      </p>

      <div className='mt-5 grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-3 p-2 w-[98%] m-auto mb-7'>
        {datas
          .filter(filterBySearchAndCategory)
          .map((ticket) => (
            <div key={ticket.created_at} className='flex items-center justify-center'>
              <Event_Ticket data={ticket} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default Page;

