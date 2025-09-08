import { createSlice } from '@reduxjs/toolkit';

interface UserState {
  username: string | null;
  fullname: string | null;
  userDetails: any;
  baseUrl: string | null;
  fileId: string | null;
  isWfh: boolean;
  qrCodeData: string | null;
}


const initialState = {
  username: null,
  fullname: null,
  userDetails: null,
  baseUrl: null,
  fileId: null,
  isWfh: false,
  qrCodeData: null,
};

export const UserSlice = createSlice({
  name: 'user',
  initialState,
  extraReducers: builder => builder.addCase('REVERT_ALL', () => initialState),
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setFullname: (state, action) => {
      state.fullname = action.payload;
    },
    setUserDetails: (state, action) => {
      state.userDetails = action.payload;
    },
    setBaseUrl: (state, action) => {
      state.baseUrl = action.payload;
    },
    setFileid: (state, action) => {
      state.fileId = action.payload;
    },
    setIsWfh: (state, action) => {
      state.isWfh = action.payload;
    },
    setQrCodeData: (state, action) => {
      state.qrCodeData = action.payload;
    },
  },
});

export const {
  setUsername,
  setFullname,
  setQrCodeData,
  setUserDetails,
  setBaseUrl,
  setFileid,
  setIsWfh,
} = UserSlice.actions;

// selector
export const selectBaseUrl = (state: { user: UserState }) => state.user.baseUrl;
export const selectFileid = (state: { user: UserState }) => state.user.fileId;
export const selectIsWfh = (state: { user: UserState }) => state.user.isWfh;
export const selectName = (state: { user: UserState }) => state.user.fullname;
export const selectUserDetails = (state: { user: UserState }) => state.user.userDetails;
export const selectEmployeeCode = (state: { user: UserState }) => state.user.userDetails?.employee_code;
export const selectQrCodeData = (state: { user: UserState }) => state.user.qrCodeData;
export default UserSlice.reducer;