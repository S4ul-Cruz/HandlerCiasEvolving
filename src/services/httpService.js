import fetch from 'node-fetch';

/**
 * Realiza una petición HTTP
 * @param {string} url - URL a la que se hace la petición
 * @param {URLSearchParams|Object|null} body - Cuerpo de la petición (opcional)
 * @param {Object} options - Opciones adicionales (method, headers, etc.)
 */
export const postRequest = async (url, body = null, options = {}) => {
  const fetchOptions = {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(options.headers || {}),
    },
    body: body ? body.toString() : undefined,
  };

  try {
    const res = await fetch(url, fetchOptions);

    // ORG puede devolver HTML de error si JWT es inválido
    const text = await res.text();

    try {
      // Intentar parsear JSON
      return JSON.parse(text);
    } catch (err) {
      console.error('[postRequest] Response no es JSON:', text);
      throw new Error(`ORG ERROR: Response inválido`);
    }
  } catch (err) {
    console.error('[postRequest] Error fetch:', err.message);
    throw err;
  }
};