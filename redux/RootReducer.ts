import { combineReducers } from '@reduxjs/toolkit';

// Import other reducers
import UserSlice from './Slices/UserSlice';


const RootReducer = combineReducers({
  user: UserSlice,
  
  // Other individual reducers
});

export default RootReducer;