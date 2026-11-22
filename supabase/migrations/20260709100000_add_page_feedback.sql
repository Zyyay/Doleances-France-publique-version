-- Free-text feedback left by a logged-in user on a subject page ("Donnez
-- votre avis sur la page"). One-way submission: no edit/delete UI, so no
-- updated_at column and no update/delete RLS policies — only insert + read
-- own, same private-by-default shape as `votes`.

create table public.page_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  content text not null check (char_length(content) <= 2000 and char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

comment on table public.page_feedback is 'Free-text feedback a user leaves on a subject page. Write-once, no history.';

create index page_feedback_subject_id_idx on public.page_feedback(subject_id);
create index page_feedback_user_id_idx on public.page_feedback(user_id);

alter table public.page_feedback enable row level security;

create policy "Users can read own feedback" on public.page_feedback for select using (auth.uid() = user_id);
create policy "Users can insert own feedback" on public.page_feedback for insert with check (auth.uid() = user_id);
