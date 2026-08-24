import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getProgressByEnrollment,
  completeLesson as completeLessonApi,
  getProgressSummary,
} from '../../api/lessonProgressApi';

const initialState = {
  byLessonId: {},
  summaryByEnrollmentId: {},
  loading: false,
  completing: false,
  error: null,
};

export const fetchProgressByEnrollment = createAsyncThunk(
  'lessonProgress/fetchByEnrollment',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await getProgressByEnrollment(enrollmentId);
      return response.data.data; // expected: array of { lessonId, completed, ... }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load progress');
    }
  }
);

export const fetchProgressSummary = createAsyncThunk(
  'lessonProgress/fetchSummary',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await getProgressSummary(enrollmentId);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load progress summary');
    }
  }
);

export const markLessonComplete = createAsyncThunk(
  'lessonProgress/markComplete',
  async ({ lessonId, enrollmentId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await completeLessonApi(lessonId, enrollmentId);
      // refresh summary right after, since completion % / certificate eligibility changed
      dispatch(fetchProgressSummary(enrollmentId));
      return { lessonId, result: response.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark lesson complete');
    }
  }
);

const lessonProgressSlice = createSlice({
  name: 'lessonProgress',
  initialState,
  reducers: {
    clearLessonProgressError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgressByEnrollment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgressByEnrollment.fulfilled, (state, action) => {
        state.loading = false;
        const list = Array.isArray(action.payload) ? action.payload : [];
        state.byLessonId = list.reduce((acc, p) => {
          if (p.completed) acc[p.lessonId] = true;
          return acc;
        }, {});
      })
      .addCase(fetchProgressByEnrollment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProgressSummary.fulfilled, (state, action) => {
        state.summaryByEnrollmentId[action.meta.arg] = action.payload;
      })
      .addCase(markLessonComplete.pending, (state) => {
        state.completing = true;
      })
      .addCase(markLessonComplete.fulfilled, (state, action) => {
        state.completing = false;
        state.byLessonId[action.payload.lessonId] = true;
      })
      .addCase(markLessonComplete.rejected, (state, action) => {
        state.completing = false;
        state.error = action.payload;
      });
  },
});

export const { clearLessonProgressError } = lessonProgressSlice.actions;

export const selectIsLessonComplete = (lessonId) => (state) => !!state.lessonProgress.byLessonId[lessonId];
export const selectProgressSummaryFor = (enrollmentId) => (state) =>
  state.lessonProgress.summaryByEnrollmentId[enrollmentId] || null;
export const selectLessonProgressLoading = (state) => state.lessonProgress.loading;
export const selectMarkingComplete = (state) => state.lessonProgress.completing;

export default lessonProgressSlice.reducer;