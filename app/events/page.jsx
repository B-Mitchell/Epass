'use client'
import React, { useEffect, useState } from 'react'
import Event_Ticket from './Event_Ticket'
import supabase from '../supabase'
import LoadingAnimation from '../components/LoadingAnimation'

const page = () => {
    const [ loading, setLoading ] = useState(false);
    const [ datas, setData ] = useState([]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            let { data , error } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });
            if (error) {
                console.log('error fetching tickets')
            } else {
                console.log(data);
                setData(data)
            }
        } catch (err) {
            console.error('Error is: ' + err.message);
        } finally {
            setLoading(false);
        }
    }
    console.log(datas)

    useEffect(() => {
        fetchTickets();
    }, []);
    
  return (
    <div >
        <p className='text-center font-bold text-[1.4rem] mt-4'>Available Events</p>
        <p className={`text-center ${loading ? 'mt-10' : null} font-bold italic`}>{ loading ? <LoadingAnimation /> : null }</p>
        
        <div className='grid lg:grid-cols-3 grid-cols-2 gap-4 p-2 w-[100%] m-auto mb-7'>
        {
            datas.map((ticket) => {
                return (
                    <div key={ticket.created_at} className='flex items-center justify-center'>
                        <Event_Ticket data={ticket}/>
                    </div>
                )
            })
        }
        </div>
        
    </div>
  )
}

export default page
