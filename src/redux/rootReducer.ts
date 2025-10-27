import { combineReducers } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  // Add your reducers here
});

export default rootReducer;
