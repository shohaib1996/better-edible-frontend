import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tagTypes } from "../tagTypes/tagTypes";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "https://better-edibles-backend.vercel.app/api" }), // Replace with your API base URL
  tagTypes: Object.values(tagTypes),
  endpoints: (builder) => ({}),
});

export const {} = baseApi;

// http://localhost:5000/api
