import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "./utils/axios";

export const fetchProblems = createAsyncThunk(
    "problems/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/problem/problem");
            return response.data; // array of problem documents
        } catch (err) {
            return rejectWithValue(err.response?.data || "Failed to fetch problems");
        }
    }
);

const problemSlice = createSlice({
    name: "problems",
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProblems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProblems.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchProblems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default problemSlice.reducer;