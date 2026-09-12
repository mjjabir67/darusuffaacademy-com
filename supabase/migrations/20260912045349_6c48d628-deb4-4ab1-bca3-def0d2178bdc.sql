-- posts
drop policy if exists "published posts are public" on public.posts;
create policy "anon reads published posts" on public.posts for select to anon using (published);
create policy "auth reads posts" on public.posts for select to authenticated using (published or public.has_role(auth.uid(), 'admin'));

-- courses
drop policy if exists "published courses are public" on public.courses;
create policy "anon reads published courses" on public.courses for select to anon using (published);
create policy "auth reads courses" on public.courses for select to authenticated using (published or public.has_role(auth.uid(), 'admin'));

-- gallery
drop policy if exists "published images are public" on public.gallery_images;
create policy "anon reads published images" on public.gallery_images for select to anon using (published);
create policy "auth reads images" on public.gallery_images for select to authenticated using (published or public.has_role(auth.uid(), 'admin'));

-- announcements
drop policy if exists "published announcements are public" on public.announcements;
create policy "anon reads published announcements" on public.announcements for select to anon using (published);
create policy "auth reads announcements" on public.announcements for select to authenticated using (published or public.has_role(auth.uid(), 'admin'));