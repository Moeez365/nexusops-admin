import api from './axios.js';

export const getOrders = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    )
  );
  const response = await api.get('/orders', { params: cleanParams });
  return response.data;
};

export const createOrder = async (payload) => {
  const response = await api.post('/orders', payload);
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${encodeURIComponent(id)}`);
  return response.data;
};

export const updateOrder = async (id, payload) => {
  if (!id) {
    throw new Error('Order ID is required');
  }
  const response = await api.put(`/orders/${encodeURIComponent(id)}`, payload);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  if (!id) {
    throw new Error('Order ID is required');
  }
  const response = await api.patch(`/orders/${encodeURIComponent(id)}/status`, { status });
  return response.data;
};

export const deleteOrder = async (id) => {
  if (!id) {
    throw new Error('Order ID is required');
  }
  const response = await api.delete(`/orders/${encodeURIComponent(id)}`);
  return response.data;
};

export const getOrderStats = async () => {
  const response = await api.get('/orders/stats');
  return response.data;
};

