// frontend/server.js - API Configuration
const BACKEND_BASE_URL = "http://localhost:5000";

// API endpoints with /api/v2
export const server = `${BACKEND_BASE_URL}/api/v2`;

// Base URL without /api/v2 (for images)
export const backend_url = BACKEND_BASE_URL;

// Uploads directory
export const uploads_url = `${BACKEND_BASE_URL}/uploads`;

// Helper to build API URLs
export const apiUrl = (endpoint) => {
  // Remove leading slash to avoid double slashes
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${server}/${cleanEndpoint}`;
};

// Helper to build image URLs
export const getImageUrl = (filename) => {
  if (!filename || filename === '') {
    return `${uploads_url}/default-product.jpg`;
  }
  
  // If already a full URL
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // If contains 'uploads/' path
  if (filename.includes('uploads/')) {
    const cleanName = filename.split('uploads/').pop();
    return `${uploads_url}/${cleanName}`;
  }
  
  // Plain filename
  return `${uploads_url}/${filename}`;
};

// Debug info
console.log('🔄 Server configuration loaded:');
console.log('• API Server:', server);
console.log('• Backend URL:', backend_url);
console.log('• Uploads URL:', uploads_url);
console.log('• Example API:', apiUrl('product/fetch-external'));
console.log('• Example Image:', getImageUrl('product-image.jpg'));