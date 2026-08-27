import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { runCode } from '../../api/codeExecutionApi'; 

const initialState = {
  status: 'idle', // idle | submitting | polling | success | error
  submissionId: null,
  judge0Token: null,
  stdout: '',
  stderr: '',
  compileOutput: '',
  errorMessage: null,
  time: null,
  memory: null,
};

export const submitCode = createAsyncThunk(
  'codeExecution/submitCode',
  async ({ language, code, stdin = '', submissionId }, { dispatch, signal, rejectWithValue }) => {
    try {
      const result = await runCode({
        language,
        code,
        stdin,
        submissionId,
        signal,
        onStatusChange: (status) => {
          // fires once right after the 202, then again after each poll
          dispatch(codeExecutionSlice.actions.statusUpdated(status));
        },
      });

      if (result.status?.id !== 3) {
        // Compile Error / Runtime Error / Wrong Answer / etc — not a thrown
        // error, but not a clean run either. Let the reducer decide the badge.
        return rejectWithValue(result);
      }

      return result;
    } catch (err) {
      return rejectWithValue({ errorMessage: err.message || 'Execution failed' });
    }
  }
);

const codeExecutionSlice = createSlice({
  name: 'codeExecution',
  initialState,
  reducers: {
    resetExecution: () => initialState,
    statusUpdated: (state, action) => {
      const statusId = action.payload?.id;
      state.status = statusId === 1 || statusId === 2 ? 'polling' : state.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitCode.pending, (state) => {
        Object.assign(state, initialState, { status: 'submitting' });
      })
      .addCase(submitCode.fulfilled, (state, action) => {
        const r = action.payload;
        state.status = 'success';
        state.submissionId = r.submissionId;
        state.judge0Token = r.judge0Token;
        state.stdout = r.stdout;
        state.stderr = r.stderr;
        state.compileOutput = r.compileOutput;
        state.time = r.time;
        state.memory = r.memory;
      })
      .addCase(submitCode.rejected, (state, action) => {
        const r = action.payload;
        state.status = 'error';
        if (r?.status) {
          // a real Judge0 terminal status (compile error, runtime error, etc.)
          state.submissionId = r.submissionId;
          state.judge0Token = r.judge0Token;
          state.stdout = r.stdout;
          state.stderr = r.stderr;
          state.compileOutput = r.compileOutput;
          state.time = r.time;
          state.memory = r.memory;
          state.errorMessage = r.status.description || 'Execution failed';
        } else {
          // network error, timeout, or cancellation
          state.errorMessage = r?.errorMessage || 'Execution failed';
        }
      });
  },
});

export const { resetExecution } = codeExecutionSlice.actions;
export default codeExecutionSlice.reducer;