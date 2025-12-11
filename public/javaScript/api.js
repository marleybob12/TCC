// public/javaScript/api.js
const API_URL = 'https://eventflow-backend-three.vercel.app/';

/**
 * Cliente HTTP para comunicação com backend
 */
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error(`Erro na API [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Instância do cliente
const api = new APIClient(API_URL);

// Funções específicas do EventFlow
export const EventFlowAPI = {
  // Comprar ingresso
  async comprarIngresso(usuarioID, eventoID, loteID) {
    return api.post('/api/comprar-ingresso', {
      usuarioID,
      eventoID,
      loteID,
    });
  },

  // Listar ingressos do usuário
  async listarIngressos(usuarioID) {
    return api.get('/api/listar-ingressos', { usuarioID });
  },

  // Validar QR Code
  async validarQRCode(qrcode) {
    return api.post('/api/validar-qrcode', { qrcode });
  },

  // Criar ingresso sem email (dados apenas)
  async criarIngresso(usuarioID, eventoID, loteID) {
    return api.post('/api/dados-compra', {
      usuarioID,
      eventoID,
      loteID,
    });
  },
};

export default api;