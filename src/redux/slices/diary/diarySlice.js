import { createSlice } from '@reduxjs/toolkit';

const diarySlice = createSlice({
  name: 'diary',
  initialState: {
    entries: {}, 
    allEntries: {}, 
    quote: '',
    loading: false,
    error: null,
  },
  reducers: {
    fetchDiaryRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDiarySuccess: (state, action) => {
      state.loading = false;
      const { selectedDate, entryData } = action.payload;
      state.entries[selectedDate] = entryData; 
    },
    fetchDiaryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addDiaryEntryRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    addDiaryEntrySuccess: (state, action) => {
      state.loading = false;
      const { selectedDate, entryData } = action.payload;
      state.entries[selectedDate] = entryData; 
    },
    addDiaryEntryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchAllDiaryEntriesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAllDiaryEntriesSuccess: (state, action) => {
      state.loading = false;
      const { entries } = action.payload;
      state.allEntries = entries;
    },
    fetchAllDiaryEntriesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchQuoteRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchQuoteSuccess: (state, action) => {
      state.loading = false;
      state.quote = action.payload;
    },
    fetchQuoteFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchDiaryRequest,
  fetchDiarySuccess,
  fetchDiaryFailure,
  addDiaryEntryRequest,
  addDiaryEntrySuccess,
  addDiaryEntryFailure,
  fetchAllDiaryEntriesRequest,
  fetchAllDiaryEntriesSuccess,
  fetchAllDiaryEntriesFailure,
  fetchQuoteRequest,
  fetchQuoteSuccess,
  fetchQuoteFailure,
} = diarySlice.actions;

export const selectDiaryByDate = (state, selectedDate) => {
  return state.diary.entries[selectedDate] || null;
};

export const selectAllDiaryEntries = (state) => state.diary.allEntries;


export default diarySlice.reducer;
