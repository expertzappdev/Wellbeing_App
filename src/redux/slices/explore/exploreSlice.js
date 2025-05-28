import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  exploreData: {},
  userCompletedCards: [], // <-- New state field
  userFavoriteCards: [], // <-- Add this now for Task 2
  loading: false,
  error: null,
};

const exploreSlice = createSlice({
  name: 'explore',
  initialState,
  reducers: {
    fetchExploreDataRequest: (state) => {
      state.loading = true;
    },
    fetchExploreDataSuccess: (state, action) => {
      state.loading = false;
      state.exploreData = action.payload;
    },
    fetchExploreDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    storeExploreDataRequest: (state) => {
      state.loading = true;
    },
    storeExploreDataSuccess: (state, action) => {
      state.loading = false;
      const { category, data } = action.payload;
      if (!state.exploreData[category]) {
        state.exploreData[category] = [];
      }
      state.exploreData[category].push(data);
    },
    storeExploreDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchUserCompletedRequest: (state) => {
      state.loading = true;
    },
    fetchUserCompletedSuccess: (state, action) => {
      state.userCompletedCards = action.payload;
    },
    fetchUserCompletedFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    markCardCompletedRequest: (state, action) => {
      state.loading = true;
    },
    markCardCompletedSuccess: (state, action) => {
      const cardId = action.payload;
      if (!state.userCompletedCards.includes(cardId)) {
        state.userCompletedCards.push(cardId);
      }
    },
    markCardCompletedFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
     fetchUserFavoritesRequest: (state) => {
      state.loading = true;
     },
     fetchUserFavoritesSuccess: (state, action) => {
       state.userFavoriteCards = action.payload;
     },
     fetchUserFavoritesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
     },
     toggleFavoriteRequest: (state, action) => {
      state.loading = true;
     },
     toggleFavoriteSuccess: (state, action) => {
       const { cardId, isFavorite } = action.payload;
       if (isFavorite && !state.userFavoriteCards.includes(cardId)) {
         state.userFavoriteCards.push(cardId); 
       } else if (!isFavorite && state.userFavoriteCards.includes(cardId)) {
         state.userFavoriteCards = state.userFavoriteCards.filter(id => id !== cardId);
       }
     },
     toggleFavoriteFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
     },
  },
});

export const {
  fetchExploreDataRequest,
  fetchExploreDataSuccess,
  fetchExploreDataFailure,
  storeExploreDataRequest,
  storeExploreDataSuccess,
  storeExploreDataFailure,
  fetchUserCompletedRequest,
  fetchUserCompletedSuccess,
  fetchUserCompletedFailure,
  markCardCompletedRequest,
  markCardCompletedSuccess,
  markCardCompletedFailure,
  fetchUserFavoritesRequest,
  fetchUserFavoritesSuccess,
  fetchUserFavoritesFailure,
  toggleFavoriteRequest,
  toggleFavoriteSuccess,
  toggleFavoriteFailure,
} = exploreSlice.actions;

export default exploreSlice.reducer;