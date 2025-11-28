// Tipos de usuario
export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
}

// Tipos de sección
export enum SectionName {
  BLANDAS = 'blandas',
  ADAPTATIVAS = 'adaptativas',
  TECNOLOGICAS = 'tecnologicas',
}

// Tipos de pregunta
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SCALE = 'scale',
  TEXT = 'text',
}

// Estados de evaluación
export enum EvaluationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// Niveles de evaluación
export enum EvaluationLevel {
  MUY_BAJO = 'muy_bajo',
  BAJO = 'bajo',
  INTERMEDIO = 'intermedio',
  ALTO = 'alto',
  MUY_ALTO = 'muy_alto',
}

// Interfaces de usuario
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  career?: string;
  course?: string;
  parallel?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  career?: string;
  course?: string;
  parallel?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Interfaces de sección
export interface Section {
  _id: string;
  name: SectionName;
  displayName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de cuestionario
export interface Questionnaire {
  _id: string;
  sectionId: string | Section;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de pregunta
export interface Question {
  _id: string;
  questionnaireId: string | Questionnaire;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: any;
  minScale?: number; // Valor mínimo de la escala para preguntas tipo scale
  maxScale?: number; // Valor máximo de la escala para preguntas tipo scale
  points: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de evaluación
export interface Evaluation {
  _id: string;
  userId: string | User;
  sectionId: string | Section;
  status: EvaluationStatus;
  totalScore?: number;
  maxScore?: number;
  level?: EvaluationLevel;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationWithAnswers extends Evaluation {
  answers?: Answer[];
}

// Interfaces de respuesta
export interface Answer {
  _id: string;
  evaluationId: string | Evaluation;
  questionId: string | Question;
  value: any;
  score?: number;
  createdAt: string;
}

// DTOs para envío de datos
export interface SubmitAnswerDto {
  questionId: string;
  value: string | number;
}

// Interfaces de configuración
export interface EvaluationConfig {
  _id: string;
  sectionId: string | Section;
  muyBajo: { min: number; max: number };
  bajo: { min: number; max: number };
  intermedio: { min: number; max: number };
  alto: { min: number; max: number };
  muyAlto: { min: number; max: number };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de reportes
export interface ProgressPanel {
  totalEvaluations: number;
  completedEvaluations: number;
  inProgressEvaluations: number;
}

export interface SectionDistribution {
  sectionName: string;
  levels: {
    muy_bajo?: number;
    bajo?: number;
    intermedio?: number;
    alto?: number;
    muy_alto?: number;
  };
}

export interface LevelsDistribution {
  sections: SectionDistribution[];
}

export interface SectionResult {
  sectionName: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: EvaluationLevel;
}

export interface IndividualReport {
  evaluation: Evaluation;
  sections: SectionResult[];
  totalScore: number;
  totalMaxScore: number;
  overallLevel: EvaluationLevel;
}

// Tipos para respuestas de API
export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface ApiErrorResponse {
  response?: {
    data?: ApiError;
  };
  message?: string;
}
