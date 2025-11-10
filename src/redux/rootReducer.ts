import { combineReducers } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import authReducer from "./AuthSlice/AuthSlice";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  // Add your reducers here
});

export default rootReducer;
