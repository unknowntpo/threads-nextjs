-- Create posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for better performance
create index posts_user_id_idx on public.posts(user_id);
create index posts_created_at_idx on public.posts(created_at desc);

-- Enable RLS
alter table public.posts enable row level security;

-- RLS policies for posts
create policy "Posts are viewable by everyone" 
  on posts for select 
  using (true);

create policy "Users can create their own posts" 
  on posts for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own posts" 
  on posts for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own posts" 
  on posts for delete 
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_posts_updated_at
  before update on public.posts
  for each row
  execute function public.handle_updated_at();