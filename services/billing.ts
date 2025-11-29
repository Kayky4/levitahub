import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { BandBilling, MockStripeEvent, SubscriptionStatus, BillingLog } from './types';

// --- CONFIG ---
// Using 'subscription' as the document ID inside 'billing' subcollection
const BILLING_DOC_PATH = (bandId: string) => `bands/${bandId}/billing/subscription`;
const LOGS_COLLECTION = (bandId: string) => `bands/${bandId}/billingLogs`;

// Mock Constants
const MOCK_PRICE_ID = "price_mock_plus_plan";
const TRIAL_DAYS = 14;

// --- FEATURE FLAGGING & PERMISSIONS ---

export const canUseFeature = (feature: 'create_song' | 'create_playlist' | 'regency' | 'create_band', status: SubscriptionStatus): boolean => {
  switch (status) {
    case 'active':
    case 'trialing':
      return true;
    case 'past_due':
      // Block new creations to encourage payment
      return false; 
    case 'inactive':
    case 'canceled':
    case 'blocked':
      return false;
    default:
      return false;
  }
};

export const getFeatureTooltip = (feature: string, status: SubscriptionStatus): string => {
  if (canUseFeature(feature as any, status)) return "";
  
  if (status === 'inactive') return "Ative o Plano Plus para usar este recurso.";
  if (status === 'past_due') return "Pagamento pendente. Regularize para liberar.";
  if (status === 'canceled') return "Assinatura cancelada. Reative para usar.";
  return "Assinatura necessária.";
};

// --- READ OPERATIONS ---

export const getBandBilling = async (bandId: string): Promise<BandBilling | null> => {
  try {
    const ref = doc(db, BILLING_DOC_PATH(bandId));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as BandBilling;
    }
    // If doc doesn't exist yet (legacy bands), return default inactive
    return {
      subscriptionStatus: 'inactive',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
      pastDueAt: null,
      graceEndsAt: null,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn("Billing permission check failed:", error);
    // Graceful fallback for UI
    return null;
  }
};

export const getBillingHistory = async (bandId: string): Promise<BillingLog[]> => {
  try {
    const logsRef = collection(db, LOGS_COLLECTION(bandId));
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(10));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BillingLog));
  } catch (error) {
    console.warn("Billing logs permission check failed:", error);
    return [];
  }
};

// --- MOCK "CLOUD FUNCTIONS" (Client-side Simulation) ---

/**
 * Simulates `functions/stripe/createCheckoutSession.ts`
 */
export const createCheckoutSessionMock = async (bandId: string): Promise<{ url: string }> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  // Generate a fake session ID
  const sessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
  
  // Create a pending checkout marker in Firestore
  await updateDoc(doc(db, BILLING_DOC_PATH(bandId)), {
    stripeSubscriptionId: "pending_" + sessionId, 
    updatedAt: new Date().toISOString()
  });

  // Return the URL to our internal Mock Checkout Page
  return {
    url: `/mock-checkout?session_id=${sessionId}&band_id=${bandId}`
  };
};

/**
 * Simulates `functions/stripe/stripeWebhook.ts`
 * This is the CORE logic engine for billing state.
 */
