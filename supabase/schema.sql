-- ========================================================
-- ASSESSMENT PLATFORM SCHEMA (SUPABASE POSTGRESQL)
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ========================================================

-- 1. Create Papers Table
CREATE TABLE IF NOT EXISTS public.papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    track_tab_switches BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Dynamic Registration Form Fields Table
CREATE TABLE IF NOT EXISTS public.form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'email', 'tel', 'number', 'dropdown'
    options JSONB DEFAULT '[]'::jsonb, -- Array of strings for dropdown
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Questions Table
-- Types: 'single_choice' (Radio), 'multiple_choice' (Checkbox), 'text_input' (Typing)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'single_choice', -- 'single_choice', 'multiple_choice', 'text_input'
    topic TEXT NOT NULL DEFAULT 'General',
    options JSONB DEFAULT '[]'::jsonb, -- array of options for choice questions
    correct_answers JSONB DEFAULT '[]'::jsonb, -- array of index numbers for choice or accepted strings for typing
    marks NUMERIC DEFAULT 1 NOT NULL,
    negative_marks NUMERIC DEFAULT 0 NOT NULL,
    explanation TEXT DEFAULT '',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Student Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT DEFAULT '',
    student_phone TEXT DEFAULT '',
    student_college TEXT DEFAULT '',
    student_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score NUMERIC NOT NULL DEFAULT 0,
    max_score NUMERIC NOT NULL DEFAULT 0,
    percentage NUMERIC NOT NULL DEFAULT 0,
    topic_scores JSONB DEFAULT '{}'::jsonb,
    tab_switch_count INTEGER DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS) & Grant Access for Anon Key
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (policies for development & testing with anon key)
DROP POLICY IF EXISTS "Public access for papers" ON public.papers;
CREATE POLICY "Public access for papers" ON public.papers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for form_fields" ON public.form_fields;
CREATE POLICY "Public access for form_fields" ON public.form_fields FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for questions" ON public.questions;
CREATE POLICY "Public access for questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for submissions" ON public.submissions;
CREATE POLICY "Public access for submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- 6. Insert Starter Paper with Default Form Fields & Questions
-- ========================================================
DO $$
DECLARE
    new_paper_id UUID := gen_random_uuid();
BEGIN
    -- Check if any paper exists
    IF NOT EXISTS (SELECT 1 FROM public.papers LIMIT 1) THEN
        -- Insert Demo Paper
        INSERT INTO public.papers (id, title, description, duration_minutes, is_active, show_results_immediately, track_tab_switches)
        VALUES (
            new_paper_id,
            'A5 Placement Assessment (Technical & Aptitude)',
            'Please fill in your accurate personal details before commencing the test. The test contains single choice, multi-select, and short typing questions.',
            20,
            true,
            true,
            true
        );

        -- Insert Default Form Fields
        INSERT INTO public.form_fields (paper_id, field_key, label, field_type, options, is_required, order_index)
        VALUES
        (new_paper_id, 'full_name', 'Full Name', 'text', '[]'::jsonb, true, 1),
        (new_paper_id, 'email', 'Email Address', 'email', '[]'::jsonb, true, 2),
        (new_paper_id, 'phone', 'Phone Number', 'tel', '[]'::jsonb, true, 3),
        (new_paper_id, 'college', 'College Name', 'dropdown', '["College of Engineering Guindy (CEG)", "PSG College of Technology", "Madras Institute of Technology (MIT)", "SSN College of Engineering", "Government College of Technology (GCT)", "Other College"]'::jsonb, true, 4),
        (new_paper_id, 'department', 'Degree & Department', 'text', '[]'::jsonb, false, 5);

        -- Insert Sample Questions with Single-Choice, Multi-Choice, and Typing
        -- Question 1: Single Choice (Topic: Aptitude)
        INSERT INTO public.questions (paper_id, question_text, question_type, topic, options, correct_answers, marks, order_index, explanation)
        VALUES (
            new_paper_id,
            'If a train travels 360 km in 4 hours, what is its speed in meters per second (m/s)?',
            'single_choice',
            'Aptitude',
            '["20 m/s", "25 m/s", "30 m/s", "90 m/s"]'::jsonb,
            '[1]'::jsonb, -- Index 1 is 25 m/s (90 km/h * 5/18 = 25 m/s)
            2,
            1,
            'Speed = 360/4 = 90 km/h. To convert to m/s: 90 * (5/18) = 25 m/s.'
        );

        -- Question 2: Multi-Select (Topic: Web Development)
        INSERT INTO public.questions (paper_id, question_text, question_type, topic, options, correct_answers, marks, order_index, explanation)
        VALUES (
            new_paper_id,
            'Which of the following are valid JavaScript data types? (Select all that apply)',
            'multiple_choice',
            'Web Development',
            '["String", "Boolean", "Float", "Symbol", "BigInt"]'::jsonb,
            '[0, 1, 3, 4]'::jsonb, -- String, Boolean, Symbol, BigInt are primitive types (Float is not, numbers are Number)
            3,
            2,
            'In JavaScript, primitive types include String, Number, Boolean, Symbol, BigInt, Undefined, and Null. Float is not a separate type.'
        );

        -- Question 3: Typing / Short Answer (Topic: Database)
        INSERT INTO public.questions (paper_id, question_text, question_type, topic, options, correct_answers, marks, order_index, explanation)
        VALUES (
            new_paper_id,
            'What SQL command is used to remove a table and its structure permanently from the database?',
            'text_input',
            'Database',
            '[]'::jsonb,
            '["DROP TABLE", "DROP"]'::jsonb, -- case-insensitive accepted answers
            2,
            3,
            'The DROP TABLE command completely deletes the table definition and all its data.'
        );

        -- Question 4: Single Choice (Topic: Python)
        INSERT INTO public.questions (paper_id, question_text, question_type, topic, options, correct_answers, marks, order_index, explanation)
        VALUES (
            new_paper_id,
            'What is the output of `type([])` in Python?',
            'single_choice',
            'Python',
            '["<class ''array''>", "<class ''list''>", "<class ''tuple''>", "<class ''dict''>"]'::jsonb,
            '[1]'::jsonb,
            1,
            4,
            'In Python, square brackets define a list, so type([]) returns <class ''list''>.'
        );

        -- Question 5: Multi-Select (Topic: Soft Skills & Logic)
        INSERT INTO public.questions (paper_id, question_text, question_type, topic, options, correct_answers, marks, order_index, explanation)
        VALUES (
            new_paper_id,
            'Which of the following statements about HTTP status codes are correct? (Select all correct)',
            'multiple_choice',
            'Networking',
            '["200 represents OK / Success", "404 represents Not Found", "500 represents Unauthorized", "401 represents Unauthorized"]'::jsonb,
            '[0, 1, 3]'::jsonb,
            3,
            5,
            '200 is OK, 404 is Not Found, 401 is Unauthorized, and 500 is Internal Server Error.'
        );

    END IF;
END $$;
