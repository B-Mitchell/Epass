'use client'
import React, { useEffect, useState } from 'react'
import Event_Ticket from './Event_Ticket'
import supabase from '../supabase'

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
        <p className={`text-center ${loading ? 'mt-10' : null} font-bold italic`}>{ loading ? 'loading Events...' : null }</p>
        
        <div className='grid md:grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 grid-cols-1 gap-4 w-[97%] m-auto mb-7'>
        {
            datas.map((ticket) => {
                return (
                    <Event_Ticket key={ticket.created_at} data={ticket}/>
                )
            })
        }
        </div>
        
    </div>
  )
}

export default page
