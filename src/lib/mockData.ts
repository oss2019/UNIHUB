export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "student" | "alumni" | "faculty" | "admin";
  branch?: string;
  graduationYear?: number;
  bio?: string;
  joinedSubForums: string[];
  mutedSubForums: string[];
};

export type Subforum = {
  id: string;
  forumId: string;
  name: string;
  description: string;
  tags: string[];
  members: number;
  threadCount: number;
  activeNow: number;
};

export type Forum = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string; // emoji
  type: "academic" | "club" | "collab" | "general";
  members: number;
  threadCount: number;
  subforums: Subforum[];
};

export type Comment = {
  id: string;
  threadId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  votes: number;
  replies: Comment[];
};

export type Thread = {
  id: string;
  forumId: string;
  subforumId: string;
  title: string;
  excerpt: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: User["role"];
  createdAt: string;
  views: number;
  replies: number;
  likes: number;
  tags: string[];
  isPinned?: boolean;
  isSolved?: boolean;
};

export type Notification = {
  id: string;
  type: "reply" | "mention" | "system" | "join";
  message: string;
  sender?: string;
  threadId?: string;
  isRead: boolean;
  createdAt: string;
};

export const currentUser: User = {
  id: "u_me",
  name: "Aarav Sharma",
  email: "210010001@iitdh.ac.in",
  role: "student",
  branch: "Computer Science",
  graduationYear: 2025,
  bio: "Building things at IIT Dharwad. Open source enthusiast.",
  joinedSubForums: ["sf_cs_dsa", "sf_culture_music", "sf_collab_web"],
  mutedSubForums: [],
};

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();

export const forums: Forum[] = [
  {
    id: "f_academics",
    slug: "academics",
    name: "Academics",
    description: "Courses, professors, exams, and study material across all departments.",
    icon: "📚",
    type: "academic",
    members: 2840,
    threadCount: 1284,
    subforums: [
      {
        id: "sf_cs_dsa",
        forumId: "f_academics",
        name: "CS · Data Structures",
        description: "Notes, doubts, and past papers for DSA.",
        tags: ["cs", "dsa", "exam"],
        members: 612,
        threadCount: 184,
        activeNow: 24,
      },
      {
        id: "sf_ee_signals",
        forumId: "f_academics",
        name: "EE · Signals & Systems",
        description: "Fourier, Laplace, and life.",
        tags: ["ee", "signals"],
        members: 318,
        threadCount: 92,
        activeNow: 8,
      },
      {
        id: "sf_me_thermo",
        forumId: "f_academics",
        name: "ME · Thermodynamics",
        description: "Entropy is high here.",
        tags: ["me", "thermo"],
        members: 244,
        threadCount: 71,
        activeNow: 5,
      },
    ],
  },
  {
    id: "f_culture",
    slug: "culture",
    name: "Culture & Clubs",
    description: "Music, drama, dance, lit, photography — everything beyond the syllabus.",
    icon: "🎭",
    type: "club",
    members: 1920,
    threadCount: 612,
    subforums: [
      {
        id: "sf_culture_music",
        forumId: "f_culture",
        name: "Music Club",
        description: "Jam sessions, gear talk, originals.",
        tags: ["music", "jam"],
        members: 412,
        threadCount: 128,
        activeNow: 12,
      },
      {
        id: "sf_culture_drama",
        forumId: "f_culture",
        name: "Drama Society",
        description: "Auditions, rehearsals, scripts.",
        tags: ["drama", "theatre"],
        members: 198,
        threadCount: 64,
        activeNow: 3,
      },
    ],
  },
  {
    id: "f_collab",
    slug: "collab",
    name: "Collab & Projects",
    description: "Find teammates for hackathons, research, and side projects.",
    icon: "🛠️",
    type: "collab",
    members: 1432,
    threadCount: 488,
    subforums: [
      {
        id: "sf_collab_web",
        forumId: "f_collab",
        name: "Web & Mobile",
        description: "Frontend, backend, mobile builders.",
        tags: ["web", "react", "mobile"],
        members: 386,
        threadCount: 142,
        activeNow: 18,
      },
      {
        id: "sf_collab_ml",
        forumId: "f_collab",
        name: "ML & Research",
        description: "Papers, datasets, GPU sharing.",
        tags: ["ml", "ai", "research"],
        members: 274,
        threadCount: 96,
        activeNow: 11,
      },
      {
        id: "sf_collab_hw",
        forumId: "f_collab",
        name: "Hardware & Robotics",
        description: "PCBs, sensors, actuators.",
        tags: ["hw", "robotics"],
        members: 162,
        threadCount: 58,
        activeNow: 4,
      },
    ],
  },
  {
    id: "f_campus",
    slug: "campus",
    name: "Campus Life",
    description: "Mess, hostel, sports, lost & found, general chatter.",
    icon: "🏛️",
    type: "general",
    members: 3120,
    threadCount: 2104,
    subforums: [
      {
        id: "sf_campus_mess",
        forumId: "f_campus",
        name: "Mess & Food",
        description: "Today's menu, complaints, recipes.",
        tags: ["mess", "food"],
        members: 1840,
        threadCount: 612,
        activeNow: 41,
      },
      {
        id: "sf_campus_lost",
        forumId: "f_campus",
        name: "Lost & Found",
        description: "Lost a charger? Found an ID card?",
        tags: ["lost", "found"],
        members: 920,
        threadCount: 384,
        activeNow: 7,
      },
    ],
  },
];

