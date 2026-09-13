import { apiClient } from './client';

export const getProducts = async ({
  limit = 20,
  skip = 0,
  sortBy,
  order,
  category,
  search,
}) => {
  let url = '';
  if (search) {
    url = `/products/search?q=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`;
    if (sortBy) url += `&sortBy=${sortBy}&order=${order || 'asc'}`;
  } else if (category) {
    url = `/products/category/${encodeURIComponent(category)}?limit=${limit}&skip=${skip}`;
    if (sortBy) url += `&sortBy=${sortBy}&order=${order || 'asc'}`;
  } else {
    url = `/products?limit=${limit}&skip=${skip}`;
    if (sortBy) url += `&sortBy=${sortBy}&order=${order || 'asc'}`;
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
