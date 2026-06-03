export type ResourceCategory = "course-material" | "lab-manual" | "project" | "placement" | "other";
export type ResourceFileType = "PDF" | "ZIP" | "Link" | "GitHub" | "Drive";

export interface Resource {
  _id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  tags: string[];
  url: string;
  courseCode: string; // e.g. MA-101, CS-201, ME-201
  courseName: string; // e.g. Calculus, Data Structures, Thermodynamics
  semester: number; // 1-8
  fileType: ResourceFileType;
  fileSize?: string;
  uploadedBy: {
    name: string;
    avatar?: string;
    role?: string;
  };
  downloadsCount: number;
  upvotesCount: number;
  createdAt: string;
}

export const initialResources: Resource[] = [
  {
    _id: "res-ma101-1",
    title: "Calculus (MA-101) Complete Lecture Notes",
    description: "Handwritten comprehensive notes covering limits, derivatives, integration, and multivariate calculus, matching the first-semester syllabus.",
    category: "course-material",
    tags: ["calculus", "notes", "math", "first-year"],
    url: "https://drive.google.com/drive/folders/sample-ma101",
    courseCode: "MA-101",
    courseName: "Calculus",
    semester: 1,
    fileType: "Drive",
    fileSize: "Folder (45 MB)",
    uploadedBy: {
      name: "Prof. R. Sharma (Dept of Math)",
      role: "Faculty",
    },
    downloadsCount: 142,
    upvotesCount: 38,
    createdAt: "2026-01-15T09:30:00Z",
  },
  {
    _id: "res-ma201-1",
    title: "Linear Algebra & Complex Analysis Formula Cheatsheet",
    description: "A quick 4-page reference sheet with all important equations, eigenvalues, Taylor series, and residue theorems for mid-sems and end-sems.",
    category: "course-material",
    tags: ["cheatsheet", "formulas", "linear-algebra", "complex-analysis"],
    url: "https://example.com/resources/ma201-cheatsheet.pdf",
    courseCode: "MA-201",
    courseName: "Linear Algebra & Complex Analysis",
    semester: 3,
    fileType: "PDF",
    fileSize: "1.2 MB",
    uploadedBy: {
      name: "Aaditya Patel",
      role: "admin",
    },
    downloadsCount: 310,
    upvotesCount: 74,
    createdAt: "2026-02-10T14:15:00Z",
  },
  {
    _id: "res-cs201-1",
    title: "Data Structures & Algorithms - Lab Manual & Solutions",
    description: "Contains all problem statements and optimized C++ templates for Stack, Queue, BST, Heap, and Graph algorithms from CS-201 lab sessions.",
    category: "lab-manual",
    tags: ["dsa", "cpp", "lab-manual", "graphs", "trees"],
    url: "https://github.com/iitdh-student-hub/cs201-dsa-labs",
    courseCode: "CS-201",
    courseName: "Data Structures and Algorithms",
    semester: 3,
    fileType: "GitHub",
    fileSize: "Repo (2.4 MB)",
    uploadedBy: {
      name: "Aditi Iyer",
      role: "admin",
    },
    downloadsCount: 185,
    upvotesCount: 52,
    createdAt: "2026-03-01T11:00:00Z",
  },
  {
    _id: "res-cs301-1",
    title: "Machine Learning (CS-301) Course Project: Sentiment Analyzer",
    description: "End-to-end Python code using PyTorch and HuggingFace Transformers for fine-tuning DistilBERT on student feedback datasets. Includes training logs.",
    category: "project",
    tags: ["ml", "nlp", "pytorch", "bert", "python"],
    url: "https://github.com/iitdh-student-hub/student-sentiment-bert",
    courseCode: "CS-301",
    courseName: "Introduction to Machine Learning",
    semester: 5,
    fileType: "GitHub",
    fileSize: "Repo",
    uploadedBy: {
      name: "Rahul Verma",
      role: "student",
    },
    downloadsCount: 94,
    upvotesCount: 29,
    createdAt: "2026-04-18T18:45:00Z",
  },
  {
    _id: "res-ee101-1",
    title: "Basic Electrical Systems (EE-101) Solved Previous Year Question Papers",
    description: "Step-by-step solutions for End-Semester papers from 2022, 2023, and 2024. Ideal for practicing circuit analysis and AC networks.",
    category: "course-material",
    tags: ["pyq", "solved-papers", "circuits", "first-year"],
    url: "https://example.com/resources/ee101-pyqs.pdf",
    courseCode: "EE-101",
    courseName: "Introduction to Electrical Systems",
    semester: 1,
    fileType: "PDF",
    fileSize: "4.8 MB",
    uploadedBy: {
      name: "Vikram Malhotra",
      role: "admin",
    },
    downloadsCount: 220,
    upvotesCount: 65,
    createdAt: "2025-11-20T10:00:00Z",
  },
  {
    _id: "res-ee204-1",
    title: "Signals and Systems MATLAB Simulation Lab Report",
    description: "MATLAB scripts and fully completed reports for Fourier transform simulations, filter designs, and convolution operations.",
    category: "lab-manual",
    tags: ["matlab", "signals", "fourier", "simulation"],
    url: "https://example.com/resources/ee204-matlab-lab.zip",
    courseCode: "EE-204",
    courseName: "Signals and Systems",
    semester: 4,
    fileType: "ZIP",
    fileSize: "8.5 MB",
    uploadedBy: {
      name: "Sneha Nair",
      role: "student",
    },
    downloadsCount: 78,
    upvotesCount: 17,
    createdAt: "2026-03-22T16:30:00Z",
  },
  {
    _id: "res-me201-1",
    title: "Thermodynamics (ME-201) Practice Problems & Solutions",
    description: "Comprehensive problem set with detailed hand-worked solutions for energy balances, heat engines, entropy, and cycle analyses.",
    category: "course-material",
    tags: ["thermodynamics", "solved-problems", "physics", "entropy"],
    url: "https://example.com/resources/me201-thermo-problems.pdf",
    courseCode: "ME-201",
    courseName: "Thermodynamics",
    semester: 3,
    fileType: "PDF",
    fileSize: "3.5 MB",
    uploadedBy: {
      name: "Dr. Amit Patwardhan",
      role: "Faculty",
    },
    downloadsCount: 112,
    upvotesCount: 41,
    createdAt: "2026-02-28T10:00:00Z",
  },
  {
    _id: "res-placement-1",
    title: "Technical Interview Prep Guide - IIT Dharwad Placement Cell",
    description: "Curated compilation of interview questions asked by visiting companies (Google, Microsoft, Sprinklr, etc.) at IIT Dharwad. Covers DSA, System Design, and OS.",
    category: "placement",
    tags: ["placement-prep", "interview-questions", "dsa", "resume"],
    url: "https://drive.google.com/file/d/sample-placement-guide/view",
    courseCode: "PLACEMENTS",
    courseName: "Placement and Internship Prep",
    semester: 7,
    fileType: "Drive",
    fileSize: "1.5 MB",
    uploadedBy: {
      name: "Placement Cell Admin",
      role: "admin",
    },
    downloadsCount: 512,
    upvotesCount: 145,
    createdAt: "2025-08-01T08:00:00Z",
  },
  {
    _id: "res-hs102-1",
    title: "Professional Communication (HS-102) Presentation Template",
    description: "A professional and modern Google Slides template aligned with the guidelines of HS-102 course for semester presentation assignments.",
    category: "other",
    tags: ["presentation", "template", "slides", "first-year"],
    url: "https://docs.google.com/presentation/d/sample-hs102-template/edit",
    courseCode: "HS-102",
    courseName: "Professional Communication",
    semester: 2,
    fileType: "Link",
    fileSize: "Web Link",
    uploadedBy: {
      name: "Karan Johar",
      role: "student",
    },
    downloadsCount: 65,
    upvotesCount: 12,
    createdAt: "2026-01-25T13:20:00Z",
  }
];
