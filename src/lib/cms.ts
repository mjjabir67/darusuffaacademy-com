import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Post = {
  id: string;
  kind: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
};

export type GalleryImage = {
  id: string;
  image_url: string;
  caption: string;
  sort_order: number;
  published: boolean;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  published: boolean;
};

export type Enquiry = {
  id: string;
  student_name: string;
  parent_name: string;
  phone: string;
  email: string;
  course: string;
  admission_year: string;
  message: string;
  is_read: boolean;
  is_contacted: boolean;
  created_at: string;
};

export type ContactSettings = {
  address: string;
  phones: string[];
  email: string;
  whatsapp: string;
  mapQuery: string;
  facebook: string;
  instagram: string;
  youtube: string;
};

export type HomeSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  welcomeTitle: string;
  welcomeText: string;
  stats: { label: string; value: string }[];
};

export type SiteSettings = {
  siteName: string;
  seoTitle: string;
  seoDescription: string;
  footerText: string;
};

export const DEFAULT_CONTACT: ContactSettings = {
  address: "Vadeesunnah, Kolathur PO, 679338, Malappuram, Kerala",
  phones: ["+91 99610 09313", "+91 79025 20097"],
  email: "darusuffaacademymsa@gmail.com",
  whatsapp: "+91 70346 49996",
  mapQuery: "Vadeesunnah+Kolathur+Malappuram+Kerala",
  facebook: "",
  instagram: "",
  youtube: "",
};

export const DEFAULT_HOME: HomeSettings = {
  heroTitle: "DARUSUFFA ACADEMY",
  heroSubtitle: "Muhyisunna Integrated Dars",
  heroDescription: "",
  primaryCtaLabel: "Apply for admission",
  primaryCtaLink: "/admission",
  secondaryCtaLabel: "Know us",
  secondaryCtaLink: "/about",
  welcomeTitle: "Our Story",
  welcomeText:
    "In 2018, under the patronage of Kolathur Irshadiyya, a new chapter began with the founding of Darussuffa Academy at Vadi Sunnah.",
  stats: [],
};

export const DEFAULT_SITE: SiteSettings = {
  siteName: "Darusuffa Academy",
  seoTitle: "Darusuffa Academy, Kolathur",
  seoDescription: "Integrated Islamic and modern education at Vadeesunnah, Kolathur, Kerala.",
  footerText: "Educate. Elevate. Empower.",
};

async function fetchSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return { ...fallback, ...(data.value as object) } as T;
}

export function useContactSettings() {
  const { data } = useQuery({
    queryKey: ["settings", "contact"],
    queryFn: () => fetchSetting<ContactSettings>("contact", DEFAULT_CONTACT),
  });
  return data ?? DEFAULT_CONTACT;
}

export function useHomeSettings() {
  const { data } = useQuery({
    queryKey: ["settings", "home"],
    queryFn: () => fetchSetting<HomeSettings>("home", DEFAULT_HOME),
  });
  return data ?? DEFAULT_HOME;
}

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["settings", "site"],
    queryFn: () => fetchSetting<SiteSettings>("site", DEFAULT_SITE),
  });
  return data ?? DEFAULT_SITE;
}

export function usePublishedPosts() {
  return useQuery({
    queryKey: ["posts", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("event_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });
}

export function usePublishedAnnouncements() {
  return useQuery({
    queryKey: ["announcements", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
  });
}

export function usePublishedGallery() {
  return useQuery({
    queryKey: ["gallery", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("published", true)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GalleryImage[];
    },
  });
}

export function usePublishedCourses() {
  return useQuery({
    queryKey: ["courses", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });
}

/** Uploads a file to the media bucket and returns a public-facing URL. */
export async function uploadMedia(file: File, folder = "uploads") {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("site-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return `/api/public/media/${path}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
