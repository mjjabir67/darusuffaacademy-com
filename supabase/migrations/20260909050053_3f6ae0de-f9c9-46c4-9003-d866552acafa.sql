create type public.app_role as enum ('admin','editor');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  parent_name text not null,
  phone text not null,
  email text not null,
  course text not null,
  admission_year text not null,
  message text not null,
  is_read boolean not null default false,
  is_contacted boolean not null default false,
  created_at timestamptz not null default now()
);
grant insert on public.enquiries to anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "anyone can submit an enquiry" on public.enquiries for insert to anon, authenticated with check (true);
create policy "admins read enquiries" on public.enquiries for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins update enquiries" on public.enquiries for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admins delete enquiries" on public.enquiries for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'news',
  title text not null,
  slug text not null unique,
  summary text not null default '',
  body text not null default '',
  event_date date,
  event_time text,
  location text,
  image_url text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "published posts are public" on public.posts for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admins write posts" on public.posts for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admins update posts" on public.posts for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admins delete posts" on public.posts for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger posts_updated_at before update on public.posts for each row execute function public.update_updated_at_column();

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.announcements to anon;
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "published announcements are public" on public.announcements for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admins write announcements" on public.announcements for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admins update announcements" on public.announcements for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admins delete announcements" on public.announcements for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger announcements_updated_at before update on public.announcements for each row execute function public.update_updated_at_column();

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text not null default '',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.gallery_images to anon;
grant select, insert, update, delete on public.gallery_images to authenticated;
grant all on public.gallery_images to service_role;
alter table public.gallery_images enable row level security;
create policy "published images are public" on public.gallery_images for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admins write images" on public.gallery_images for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admins update images" on public.gallery_images for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admins delete images" on public.gallery_images for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.courses to anon;
grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "published courses are public" on public.courses for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admins write courses" on public.courses for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admins update courses" on public.courses for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admins delete courses" on public.courses for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger courses_updated_at before update on public.courses for each row execute function public.update_updated_at_column();

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings are public" on public.site_settings for select to anon, authenticated using (true);
create policy "admins write settings" on public.site_settings for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admins update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admins delete settings" on public.site_settings for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.update_updated_at_column();

insert into public.site_settings (key, value) values
 ('contact', '{"address":"Vadeesunnah, Kolathur PO, 679338, Malappuram, Kerala","phones":["+91 99610 09313","+91 79025 20097"],"email":"darusuffaacademymsa@gmail.com","whatsapp":"+91 70346 49996","mapQuery":"Vadeesunnah+Kolathur+Malappuram+Kerala","facebook":"","instagram":"","youtube":""}'::jsonb),
 ('home', '{"heroTitle":"Darusuffa Academy","heroSubtitle":"Educate. Elevate. Empower.","heroDescription":"An integrated campus at Vadeesunnah, Kolathur where modern education meets Islamic values.","primaryCtaLabel":"Admission","primaryCtaLink":"/admission","secondaryCtaLabel":"Know us","secondaryCtaLink":"/about","welcomeTitle":"Our Story","welcomeText":"","stats":[{"label":"Students","value":"400+"},{"label":"Faculty","value":"30+"},{"label":"Years","value":"15+"}]}'::jsonb),
 ('site', '{"siteName":"Darusuffa Academy","seoTitle":"Darusuffa Academy, Kolathur","seoDescription":"Integrated Islamic and modern education at Vadeesunnah, Kolathur, Kerala.","footerText":"Educate. Elevate. Empower."}'::jsonb);

insert into public.posts (kind, title, slug, summary, body, event_date, published) values
 ('news','Engspire','engspire','A ten-day English proficiency camp to sharpen the communication skills and confidence of our students.','Our institution organized a ten-day English proficiency camp aimed at enhancing the communication skills and confidence of our students. The sessions were led by Ashiq Shaheer Adani from Ma''din Academy.','2025-08-01',true),
 ('event','Amazio — The Rooted Tree','amazio-2026','The flagship literary and arts fest of the academy returns as a celebration of knowledge, creativity and culture.','AMAZIO, the flagship literary fest of our institution, unfolds as a vibrant celebration of knowledge, creativity and cultural expression.','2026-01-15',true),
 ('event','Noorvia — Spiritual Journey','noorvia','A ten-day spiritual journey programme of reflection, remembrance and character building.','Noorvia is a guided spiritual journey held on campus, combining daily dhikr circles, Qur''anic reflection sessions and talks by visiting scholars.','2025-11-14',true);

insert into public.announcements (title, body, published) values
 ('Admissions open for 2026-27','Applications are now being accepted for High School, Higher Secondary, Degree and Integrated Dars programmes.', true);

insert into public.courses (title, description, sort_order) values
 ('High School','Kerala state syllabus classes integrated with daily Dars sessions.',1),
 ('Higher Secondary','Science and Humanities streams alongside advanced Islamic studies.',2),
 ('Degree','Undergraduate studies combined with the Muhyissunna Dars curriculum.',3),
 ('Integrated Dars','Traditional Fiqh, Hadith and Tafsir under senior Ustads.',4);

create policy "site media read" on storage.objects for select to anon, authenticated using (bucket_id = 'site-media');
create policy "admins upload site media" on storage.objects for insert to authenticated with check (bucket_id = 'site-media' and public.has_role(auth.uid(),'admin'));
create policy "admins update site media" on storage.objects for update to authenticated using (bucket_id = 'site-media' and public.has_role(auth.uid(),'admin'));
create policy "admins delete site media" on storage.objects for delete to authenticated using (bucket_id = 'site-media' and public.has_role(auth.uid(),'admin'));