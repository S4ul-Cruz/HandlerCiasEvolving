// services/httpService.js
import fetch from 'node-fetch';

/**
 * 
 * @param {*} url 
 * @returns 
 * Aquí centralizamos llamadas HTTP (ME y ORG)
 */
export const postRequest = async (url) => {
  const response = await fetch(url, { method: 'POST' });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
};
