import api from "./axios";

export const getAnalyticsData = async (range) => {
    const response = await api.get('/analytics?range=7D');
    return response.data;
}