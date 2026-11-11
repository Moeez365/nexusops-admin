import api from "./axios.js";

export const getUsers = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== undefined && value !== null && value !== ""
    )
  );
  const response = await api.get("/users", { params: cleanParams });
  return response.data;
};

export const getUserById = async (id, signal) => {
  const response = await api.get(
    `/users/${encodeURIComponent(id)}`,
    signal ? { signal } : undefined
  );
  return response.data;
};

export const createUser = async (payload) => {
  const response = await api.post("/users", payload);
  return response.data;
};

export const updateUser = async (id, payload) => {
  const response = await api.put(
    `/users/${encodeURIComponent(id)}`,
    payload
  );
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${encodeURIComponent(id)}`);
  return response.data;
};

export const getUserStats = async () => {
  const response = await api.get("/users/stats");
  return response.data;
};

