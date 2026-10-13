import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { HelpCategory, HelpRequest, HelpResponse, HelpStatus, User } from '../models';
import { db } from './firebaseConfig';

const REQUESTS = 'helpRequests';
const MAX_RECENT_REQUESTS = 50;
const MAX_THREAD_RESPONSES = 200;

function toIsoString(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value.toDate as () => Date)().toISOString();
  }
  return typeof value === 'string' ? value : new Date(0).toISOString();
}

function mapRequest(id: string, data: Record<string, unknown>): HelpRequest {
  return {
    ...(data as unknown as HelpRequest),
    id,
    createdAt: toIsoString(data.createdAt),
    responseCount: Number(data.responseCount) || 0,
    upvotes: Number(data.upvotes) || 0,
    tags: Array.isArray(data.tags) ? data.tags as string[] : [],
  };
}

function mapResponse(id: string, requestId: string, data: Record<string, unknown>): HelpResponse {
  return {
    ...(data as unknown as HelpResponse),
    id,
    requestId,
    createdAt: toIsoString(data.createdAt),
  };
}

function matchesRequest(request: HelpRequest, filters?: {
  university?: string;
  category?: string;
  query?: string;
  authorId?: string;
  status?: string;
}): boolean {
  if (!filters) return true;
  if (filters.category && filters.category !== 'All' && request.category.toLowerCase() !== filters.category.toLowerCase()) return false;
  if (filters.university && filters.university !== 'All' && !request.university.toLowerCase().includes(filters.university.toLowerCase())) return false;
  if (filters.authorId && request.authorId !== filters.authorId) return false;
  if (filters.status && filters.status !== 'All' && request.status !== filters.status) return false;
  const term = filters.query?.trim().toLowerCase();
  if (!term) return true;
  return request.title.toLowerCase().includes(term)
    || request.description.toLowerCase().includes(term)
    || request.university.toLowerCase().includes(term)
    || request.authorName.toLowerCase().includes(term)
    || request.tags.some((tag) => tag.toLowerCase().includes(term));
}

function authorFields(author: User) {
  return {
    authorId: author.id,
    authorName: `${author.firstName} ${author.lastName}`.trim(),
    authorRole: author.userType,
    authorUniversity: author.university || '',
    authorDesignation: author.designation || '',
  };
}

export const communityService = {
  async getHelpRequests(filters?: {
    university?: string;
    category?: string;
    query?: string;
    authorId?: string;
    status?: string;
  }): Promise<HelpRequest[]> {
    // Keep reads bounded while the feed is client-filtered. Add cursor pagination before launch.
    const recentQuery = query(collection(db, REQUESTS), orderBy('createdAt', 'desc'), limit(MAX_RECENT_REQUESTS));
    const snapshot = await getDocs(recentQuery);
    return snapshot.docs
      .map((item) => mapRequest(item.id, item.data()))
      .filter((item) => matchesRequest(item, filters));
  },

  async getHelpRequestById(requestId: string): Promise<HelpRequest | null> {
    const requestRef = doc(db, REQUESTS, requestId);
    const [requestSnapshot, responseSnapshot] = await Promise.all([
      getDoc(requestRef),
      getDocs(query(collection(requestRef, 'responses'), orderBy('createdAt', 'asc'), limit(MAX_THREAD_RESPONSES))),
    ]);
    if (!requestSnapshot.exists()) return null;

    const request = mapRequest(requestSnapshot.id, requestSnapshot.data());
    const responses = responseSnapshot.docs.map((item) => mapResponse(item.id, requestId, item.data()));
    return { ...request, responses };
  },

  async createHelpRequest(payload: {
    title: string;
    description: string;
    category: HelpCategory;
    university: string;
    department?: string;
    urgency?: 'Low' | 'Medium' | 'High';
    tags?: string[];
    author: User;
  }): Promise<HelpRequest> {
    const createdAt = new Date().toISOString();
    const requestData = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      university: payload.university.trim(),
      department: payload.department?.trim() || payload.author.department || '',
      ...authorFields(payload.author),
      urgency: payload.urgency || 'Medium',
      status: 'open' as const,
      createdAt: serverTimestamp(),
      responseCount: 0,
      upvotes: 0,
      tags: payload.tags?.length ? payload.tags : [payload.category, payload.university.trim()],
    };
    const requestRef = await addDoc(collection(db, REQUESTS), requestData);
    return { ...requestData, id: requestRef.id, createdAt };
  },

  async addResponseToRequest(payload: {
    requestId: string;
    content: string;
    author: User;
  }): Promise<HelpResponse> {
    const createdAt = new Date().toISOString();
    const responseData = {
      requestId: payload.requestId,
      ...authorFields(payload.author),
      content: payload.content.trim(),
      createdAt: serverTimestamp(),
    };
    const responseRef = await addDoc(
      collection(db, REQUESTS, payload.requestId, 'responses'),
      responseData,
    );
    return { ...responseData, id: responseRef.id, createdAt };
  },

  async toggleUpvoteRequest(requestId: string, userId: string): Promise<number> {
    const requestRef = doc(db, REQUESTS, requestId);
    const voteRef = doc(db, REQUESTS, requestId, 'upvotes', userId);
    return runTransaction(db, async (transaction) => {
      const [requestSnapshot, existingVote] = await Promise.all([
        transaction.get(requestRef),
        transaction.get(voteRef),
      ]);
      if (!requestSnapshot.exists()) throw new Error('This question is no longer available.');
      const currentCount = Number(requestSnapshot.data().upvotes) || 0;
      if (existingVote.exists()) {
        transaction.delete(voteRef);
        return Math.max(0, currentCount - 1);
      } else {
        transaction.set(voteRef, { userId, createdAt: serverTimestamp() });
        return currentCount + 1;
      }
    });
  },

  async updateRequestStatus(requestId: string, status: HelpStatus): Promise<void> {
    if (status !== 'resolved') throw new Error('Only the question author can mark a question as resolved.');
    await updateDoc(doc(db, REQUESTS, requestId), { status });
  },
};
