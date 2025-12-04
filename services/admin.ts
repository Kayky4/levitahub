import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    updateDoc,
    addDoc,
    getDoc,
    serverTimestamp,
    startAfter,
    writeBatch,
    getCountFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Band, Subscription, ManualPayment } from './types';

// --- ADMIN HELPERS ---

// Hardcoded Admin Check for MVP
export const isAdmin = (email: string | null | undefined) => {
    const ADMIN_EMAILS = ['kayky@gmail.com'];
    return email && ADMIN_EMAILS.includes(email);
};

// --- DASHBOARD STATS ---

export const getDetailedDashboardStats = async () => {
    // 1. Fetch Bands Snapshot for calculations
    const bandsSnap = await getDocs(collection(db, 'bands'));
    const bands = bandsSnap.docs.map(d => d.data() as Band);

    const totalBands = bands.length;
    const trialBands = bands.filter(b => b.status === 'trial').length;
    const activeBands = bands.filter(b => b.status === 'active').length;
    const blockedBands = bands.filter(b => b.status === 'blocked' || b.status === 'expired').length;

    // 2. Fetch Users Count
    const usersSnap = await getCountFromServer(collection(db, 'users'));
    const totalUsers = usersSnap.data().count;

    // 3. Calculate Revenue
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const paymentsQ = query(collection(db, 'manualPayments'));
    const paymentsSnap = await getDocs(paymentsQ);
    const payments = paymentsSnap.docs.map(d => d.data() as ManualPayment);

    const monthlyRevenue = payments
        .filter(p => p.referenceMonth === currentMonth)
        .reduce((acc, p) => acc + (p.amount || 0), 0);

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // 4. Top Lists (Client-side aggregation for MVP)
    // Top Leaders (Owners of most bands - usually 1 per user but good to check)
    const leaderCounts: Record<string, number> = {};
    bands.forEach(b => {
        if (b.ownerId) leaderCounts[b.ownerId] = (leaderCounts[b.ownerId] || 0) + 1;
    });
    // This is just counts, we'd need user names. For MVP, let's just return raw counts or skip.
    // Let's skip "Top Leaders" complex mapping for now to save reads, or just show IDs.

    return {
        totalBands,
        trialBands,
        activeBands,
        blockedBands,
        totalUsers,
        monthlyRevenue,
        totalRevenue,
        growthRate: 0, // Placeholder
    };
};

// --- BAND MANAGEMENT ---

