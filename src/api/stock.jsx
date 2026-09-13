import { apiClient } from './client';

export const getProducts = async ({
  limit = 20,
  skip = 0,
  sortBy,
  order,
  category,
  search,
}) => {
  let endpoint = '/products';
  if (search) {
    endpoint = `/products/search?q=${encodeURIComponent(search)}`;
  } else if (category) {
    endpoint = `/products/category/${encodeURIComponent(category)}`;
  }

  let url = `${endpoint}?limit=${limit}&skip=${skip}`;
  if (sortBy) {
    url += `&sortBy=${sortBy}&order=${order || 'asc'}`;
  }

  const response = await apiClient.get(url);
  return response.data;
};

export const getCategories = async () => {
  const response = await apiClient.get('/products/categories');
  return response.data;
};

export const getProduct = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

export const updateProduct = async ({ id, data }) => {
  const response = await apiClient.put(`/products/${id}`, data);
  return response.data;
};
