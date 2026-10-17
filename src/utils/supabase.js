/**
 * REPLATE Supabase Cloud Integration
 * Provides real-time synchronization, multi-device collaborative state,
 * and resilient local-first hybrid fallback.
 */

import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://jergrgmiebqctbwumeoa.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_92Y1FL_KGgjCpQX4wCtlVw_8DAua88R';

export const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;

let clientInstance = null;

export function getSupabase() {
  if (clientInstance) return clientInstance;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return clientInstance;
  } catch (err) {
    console.warn('[REPLATE Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseAvailable() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && getSupabase());
}

// -------------------------------------------------------------
// Object Mapper: CamelCase (App) <-> SnakeCase (PostgreSQL)
// -------------------------------------------------------------

export function mapReportToSupabaseRow(rep) {
  return {
    id: rep.id,
    food_name: rep.foodName || rep.foodTypeId || 'Surplus Meal',
    food_type_id: rep.foodTypeId || null,
    quantity: Number(rep.quantity) || 0,
    unit: rep.unit || 'kg',
    actual_received_kg: rep.actualReceivedKg !== undefined ? Number(rep.actualReceivedKg) : null,
    source_context_id: rep.sourceContextId || null,
    recommended_route: rep.recommendedRoute || 'REDISTRIBUTE',
    rescue_score: Number(rep.rescueScore) || 0,
    priority: rep.priority || null,
    journey_status: rep.journeyStatus || 'REPORTED',
    cancellation_reason: rep.cancellationReason || null,
    reported_by: rep.reportedBy || null,
    selected_destination: rep.selectedDestination || null,
    food_safety_gate: rep.foodSafetyGate || null,
    journey_events: rep.journeyEvents || [],
    is_demo: Boolean(rep.isDemo),
    updated_at: new Date().toISOString()
  };
}

export function mapSupabaseRowToReport(row) {
  return {
    id: row.id,
    foodName: row.food_name,
    foodTypeId: row.food_type_id,
    quantity: Number(row.quantity),
    unit: row.unit || 'kg',
    actualReceivedKg: row.actual_received_kg !== null ? Number(row.actual_received_kg) : undefined,
    sourceContextId: row.source_context_id,
    recommendedRoute: row.recommended_route,
    rescueScore: Number(row.rescue_score),
    priority: row.priority,
    journeyStatus: row.journey_status,
    cancellationReason: row.cancellation_reason,
    reportedBy: row.reported_by,
    selectedDestination: row.selected_destination,
    foodSafetyGate: row.food_safety_gate,
    journeyEvents: row.journey_events || [],
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapEmergencyRequestToRow(req) {
  return {
    id: req.id,
    needed_food_type: req.neededFoodType,
    food_type_name: req.foodTypeName || null,
    requested_portions: Number(req.requestedPortions) || 0,
    estimated_kg: Number(req.estimatedKg) || null,
    beneficiary_count: Number(req.beneficiaryCount) || null,
    beneficiary_group: req.beneficiaryGroup || null,
    target_location: req.targetLocation,
    urgency_level: req.urgencyLevel || 'HIGH',
    urgency_deadline: req.urgencyDeadline || null,
    urgency_reason: req.urgencyReason,
    contact_person: req.contactPerson || null,
    contact_phone: req.contactPhone || null,
    notes: req.notes || null,
    status: req.status || 'OPEN',
    matched_surplus_id: req.matchedSurplusId || null,
    matched_surplus_name: req.matchedSurplusName || null,
    requested_by: req.requestedBy || null,
    is_demo: Boolean(req.isDemo),
    updated_at: new Date().toISOString()
  };
}

export function mapRowToEmergencyRequest(row) {
  return {
    id: row.id,
    type: 'EMERGENCY_REQUEST',
    neededFoodType: row.needed_food_type,
    foodTypeName: row.food_type_name,
    requestedPortions: Number(row.requested_portions),
    estimatedKg: Number(row.estimated_kg),
    beneficiaryCount: Number(row.beneficiary_count),
    beneficiaryGroup: row.beneficiary_group,
    targetLocation: row.target_location,
    urgencyLevel: row.urgency_level,
    urgencyDeadline: row.urgency_deadline,
    urgencyReason: row.urgency_reason,
    contactPerson: row.contact_person,
    contactPhone: row.contact_phone,
    notes: row.notes,
    status: row.status,
    matchedSurplusId: row.matched_surplus_id,
    matchedSurplusName: row.matched_surplus_name,
    requestedBy: row.requested_by,
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// -------------------------------------------------------------
// Cloud Sync APIs
// -------------------------------------------------------------

/**
 * Fetch remote surplus reports from Supabase
 */
export async function fetchRemoteSurplusReports() {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('surplus_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[REPLATE Supabase] Error fetching surplus reports:', error.message);
      return [];
    }
    return (data || []).map(mapSupabaseRowToReport);
  } catch (err) {
    console.warn('[REPLATE Supabase] Network error fetching surplus reports:', err);
    return [];
  }
}

/**
 * Upsert a report to Supabase in the background
 */
export async function syncReportToSupabase(report) {
  const sb = getSupabase();
  if (!sb || !report) return null;
  try {
    const row = mapReportToSupabaseRow(report);
    const { data, error } = await sb
      .from('surplus_reports')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('[REPLATE Supabase] Error syncing report:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[REPLATE Supabase] Network error syncing report:', err);
    return null;
  }
}

/**
 * Delete a report from Supabase in the background
 */
export async function deleteReportFromSupabase(id) {
  const sb = getSupabase();
  if (!sb || !id) return false;
  try {
    const { error } = await sb
      .from('surplus_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[REPLATE Supabase] Error deleting report:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[REPLATE Supabase] Network error deleting report:', err);
    return false;
  }
}

/**
 * Delete emergency request from Supabase Cloud
 */
export async function deleteEmergencyRequestFromSupabase(id) {
  const sb = getSupabase();
  if (!sb || !id) return false;
  try {
    const { error } = await sb
      .from('emergency_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[REPLATE Supabase] Error deleting emergency request:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[REPLATE Supabase] Network error deleting emergency request:', err);
    return false;
  }
}

/**
 * Fetch remote emergency requests from Supabase
 */
export async function fetchRemoteEmergencyRequests() {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('emergency_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[REPLATE Supabase] Error fetching emergency requests:', error.message);
      return [];
    }
    return (data || []).map(mapRowToEmergencyRequest);
  } catch (err) {
    console.warn('[REPLATE Supabase] Network error fetching emergency requests:', err);
    return [];
  }
}

/**
 * Sync emergency request to Supabase in the background
 */
export async function syncEmergencyRequestToSupabase(req) {
  const sb = getSupabase();
  if (!sb || !req) return null;
  try {
    const row = mapEmergencyRequestToRow(req);
    const { data, error } = await sb
      .from('emergency_requests')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('[REPLATE Supabase] Error syncing emergency request:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[REPLATE Supabase] Network error syncing emergency request:', err);
    return null;
  }
}

/**
 * Helper to generate standard RFC4122 v4 UUID
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sync a newly registered user to Supabase Cloud
 */
export async function syncUserToSupabase(user) {
  const sb = getSupabase();
  if (!sb || !user) return null;
  try {
    const orgId = user.role === 'supplier'
      ? '00000000-0000-0000-0000-000000000002'
      : '00000000-0000-0000-0000-000000000003';
    
    // Ensure valid UUID format for PostgreSQL uuid column
    const userUuid = user.id && user.id.length === 36 && user.id.includes('-')
      ? user.id
      : generateUUID();

    const now = new Date().toISOString();
    const row = {
      id: userUuid,
      organization_id: orgId,
      email: user.email || `${user.username}@replate.id`,
      full_name: user.name || user.username,
      password_hash: `plain:${user.password}`,
      role: user.role === 'supplier' ? 'SUPPLIER' : user.role === 'mitra' ? 'MITRA' : 'ADMIN',
      is_active: true,
      created_at: user.createdAt || now,
      updated_at: now
    };

    const { data, error } = await sb
      .from('users')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('[REPLATE Supabase] Error syncing user:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[REPLATE Supabase] Network error syncing user:', err);
    return null;
  }
}

/**
 * Fetch remote registered users from Supabase Cloud
 */
export async function fetchRemoteUsers() {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from('users').select('*');
    if (error) {
      console.warn('[REPLATE Supabase] Error fetching users:', error.message);
      return [];
    }
    return (data || []).map(u => ({
      id: u.id,
      username: u.email.split('@')[0],
      email: u.email,
      password: u.password_hash?.startsWith('plain:') ? u.password_hash.replace('plain:', '') : (u.role === 'SUPPLIER' ? 'supplier123' : u.role === 'MITRA' ? 'mitra123' : 'admin123'),
      name: u.full_name,
      role: (u.role || 'supplier').toLowerCase(),
      organization: u.role === 'SUPPLIER' ? 'Dapur Grand Catering' : 'Dapur Umum Mandiri',
      avatar: u.role === 'SUPPLIER' ? '🏪' : u.role === 'MITRA' ? '🤝' : '👑',
      badgeText: u.role === 'SUPPLIER' ? 'Penyedia Surplus' : u.role === 'MITRA' ? 'Mitra Penerima' : 'Admin Operasional',
      createdAt: u.created_at
    }));
  } catch (err) {
    console.warn('[REPLATE Supabase] Network error fetching users:', err);
    return [];
  }
}

/**
 * Setup Realtime Subscriptions for live multi-device syncing
 */
export function setupSupabaseRealtimeSubscriptions(onReportChange, onEmergencyChange, onUserChange) {
  const sb = getSupabase();
  if (!sb || typeof window === 'undefined') return () => {};

  const channel = sb.channel('replate-live-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'surplus_reports' },
      (payload) => {
        if (onReportChange) onReportChange(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'emergency_requests' },
      (payload) => {
        if (onEmergencyChange) onEmergencyChange(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      (payload) => {
        if (onUserChange) onUserChange(payload);
      }
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}
