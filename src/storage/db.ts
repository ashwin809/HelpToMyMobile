import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, HelpRequest, HelpResponse, Institution, Connection, HelpCategory } from '../models';

const STORAGE_KEYS = {
  USERS: '@helptoyou:users',
  REQUESTS: '@helptoyou:help_requests',
  RESPONSES: '@helptoyou:help_responses',
  INSTITUTIONS: '@helptoyou:institutions',
  CONNECTIONS: '@helptoyou:connections',
  SEEDED: '@helptoyou:seeded_v2',
};

// Default seed data with realistic educational connect scenarios
const INITIAL_USERS: User[] = [
  {
    id: 'user_prof_sundaram',
    email: 'prof.sundaram@annauniv.edu',
    firstName: 'Dr. R.',
    lastName: 'Sundaram',
    userType: 'Professor',
    university: 'Anna University, Chennai',
    department: 'Computer Science & Engineering',
    designation: 'Senior Professor & Research Dean',
    educationLevel: 'PhD, Computer Science',
    skills: ['AI & Machine Learning', 'PG Admissions', 'Research Fellowships', 'Algorithms'],
    bio: 'Professor at Anna University with 18+ years of teaching & research. Passionate about mentoring aspiring engineering students with curriculum, research opportunities, and admissions.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    isVerified: true,
    helpedCount: 42,
    rating: 4.9,
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'user_prof_watson',
    email: 'emily.watson@stanford.edu',
    firstName: 'Dr. Emily',
    lastName: 'Watson',
    userType: 'Professor',
    university: 'Stanford University',
    department: 'School of Engineering / AI Lab',
    designation: 'Associate Professor',
    educationLevel: 'PhD, Robotics & AI',
    skills: ['Deep Learning', 'MS/PhD Admissions', 'Statement of Purpose (SOP)', 'Research Grants'],
    bio: 'Educator and AI researcher mentoring prospective graduate students on academic pathways, research proposals, and international admissions.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    isVerified: true,
    helpedCount: 29,
    rating: 5.0,
    city: 'Stanford',
    state: 'California',
    country: 'USA',
    createdAt: '2026-01-15T11:30:00Z',
  },
  {
    id: 'user_alumni_priya',
    email: 'priya.natarajan@alumni.org',
    firstName: 'Priya',
    lastName: 'Natarajan',
    userType: 'Alumni',
    university: 'IIT Madras',
    department: 'Electrical & Computer Engineering',
    designation: 'Staff Software Architect & Mentor',
    educationLevel: 'B.Tech, IIT Madras (2018)',
    skills: ['Career Transition', 'System Design', 'Tech Interview Prep', 'Higher Studies'],
    bio: 'IIT Madras alumna passionate about giving back. Mentoring first-generation college students on software engineering careers, higher education, and scholarship prep.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
    isVerified: true,
    helpedCount: 38,
    rating: 4.95,
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    createdAt: '2026-02-01T09:15:00Z',
  },
  {
    id: 'user_student_karthik',
    email: 'karthik.raja@student.edu',
    firstName: 'Karthik',
    lastName: 'Raja',
    userType: 'Student',
    university: 'Anna University, Chennai',
    department: 'Information Technology',
    designation: 'Final Year B.Tech Student',
    educationLevel: 'Undergraduate (Senior)',
    skills: ['Campus Placements', 'Anna University Syllabus', 'Web Development', 'Peer Mentoring'],
    bio: 'Final year student at Anna University CEG campus. Excited to help juniors and aspirants with subject notes, lab prep, and campus placement strategies.',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
    isVerified: true,
    helpedCount: 16,
    rating: 4.8,
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    createdAt: '2026-02-10T14:20:00Z',
  },
  {
    id: 'user_aspirant_arun',
    email: 'arun.aspirant@gmail.com',
    firstName: 'Arun',
    lastName: 'Kumar',
    userType: 'Student',
    university: 'Anna University, Chennai',
    department: 'Computer Science & Engineering',
    designation: 'M.Tech Aspirant (Applying)',
    educationLevel: 'Prospective Graduate Student',
    skills: ['GATE CS Prep', 'Programming'],
    bio: 'Aspiring engineering graduate preparing for Anna University CEG M.Tech admission. Looking for guidance on syllabus, interviews, and cutoffs.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    isVerified: false,
    helpedCount: 0,
    rating: 5.0,
    city: 'Madurai',
    state: 'Tamil Nadu',
    country: 'India',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'user_sponsor_senthil',
    email: 'senthil@helptoyou.org',
    firstName: 'Senthil',
    lastName: 'Krishnaswamy',
    userType: 'Sponsor',
    university: 'HelpToYou Foundation',
    department: 'Education Assistance & Sponsorship',
    designation: 'Foundation Lead & Sponsor',
    educationLevel: 'MS, Engineering',
    skills: ['Education Scholarships', 'Tuition Sponsorship', 'Student Aid', 'NGO Mentorship'],
    bio: 'Co-founder at HelpToYou. Dedicated to breaking poverty cycles by providing educational sponsorship, fees assistance, and mentorship to deserving students.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    isVerified: true,
    helpedCount: 124,
    rating: 5.0,
    city: 'San Jose',
    state: 'California',
    country: 'USA',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst_anna',
    name: 'Anna University, Chennai',
    location: 'Chennai, Tamil Nadu, India',
    type: 'University',
    departments: ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Electronics & Comm.'],
    mentorCount: 18,
    studentCount: 340,
  },
  {
    id: 'inst_iitm',
    name: 'IIT Madras',
    location: 'Chennai, Tamil Nadu, India',
    type: 'Institute',
    departments: ['Computer Science', 'Electrical Engineering', 'Data Science & AI', 'Aerospace Engineering'],
    mentorCount: 24,
    studentCount: 420,
  },
  {
    id: 'inst_stanford',
    name: 'Stanford University',
    location: 'Stanford, California, USA',
    type: 'University',
    departments: ['Computer Science / AI Lab', 'Electrical Engineering', 'Management Science', 'Bioengineering'],
    mentorCount: 14,
    studentCount: 190,
  },
  {
    id: 'inst_nitt',
    name: 'NIT Trichy',
    location: 'Tiruchirappalli, Tamil Nadu, India',
    type: 'Institute',
    departments: ['Computer Science', 'Instrumentation & Control', 'Civil Engineering', 'Chemical Engineering'],
    mentorCount: 12,
    studentCount: 280,
  },
  {
    id: 'inst_berkeley',
    name: 'UC Berkeley',
    location: 'Berkeley, California, USA',
    type: 'University',
    departments: ['EECS', 'Data Science', 'Statistics', 'Mechanical Engineering'],
    mentorCount: 9,
    studentCount: 150,
  },
];