export const threads: Thread[] = [
  {
    id: "t_1",
    forumId: "f_academics",
    subforumId: "sf_cs_dsa",
    title: "Best resources for graph algorithms before midsem?",
    excerpt: "Looking for problem sets and lecture notes that go beyond CLRS basics...",
    content:
      "Midsem is in 10 days and graphs feel shaky. I've done CLRS chapters but want practice problems with editorials. Anyone has a curated list? Especially for DSU, MST, and shortest paths.",
    authorId: "u_2",
    authorName: "Priya Nair",
    authorRole: "student",
    createdAt: ago(42),
    views: 412,
    replies: 18,
    likes: 34,
    tags: ["dsa", "graphs", "midsem"],
    isPinned: true,
  },
  {
    id: "t_2",
    forumId: "f_academics",
    subforumId: "sf_cs_dsa",
    title: "Prof. Rao's grading rubric for assignment 3",
    excerpt: "Anyone got clarity on how partial marks work for the segment tree problem?",
    content: "Submitted my solution but the test cases were ambiguous. Sharing my approach — would love feedback.",
    authorId: "u_3",
    authorName: "Karthik Reddy",
    authorRole: "student",
    createdAt: ago(180),
    views: 220,
    replies: 9,
    likes: 12,
    tags: ["assignment", "grading"],
  },
  {
    id: "t_3",
    forumId: "f_culture",
    subforumId: "sf_culture_music",
    title: "Open jam this Friday at OAT — bring your gear 🎸",
    excerpt: "Hosting an open jam on Friday 7pm. All levels welcome.",
    content: "We'll have a basic PA, two guitars, a cajon. Bring whatever you play. Originals and covers both encouraged.",
    authorId: "u_4",
    authorName: "Ishaan Mehta",
    authorRole: "student",
    createdAt: ago(95),
    views: 318,
    replies: 24,
    likes: 56,
    tags: ["jam", "event"],
    isPinned: true,
  },
  {
    id: "t_4",
    forumId: "f_collab",
    subforumId: "sf_collab_web",
    title: "Looking for a backend dev for Smart India Hackathon team",
    excerpt: "We have frontend + ML covered. Need someone strong with Node/Postgres.",
    content: "Problem statement is in the agritech category. Team of 4 confirmed, looking for one more. DM if interested.",
    authorId: "u_5",
    authorName: "Sneha Iyer",
    authorRole: "student",
    createdAt: ago(20),
    views: 148,
    replies: 11,
    likes: 22,
    tags: ["sih", "hackathon", "backend"],
  },
  {
    id: "t_5",
    forumId: "f_collab",
    subforumId: "sf_collab_ml",
    title: "GPU credits pool — anyone interested?",
    excerpt: "Thinking of pooling Lambda Labs credits for a small group.",
    content: "If 5-6 people pitch in, we can get a sustained A100 for a month. Useful for thesis-scale runs.",
    authorId: "u_6",
    authorName: "Rohan Gupta",
    authorRole: "student",
    createdAt: ago(310),
    views: 96,
    replies: 6,
    likes: 14,
    tags: ["gpu", "ml", "research"],
  },
  {
    id: "t_6",
    forumId: "f_campus",
    subforumId: "sf_campus_mess",
    title: "Mess feedback — week 3 menu rotation",
    excerpt: "The new south Indian breakfast rotation is genuinely good. Credit where it's due.",
    content: "Idli sambar on Tuesday and pongal on Thursday hit the spot. Can we make this permanent?",
    authorId: "u_7",
    authorName: "Anjali Verma",
    authorRole: "student",
    createdAt: ago(60),
    views: 482,
    replies: 32,
    likes: 78,
    tags: ["mess", "feedback"],
  },
  {
    id: "t_7",
    forumId: "f_campus",
    subforumId: "sf_campus_lost",
    title: "Found: black Sony WH-1000XM4 near LH-1",
    excerpt: "Picked up at the bench outside LH-1 around 6pm. DM with serial last 4 digits.",
    content: "Will hand over after verification. Bring your ID.",
    authorId: "u_8",
    authorName: "Devansh Kapoor",
    authorRole: "student",
    createdAt: ago(8),
    views: 84,
    replies: 3,
    likes: 18,
    tags: ["found", "headphones"],
  },
];

