'use client'
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import EventCreation from '@/app/modals/EventCreation';
import { useMyContext } from '@/app/context/createContext';

const Page = () => {
    const router = useRouter();
    const { createEventModal, setCreateEventModal } = useMyContext();
    const userId = useSelector(state => state.user.user_id);
    const [activeTab, setActiveTab] = useState('single');

    const [eventImage, setEventImage] = useState(null);
    const [imageFileName, setImageFileName] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const [eventAddress, setEventAddress] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [instagramHandle, setInstagramHandle] = useState('');
    const [twitterHandle, setTwitterHandle] = useState('');
    const [facebookHandle, setFacebookHandle] = useState('');
    const [eventPrice, setEventPrice] = useState('');
    const [eventPricingType, setPricingType] = useState('');
    const [nops, setNops] = useState('');
    const [eventFrequency, setEventFrequency] = useState('');
    const [endCondition, setEndCondition] = useState('');
    const [endDate, setEndDate] = useState('');
    const [occurrences, setOccurrences] = useState('');

    const [ticketType, setTicketType] = useState('single');
    const [ticketName, setTicketName] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketLimit, setTicketLimit] = useState('');
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [purchaseLimit, setPurchaseLimit] = useState('');
    const [groupSize, setGroupSize] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const commonData = {
            user_id: userId,
            title: eventTitle,
            typeOfEvent: selectedOption,
            address: eventAddress,
            image: imageFileName.name,
            pricingType: eventPricingType,
            nops: nops,
            instagramHandle,
            twitterHandle,
            facebookHandle
        };

        const singleEventData = {
            ...commonData,
            date: eventDate,
            startTime,
            endTime,
            price: eventPrice,
        };

        const recurringEventData = {
            ...commonData,
            startDate: eventDate,
            eventFrequency,
            endCondition,
            endDate: endCondition === 'date' ? endDate : null,
            occurrences: endCondition === 'occurrences' ? occurrences : null,
        };

        const ticketData = {
            type: ticketType,
            name: ticketName,
            description: ticketDescription,
            limit: isUnlimited ? 'unlimited' : ticketLimit,
            purchaseLimit: ticketType === 'single' ? purchaseLimit : null,
            groupSize: ticketType === 'group' ? groupSize : null,
        };

        const Data = activeTab === 'single' ? { ...singleEventData, ...ticketData } : { ...recurringEventData, ...ticketData };

        try {
            const { data, error } = await supabase
                .from('tickets')
                .insert([Data])
                .select();

            if (error) {
                console.error('Error uploading product:', error.message);
            } else {
                console.log('Product uploaded successfully:', data);
            }

        } catch (err) {
            console.log('Error during text upload: ' + err);
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
        console.log(Data);
    };

    const resetForm = () => {
        setEventImage(null);
        setEventAddress('');
        setImageFileName(null);
        setEventTitle('');
        setSelectedOption('');
        setEventDate('');
        setStartTime('');
        setEndTime('');
        setEventPrice('');
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
        setTicketDescription('');
        setTicketLimit('');
        setIsUnlimited(false);
        setPurchaseLimit('');
        setGroupSize('');
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

                        <div className='mb-4'>
                            <label className='block text-lg font-medium mb-2'>Event Price:</label>
                            <input type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setEventPrice(e.target.value) }} value={eventPrice} />
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
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' onChange={(e) => { setTwitterHandle(e.target.value) }} value={twitterHandle} />
                    </div>

                    <div>
                        <label className='block text-lg font-medium mb-2'>Facebook Handle:</label>
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' onChange={(e) => { setFacebookHandle(e.target.value) }} value={facebookHandle} />
                    </div>

                    <div>
                        <label className='block text-lg font-medium mb-2'>Number of Participants:</label>
                        <input type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setNops(e.target.value) }} value={nops} />
                    </div>
                </div>

                <div className='mb-6'>
                    <label className='block text-lg font-medium mb-2'>Ticket Type:</label>
                    <div className='grid md:grid-cols-2 grid-cols-1 gap-4'>
                        <label className='flex items-center space-x-2'>
                            <input type="radio" value="single" checked={ticketType === 'single'} onChange={(e) => setTicketType(e.target.value)} required className='w-4 h-4' />
                            <span>Single Ticket</span>
                        </label>
                        <label className='flex items-center space-x-2'>
                            <input type="radio" value="group" checked={ticketType === 'group'} onChange={(e) => setTicketType(e.target.value)} required className='w-4 h-4' />
                            <span>Group Ticket</span>
                        </label>
                    </div>
                </div>

                <div className='grid md:grid-cols-2 grid-cols-1 gap-4'>
                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Ticket Name:</label>
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setTicketName(e.target.value) }} value={ticketName} />
                    </div>

                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Ticket Description:</label>
                        <input type='text' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setTicketDescription(e.target.value) }} value={ticketDescription} />
                    </div>
                </div>

                <div className='grid md:grid-cols-2 grid-cols-1 gap-4 mb-4'>
                    <div>
                        <label className='block text-lg font-medium mb-2'>Ticket Limit:</label>
                        <input type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' disabled={isUnlimited} required onChange={(e) => { setTicketLimit(e.target.value) }} value={ticketLimit} />
                    </div>

                    <div className='flex items-center space-x-2 mt-8'>
                        <input type="checkbox" onChange={() => { setIsUnlimited(!isUnlimited) }} checked={isUnlimited} className='w-4 h-4' />
                        <span>Unlimited</span>
                    </div>
                </div>

                {ticketType === 'single' && (
                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Purchase Limit:</label>
                        <input type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setPurchaseLimit(e.target.value) }} value={purchaseLimit} />
                    </div>
                )}

                {ticketType === 'group' && (
                    <div className='mb-4'>
                        <label className='block text-lg font-medium mb-2'>Group Size:</label>
                        <input type='number' className='border border-gray-300 w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC0CB]' required onChange={(e) => { setGroupSize(e.target.value) }} value={groupSize} />
                    </div>
                )}

                <div className='flex justify-end'>
                    <button type='submit' className='bg-[#FFC0CB] text-white px-6 py-3 rounded-xl hover:bg-[#E0BFB9]'>Create Event</button>
                </div>
            </form>
        </div>
    )
}

export default Page;