export const processMockWebhook = async (bandId: string, event: MockStripeEvent): Promise<void> => {
  const billingRef = doc(db, BILLING_DOC_PATH(bandId));
  const logsRef = collection(db, LOGS_COLLECTION(bandId));
  const now = Date.now();

  console.log(`[Webhook] Processing ${event.type} for ${bandId}`);

  // Fetch current billing to merge
  const currentSnap = await getDoc(billingRef);
  const currentData = currentSnap.exists() ? currentSnap.data() as BandBilling : {} as any;

  let updates: Partial<BandBilling> = {};

  switch (event.type) {
    case 'checkout.session.completed':
      // New subscription started
      updates = {
        subscriptionStatus: 'trialing', // Start with trial
        stripeCustomerId: `cus_${Math.random().toString(36).substr(2, 9)}`,
        stripeSubscriptionId: `sub_${Math.random().toString(36).substr(2, 9)}`,
        trialEndsAt: now + (TRIAL_DAYS * 24 * 60 * 60 * 1000),
        currentPeriodEnd: now + (30 * 24 * 60 * 60 * 1000), 
      };
      break;

    case 'invoice.paid':
      // Recurring payment success or initial payment if no trial
      updates = {
        subscriptionStatus: 'active',
        pastDueAt: null,
        graceEndsAt: null,
        currentPeriodEnd: now + (30 * 24 * 60 * 60 * 1000)
      };
      break;

    case 'invoice.payment_failed':
      // Payment failed
      updates = {
        subscriptionStatus: 'past_due',
        pastDueAt: now,
        graceEndsAt: now + (3 * 24 * 60 * 60 * 1000) // 3 days grace
      };
      break;

    case 'customer.subscription.deleted':
      updates = {
        subscriptionStatus: 'canceled',
        currentPeriodEnd: null,
        trialEndsAt: null
      };
      break;
  }

  // 1. Update Billing Doc
  // If it doesn't exist (first time), setDoc, else updateDoc
  if (!currentSnap.exists()) {
     await setDoc(billingRef, { ...updates, updatedAt: new Date().toISOString() });
  } else {
     await updateDoc(billingRef, { ...updates, updatedAt: new Date().toISOString() });
  }

  // 2. Log Event
  await addDoc(logsRef, {
    eventId: event.id,
    type: event.type,
    status: 'processed',
    details: JSON.stringify(event.data),
    createdAt: new Date().toISOString()
  });
};

/**
 * Simulates `functions/stripe/reconciliationJob.ts`
 */
export const runReconciliationJobMock = async (bandId: string): Promise<string> => {
  const billing = await getBandBilling(bandId);
  if (!billing) return "No billing doc";

  const now = Date.now();
  let statusChanged = false;
  let newStatus = billing.subscriptionStatus;

  // 1. Check Trial Expiry
  if (billing.subscriptionStatus === 'trialing' && billing.trialEndsAt && now > billing.trialEndsAt) {
    // Simulate move to active (assuming auto-pay works)
    newStatus = 'active'; 
    statusChanged = true;
  }

  // 2. Check Grace Period
  if (billing.subscriptionStatus === 'past_due' && billing.graceEndsAt && now > billing.graceEndsAt) {
    newStatus = 'blocked'; 
    statusChanged = true;
  }

  if (statusChanged) {
    await updateDoc(doc(db, BILLING_DOC_PATH(bandId)), {
      subscriptionStatus: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    // Log
    await addDoc(collection(db, LOGS_COLLECTION(bandId)), {
      eventId: 'reconciliation_job_' + now,
      type: 'system.reconciliation',
      status: 'processed',
      details: `Status changed from ${billing.subscriptionStatus} to ${newStatus}`,
      createdAt: new Date().toISOString()
    });
    
    return `Status updated: ${newStatus}`;
  }

  return "No changes required";
};

// --- TEMP TESTING FUNCTION ---
export const forceActivateSubscription = async (bandId: string): Promise<void> => {
  const billingRef = doc(db, BILLING_DOC_PATH(bandId));
  const logsRef = collection(db, LOGS_COLLECTION(bandId));
  const now = Date.now();

  // Create doc if it doesn't exist, or update
  await setDoc(billingRef, {
    subscriptionStatus: 'active',
    stripeCustomerId: `cus_mock_forced_${now}`,
    stripeSubscriptionId: `sub_mock_forced_${now}`,
    currentPeriodEnd: now + (30 * 24 * 60 * 60 * 1000), // 30 days
    updatedAt: new Date().toISOString()
  }, { merge: true });

  await addDoc(logsRef, {
    eventId: 'manual_force_active_' + now,
    type: 'system.force_active',
    status: 'processed',
    details: 'Ativação manual para testes (Dev Mode)',
    createdAt: new Date().toISOString()
  });
};

// --- HELPERS ---

export const getReadableStatus = (status: SubscriptionStatus) => {
  const map = {
    'inactive': 'Inativo',
    'trialing': 'Em Período de Teste',
    'active': 'Ativo',
    'past_due': 'Pagamento Pendente',
    'canceled': 'Cancelado',
    'blocked': 'Bloqueado'
  };
  return map[status] || status;
};