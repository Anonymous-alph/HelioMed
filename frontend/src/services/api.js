const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(method, endpoint, data = null, { noRedirect = false } = {}) {
  const url = `${API_BASE}${endpoint}`;

  const options = {
    method,
    credentials: 'include',
    headers: {},
  };

  if (data) {
    if (data instanceof FormData) {
      options.body = data;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(url, options);

  if (response.status === 401 && !noRedirect) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.detail || error.message || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function GET(endpoint, opts) {
  return request('GET', endpoint, null, opts);
}

function POST(endpoint, data, opts) {
  return request('POST', endpoint, data, opts);
}

function PATCH(endpoint, data, opts) {
  return request('PATCH', endpoint, data, opts);
}

function DELETE(endpoint, opts) {
  return request('DELETE', endpoint, null, opts);
}

export const api = {
  // Auth
  login: (email, password) => POST('/api/v1/auth/login', { email, password }, { noRedirect: true }),
  register: (email, password, name) => POST('/api/v1/auth/register', { email, password, name }, { noRedirect: true }),
  logout: () => POST('/api/v1/auth/logout'),
  getMe: () => GET('/api/v1/auth/me', { noRedirect: true }),

  // Consultation
  transcribe: (audioBlob, patientId, fileName) => {
    const formData = new FormData();
    formData.append('file', audioBlob, fileName || 'recording.webm');
    if (patientId) formData.append('patient_id', patientId);
    return POST('/api/v1/consultations/transcribe', formData);
  },

  // Consultations
  getConsultations: () => GET('/api/v1/consultations/'),
  getConsultation: (id) => GET(`/api/v1/consultations/${id}`),
  updateConsultation: (id, data) => PATCH(`/api/v1/consultations/${id}`, data),
  deleteConsultation: (id) => DELETE(`/api/v1/consultations/${id}`),
  saveConsultationNotes: (id, notes) => POST(`/api/v1/consultations/${id}/notes`, { notes }),

  // Prescription Image Scan
  scanPrescriptionImage: (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile, imageFile.name || 'prescription.png');
    return POST('/api/v1/prescriptions/scan-image', formData);
  },

  // Query Bot
  chat: (message, sessionId, consultationId, createConsultation = false) =>
    POST('/api/v1/chat/', {
      message,
      session_id: sessionId,
      consultation_id: consultationId || null,
      create_consultation: createConsultation,
    }),
  getChatHistory: (sessionId) => GET(`/api/v1/chat/history?session_id=${sessionId}`),

  // Store Locator — nearby pharmacies, hospitals, clinics
  getNearbyLocations: ({ zipcode, lat, lon, radius = 5000, types = 'pharmacy,hospital,clinic' } = {}) => {
    const params = new URLSearchParams();
    if (zipcode) params.set('zipcode', zipcode);
    if (lat != null) params.set('lat', lat);
    if (lon != null) params.set('lon', lon);
    params.set('radius', radius);
    params.set('types', types);
    return GET(`/api/v1/pharmacies/nearby?${params.toString()}`);
  },

  // User Profile
  getProfile: () => GET('/api/v1/users/profile'),
  updateProfile: (data) => POST('/api/v1/users/profile', data),
};
