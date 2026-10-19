/**
 * REPLATE API Client Adapter Layer
 * Connects frontend to REPLATE NestJS REST API (http://localhost:3000/api/v1)
 * with graceful fallback to local-first / Supabase storage via feature toggle.
 */

export function normalizeApiUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://replate-backend-roo2.onrender.com/api/v1';
  }
  let url = rawUrl.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    if (url.endsWith('/api')) {
      url = `${url}/v1`;
    } else {
      url = `${url}/api/v1`;
    }
  }
  return url;
}

export const USE_BACKEND_API = typeof import.meta !== 'undefined'
  ? (String(import.meta.env?.VITE_USE_BACKEND_API).toLowerCase() === 'true' || import.meta.env?.VITE_USE_BACKEND_API === true || import.meta.env?.VITE_USE_BACKEND_API === '1')
  : false;

export const BASE_URL = normalizeApiUrl(
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : null
);

let authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('replate_access_token') : null;

export const setAuthToken = (token) => {
  authToken = token;
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem('replate_access_token', token);
    } else {
      localStorage.removeItem('replate_access_token');
    }
  }
};

export const getAuthToken = () => authToken;

async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include', // Sends HttpOnly cookie for refresh token
    });
  } catch (netErr) {
    const error = new Error(`Gagal terhubung ke backend API (${fullUrl}): ${netErr.message || 'Koneksi jaringan terputus atau server sedang cold-start'}`);
    error.status = 0;
    error.isNetworkError = true;
    throw error;
  }

  // Handle token expired (401)
  if (response.status === 401 && !options._retry && !endpoint.includes('/auth/login')) {
    try {
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const newToken = refreshData.data?.accessToken || refreshData.accessToken;
        setAuthToken(newToken);
        options._retry = true;
        return request(endpoint, options);
      }
    } catch {
      setAuthToken(null);
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || (Array.isArray(data.message) ? data.message.join(', ') : 'Terjadi kesalahan pada permintaan API');
    const error = new Error(errorMsg);
    error.status = response.status;
    error.details = data.details || data.error;
    throw error;
  }

  return data.data !== undefined ? data.data : data;
}

// ==========================================
// API Methods Grouped by Domain
// ==========================================

