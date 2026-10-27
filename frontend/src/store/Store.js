 
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { employeeApi } from "../slice/employeesService/employeeApi";
import employeesReducer from "../slice/Employees/EmployeesSlice";

export const store = configureStore({
  reducer: {
    // Employee UI state
    employees: employeesReducer,

    // Employee API cache
    [employeeApi.reducerPath]: employeeApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(employeeApi.middleware),

  devTools: import.meta.env.DEV,
});

// Enable automatic refetch on focus/reconnect
setupListeners(store.dispatch);

export default store;