const INITIAL_RESPONSES: Record<string, HelpResponse[]> = {
  req_1: [
    {
      id: 'resp_1_1',
      requestId: 'req_1',
      authorId: 'user_prof_sundaram',
      authorName: 'Dr. R. Sundaram',
      authorRole: 'Professor',
      authorUniversity: 'Anna University, Chennai',
      authorDesignation: 'Senior Professor & Research Dean',
      content:
        'Welcome Arun! For M.Tech CS at CEG, admissions are primarily through TANCET and GATE scores. The general cutoff usually ranges between 58-64 percentile for GATE qualified applicants. Ensure you have your undergraduate consolidated marksheet, provisional degree, and community certificate ready. Our department also welcomes research aptitude discussions if you are applying for sponsored or research categories. Feel free to connect directly if you need syllabus clarifications!',
      createdAt: '2026-03-02T11:20:00Z',
      isAccepted: true,
      upvotes: 14,
    },
    {
      id: 'resp_1_2',
      requestId: 'req_1',
      authorId: 'user_student_karthik',
      authorName: 'Karthik Raja',
      authorRole: 'Student',
      authorUniversity: 'Anna University, Chennai',
      authorDesignation: 'Final Year B.Tech Student',
      content:
        'Hey Arun! I am currently at CEG campus. In addition to what Dr. Sundaram sir mentioned, counseling happens at the Ramanujan Computing Centre. The campus environment is great for research. I have also shared my notes on previous year entrance papers. Best of luck!',
      createdAt: '2026-03-02T14:45:00Z',
      isAccepted: false,
      upvotes: 7,
    },
  ],
  req_2: [
    {
      id: 'resp_2_1',
      requestId: 'req_2',
      authorId: 'user_prof_watson',
      authorName: 'Dr. Emily Watson',
      authorRole: 'Professor',
      authorUniversity: 'Stanford University',
      authorDesignation: 'Associate Professor',
      content:
        'Great initiative Karthik! When emailing professors for research assistantships: 1) Keep your email under 200 words. 2) Reference a specific paper published by the lab in the last 2 years and explain why that problem interests you. 3) Link a clean GitHub repo with reproducible PyTorch/TensorFlow code or benchmark results. 4) Attach a 1-page academic CV with your GPA, math background, and coding skills. Avoid generic mass emails!',
      createdAt: '2026-03-05T18:10:00Z',
      isAccepted: true,
      upvotes: 22,
    },
  ],
  req_3: [
    {
      id: 'resp_3_1',
      requestId: 'req_3',
      authorId: 'user_sponsor_senthil',
      authorName: 'Senthil Krishnaswamy',
      authorRole: 'Sponsor',
      authorUniversity: 'HelpToYou Foundation',
      authorDesignation: 'Foundation Lead & Sponsor',
      content:
        'Hello Manisha! Congratulations on scoring 94% in your 12th board exams. HelpToYou Foundation prioritizes merit-cum-means educational assistance for higher education. Please reach out with your 12th marksheet, allotment order, and income certificate. We have active donor sponsors who can sponsor your annual college tuition fees. We are here to support your engineering dreams!',
      createdAt: '2026-03-08T10:05:00Z',
      isAccepted: true,
      upvotes: 31,
    },
  ],
  req_4: [
    {
      id: 'resp_4_1',
      requestId: 'req_4',
      authorId: 'user_alumni_priya',
      authorName: 'Priya Natarajan',
      authorRole: 'Alumni',
      authorUniversity: 'IIT Madras',
      authorDesignation: 'Staff Software Architect & Mentor',
      content:
        'Here is a proven 3-month roadmap for tier-1 coding rounds: Month 1: Master Arrays, Strings, HashMaps, Two Pointers, and Binary Search (do ~50 LeetCode medium questions). Month 2: Trees, Graphs (BFS/DFS, Topological Sort), and Priority Queues. Month 3: Dynamic Programming (0/1 Knapsack, Longest Common Subsequence) and Mock Interviews on Pramp. Focus on explaining your time and space complexity out loud!',
      createdAt: '2026-03-11T16:40:00Z',
      isAccepted: true,
      upvotes: 18,
    },
  ],
};

