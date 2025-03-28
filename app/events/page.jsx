'use client'
import React, { useEffect, useState } from 'react';
import Event_Ticket from './Event_Ticket';
import supabase from '../supabase';
import LoadingAnimation from '../components/LoadingAnimation';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Page = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [datas, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [view, setView] = useState('standard'); // 'standard' or 'compact' for mobile
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  
  // Function to fetch all events
  const fetchTickets = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('publishEvent', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.log('error fetching tickets');
      } else {
        setData(data);
        setFilteredData(data);
        
        // Get 5 most recent events for the slider
        const featured = data.slice(0, 5);
        setFeaturedEvents(featured);
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
  
  // Filter the events whenever search term or category changes
  useEffect(() => {
    if (datas.length > 0) {
      const filtered = datas.filter(ticket => {
        const nameMatch = searchTerm 
          ? ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) 
          : true;
        const categoryMatch = selectedCategory 
          ? ticket.typeOfEvent === selectedCategory 
          : true;
    return nameMatch && categoryMatch;
      });
      setFilteredData(filtered);
    }
  }, [searchTerm, selectedCategory, datas]);

  // Get unique categories for the filter
  const uniqueTypeOfEvents = [...new Set(datas.map((ticket) => ticket.typeOfEvent))].filter(Boolean);
  
  // Handle slider navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === featuredEvents.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? featuredEvents.length - 1 : prev - 1));
  };
  
  // Auto slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  // Clear filters function
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Section with Featured Events Slider */}
      {featuredEvents.length > 0 && (
        <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
          {featuredEvents.map((event, index) => (
            <div 
              key={event.uuid} 
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="absolute inset-0 bg-black/40 z-10" />
              <Image 
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticketBucket/public/${event.user_id}_${event.image}`}
                alt={event.title}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{event.title}</h2>
                <p className="text-sm md:text-base mb-2">{event.address}</p>
                <button 
                  onClick={() => router.push(`events/${event.uuid}`)}
                  className="bg-[#8B5E3C] text-white px-4 py-2 rounded-lg hover:bg-[#FFC0CB]/80 transition mt-2"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
          
          {/* Slider Controls */}
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 rounded-full p-2"
            onClick={prevSlide}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 rounded-full p-2"
            onClick={nextSlide}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Slider Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
            {featuredEvents.map((_, index) => (
              <button 
                key={index} 
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#1E1E1E]">
          Discover Events
        </h1>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Search Input */}
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by event name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent outline-none"
              />
            </div>
            
            {/* Category Select */}
            <div className="relative min-w-[180px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFC0CB] focus:border-transparent outline-none"
              >
                <option value="">All Categories</option>
                {uniqueTypeOfEvents.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Clear Filters Button and Mobile View Toggle */}
            <div className="flex gap-2">
              <button 
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Clear
              </button>
              
              {/* Only show the view toggle on small screens */}
              <div className="sm:hidden flex border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setView('standard')}
                  className={`px-3 py-2 ${view === 'standard' ? 'bg-[#FFC0CB] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  aria-label="Standard view"
                  title="Standard view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setView('compact')}
                  className={`px-3 py-2 ${view === 'compact' ? 'bg-[#FFC0CB] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  aria-label="Compact view"
                  title="Compact view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
      </div>

        {/* Results Summary */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Showing {filteredData.length} {filteredData.length === 1 ? 'event' : 'events'}
            {selectedCategory && ` in ${selectedCategory}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center my-12">
            <LoadingAnimation />
          </div>
        )}
        
        {/* Empty State */}
        {!loading && filteredData.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 8l-7 7-7-7M16 8h5a2 2 0 012 2v8a2 2 0 01-2 2h-5" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter to find what you're looking for.</p>
            <button onClick={clearFilters} className="px-4 py-2 bg-[#FFC0CB] text-white rounded-lg hover:bg-[#FFC0CB]/90 transition">
              Clear Filters
            </button>
          </div>
        )}
        
        {/* Events Grid View with responsive layout based on view selection */}
        {!loading && filteredData.length > 0 && (
          <div className={
            view === 'standard' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "grid grid-cols-2 gap-3" // Compact view shows 2 items per row even on small screens
          }>
            {filteredData.map((ticket) => (
              <div key={ticket.uuid}>
                <Event_Ticket data={ticket} isCompact={view === 'compact'} />
              </div>
            ))}
          </div>
        )}
    </div>
    </div>
  );
};

export default Page;

