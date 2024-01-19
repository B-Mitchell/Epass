'use client'
import { createContext, useContext, useState } from 'react';

// Create the context
const MyContext = createContext();

// Create a provider component
export const MyContextProvider = ({ children }) => {
  const [createEventModal, setCreateEventModal] = useState(false);

  const contextData = {
    createEventModal,
    setCreateEventModal
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