export const api = {
  isLiveApiEnabled: () => USE_BACKEND_API,
  getBaseUrl: () => BASE_URL,

  // Health / Connection check using public endpoint
  checkHealth: async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- 1. Autentikasi ---
  auth: {
    login: async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data?.accessToken) {
        setAuthToken(data.accessToken);
      }
      return data;
    },
    me: () => request('/auth/me'),
    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setAuthToken(null);
      }
    },
  },

  // --- 2. Surplus Listings & Food Safety Gate ---
  surplus: {
    create: (listingPayload) =>
      request('/surplus-listings', {
        method: 'POST',
        body: JSON.stringify(listingPayload),
      }),
    findAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/surplus-listings${qs ? `?${qs}` : ''}`);
    },
    getMyDispatches: () => request('/surplus-listings/my-dispatches'),
    getAssessment: (listingId) => request(`/surplus-listings/${listingId}/assessment`),
    updateSafetyParameters: (listingId, parameters) =>
      request(`/surplus-listings/${listingId}/safety-parameters`, {
        method: 'PUT',
        body: JSON.stringify(parameters),
      }),
    getMatches: (listingId) => request(`/surplus-listings/${listingId}/matches`),
    assignDestination: (listingId, recipientId, notes) =>
      request(`/surplus-listings/${listingId}/assign-destination`, {
        method: 'POST',
        body: JSON.stringify({ recipientId, notes }),
      }),
  },

  // --- 3. Recipient Capacities ---
  recipients: {
    getMyCapacity: () => request('/recipients/my-capacity'),
    findAll: () => request('/recipients'),
    findOne: (id) => request(`/recipients/${id}`),
  },

  // --- 4. Emergency Requests ---
  emergency: {
    create: (payload) =>
      request('/emergency-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    findAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/emergency-requests${qs ? `?${qs}` : ''}`);
    },
    findOne: (id) => request(`/emergency-requests/${id}`),
    updateStatus: (id, statusData) =>
      request(`/emergency-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }),
    allocate: (id, surplusId, surplusName) =>
      request(`/emergency-requests/${id}/allocate`, {
        method: 'POST',
        body: JSON.stringify({ surplusId, surplusName }),
      }),
    delete: (id) => request(`/emergency-requests/${id}`, { method: 'DELETE' }),
  },

  // --- 4. Rescue Journeys & Doorstep Logistics ---
  journeys: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/journeys${qs ? `?${qs}` : ''}`);
    },
    getById: (journeyId) => request(`/journeys/${journeyId}`),
    advanceStatus: (journeyId, nextStatus, notes) =>
      request(`/journeys/${journeyId}/advance-status`, {
        method: 'PATCH',
        body: JSON.stringify({
          note: notes || (typeof nextStatus === 'string' ? `Progres status: ${nextStatus}` : undefined),
        }),
      }),
    confirmReceipt: (journeyId, actualReceivedKg, notes) =>
      request(`/journeys/${journeyId}/confirm-receipt`, {
        method: 'POST',
        body: JSON.stringify({
          actualReceivedKg: Number(actualReceivedKg) || 1,
          notes: notes || undefined,
        }),
      }),
    cancel: (journeyId, cancellationReason) =>
      request(`/journeys/${journeyId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          cancellationReason: cancellationReason || 'Dibatalkan oleh pengguna',
        }),
      }),
  },

  // --- 5. Performance Analytics & Insights ---
  analytics: {
    getPerformance: (lang = 'id') => request(`/analytics/performance?lang=${lang}`),
    getInsights: (lang = 'id') => request(`/analytics/insights?lang=${lang}`),
  },

  // --- 6. Admin & Simulation ---
  admin: {
    loadDemo: () => request('/admin/simulation/load-demo', { method: 'POST' }),
    clearDemo: () => request('/admin/simulation/clear-demo', { method: 'DELETE' }),
  },
};

/**
 * Maps frontend surplus report to NestJS CreateSurplusDto
 */
export function mapReportToBackendDto(report) {
  const categoryMap = {
    'cooked-rice': 'COOKED_MEALS',
    'pastry-bread': 'BAKERY_PASTRY',
    'dairy-cheese': 'DAIRY_EGGS',
    'raw-produce': 'FRESH_PRODUCE',
    'packaged-dry': 'PACKAGED_DRY',
    'beverages': 'BEVERAGES',
  };

  const conditionMap = {
    'suitable': 'FRESH',
    'needs_sorting': 'SLIGHTLY_WILTED',
    'near_expiry': 'NEAR_EXPIRY',
    'damaged_pkg': 'DAMAGED_PACKAGING',
    'spoiled': 'SPOILED'
  };

  const packagingMap = {
    'intact_proper': 'INTACT_SEALED',
    'resealed_clean': 'RESEALED',
    'open_clean': 'OPENED_EXPOSED',
    'compromised': 'DAMAGED'
  };

  return {
    foodName: report.foodName || 'Surplus Meal',
    foodCategory: categoryMap[report.foodTypeId] || 'COOKED_MEALS',
    foodTypeCode: report.foodTypeId ? report.foodTypeId.toUpperCase().replace('-', '_') : 'COOKED_BUFFET',
    quantityKg: Number(report.quantity) || 1,
    portions: Number(report.portions) || Math.max(1, Math.round((Number(report.quantity) || 1) / 0.35)),
    condition: conditionMap[report.conditionId] || 'FRESH',
    packagingStatus: packagingMap[report.packagingConditionId] || 'INTACT_SEALED',
    hygieneScore: 90,
    preparedAt: report.preparedAt || new Date().toISOString(),
    safetyConditionId: report.safetyConditionId || 'no_visible_damage',
    storageHistoryId: report.storageHistoryId || 'known_compliant',
    storageTempId: report.storageTempId || 'room_temp_ambient',
    packagingConditionId: report.packagingConditionId || 'intact_proper',
    handlingIntegrityId: report.handlingIntegrityId || 'hygienic_separated',
    notes: report.notes || undefined
  };
}

/**
 * Maps backend SurplusListing record to frontend surplus report object
 */
export function mapBackendListingToReport(listing) {
  const categoryMap = {
    'COOKED_MEALS': 'cooked-rice',
    'BAKERY_PASTRY': 'pastry-bread',
    'DAIRY_EGGS': 'dairy-cheese',
    'FRESH_PRODUCE': 'raw-produce',
    'PACKAGED_DRY': 'packaged-dry',
    'BEVERAGES': 'beverages',
  };

  const defaultCategory = categoryMap[listing.foodCategory] || 'cooked-rice';
  const foodTypeId = listing.foodTypeCode ? listing.foodTypeCode.toLowerCase().replace(/_/g, '-') : defaultCategory;
  const journey = listing.journeys && listing.journeys.length > 0 ? listing.journeys[0] : null;
  const status = journey?.currentStatus || listing.currentLifecycleStatus || 'REPORTED';

  const defaultEvents = [
    { status: 'REPORTED', timestamp: listing.createdAt, note: `Surplus tercatat: ${listing.quantityKg} kg ${listing.foodName}` }
  ];
  if (listing.safetyAssessment) {
    defaultEvents.push({
      status: 'SAFETY_SCREENED',
      timestamp: listing.safetyAssessment.assessedAt || listing.createdAt,
      note: `Food Safety Gate: ${listing.safetyAssessment.safetyStatus}`
    });
  }
  if (journey) {
    if (journey.assignedAt) {
      defaultEvents.push({
        status: 'MATCHED',
        timestamp: journey.assignedAt,
        note: `Dipasangkan dengan: ${journey.recipient?.organization?.name || 'Dapur Sosial Barokah Matraman'}`
      });
    }
    if (journey.initiatedAt) {
      defaultEvents.push({ status: 'RESCUE_INITIATED', timestamp: journey.initiatedAt, note: 'Armada logistik dalam perjalanan' });
    }
    if (journey.receivedAt) {
      defaultEvents.push({ status: 'RECEIVED', timestamp: journey.receivedAt, note: `Diterima fisik: ${journey.actualReceivedKg || listing.quantityKg} kg` });
    }
    if (journey.cancelledAt) {
      defaultEvents.push({ status: 'CANCELLED', timestamp: journey.cancelledAt, note: journey.cancellationReason || 'Dibatalkan' });
    }
  }

  const selectedDestination = journey?.recipient?.organization ? {
    id: journey.recipient.id,
    name: journey.recipient.organization.name,
    type: journey.recipient.recipientType || 'Community Kitchen',
    demoDistanceKm: 2.5
  } : (listing.journeys && listing.journeys.length > 0 ? {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'Dapur Sosial Barokah Matraman',
    type: 'Community Kitchen',
    demoDistanceKm: 2.5
  } : null);

  return {
    id: listing.id,
    journeyId: journey?.id || null,
    foodName: listing.foodName,
    foodTypeId: foodTypeId,
    quantity: Number(listing.quantityKg) || 1,
    unit: 'kg',
    portions: listing.portions || Math.round((Number(listing.quantityKg) || 1) / 0.35),
    sourceContextId: 'Supplier',
    recommendedRoute: listing.scoreAssessment?.recommendedRoute || 'REDISTRIBUTE',
    rescueScore: Number(listing.scoreAssessment?.totalScore) || 88,
    priority: listing.scoreAssessment?.priority || 'HIGH PRIORITY',
    journeyStatus: status,
    cancellationReason: journey?.cancellationReason || null,
    actualReceivedKg: journey?.actualReceivedKg ? Number(journey.actualReceivedKg) : undefined,
    reportedBy: {
      id: listing.donorOrganizationId || 'usr-supplier',
      name: listing.donorOrganization?.name || 'Grand Sahid Catering & Hotel',
      role: 'supplier'
    },
    selectedDestination: selectedDestination,
    foodSafetyGate: {
      status: listing.safetyAssessment?.safetyStatus || 'PASS',
      eligibleForConsumptionRecommendation: listing.safetyAssessment?.safetyStatus === 'PASS',
      headline: listing.safetyAssessment?.safetyStatus === 'PASS' ? 'LOLOS PEMERIKSAAN AWAL (WHO • KEMENKES • BPOM)' : 'PEMERIKSAAN SERVER',
      summary: `Kondisi: ${listing.condition || 'FRESH'}, Kemasan: ${listing.packagingStatus || 'INTACT_SEALED'}`,
      reasons: ['Data terverifikasi oleh server NestJS REPLATE.'],
      missingInformation: [],
      evaluatedAt: listing.safetyAssessment?.assessedAt || listing.createdAt,
      ruleVersion: '2.0'
    },
    journeyEvents: defaultEvents,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    isDemo: false
  };
}

export default api;
