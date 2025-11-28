// Endpoints de la API
export const API_ENDPOINTS = {
  // Auth
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },
  // Users
  users: {
    profile: '/users/profile',
    list: '/users',
    students: '/users/students',
    byId: (id: string) => `/users/${id}`,
  },
  // Sections
  sections: {
    list: '/sections',
    active: '/sections/active',
    byId: (id: string) => `/sections/${id}`,
    create: '/sections',
    update: (id: string) => `/sections/${id}`,
    toggleActive: (id: string) => `/sections/${id}/toggle-active`,
    delete: (id: string) => `/sections/${id}`,
  },
  // Questionnaires
  questionnaires: {
    list: '/questionnaires',
    active: '/questionnaires/active',
    byId: (id: string) => `/questionnaires/${id}`,
    create: '/questionnaires',
    update: (id: string) => `/questionnaires/${id}`,
    toggleActive: (id: string) => `/questionnaires/${id}/toggle-active`,
    delete: (id: string) => `/questionnaires/${id}`,
  },
  // Questions
  questions: {
    list: '/questions',
    byId: (id: string) => `/questions/${id}`,
    create: '/questions',
    bulkCreate: '/questions/bulk',
    update: (id: string) => `/questions/${id}`,
    reorder: '/questions/reorder',
    toggleActive: (id: string) => `/questions/${id}/toggle-active`,
    delete: (id: string) => `/questions/${id}`,
  },
  // Evaluation Config
  evaluationConfig: {
    list: '/evaluation-config',
    byId: (id: string) => `/evaluation-config/${id}`,
    create: '/evaluation-config',
    update: (id: string) => `/evaluation-config/${id}`,
    toggleActive: (id: string) => `/evaluation-config/${id}/toggle-active`,
    delete: (id: string) => `/evaluation-config/${id}`,
  },
  // Evaluations
  evaluations: {
    create: '/evaluations',
    start: (id: string) => `/evaluations/${id}/start`,
    submitAnswer: (id: string) => `/evaluations/${id}/answers`,
    complete: (id: string) => `/evaluations/${id}/complete`,
    list: '/evaluations',
    byId: (id: string) => `/evaluations/${id}`,
  },
  // Reports
  reports: {
    individual: '/reports/individual',
    individualById: (id: string) => `/reports/individual/${id}`,
    groupByCareer: '/reports/group/career',
    groupByCourse: '/reports/group/course',
    progress: '/reports/progress',
    levelsDistribution: '/reports/levels-distribution',
  },
  // Upload
  upload: {
    questions: '/upload/questions',
    formatInfo: '/upload/format-info',
  },
} as const;

