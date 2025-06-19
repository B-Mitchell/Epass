'use client'
import { createContext, useContext, useState } from 'react';

// Create the context
const MyContext = createContext();

// Create a provider component
export const MyContextProvider = ({ children }) => {
  const [createEventModal, setCreateEventModal] = useState(false);
  const [accountCreation, setAccountCreation] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(Number);
  const [ticketRoute , setTicketRoute] = useState('');
  const [refCode, setRefCode] = useState('');
  const [ticketCheckoutData,setTicketCheckoutData]= useState([])
  const [numberOfTickets, setNumberOfTickets]= useState()
  const [selectedTickets, setSelectedTickets] = useState({}); // To store selected quantities.
  const [namedTicketCounts, setNamedTicketCounts] = useState([]);

  const contextData = {
    createEventModal,
    setCreateEventModal,
    accountCreation,
    setAccountCreation,
    ticketPrice,
    setTicketPrice,
    ticketRoute, 
    setTicketRoute,
    ticketCheckoutData,
    setTicketCheckoutData,
    numberOfTickets,
    setNumberOfTickets,
    selectedTickets,
    setSelectedTickets,
    namedTicketCounts,
    setNamedTicketCounts,
    refCode,
    setRefCode
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
