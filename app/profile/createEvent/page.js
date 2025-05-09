'use client'
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import EventCreation from '@/app/modals/EventCreation';
import { useMyContext } from '@/app/context/createContext';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const Page = () => {
    const router = useRouter();
    const { createEventModal, setCreateEventModal } = useMyContext();
    const userId = useSelector(state => state.user.user_id);
    const [activeTab, setActiveTab] = useState('single');

    const [eventImage, setEventImage] = useState(null);
    const [imageFileName, setImageFileName] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription,setEventDescription] = useState('')
    const [selectedOption, setSelectedOption] = useState('');
    const [eventAddress, setEventAddress] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [instagramHandle, setInstagramHandle] = useState('');
    const [twitterHandle, setTwitterHandle] = useState('');
    const [facebookHandle, setFacebookHandle] = useState('');
    const [eventFrequency, setEventFrequency] = useState('');
    const [endCondition, setEndCondition] = useState('');
    const [endDate, setEndDate] = useState('');
    const [occurrences, setOccurrences] = useState('');
    const [isAddingTicket, setIsAddingTicket] = useState(false);
    const [ticketType, setTicketType] = useState('single');
    const [pricingType,setPricingType]=useState();
    const [ticketName, setTicketName] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketStock, setTicketStock] = useState('');
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [purchaseLimit, setPurchaseLimit] = useState('');
    const [groupSize, setGroupSize] = useState('');
    const[ticketList,setTicketList]=useState([])
    const [publishEvent, setPublishEvent] = useState(false);
    const authFunction = () => {
        if (userId) {
            console.log('user: ' + userId);
        } else {
            console.log("redirecting to login...");
            router.push('/login');
        }
    };

    useEffect(() => {
        authFunction();
    }, [userId]);

    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
    };

    const handleTicketPricingChange = (event) => {
        setPricingType(event.target.value);
    };
    const handleCreateTicket = () => {
        // Add ticket to the list
        setTicketList([
            ...ticketList,
            {
                ticketName: ticketName,
                ticketPrice:ticketPrice,
                ticketType: ticketType,
                pricingType: pricingType,
                ticketDescription: ticketDescription,
                ticketStock: isUnlimited ? 'unlimited' : ticketStock,
                currentStock:ticketStock,
                purchaseLimit: ticketType === 'single' ? purchaseLimit : null,
                groupSize: ticketType === 'group' ? groupSize : null,
            },
        ]);
        // Reset form fields
    setTicketType('');
    setPricingType('');
    setTicketName('');
    setTicketPrice('');
    setTicketDescription('');
    setTicketStock('');
    setIsUnlimited(false);
    setPurchaseLimit('');
    setGroupSize('');

    // Hide form
    setIsAddingTicket(false);
    }
    const removeTicket = (name) => {
        setTicketList(ticketList.filter((ticket) => ticket.ticketName !== name));
      };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const commonData = {
            user_id: userId,
            title: eventTitle,
            eventDescription:eventDescription,
            typeOfEvent: selectedOption,
            address: eventAddress,
            image: imageFileName?.name || '',
            instagram: instagramHandle,
            twitter: twitterHandle,
            facebook: facebookHandle,
            publishEvent:publishEvent,
        };
        const singleEventData = {
            ...commonData,
            date: eventDate,
            startTime:startTime,
            endTime:endTime,
            
        };

        const recurringEventData = {
            ...commonData,
            
            eventFrequency:eventFrequency,
            endCondition:endCondition,
            endDate: endCondition === 'date' ? endDate : null,
            occurrences: endCondition === 'occurrences' ? occurrences : null,
        };
        console.log(ticketList);
        console.log(ticketData);
        console.log(recurringEventData)
        console.log(singleEventData)
        
        const ticketData = ticketList.map((ticket) => ({
            // id: ticket.id,
            ticketName: ticket.ticketName,
            ticketPrice: ticket.pricingType === 'free' ? 0 : ticket.ticketPrice,
            ticketType: ticket.ticketType === 'single' ? 'single' : 'group',
            pricingType: ticket.pricingType,
            ticketDescription: ticket.ticketDescription,
            ticketStock: ticket.ticketStock,
            currentStock:ticket.ticketStock,
            purchaseLimit: ticket.purchaseLimit,
            groupSize: ticket.groupSize,
          }));
        
        const eventData = activeTab === 'single' ? singleEventData : recurringEventData;

        try {
            
            // Insert event data into Supabase
            const {data:event,error: eventError } = await supabase
              
                .from('tickets')
                .insert(eventData)
                .select('uuid');
            
            
            if (eventError) throw eventError;
            
            const eventId = event[0].uuid; // Get the newly created event ID
       
            // Insert ticket data
            if (ticketList.length > 0) {
                const ticketData = ticketList.map((ticket) => ({
                    ...ticket,
                    event_id: eventId,
                    user_id:userId, // Associate each ticket with the event ID
                }));

                const { error: ticketError } = await supabase
                    .from('ticketdata')
                    .insert(ticketData)
                    .select();

                if (ticketError) throw ticketError;
            }

            console.log('Event and tickets successfully created.');
            resetForm();
            setCreateEventModal(true); // Close modal on success

        } catch (error) {
            console.error('Error creating event and tickets:', error.message);
        }

        // Upload image
        try {
            const { data, error } = await supabase.storage
                .from('ticketBucket')
                .upload(`public/${userId}_${imageFileName.name}`, imageFileName);
            if (error) {
                console.error('Error uploading image:', error.message);
            } else {
                console.log('Image uploaded successfully:', data);
                setCreateEventModal(!createEventModal);
                resetForm();
            }
        } catch (error) {
            console.error('Error during image upload:', error.message);
        }
        
    };

   
    const resetForm = () => {
        setEventImage(null);
        setImageFileName(null);
        setEventTitle('');
        setSelectedOption('');
        setEventAddress('');
        setEventDate('');
        setStartTime('');
        setEndTime('');
        setInstagramHandle('');
        setTwitterHandle('');
        setFacebookHandle('');
        setNops('');
        setEventFrequency('');
        setEndCondition('');
        setEndDate('');
        setOccurrences('');
        setTicketType('single');
        setTicketName('');
        setTicketPrice('');
        setTicketDescription('');
        setTicketStock('');
        setIsUnlimited(false);
        setPurchaseLimit('');
        setGroupSize('');
        setTicketList([]);
    };
    const handlePublishToggle = () => {
        setPublishEvent(!publishEvent);
    };

    return (
        <div className='pb-6'>
            {createEventModal ? <EventCreation /> : null}

            <p className='text-center font-bold text-2xl my-4'>Create Event</p>

            <form className='border border-gray-300 md:w-1/2 w-[90%] mx-auto rounded-3xl p-6 shadow-lg' onSubmit={handleSubmit}>
                <div className='mb-4'>
                    <label className='block text-lg font-medium mb-2'>Event Image:</label>
                    <input type='file' onChange={(e) => { setEventImage(URL.createObjectURL(e.target.files[0])); setImageFileName(e.target.files[0]) }} className='bg-gray-100 w-full p-3 rounded-xl' required />
                    {eventImage && <div className='border border-gray-300 mt-2 w-[40%] h-20 rounded-xl overflow-hidden'>
                        <img src={eventImage} alt='event' className='w-full h-full object-cover' />
                    </div>}
                </div>

                <div className='mb-4'>
                    <label className='block text-lg font-medium mb-2'>Title:</label>
                    <input type='text' placeholder='e.g., "Sonic Fusion"' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setEventTitle(e.target.value) }} value={eventTitle} />
                </div>
                <div>
                <label className='block text-lg font-medium mb-2'>Event Description</label>
                <div className='border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-[#FFC0CB] overflow-hidden'>
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
                        }
                    `}</style>
                    <ReactQuill 
                        value={eventDescription} 
                        onChange={setEventDescription}
                        style={{ minHeight: '200px', border: 'none' }}
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


                <div className='mb-4'>
                    <label className='block text-lg font-medium mb-2'>Event Type:</label>
                    <div className='grid md:grid-cols-3 grid-cols-2 gap-4'>
                        {['party', 'sports', 'concert', 'webinar', 'seminar', 'conference'].map(type => (
                            <label key={type} className='flex items-center space-x-2'>
                                <input type="radio" value={type} checked={selectedOption === type} onChange={handleOptionChange} required className='w-4 h-4' />
                                <span className='capitalize'>{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className='mb-4'>
                    <label className='block text-lg font-medium mb-2'>Address:</label>
                    <input type='text' placeholder='e.g., 19 Avenue building, Victoria Island' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setEventAddress(e.target.value) }} value={eventAddress} />
                </div>

                <div className='flex justify-center mb-6'>
                    <button type="button" className={`px-4 py-2 rounded-l-lg ${activeTab === 'single' ? 'bg-[#FFC0CB] text-white' : 'bg-gray-200'} transition`} onClick={() => setActiveTab('single')}>Single Event</button>
                    <button type="button" className={`px-4 py-2 rounded-r-lg ${activeTab === 'recurring' ? 'bg-[#FFC0CB] text-white' : 'bg-gray-200'} transition`} onClick={() => setActiveTab('recurring')}>Recurring Event</button>
                </div>

                {activeTab === 'single' && (
                    <>
                        <div className='mb-4'>
                            <label className='block text-lg font-medium mb-2'>Event Date:</label>
                            <input type="date" className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setEventDate(e.target.value) }} value={eventDate} />
                        </div>

                        <div className='grid md:grid-cols-2 grid-cols-1 gap-4'>
                            <div className='mb-4'>
                                <label className='block text-lg font-medium mb-2'>Start Time:</label>
                                <input type="time" className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setStartTime(e.target.value) }} value={startTime} />
                            </div>

                            <div className='mb-4'>
                                <label className='block text-lg font-medium mb-2'>End Time:</label>
                                <input type="time" className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-bg-[#FFC0CB]' required onChange={(e) => { setEndTime(e.target.value) }} value={endTime} />
                            </div>
                        </div>

                       
                    </>
                )}

                {activeTab === 'recurring' && (
                    <>
                        <div className='mb-4'>
                            <label className='block text-lg font-medium mb-2'>Start Date:</label>
                            <input type="date" className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setEventDate(e.target.value) }} value={eventDate} />
                        </div>

                        <div className='mb-4'>
                            <label className='block text-lg font-medium mb-2'>Frequency:</label>
                            <select className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setEventFrequency(e.target.value) }} value={eventFrequency}>
                                <option value="">Select</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Biweekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        <div className='mb-4'>
                            <label className='block text-lg font-medium mb-2'>End Condition:</label>
                            <select className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setEndCondition(e.target.value) }} value={endCondition}>
                                <option value="">Select</option>
                                <option value="date">End Date</option>
                                <option value="occurrences">Number of Occurrences</option>
                            </select>
                        </div>

                        {endCondition === 'date' && (
                            <div className='mb-4'>
                                <label className='block text-lg font-medium mb-2'>End Date:</label>
                                <input type="date" className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setEndDate(e.target.value) }} value={endDate} />
                            </div>
                        )}

                        {endCondition === 'occurrences' && (
                            <div className='mb-4'>
                                <label className='block text-lg font-medium mb-2'>Occurrences:</label>
                                <input type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setOccurrences(e.target.value) }} value={occurrences} />
                            </div>
                        )}
                    </>
                )}

                <div className='grid md:grid-cols-2 grid-cols-1 gap-4 mb-4'>
                    <div>
                        <label className='block text-lg font-medium mb-2'>Instagram Handle:</label>
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' onChange={(e) => { setInstagramHandle(e.target.value) }} value={instagramHandle} />
                    </div>

                    <div>
                        <label className='block text-lg font-medium mb-2'>Twitter Handle:</label>
                        <input type='text' required className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' onChange={(e) => { setTwitterHandle(e.target.value) }} value={twitterHandle} />
                    </div>

                    <div>
                        <label className='block text-lg font-medium mb-2'>Facebook Handle:</label>
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' onChange={(e) => { setFacebookHandle(e.target.value) }} value={facebookHandle} />
                    </div>

                    
                </div>
                <button type='button' className="bg-[#FFC0CB] text-white px-4 py-2 rounded-lg mb-3" onClick={()=>setIsAddingTicket(true)}> + Add Ticket</button>
                {
                    isAddingTicket ? (
                        <>
                                   <div className='mb-6'>
                    <label className='block text-lg font-medium mb-2'>Ticket Type:</label>
                     {/* Add Ticket Button */}
                
                    <div className='grid md:grid-cols-2 grid-cols-1 gap-4 mb-3'>
                        <label className='flex items-center space-x-2'>
                            <input type="radio" value="single" checked={ticketType === 'single'} onChange={(e) => setTicketType(e.target.value)} required className='w-4 h-4' />
                            <span>Single Ticket</span>
                        </label>
                        <label className='flex items-center space-x-2'>
                            <input type="radio" value="group" checked={ticketType === 'group'} onChange={(e) => setTicketType(e.target.value)} required className='w-4 h-4' />
                            <span>Group Ticket</span>
                        </label>
                    </div>
                    <label className='block text-lg font-medium mb-2'>Pricing Type:</label>
                    <div className='grid md:grid-cols-2 grid-cols-1 gap-4'>
                            <label className='flex items-center space-x-2'>
                                <input
                                type='radio'
                                value='free'
                                checked={pricingType === 'free'} // Set `checked` based on whether pricingType is 'free'
                                onChange={(e) =>{ 
                                    setPricingType(e.target.value)
                                    setTicketPrice('0')
                                }}
                                 // Set pricingType to 'free' when this option is selected
                                required
                                className='w-4 h-4'
                                />
                                <span>Free</span>
                            </label>
                            <label className='flex items-center space-x-2'>
                                <input
                                type='radio'
                                value='paid'
                                checked={pricingType === 'paid'} // Set `checked` based on whether pricingType is 'paid'
                                onChange={(e) => setPricingType(e.target.value)} // Set pricingType to 'paid' when this option is selected
                                required
                                className='w-4 h-4'
                                />
                                <span>Paid</span>
                            </label>
                    </div>

                </div>

                <div className='grid md:grid-cols-2 grid-cols-1 gap-4'>
                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Ticket Name:</label>
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setTicketName(e.target.value) }} value={ticketName} />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Ticket Price:</label>
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]'
                        required={pricingType === 'paid'} // Only required if 'paid' is selected
                        disabled={pricingType === 'free'} 
                        onChange={(e) => { setTicketPrice(e.target.value) }}  value={pricingType === 'free' ? '0' : ticketPrice} />
                    </div>

                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Ticket Description:</label>
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setTicketDescription(e.target.value) }} value={ticketDescription} />
                    </div>
                </div>

                <div className='grid md:grid-cols-2 grid-cols-1 gap-4 mb-4'>
                    <div>
                        <label className='block text-lg font-medium mb-2'>Ticket stock:</label>
                        <input type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' disabled={isUnlimited} required onChange={(e) => { setTicketStock(e.target.value) }} value={ticketStock} />
                    </div>

                    <div className='flex items-center space-x-2 mt-8'>
                        <input type="checkbox" onChange={() => { setIsUnlimited(!isUnlimited) }} checked={isUnlimited} className='w-4 h-4' />
                        <span>Unlimited</span>
                    </div>
                </div>

                {ticketType === 'single' && (
                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Purchase Limit:</label>
                        <input required type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' onChange={(e) => { setPurchaseLimit(e.target.value) }} value={purchaseLimit} />
                    </div>
                )}

                {ticketType === 'group' && (
                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Group Size:</label>
                        <input type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setGroupSize(e.target.value) }} value={groupSize} />
                    </div>
                    
                )}
                <div className='flex gap-3'>
                    <button type="button" className="bg-[#FFC0CB] text-white px-4 py-2 rounded-lg mb-3" onClick={handleCreateTicket}>
                    Create Ticket
                </button>
                <button type="button" className="bg-white text-black border hover:bg-gray-300 border-gray-500 border-1 px-4 py-2 rounded-lg mb-3" onClick={()=>setIsAddingTicket(false)}>Cancel</button>
                </div>
                        </>
                    ):null
                }
        <ul className="">
        {ticketList.map((ticket) => (
          <li
            key={ticket.id}
            className="p-2 bg-[#FFC0CB] my-2 rounded-lg flex justify-between items-center"
          >
            <div className='flex gap-3' style={{fontFamily:'monospace'}}>
              <p className="">Ticket Name:{ticket.ticketName}</p>
              <p>Ticket Price: {ticket.ticketPrice}</p>
              <p>Ticket stock: {ticket.ticketStock}</p>
            </div>
            
            <button
              className="ml-4 px-2 py-1 bg-red-500 text-white rounded"
              onClick={() => removeTicket(ticket.ticketName)}
            >
              Cancel
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center space-x-2 mt-4">
  <label className="relative inline-flex items-center cursor-pointer">
    <input 
      type="checkbox" 
      onChange={handlePublishToggle} 
      checked={publishEvent} 
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-300 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC0CB]"></div>
  </label>
  <span>Publish Event Immediately</span>
      </div>
                <div className='flex justify-end'>
                    <button type='submit' className='bg-[#FFC0CB] text-white px-6 py-3 rounded-xl hover:bg-[#E0BFB9] mt-2'>Create Event</button>
                </div>
            </form>
        </div>
    )
}

export default Page;