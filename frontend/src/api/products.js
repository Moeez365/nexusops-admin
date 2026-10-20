import api from './axios.js';

export const getProducts = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    )
  );
  const response = await api.get('/products', { params: cleanParams });
  return response.data;
};

export const createProduct = async (payload) => {
  const response = await api.post('/products', payload);
  return response.data;
};

export const getProductById = async (id, signal) => {
  const response = await api.get(`/products/${encodeURIComponent(id)}`, {
    signal,
  });
  return response.data;
};

export const updateProduct = async (id, payload) => {
  if (!id) {
    throw new Error('Product ID is required');
  }

  const response = await api.put(`/products/${encodeURIComponent(id)}`, payload);
  return response.data;
};

export const deleteProduct = async (id) => {
  if (!id) {
    throw new Error('Product ID is required');
  }

  const response = await api.delete(`/products/${encodeURIComponent(id)}`);
  return response.data;
};

