import api from "./axios";

export const getAnalyticsData = async (params) => {
  const response = await api.get("/analytics", { params });
  return response.data;
};
