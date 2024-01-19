'use client'

import { useSelector } from 'react-redux';

const useAuthChecker = () => {
    // Access the user data from Redux store
    const userData = useSelector(state => state.user);
  
    return (request) => {
      // You can modify this function to perform additional checks if needed
      // Access request object and user data here
      console.log('Request object:', request);
      console.log('User data:', userData);
  
      return userData;
    };
};

export default useAuthChecker;
