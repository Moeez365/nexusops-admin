import api from './axios.js';

export const getCollections = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    )
  );
  const response = await api.get('/collections', { params: cleanParams });
  return response.data;
};

export const createCollection = async (payload) => {
  const response = await api.post('/collections', payload);
  return response.data;
};

export const getCollectionById = async (id) => {
  const response = await api.get(`/collections/${encodeURIComponent(id)}`);
  return response.data;
};

export const updateCollection = async (id, payload) => {
  const response = await api.put(`/collections/${encodeURIComponent(id)}`, payload);
  return response.data;
};

export const deleteCollection = async (id) => {
  const response = await api.delete(`/collections/${encodeURIComponent(id)}`);
  return response.data;
};
