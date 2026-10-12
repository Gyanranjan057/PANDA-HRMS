
import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/";

export const employeeApi = createApi({
  reducerPath: "employeeApi",

  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),

  tagTypes: ["Employee"],

  endpoints: (builder) => ({
    // ======================================
    // GET ALL EMPLOYEES
    // ======================================
    getEmployees: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        department = "",
        workType = "",
        status = "",
      } = {}) => ({
        url: "employee",
        method: "GET",
        params: {
          page,
          limit,
          ...(search.trim() && {
            search: search.trim(),
          }),
          ...(department &&
            department !== "All" && {
              department,
            }),
          ...(workType &&
            workType !== "All" && {
              workType,
            }),
          ...(status &&
            status !== "All" && {
              status,
            }),
        },
      }),

      providesTags: (result) =>
        Array.isArray(result?.data)
          ? [
              ...result.data.map(({ id }) => ({
                type: "Employee",
                id,
              })),
              {
                type: "Employee",
                id: "LIST",
              },
            ]
          : [
              {
                type: "Employee",
                id: "LIST",
              },
            ],
    }),

    // ======================================
    // GET EMPLOYEE BY ID
    // ======================================
    getEmployeeById: builder.query({
      query: (id) => ({
        url: `employee/${id}`,
        method: "GET",
      }),

      providesTags: (result, error, id) => [
        {
          type: "Employee",
          id,
        },
      ],
    }),

    // ======================================
    // CREATE EMPLOYEE
    // ======================================
    createEmployee: builder.mutation({
      query: (data) => ({
        url: "employee",
        method: "POST",
        body: data,
      }),

      invalidatesTags: [
        {
          type: "Employee",
          id: "LIST",
        },
      ],
    }),

    // ======================================
    // UPDATE EMPLOYEE
    // ======================================
    updateEmployee: builder.mutation({
      query: ({ id, data }) => ({
        url: `employee/${id}`,
        method: "PUT",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Employee",
          id,
        },
        {
          type: "Employee",
          id: "LIST",
        },
      ],
    }),

    // ======================================
    // DELETE EMPLOYEE
    // ======================================
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `employee/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        {
          type: "Employee",
          id,
        },
        {
          type: "Employee",
          id: "LIST",
        },
      ],
    }),
  }),
});

// ==========================================
// EXPORT RTK QUERY HOOKS
// ==========================================
export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApi;
