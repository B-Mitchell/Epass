'use client'
import React, {useState, useEffect} from 'react'
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import supabase from '@/app/supabase';
import EventCreation from '@/app/modals/EventCreation';
import { useMyContext } from '@/app/context/createContext';

const page = () => {
    const router = useRouter();

    const { createEventModal, setCreateEventModal } = useMyContext();
    const userId = useSelector(state => state.user.user_id);
    const [eventImage, setEventImage] = useState(null); 
    const [imageFileName, setImageFileName] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const [eventAddress, setEventAddress] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventPrice, setEventPrice] = useState('');
    const [eventPricingType, setPricingType] = useState('');
    const [nops, setNops] = useState();
    //nops is number of paid subscribers-i'm using this to handle the number of people that paid for a ticket and i'll also update it automatically if someone pays for a ticket

    const authFunction = () => {
        if (userId) {
            console.log('user: ' + userId)
        } else {
            console.log("redirecting to login...");
            router.push('/login');
        }
    }
    useEffect(() => {
        authFunction();
    },[userId]);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };
  const handleTicketPricingChange = (event) => {
    setPricingType(event.target.value);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const Data = {
        user_id: userId,
        title: eventTitle,
        typeOfEvent: selectedOption,
        address: eventAddress,
        date: eventDate,
        time: eventTime,
        price: eventPrice,
        image: imageFileName.name,
        pricingType: eventPricingType,
        nops: nops
    }
    try {
        const { data, error } = await supabase
            .from('tickets')
            .insert([Data])
            .select()

        if (error) {
            console.error('Error uploading product:', error.message);
        } else {
            console.log('product uploaded successfully:', data);
        }

    } catch(err) {
        console.log('error during text upload:' + err)
    }
    // https://zzupaillunqrgfwshuvb.supabase.co/storage/v1/object/public/tickets/2023_07_02_01_55_IMG_6791.JPG?t=2024-01-19T11%3A38%3A46.479Z
    try {
        const { data, error } = await supabase.storage
            .from('ticketBucket')
            .upload(`public/${userId}_${imageFileName.name}`, imageFileName);
        if (error) {
            console.error('Error uploading avatar:', error.message);
        } else {
            console.log('Avatar uploaded successfully:', data);
            setCreateEventModal(!createEventModal);
            setEventImage(null);
            setEventAddress('');
            setImageFileName(null);
            setEventTitle('');
            setEventTime('');
            setSelectedOption('');
            setEventDate('');
            setEventPrice('');
            setNops(null);
        }
        } catch (error) {
        console.error('Error during avatar upload:', error.message);
        }
        console.log(Data);
  }
  return (
    <div className='pb-6'>
        {createEventModal ? <EventCreation /> : null}

        <p className='text-center font-bold text-[1.6rem] my-3'>Create Event</p>

        <form onSubmit={handleSubmit} className='border border-[#E0BFB8] md:w-1/2 w-[90%] block m-auto rounded-3xl p-5 '>
            <p className='text-[1.2rem] my-2'>Event Image:</p>
            <input type='file' onChange={(e) => {setEventImage(URL.createObjectURL(e.target.files[0])); setImageFileName(e.target.files[0])} } className='bg-[#E0BFB8] w-[100%] rounded-r-2xl overflow-hidden' required />
            <div className='border border-[#E0BFB8] mt-2 w-[40%] block h-[5rem] rounded-xl overflow-hidden'>
                {eventImage && <img src={eventImage} alt='event'  className='w-[100%] h-full '/>}
            </div>
            

            <p className='text-[1.2rem] my-2'>Title:</p>
            <input type='text' placeholder='eg: "Sonic Fusion"' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => {setEventTitle(e.target.value)}} value={eventTitle}/>

            <p className='text-[1.2rem] my-2'>Event Type:</p>
            <div className=' w-[100%] grid md:grid-cols-3 grid-cols-2 md:gap-4 gap-2'>
            <div>
        <label>
          <input type="radio" value="party" checked={selectedOption === 'party'} onChange={handleOptionChange} required className='w-[1rem] h-[1rem] mt-1 mr-1'/>Party
        </label>
      </div>
      <div>
        <label>
          <input type="radio" value="sports" checked={selectedOption === 'sports'} onChange= {handleOptionChange} required className='w-[1rem] h-[1rem] mt-1 mr-1'/>sports
        </label>
      </div>
      <div>
        <label>
          <input type="radio"  value="concert" checked={selectedOption === 'concert'} onChange={handleOptionChange} required className='w-[1rem] h-[1rem] mt-1 mr-1'/>concert
        </label>
        </div>
        <div>
        <label>
          <input type="radio" value="webinar" checked={selectedOption === 'webinar'} onChange={handleOptionChange} required className='w-[1rem] h-[1rem] mt-1 mr-1'/>webinar
        </label>
        </div>
        <div>
        <label>
          <input type="radio" value="seminar" checked={selectedOption === 'seminar'} onChange={handleOptionChange} required className='w-[1rem] h-[1rem] mt-1 mr-1'/>seminar
        </label>
        </div>
        <div>
        <label>
          <input type="radio" value="conference" checked={selectedOption === 'conference'} onChange={handleOptionChange} required className='w-[1rem] h-[1rem] mt-1 mr-1'/>conference
        </label>
        </div>
      </div>

      <p className='text-[1.2rem] my-2'>Address: </p>
      <input type='text' placeholder='eg: 19 Avenue building, Victoria Island' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => {setEventAddress(e.target.value)}} value={eventAddress}/>

      <p className='text-[1.2rem] my-2'>date:</p>
      <input type="date" placeholder='eg: 15 January, 2024' className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => {setEventDate(e.target.value)}} value={eventDate}/>

      <p className='text-[1.2rem] my-2'>Time: </p>
      <input type="time" placeholder='eg: 10:00 am'  className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => {setEventTime(e.target.value)}} value={eventTime}/>

      <p className='text-[1.2rem] my-2'>Pricing Type: </p>

      <div className='flex my-3'>
        <div className='mr-4'>
          <label>
            <input type="radio" value="free" checked={eventPricingType === 'free'} onChange={handleTicketPricingChange} required className='w-[1rem] h-[1rem] mt-1 mr-1'/>Free
          </label>
          </div>
          <div>
          <label>
            <input type="radio" value="paid" checked={eventPricingType === 'paid'} onChange={handleTicketPricingChange} required className='w-[1rem] h-[1rem] mt-1 mr-1'/>Paid
          </label>
          </div>

        </div>

      <p className='text-[1.2rem] my-2'>Ticket Price: </p>
      <input type='text' placeholder='eg: 8000'  className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => {setEventPrice(e.target.value)}} value={eventPrice}/>

      <p className='text-[1.2rem] my-2'>Number of tickets: </p>
      <input type='number' placeholder='eg: 20'  className='border border-[#E0BFB8] w-[100%] p-3 outline-none bg-transparent rounded-xl focus:scale-105 transition' required onChange={(e) => {setNops(e.target.value)}} value={nops}/>

      <button className='hover:bg-[#E0BFB8] md:w-1/2 w-[80%] block m-auto mt-7 p-2 border border-[#E0BFB8] transition rounded-2xl hover:text-white hover:scale-110'>create event</button>
        </form>
    </div>
  )
}

export default page