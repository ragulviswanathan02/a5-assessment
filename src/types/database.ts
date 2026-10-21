export type QuestionType = 'single_choice' | 'multiple_choice' | 'text_input';

export type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'dropdown';

export interface FormField {
  id: string;
  paper_id: string;
  field_key: string;
  label: string;
  field_type: FormFieldType;
  options: string[]; // Options list if dropdown
  is_required: boolean;
  order_index: number;
  created_at?: string;
}

export interface Question {
  id: string;
  paper_id: string;
  question_text: string;
  question_type: QuestionType;
  topic: string;
  options: string[]; // For single_choice and multiple_choice
  correct_answers: (number | string)[]; // array of indices for choice, array of strings for typing
  marks: number;
  negative_marks: number;
  explanation?: string;
  order_index: number;
  created_at?: string;
}

export interface Paper {
  id: string;
  title: string;
  description: string;
  duration_minutes: number; // 0 for no limit
  is_active: boolean;
  show_results_immediately: boolean;
  track_tab_switches: boolean;
  created_at?: string;
  updated_at?: string;
  form_fields?: FormField[];
  questions?: Question[];
  _count?: {
    questions?: number;
    submissions?: number;
  };
}

export interface TopicScore {
  scored: number;
  total: number;
  percentage: number;
}

export interface Submission {
  id: string;
  paper_id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  student_college: string;
  student_data: Record<string, string | number>;
  answers: Record<string, any>;
  total_score: number;
  max_score: number;
  percentage: number;
  topic_scores: Record<string, TopicScore>;
  tab_switch_count: number;
  time_taken_seconds: number;
  submitted_at: string;
  paper?: Paper;
}
