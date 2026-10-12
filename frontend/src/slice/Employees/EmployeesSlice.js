
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  search: "",
  department: "All",
  workType: "All",
  status: "All",
  currentPage: 1,
  pageSize: 10,
  selectedEmployeeId: null,
};

const employeesSlice = createSlice({
  name: "employees",

  initialState,

  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      state.currentPage = 1;
    },

    setDepartment: (state, action) => {
      state.department = action.payload;
      state.currentPage = 1;
    },

    setWorkType: (state, action) => {
      state.workType = action.payload;
      state.currentPage = 1;
    },

    setStatus: (state, action) => {
      state.status = action.payload;
      state.currentPage = 1;
    },

    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    setPageSize: (state, action) => {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },

    setSelectedEmployeeId: (state, action) => {
      state.selectedEmployeeId = action.payload;
    },

    resetEmployeeFilters: (state) => {
      state.search = "";
      state.department = "All";
      state.workType = "All";
      state.status = "All";
      state.currentPage = 1;
    },

    resetEmployeeState: () => initialState,
  },
});

export const {
  setSearch,
  setDepartment,
  setWorkType,
  setStatus,
  setCurrentPage,
  setPageSize,
  setSelectedEmployeeId,
  resetEmployeeFilters,
  resetEmployeeState,
} = employeesSlice.actions;

export const selectEmployeeFilters = (state) => state.employees;

export const selectSelectedEmployeeId = (state) =>
  state.employees.selectedEmployeeId;

export default employeesSlice.reducer;