export const commentsByThread: Record<string, Comment[]> = {
  t_1: [
    {
      id: "c_1",
      threadId: "t_1",
      parentId: null,
      authorId: "u_9",
      authorName: "Vivek Joshi",
      content: "CP-Algorithms site is gold for graphs. Pair it with Codeforces EDU.",
      createdAt: ago(38),
      votes: 14,
      replies: [
        {
          id: "c_1_1",
          threadId: "t_1",
          parentId: "c_1",
          authorId: "u_2",
          authorName: "Priya Nair",
          content: "Thanks! Already started the EDU section. Any specific contests you'd recommend?",
          createdAt: ago(30),
          votes: 4,
          replies: [],
        },
      ],
    },
    {
      id: "c_2",
      threadId: "t_1",
      parentId: null,
      authorId: "u_10",
      authorName: "Meera Joshi",
      authorAvatar: undefined,
      content: "I have a notion doc with editorials sorted by topic. Sharing in the subforum chat.",
      createdAt: ago(20),
      votes: 9,
      replies: [],
    },
  ],
  t_4: [
    {
      id: "c_4_1",
      threadId: "t_4",
      parentId: null,
      authorId: "u_me",
      authorName: "Aarav Sharma",
      content: "I'm in. Built a few APIs in Node + Postgres last sem. DMing you.",
      createdAt: ago(12),
      votes: 6,
      replies: [],
    },
  ],
};

export const notifications: Notification[] = [
  {
    id: "n_1",
    type: "reply",
    sender: "Vivek Joshi",
    message: "replied to your thread about graph algorithms",
    threadId: "t_1",
    isRead: false,
    createdAt: ago(8),
  },
  {
    id: "n_2",
    type: "mention",
    sender: "Sneha Iyer",
    message: "mentioned you in 'Looking for a backend dev'",
    threadId: "t_4",
    isRead: false,
    createdAt: ago(25),
  },
  {
    id: "n_3",
    type: "system",
    message: "Welcome to PeerHive! Join a few subforums to personalize your feed.",
    isRead: true,
    createdAt: ago(60 * 24),
  },
];

export const resources = [
  { id: "r1", title: "DSA Cheatsheet — IIT Dh edition", category: "Academics", author: "CS Society", downloads: 1284 },
  { id: "r2", title: "PoR essay templates 2024", category: "Career", author: "Alumni Cell", downloads: 612 },
  { id: "r3", title: "Hostel survival guide for freshers", category: "Campus", author: "Student Council", downloads: 2104 },
  { id: "r4", title: "Open-source contributions starter pack", category: "Career", author: "OSS Club", downloads: 488 },
  { id: "r5", title: "Mess menu archive (2023-24)", category: "Campus", author: "Mess Committee", downloads: 320 },
  { id: "r6", title: "ML reading list — beginner to advanced", category: "Academics", author: "AI Group", downloads: 942 },
];

export const events = [
  { id: "e1", title: "Open Mic Night", date: "2026-04-25", time: "7:00 PM", location: "OAT", category: "Culture" },
  { id: "e2", title: "Smart India Hackathon — internal round", date: "2026-04-28", time: "9:00 AM", location: "Auditorium", category: "Tech" },
  { id: "e3", title: "Inter-hostel Football Finals", date: "2026-05-02", time: "5:00 PM", location: "Sports Ground", category: "Sports" },
  { id: "e4", title: "Alumni Talk — Life after IIT Dh", date: "2026-05-05", time: "6:30 PM", location: "Lecture Hall 1", category: "Career" },
];