const INITIAL_REQUESTS: HelpRequest[] = [
  {
    id: 'req_1',
    title: 'Guidance needed for Anna University CEG M.Tech Admission & Interview Process',
    description:
      'Hi professors and seniors! I am applying for M.Tech in Computer Science at College of Engineering Guindy (Anna University). Could someone explain what the cutoff trends are like, what documents are required during counseling, and how faculty interviews are conducted? Any advice would help me tremendously!',
    category: 'Admissions',
    university: 'Anna University, Chennai',
    department: 'Computer Science & Engineering',
    authorId: 'user_aspirant_arun',
    authorName: 'Arun Kumar',
    authorRole: 'Student',
    authorUniversity: 'Anna University, Chennai',
    authorDesignation: 'M.Tech Aspirant (Applying)',
    urgency: 'High',
    status: 'open',
    createdAt: '2026-03-02T09:30:00Z',
    responseCount: 2,
    upvotes: 19,
    tags: ['Admissions', 'M.Tech', 'CEG Guindy', 'Counseling', 'Anna University'],
  },
  {
    id: 'req_2',
    title: 'How to apply for undergraduate research assistantship in AI / Machine Learning?',
    description:
      'I am an engineering student interested in doing a summer research assistantship in deep learning. What is the right protocol to approach faculty via email? What should my portfolio or GitHub code samples include to stand out?',
    category: 'Research',
    university: 'Stanford University',
    department: 'School of Engineering / AI Lab',
    authorId: 'user_student_karthik',
    authorName: 'Karthik Raja',
    authorRole: 'Student',
    authorUniversity: 'Anna University, Chennai',
    authorDesignation: 'Final Year B.Tech Student',
    urgency: 'Medium',
    status: 'in_progress',
    createdAt: '2026-03-05T15:00:00Z',
    responseCount: 1,
    upvotes: 25,
    tags: ['Research', 'Machine Learning', 'Stanford AI', 'Cold Emailing'],
  },
  {
    id: 'req_3',
    title: 'Underprivileged student seeking engineering college fee sponsorship & scholarship aid',
    description:
      'My family is facing financial hardship, but I scored 94% in 12th board exams and got merit allotment for B.E. Computer Science. Looking for verified trust / NGO educational sponsorship to support my first year tuition and book fees.',
    category: 'Scholarships',
    university: 'Anna University, Chennai',
    department: 'Computer Science',
    authorId: 'user_aspirant_manisha',
    authorName: 'Manisha S.',
    authorRole: 'Applicant',
    authorUniversity: 'Anna University, Chennai',
    authorDesignation: 'Merit Allotted B.E. Student',
    urgency: 'High',
    status: 'open',
    createdAt: '2026-03-08T08:15:00Z',
    responseCount: 1,
    upvotes: 35,
    tags: ['Scholarships', 'Tuition Aid', 'HelpToYou', 'Merit Student'],
  },
  {
    id: 'req_4',
    title: 'Tips for cracking campus placement coding round for tier-1 tech companies',
    description:
      'Need recommendations for Data Structures & Algorithms preparation timeline for 3rd and final year students. What topics are most frequently asked in product company rounds?',
    category: 'Career Guidance',
    university: 'IIT Madras',
    department: 'Computer Science',
    authorId: 'user_student_vignesh',
    authorName: 'Vignesh P.',
    authorRole: 'Student',
    authorUniversity: 'IIT Madras',
    authorDesignation: 'Pre-final Year B.Tech',
    urgency: 'Medium',
    status: 'resolved',
    createdAt: '2026-03-11T12:00:00Z',
    responseCount: 1,
    upvotes: 21,
    tags: ['Placements', 'DSA', 'Tech Careers', 'Coding Interview'],
  },
  {
    id: 'req_5',
    title: 'Syllabus & recommended textbooks for 4th Semester Distributed Systems',
    description:
      'Could any senior or professor recommend the best reference books and online lectures for Distributed Systems and Cloud Computing as per the current university regulation?',
    category: 'Syllabus & Exam',
    university: 'Anna University, Chennai',
    department: 'Information Technology',
    authorId: 'user_aspirant_arun',
    authorName: 'Arun Kumar',
    authorRole: 'Student',
    authorUniversity: 'Anna University, Chennai',
    authorDesignation: 'M.Tech Aspirant (Applying)',
    urgency: 'Low',
    status: 'open',
    createdAt: '2026-03-14T10:00:00Z',
    responseCount: 0,
    upvotes: 8,
    tags: ['Syllabus', 'Distributed Systems', 'Books', 'Anna University'],
  },
];

