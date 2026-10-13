import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, HelpRequest, HelpResponse, Institution, Connection, HelpCategory } from '../models';

const STORAGE_KEYS = {
  USERS: '@helptoyou:users',
  REQUESTS: '@helptoyou:help_requests',
  RESPONSES: '@helptoyou:help_responses',
  INSTITUTIONS: '@helptoyou:institutions',
  CONNECTIONS: '@helptoyou:connections',
};

const SAMPLE_USER_IDS = new Set([
  'user_prof_sundaram', 'user_prof_watson', 'user_alumni_priya',
  'user_student_karthik', 'user_aspirant_arun', 'user_sponsor_senthil',
]);
const SAMPLE_REQUEST_IDS = new Set(['req_1', 'req_2', 'req_3', 'req_4', 'req_5']);
const SAMPLE_CONNECTION_IDS = new Set(['conn_1', 'conn_2']);

class DatabaseService {
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    try {
      // Remove the old illustrative records without clearing real user-created local content.
      const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        const parsedUsers: (User & { passwordHash?: string })[] = JSON.parse(storedUsers);
        const users = parsedUsers
          .filter((user) => !SAMPLE_USER_IDS.has(user.id))
          .map(({ passwordHash, ...user }) => user);
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      const storedRequests = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (storedRequests) {
        const requests: HelpRequest[] = JSON.parse(storedRequests);
        await AsyncStorage.setItem(
          STORAGE_KEYS.REQUESTS,
          JSON.stringify(requests.filter((request) => !SAMPLE_REQUEST_IDS.has(request.id))),
        );
      }
      const storedResponses = await AsyncStorage.getItem(STORAGE_KEYS.RESPONSES);
      if (storedResponses) {
        const responses: Record<string, HelpResponse[]> = JSON.parse(storedResponses);
        SAMPLE_REQUEST_IDS.forEach((id) => delete responses[id]);
        await AsyncStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
      }
      const storedConnections = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (storedConnections) {
        const connections: Connection[] = JSON.parse(storedConnections);
        await AsyncStorage.setItem(
          STORAGE_KEYS.CONNECTIONS,
          JSON.stringify(connections.filter((connection) => !SAMPLE_CONNECTION_IDS.has(connection.id))),
        );
      }
      const storedInstitutions = await AsyncStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
      if (storedInstitutions) {
        const institutions: Institution[] = JSON.parse(storedInstitutions);
        await AsyncStorage.setItem(
          STORAGE_KEYS.INSTITUTIONS,
          JSON.stringify(institutions.filter((institution) => !institution.id.startsWith('inst_'))),
        );
      }
      await AsyncStorage.removeItem('@helptoyou:seeded_v2');
      this.initialized = true;
    } catch (e) {
      console.warn('Database initialization warning:', e);
      this.initialized = true;
    }
  }

  // --- USERS ---
  public async getUsers(): Promise<User[]> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  // --- HELP REQUESTS ---
  public async getHelpRequests(filters?: {
    university?: string;
    category?: string;
    query?: string;
    authorId?: string;
    status?: string;
  }): Promise<HelpRequest[]> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
    let requests: HelpRequest[] = data ? JSON.parse(data) : [];

    // Load responses map to populate counts and sub-threads
    const respData = await AsyncStorage.getItem(STORAGE_KEYS.RESPONSES);
    const responsesMap: Record<string, HelpResponse[]> = respData ? JSON.parse(respData) : {};

    requests = requests.map((req) => ({
      ...req,
      responses: responsesMap[req.id] || [],
      responseCount: (responsesMap[req.id] || []).length,
    }));

    if (filters) {
      if (filters.category && filters.category !== 'All') {
        requests = requests.filter((r) => r.category.toLowerCase() === filters.category!.toLowerCase());
      }
      if (filters.university && filters.university !== 'All') {
        requests = requests.filter((r) => r.university.toLowerCase().includes(filters.university!.toLowerCase()));
      }
      if (filters.authorId) {
        requests = requests.filter((r) => r.authorId === filters.authorId);
      }
      if (filters.status && filters.status !== 'All') {
        requests = requests.filter((r) => r.status === filters.status);
      }
      if (filters.query && filters.query.trim()) {
        const q = filters.query.toLowerCase().trim();
        requests = requests.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.university.toLowerCase().includes(q) ||
            r.authorName.toLowerCase().includes(q) ||
            r.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
    }

    // Sort by newest first
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getHelpRequestById(id: string): Promise<HelpRequest | null> {
    const list = await this.getHelpRequests();
    return list.find((r) => r.id === id) || null;
  }

  public async createHelpRequest(payload: {
    title: string;
    description: string;
    category: HelpCategory;
    university: string;
    department?: string;
    urgency?: 'Low' | 'Medium' | 'High';
    tags?: string[];
    author: User;
  }): Promise<HelpRequest> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
    const requests: HelpRequest[] = data ? JSON.parse(data) : [];

    const newRequest: HelpRequest = {
      id: `req_${Date.now()}`,
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      university: payload.university.trim(),
      department: payload.department?.trim() || payload.author.department,
      authorId: payload.author.id,
      authorName: `${payload.author.firstName} ${payload.author.lastName}`.trim(),
      authorRole: payload.author.userType,
      authorUniversity: payload.author.university,
      authorDesignation: payload.author.designation,
      urgency: payload.urgency || 'Medium',
      status: 'open',
      createdAt: new Date().toISOString(),
      responseCount: 0,
      upvotes: 0,
      tags: payload.tags && payload.tags.length ? payload.tags : [payload.category, payload.university],
      responses: [],
    };

    requests.unshift(newRequest);
    await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    return newRequest;
  }

  public async addResponseToRequest(payload: {
    requestId: string;
    content: string;
    author: User;
  }): Promise<HelpResponse> {
    await this.init();
    const respData = await AsyncStorage.getItem(STORAGE_KEYS.RESPONSES);
    const responsesMap: Record<string, HelpResponse[]> = respData ? JSON.parse(respData) : {};

    const newResponse: HelpResponse = {
      id: `resp_${Date.now()}`,
      requestId: payload.requestId,
      authorId: payload.author.id,
      authorName: `${payload.author.firstName} ${payload.author.lastName}`.trim(),
      authorRole: payload.author.userType,
      authorUniversity: payload.author.university,
      authorDesignation: payload.author.designation,
      content: payload.content.trim(),
      createdAt: new Date().toISOString(),
    };

    const currentList = responsesMap[payload.requestId] || [];
    currentList.push(newResponse);
    responsesMap[payload.requestId] = currentList;
    await AsyncStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responsesMap));

    // Update request count
    const reqData = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (reqData) {
      const requests: HelpRequest[] = JSON.parse(reqData);
      const reqIdx = requests.findIndex((r) => r.id === payload.requestId);
      if (reqIdx !== -1) {
        requests[reqIdx].responseCount = currentList.length;
        if (requests[reqIdx].status === 'open') {
          requests[reqIdx].status = 'in_progress';
        }
        await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
      }
    }

    return newResponse;
  }

  public async toggleUpvoteRequest(id: string): Promise<number> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!data) return 0;
    const requests: HelpRequest[] = JSON.parse(data);
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return 0;

    requests[index].upvotes = (requests[index].upvotes || 0) + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    return requests[index].upvotes;
  }

  public async updateRequestStatus(id: string, status: 'open' | 'in_progress' | 'resolved'): Promise<void> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!data) return;
    const requests: HelpRequest[] = JSON.parse(data);
    const index = requests.findIndex((r) => r.id === id);
    if (index !== -1) {
      requests[index].status = status;
      await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    }
  }

  // --- INSTITUTIONS & MENTORS ---
  public async getInstitutions(): Promise<Institution[]> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
    return data ? JSON.parse(data) : [];
  }

  public async getMentors(university?: string, role?: string): Promise<User[]> {
    const allUsers = await this.getUsers();
    let mentors = allUsers.filter((u) => u.userType === 'Professor' || u.userType === 'Alumni' || u.userType === 'Sponsor');
    if (university && university !== 'All') {
      mentors = mentors.filter((m) => m.university?.toLowerCase().includes(university.toLowerCase()));
    }
    if (role && role !== 'All') {
      mentors = mentors.filter((m) => m.userType === role);
    }
    return mentors;
  }

  // --- CONNECTIONS ---
  public async getConnections(userId: string): Promise<Connection[]> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    const list: Connection[] = data ? JSON.parse(data) : [];
    return list.filter((c) => c.fromUserId === userId || c.toUserId === userId);
  }

  public async connectWithUser(fromUserId: string, toUserId: string, message?: string): Promise<Connection> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    const list: Connection[] = data ? JSON.parse(data) : [];

    const existing = list.find(
      (c) =>
        (c.fromUserId === fromUserId && c.toUserId === toUserId) ||
        (c.fromUserId === toUserId && c.toUserId === fromUserId)
    );
    if (existing) return existing;

    const newConn: Connection = {
      id: `conn_${Date.now()}`,
      fromUserId,
      toUserId,
      status: 'pending',
      message: message || 'I would like to connect for education guidance.',
      createdAt: new Date().toISOString(),
    };

    list.push(newConn);
    await AsyncStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(list));
    return newConn;
  }

  // --- SEED RESET ---
  public async resetToDefaults(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USERS);
    await AsyncStorage.removeItem(STORAGE_KEYS.REQUESTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.RESPONSES);
    await AsyncStorage.removeItem(STORAGE_KEYS.INSTITUTIONS);
    await AsyncStorage.removeItem(STORAGE_KEYS.CONNECTIONS);
    this.initialized = false;
    await this.init();
  }
}

export const db = new DatabaseService();
