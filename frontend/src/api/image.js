import api from "./axios.js";

export const getImages = async (limit = 10) => {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError("Image limit must be a positive integer");
  }

  const response = await api.get("/upload", {
    params: { limit },
  });
  return response.data;
};

const uploadImages = async (payload) => {
  const formData = new FormData();
  payload.forEach((image) => {
    formData.append("images", image);
  });
  const response = await api.post("/upload", formData, {
    timeout: 120000,
  });
  return response.data; 
};

export const deleteImage = async (id) => {
  if (!id) {
    throw new Error("Image ID is required");
  }

  const response = await api.delete(`/upload/${encodeURIComponent(id)}`);
  return response.data;
};

export default uploadImages;