const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: 'conn_1',
    fromUserId: 'user_student_karthik',
    toUserId: 'user_prof_sundaram',
    status: 'accepted',
    message: 'Respected Sir, seeking your guidance on PG research topics.',
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'conn_2',
    fromUserId: 'user_aspirant_arun',
    toUserId: 'user_student_karthik',
    status: 'accepted',
    message: 'Hi Karthik, wanted to ask about hostel facilities and entrance prep.',
    createdAt: '2026-03-02T16:00:00Z',
  },
];

class DatabaseService {
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const seeded = await AsyncStorage.getItem(STORAGE_KEYS.SEEDED);
      if (!seeded) {
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
        await AsyncStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(INITIAL_RESPONSES));
        await AsyncStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(INITIAL_INSTITUTIONS));
        await AsyncStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(INITIAL_CONNECTIONS));
        await AsyncStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
      }
      const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        const parsedUsers: (User & { passwordHash?: string })[] = JSON.parse(storedUsers);
        if (parsedUsers.some((user) => user.passwordHash !== undefined)) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.USERS,
            JSON.stringify(parsedUsers.map(({ passwordHash, ...user }) => user)),
          );
        }
      }
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
    if (!data) return INITIAL_USERS;
    return JSON.parse(data);
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
    let requests: HelpRequest[] = data ? JSON.parse(data) : [...INITIAL_REQUESTS];

    // Load responses map to populate counts and sub-threads
    const respData = await AsyncStorage.getItem(STORAGE_KEYS.RESPONSES);
    const responsesMap: Record<string, HelpResponse[]> = respData ? JSON.parse(respData) : INITIAL_RESPONSES;

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
    const requests: HelpRequest[] = data ? JSON.parse(data) : [...INITIAL_REQUESTS];

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
      upvotes: 1,
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
    const responsesMap: Record<string, HelpResponse[]> = respData ? JSON.parse(respData) : { ...INITIAL_RESPONSES };

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
      isAccepted: false,
      upvotes: 0,
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

    // Increment author helpedCount
    await this.incrementHelpedCount(payload.author.id);

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

  private async incrementHelpedCount(userId: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) return;
      const users: User[] = JSON.parse(data);
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        users[idx].helpedCount = (users[idx].helpedCount || 0) + 1;
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    } catch {
      // ignore
    }
  }

  // --- INSTITUTIONS & MENTORS ---
  public async getInstitutions(): Promise<Institution[]> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
    return data ? JSON.parse(data) : INITIAL_INSTITUTIONS;
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
    const list: Connection[] = data ? JSON.parse(data) : INITIAL_CONNECTIONS;
    return list.filter((c) => c.fromUserId === userId || c.toUserId === userId);
  }

  public async connectWithUser(fromUserId: string, toUserId: string, message?: string): Promise<Connection> {
    await this.init();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    const list: Connection[] = data ? JSON.parse(data) : [...INITIAL_CONNECTIONS];

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
    await AsyncStorage.removeItem(STORAGE_KEYS.SEEDED);
    this.initialized = false;
    await this.init();
  }
}

export const db = new DatabaseService();
