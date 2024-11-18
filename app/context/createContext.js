'use client'
import { createContext, useContext, useState } from 'react';

// Create the context
const MyContext = createContext();

// Create a provider component
export const MyContextProvider = ({ children }) => {
  const [createEventModal, setCreateEventModal] = useState(false);
  const [accountCreation, setAccountCreation] = useState(false);
  // ticket details
  const [ticketPrice, setTicketPrice] = useState(Number);
  const [ticketRoute , setTicketRoute] = useState(''); // tikcet id
  const [imageSrc, setImageSrc] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDate, setTicketDate] = useState('');
  const [ticketTime, setTicketTime] = useState('');
  const [ticketAddress, setTicketAddress] = useState('');


  const contextData = {
    createEventModal,
    setCreateEventModal,
    accountCreation,
    setAccountCreation,
    ticketPrice,
    setTicketPrice,
    ticketRoute , 
    setTicketRoute,
    setImageSrc,
    setTicketTitle,
    setTicketDate,
    setTicketTime,
    setTicketAddress,
    imageSrc,
    ticketAddress,
    ticketDate,
    ticketTime,
    ticketTitle
  }

  // Provide the context value to the children components
  return (
    <MyContext.Provider value={contextData}>
      {children}
    </MyContext.Provider>
  );
};

// Create a custom hook to access the context
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within a MyContextProvider');
  }
  return context;
};
