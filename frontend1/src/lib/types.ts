export type QuestionType = "text" | "multiple_choice" | "checkbox" | "rating";
export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  condition?: { question_id: string; value: string } | null;
};
export type Survey = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  status: "draft" | "published";
  questions: Question[];
  response_count?: number;
  updated_at: string;
};
export type Dashboard = {
  total_surveys: number;
  active_surveys: number;
  total_responses: number;
  recent_surveys: Survey[];
};
export type AnalyticsQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  answered: number;
  options?: { option: string; count: number; percentage: number }[];
  average?: number | null;
  ratings?: { rating: number; count: number }[];
  answers?: string[];
};
export type Analytics = {
  survey: Survey;
  total_responses: number;
  questions: AnalyticsQuestion[];
};
