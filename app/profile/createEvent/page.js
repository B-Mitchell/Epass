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
    const [step, setStep] = useState(1);
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

    const handleNextStep = () => {
        setStep(prevStep => prevStep + 1);
    };

    const handlePreviousStep = () => {
        setStep(prevStep => prevStep - 1);
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

            <p className='text-center font-bold text-[1.6rem] my-3'>Create Event</p>

            {step === 1 && (
                <form className='border border-[#E0BFB8] md:w-1/2 w-[90%] block m-auto rounded-3xl p-5'>
                    <p className='text-[1.2rem] my-2'>Event Image:</p>
                    <input type='file' onChange={(e) => { setEventImage(URL.createObjectURL(e.target.files[0])); setImageFileName(e.target.files[0]) }} className='bg-[#E0BFB8] w-[100%] rounded-r-2xl overflow-hidden' required />
                    <div className='border border-[#E0BFB8] mt-2 w-[40%] block h-[5rem] rounded-xl overflow-hidden'>
                        {eventImage && <img src={eventImage} alt='event' className='w-[100%] h-full' />}
                    </div>

                    <p className='text-[1.2rem] my-2'>Title:</p>
                    <input type='text' placeholder='eg: "Sonic Fusion"' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setEventTitle(e.target.value) }} value={eventTitle} />

                    <p className='text-[1.2rem] my-2'>Event Type:</p>
                    <div className='w-[100%] grid md:grid-cols-3 grid-cols-2 md:gap-4 gap-2'>
                        {['party', 'sports', 'concert', 'webinar', 'seminar', 'conference'].map(type => (
                            <div key={type}>
                                <label>
                                    <input type="radio" value={type} checked={selectedOption === type} onChange={handleOptionChange} required className='w-[1rem] h-[1rem] mt-1 mr-1' />{type}
                                </label>
                            </div>
                        ))}
                    </div>

                    <p className='text-[1.2rem] my-2'>Address:</p>
                    <input type='text' placeholder='eg: 19 Avenue building, Victoria Island' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setEventAddress(e.target.value) }} value={eventAddress} />
                    {/* <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} libraries={libraries}>
                            <Autocomplete
                                onLoad={autocomplete => setAutocomplete(autocomplete)}
                                onPlaceChanged={() => handlePlaceChange(autocomplete)}
                            >
                                <input type="text" placeholder="Search address" className="border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition" />
                            </Autocomplete>
                        </LoadScript> */}

                    <div className='flex justify-end mt-4'>
                        <button type="button" onClick={handleNextStep} className='bg-[#E0BFB8] px-4 py-2 rounded-lg hover:bg-[#d5a8a0] transition'>Next</button>
                    </div>
                </form>
            )}

            {step === 2 && (
                <form className='border border-[#E0BFB8] md:w-1/2 w-[90%] block m-auto rounded-3xl p-5'>
                    <div className='flex justify-center mb-4'>
                        <button type="button" className={`px-4 py-2 rounded-l-lg ${activeTab === 'single' ? 'bg-[#E0BFB8]' : 'bg-gray-200'} transition`} onClick={() => setActiveTab('single')}>Single Event</button>
                        <button type="button" className={`px-4 py-2 rounded-r-lg ${activeTab === 'recurring' ? 'bg-[#E0BFB8]' : 'bg-gray-200'} transition`} onClick={() => setActiveTab('recurring')}>Recurring Event</button>
                    </div>

                    {activeTab === 'single' && (
                        <>
                            <p className='text-[1.2rem] my-2'>Event Date:</p>
                            <input type="date" className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setEventDate(e.target.value) }} value={eventDate} />

                            <p className='text-[1.2rem] my-2'>Start Time:</p>
                            <input type="time" className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setStartTime(e.target.value) }} value={startTime} />

                            <p className='text-[1.2rem] my-2'>End Time:</p>
                            <input type="time" className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setEndTime(e.target.value) }} value={endTime} />

                            <p className='text-[1.2rem] my-2'>Instagram Handle:</p>
                            <input type='text' placeholder='eg: @sonicfusion' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' onChange={(e) => { setInstagramHandle(e.target.value) }} value={instagramHandle} />

                            <p className='text-[1.2rem] my-2'>Twitter Handle:</p>
                            <input type='text' placeholder='eg: @sonicfusion' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' onChange={(e) => { setTwitterHandle(e.target.value) }} value={twitterHandle} />

                            <p className='text-[1.2rem] my-2'>Facebook Handle:</p>
                            <input type='text' placeholder='eg: @sonicfusion' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' onChange={(e) => { setFacebookHandle(e.target.value) }} value={facebookHandle} />
                        </>
                    )}

                    {activeTab === 'recurring' && (
                        <>
                            <p className='text-[1.2rem] my-2'>Start Date:</p>
                            <input type="date" className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setEventDate(e.target.value) }} value={eventDate} />

                            <p className='text-[1.2rem] my-2'>Event Frequency:</p>
                            <div className='w-[100%] grid md:grid-cols-3 grid-cols-2 md:gap-4 gap-2'>
                                {['everyday', 'every week', 'every two weeks'].map(frequency => (
                                    <div key={frequency}>
                                        <label>
                                            <input type="radio" value={frequency} checked={eventFrequency === frequency} onChange={(e) => setEventFrequency(e.target.value)} required className='w-[1rem] h-[1rem] mt-1 mr-1' />{frequency}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <p className='text-[1.2rem] my-2'>When Does Event End:</p>
                            <div className='w-[100%] grid md:grid-cols-2 grid-cols-1 md:gap-4 gap-2'>
                                <div>
                                    <label>
                                        <input type="radio" value="date" checked={endCondition === 'date'} onChange={(e) => setEndCondition(e.target.value)} required className='w-[1rem] h-[1rem] mt-1 mr-1' />On a Specific Date
                                    </label>
                                    {endCondition === 'date' && (
                                        <input type="date" className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mt-2' required onChange={(e) => setEndDate(e.target.value)} value={endDate} />
                                    )}
                                </div>
                                <div>
                                    <label>
                                        <input type="radio" value="occurrences" checked={endCondition === 'occurrences'} onChange={(e) => setEndCondition(e.target.value)} required className='w-[1rem] h-[1rem] mt-1 mr-1' />After a Number of Occurrences
                                    </label>
                                    {endCondition === 'occurrences' && (
                                        <input type="number" className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition mt-2' placeholder='eg: 10' required onChange={(e) => setOccurrences(e.target.value)} value={occurrences} />
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <div className='flex justify-between mt-4'>
                        <button type="button" onClick={handlePreviousStep} className='bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition'>Back</button>
                        <button type="button" onClick={handleNextStep} className='bg-[#E0BFB8] px-4 py-2 rounded-lg hover:bg-[#d5a8a0] transition'>Next</button>
                    </div>
                </form>
            )}

            {step === 3 && (
                <form className='border border-[#E0BFB8] md:w-1/2 w-[90%] block m-auto rounded-3xl p-5' onSubmit={handleSubmit}>
                    <p className='text-[1.2rem] my-2'>Ticket Type:</p>
                    <div className='flex my-3'>
                        {['single', 'group'].map(type => (
                            <div key={type} className='mr-4'>
                                <label>
                                    <input type="radio" value={type} checked={ticketType === type} onChange={(e) => setTicketType(e.target.value)} required className='w-[1rem] h-[1rem] mt-1 mr-1' />{type}
                                </label>
                            </div>
                        ))}
                    </div>

                    {ticketType === 'single' && (
                        <>
                            <p className='text-[1.2rem] my-2'>Pricing Type:</p>
                            <div className='flex my-3'>
                                {['free', 'paid'].map(type => (
                                    <div key={type} className='mr-4'>
                                        <label>
                                            <input type="radio" value={type} checked={eventPricingType === type} onChange={handleTicketPricingChange} required className='w-[1rem] h-[1rem] mt-1 mr-1' />{type}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {eventPricingType === 'paid' && (
                                <>
                                    <p className='text-[1.2rem] my-2'>Ticket Price:</p>
                                    <input type='text' placeholder='eg: 8000' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setEventPrice(e.target.value) }} value={eventPrice} />
                                </>
                            )}
                        </>
                    )}

                    <p className='text-[1.2rem] my-2'>Ticket Name:</p>
                    <input type='text' placeholder='eg: "VIP Pass"' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setTicketName(e.target.value) }} value={ticketName} />

                    <p className='text-[1.2rem] my-2'>Ticket Description:</p>
                    <textarea placeholder='Description of the ticket' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setTicketDescription(e.target.value) }} value={ticketDescription} />

                    <p className='text-[1.2rem] my-2'>Is this ticket limited?</p>
                    <div className='flex my-3'>
                        {['unlimited', 'limited'].map(limit => (
                            <div key={limit} className='mr-4'>
                                <label>
                                    <input type="radio" value={limit} checked={isUnlimited === (limit === 'unlimited')} onChange={(e) => setIsUnlimited(limit === 'unlimited')} required className='w-[1rem] h-[1rem] mt-1 mr-1' />{limit}
                                </label>
                            </div>
                        ))}
                    </div>

                    {!isUnlimited && (
                        <>
                            <p className='text-[1.2rem] my-2'>Ticket Limit:</p>
                            <input type='number' placeholder='eg: 100' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setTicketLimit(e.target.value) }} value={ticketLimit} />
                        </>
                    )}

                    {ticketType === 'single' && (
                        <>
                            <p className='text-[1.2rem] my-2'>Ticket Purchase Limit:</p>
                            <input type='number' placeholder='eg: 5' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' onChange={(e) => { setPurchaseLimit(e.target.value) }} value={purchaseLimit} />
                        </>
                    )}

                    {ticketType === 'group' && (
                        <>
                            <p className='text-[1.2rem] my-2'>Group Size:</p>
                            <input type='number' placeholder='eg: 10' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => { setGroupSize(e.target.value) }} value={groupSize} />
                        </>
                    )}

                    <div className='flex justify-between mt-4'>
                        <button type="button" onClick={handlePreviousStep} className='bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition'>Back</button>
                        <button type="submit" className='bg-[#E0BFB8] px-4 py-2 rounded-lg hover:bg-[#d5a8a0] transition'>Submit</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Page;