export const getAllBands = async (lastDoc: any = null, pageSize: number = 20) => {
    let q = query(collection(db, 'bands'), orderBy('createdAt', 'desc'), limit(pageSize));

    if (lastDoc) {
        q = query(collection(db, 'bands'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const bands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Band));

    return {
        bands,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
};

export const getBandDetailsAdmin = async (bandId: string) => {
    const bandRef = doc(db, 'bands', bandId);
    const bandSnap = await getDoc(bandRef);
    if (!bandSnap.exists()) return null;
    return { id: bandSnap.id, ...bandSnap.data() } as Band;
};

export const updateBandStatus = async (bandId: string, status: 'active' | 'blocked' | 'trial' | 'expired', newExpiry?: number) => {
    const user = auth.currentUser;
    if (!user || !isAdmin(user.email)) throw new Error("Unauthorized");

    const bandRef = doc(db, 'bands', bandId);
    const updates: any = { status };

    if (newExpiry) {
        updates.subscriptionActiveUntil = newExpiry;
        if (status === 'trial') {
            updates.trialEndsAt = newExpiry;
        }
    }

    await updateDoc(bandRef, updates);
};

export const extendTrial = async (bandId: string, days: number) => {
    const band = await getBandDetailsAdmin(bandId);
    if (!band) throw new Error("Band not found");

    const currentTrialEnd = band.trialEndsAt || Date.now();
    const newTrialEnd = currentTrialEnd + (days * 24 * 60 * 60 * 1000);

    await updateBandStatus(bandId, 'trial', newTrialEnd);
};

// --- USER MANAGEMENT ---

export const getAllUsers = async (lastDoc: any = null, pageSize: number = 20) => {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(pageSize));

    if (lastDoc) {
        q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
        users,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
};

// --- PAYMENTS MANAGEMENT ---

export const getAllPayments = async (lastDoc: any = null, pageSize: number = 20) => {
    let q = query(collection(db, 'manualPayments'), orderBy('approvedAt', 'desc'), limit(pageSize));

    if (lastDoc) {
        q = query(collection(db, 'manualPayments'), orderBy('approvedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManualPayment));

    return {
        payments,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
};

export const registerManualPayment = async (
    bandId: string,
    amount: number,
    method: string,
    monthsToAdd: number = 1
) => {
    const user = auth.currentUser;
    if (!user || !isAdmin(user.email)) throw new Error("Unauthorized");

    const bandRef = doc(db, 'bands', bandId);
    const bandSnap = await getDoc(bandRef);
    if (!bandSnap.exists()) throw new Error("Band not found");
    const band = bandSnap.data() as Band;

    const batch = writeBatch(db);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Create Payment Record
    const paymentRef = doc(collection(db, 'manualPayments'));
    const paymentData: ManualPayment = {
        id: paymentRef.id,
        userId: band.ownerId,
        bandId: bandId,
        amount,
        method,
        approvedBy: user.email || 'Admin',
        approvedAt: now.getTime(),
        referenceMonth: currentMonth
    };
    batch.set(paymentRef, paymentData);

    // 2. Update Subscription & Band Status
    const currentExpiry = band.subscriptionActiveUntil || Date.now();
    // If expired, start from now. If active, add to end.
    const baseDate = (currentExpiry > Date.now()) ? currentExpiry : Date.now();
    const newExpiry = baseDate + (monthsToAdd * 30 * 24 * 60 * 60 * 1000);

    // Update Band
    batch.update(bandRef, {
        status: 'active',
        subscriptionActiveUntil: newExpiry
    });

    // Update Subscription Doc if exists
    if (band.subscriptionId) {
        const subRef = doc(db, 'subscriptions', band.subscriptionId);
        batch.update(subRef, {
            status: 'active',
            nextPaymentDate: newExpiry,
            notes: `Pagamento manual de R$${amount} registrado em ${now.toLocaleDateString()}`
        });
    }

    await batch.commit();
    return newExpiry;
};

// --- OPERATIONS & SUPPORT (MOCK/SIMPLE) ---

export const getOperationsStats = async () => {
    // Mocked for MVP as we don't have real-time presence yet
    return {
        activeRegencies: Math.floor(Math.random() * 5),
        sessionsToday: Math.floor(Math.random() * 20) + 5,
        musiciansOnline: Math.floor(Math.random() * 50) + 10,
        recentLogs: [
            { id: 1, action: 'Playlist Criada', band: 'Ministério Louvor', time: '2 min atrás' },
            { id: 2, action: 'Música Editada', band: 'Banda Jovem', time: '5 min atrás' },
            { id: 3, action: 'Novo Membro', band: 'Coral Principal', time: '12 min atrás' },
            { id: 4, action: 'Regência Iniciada', band: 'Grupo de Louvor', time: '15 min atrás' },
        ]
    };
};

export const getSupportTickets = async () => {
    // Mocked for MVP
    return [
        { id: 't1', user: 'joao@gmail.com', subject: 'Dúvida sobre pagamento', status: 'open', date: Date.now() - 10000000 },
        { id: 't2', user: 'maria@hotmail.com', subject: 'Erro ao criar música', status: 'resolved', date: Date.now() - 50000000 },
        { id: 't3', user: 'pedro@outlook.com', subject: 'Como convidar membros?', status: 'open', date: Date.now() - 2000000 },
    ];
};
