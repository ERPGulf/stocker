import { combineReducers } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';

// Import other reducers
import UserSlice from './Slices/UserSlice';

const RootReducer = combineReducers({
  user: UserSlice,
  // Other individual reducers
});

export type RootState = ReturnType<typeof RootReducer>;
export default RootReducer as Reducer<RootState>;