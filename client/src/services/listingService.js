import apiClient from './api';

export const listingService = {
  generateListing: async (payload) => apiClient('/listings/generate', { method: 'POST', body: JSON.stringify(payload) }),
  generateMarketing: async (payload) => apiClient('/listings/generate-marketing', { method: 'POST', body: JSON.stringify(payload) }),
  getListings: async () => apiClient('/listings', { method: 'GET' }),
  getListingById: async (id) => apiClient(`/listings/${id}`, { method: 'GET' }),
  saveListing: async (listingData) => apiClient('/listings', { method: 'POST', body: JSON.stringify(listingData) }),
};

export default listingService;

