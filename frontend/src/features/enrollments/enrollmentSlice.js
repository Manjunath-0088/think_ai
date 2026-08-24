import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getEnrollments } from '../../api/enrollmentApi';

const initialState = {
  myEnrollments: [],   
  loading: false,
  error: null,
};

export const fetchMyEnrollments = createAsyncThunk(
  'enrollments/fetchMine',
  async (studentEmail, { rejectWithValue }) => {
    if (!studentEmail) {
      return rejectWithValue('No logged-in user email available.');
    }
    try {
      const response = await getEnrollments();
      const all = response.data?.data || [];
      const mine = all.filter(
        (e) => e.studentEmail?.toLowerCase() === studentEmail.toLowerCase()
      );
      return mine;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load enrollments');
    }
  }
);

const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {
    clearEnrollmentError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.myEnrollments = action.payload;
      })
      .addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.myEnrollments = [];
      });
  },
});

export const { clearEnrollmentError } = enrollmentSlice.actions;

export const selectMyEnrollments = (state) => state.enrollments.myEnrollments;
export const selectEnrollmentLoading = (state) => state.enrollments.loading;
export const selectEnrollmentError = (state) => state.enrollments.error;

export const selectEnrollmentForCourse = (courseId) => (state) =>
  state.enrollments.myEnrollments.find(
    (e) => e.batch?.course?.id === Number(courseId)
  ) || null;

export default enrollmentSlice.reducer;