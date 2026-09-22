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
  heroImage?: string | null;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  welcomeTitle: string;
  welcomeText: string;
  ourStoryImage?: string | null;
  welcomeImage?: string | null;
  stats: { label: string; value: string }[];
};

export type AcademicSettings = {
  eyebrow?: string;
  title?: string;
  intro?: string;
  pageImage?: string | null;
  bannerImage?: string | null;
};

export type AboutSettings = {
  campusImage?: string | null;
  historyImage?: string | null;
  bannerImage?: string | null;
};

export type PageBanners = Record<string, string | null>;

export type SiteSettings = {
  siteName: string;
  seoTitle: string;
  seoDescription: string;
  footerText: string;
};

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  photo_url?: string | null;
  sort_order?: number;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type CommitteeMember = {
  id: string;
  name: string;
  role?: string;
  photo_url?: string | null;
  sort_order?: number;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type AdmissionOption = {
  value: string;
  label: string;
};

export type AdmissionFormFieldType = "text" | "textarea" | "phone" | "select";

export type AdmissionFormField = {
  id: string;
  name: string;
  label: string;
  type: AdmissionFormFieldType;
  required: boolean;
  options?: string[];
  visible: boolean;
  order: number;
};

export type AdmissionApplicationStatus = "New" | "Reviewing" | "Accepted" | "Rejected";

export type AdmissionApplication = {
  id: string;
  student_name: string;
  father_name: string;
  class_to_join: string;
  phone: string;
  whatsapp: string;
  address: string;
  place: string;
  district: string;
  status: AdmissionApplicationStatus;
  created_at: string;
  notes?: string;
  custom_fields?: Record<string, string>;
};

export type AdmissionSettings = {
  // Institution & Header Information
  institutionName: string;
  institutionSubtitle: string;
  institutionLocation: string;
  formTitle: string;
  admissionYear: string;
  contactPhone: string;
  contactEmail: string;

  // Facilities list
  facilities: string[];

  // Dynamic Application Form Fields
  formFields: AdmissionFormField[];

  // Page Meta & Header
  eyebrow: string;
  title: string;
  intro: string;

  // Overview / Campus intro
  overviewText: string;
  callButtonText: string;
  whatsappButtonText: string;
  phoneOverride?: string;
  whatsappOverride?: string;

  // Feature cards
  card1Title: string;
  card1Description: string;
  card2Title: string;
  card2Description: string;

  // How to apply steps
  howToApplyTitle: string;
  steps: string[];

  // Eligibility & Requirements
  showEligibility: boolean;
  eligibilityTitle: string;
  eligibilityText: string;

  // Required documents
  showRequiredDocuments: boolean;
  requiredDocumentsTitle: string;
  requiredDocuments: string[];

  // Important notes / session
  academicSession: string;
  importantNotes?: string;

  // Form options
  availableCourses: AdmissionOption[];
  availableYears: AdmissionOption[];

  // Download Form Settings
  showDownloadForm: boolean;
  downloadSource: "generated" | "uploaded";
  formDownloadUrl: string;
  formFileName: string;
  formFileSize?: string;
  downloadButtonText: string;
  downloadDescription: string;

  // Online Enquiry Section
  enquiryEyebrow: string;
  enquiryTitle: string;
  enquiryDescription: string;

  // Admission Page Image
  admissionImage?: string | null;
};

export const DEFAULT_STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "Sayyid Murthala Shihab Saqafi Thiroorkkad",
    role: "Chairman",
    photo_url: null,
    sort_order: 1,
  },
  {
    id: "staff-2",
    name: "Shaheer Anas Adani Aykkarappadi",
    role: "Principal",
    photo_url: null,
    sort_order: 2,
  },
  {
    id: "staff-3",
    name: "Muhyissunna Dars Faculty",
    role: "Senior Ustads — Fiqh, Hadith & Tafsir",
    photo_url: null,
    sort_order: 3,
  },
  {
    id: "staff-4",
    name: "Academic Wing",
    role: "Humanities, Languages & Social Sciences",
    photo_url: null,
    sort_order: 4,
  },
];

export const DEFAULT_COMMITTEE: CommitteeMember[] = [];

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
  heroImage: null,
  primaryCtaLabel: "Apply for admission",
  primaryCtaLink: "/admission",
  secondaryCtaLabel: "Know us",
  secondaryCtaLink: "/about",
  welcomeTitle: "Our Story",
  welcomeText:
    "In 2018, under the patronage of Kolathur Irshadiyya, a new chapter began with the founding of Darussuffa Academy at Vadi Sunnah.",
  ourStoryImage: null,
  welcomeImage: null,
  stats: [],
};

export const DEFAULT_ACADEMIC: AcademicSettings = {
  eyebrow: "Curriculum",
  title: "Academics",
  intro:
    "A classical Dars tradition carried forward with modern academics, enrichment programmes and well-equipped facilities.",
  pageImage: null,
};

export const DEFAULT_ABOUT: AboutSettings = {
  campusImage: null,
  historyImage: null,
  bannerImage: null,
};

export const DEFAULT_PAGE_BANNERS: PageBanners = {
  about: null,
  admission: null,
  academic: null,
  staff: null,
  gallery: null,
  media: null,
  news: null,
  "art-literature": null,
  "language-door": null,
  magazine: null,
  "ssf-dawa": null,
  contact: null,
};

export const DEFAULT_SITE: SiteSettings = {
  siteName: "Darusuffa Academy",
  seoTitle: "Darusuffa Academy, Kolathur",
  seoDescription: "Integrated Islamic and modern education at Vadeesunnah, Kolathur, Kerala.",
  footerText: "Educate. Elevate. Empower.",
};

export const DEFAULT_ADMISSION_FIELDS: AdmissionFormField[] = [
  {
    id: "class_to_join",
    name: "class_to_join",
    label: "Class to Join",
    type: "select",
    required: true,
    options: ["8th Class", "9th Class", "Plus One"],
    visible: true,
    order: 1,
  },
  {
    id: "student_name",
    name: "student_name",
    label: "Name of Student",
    type: "text",
    required: true,
    visible: true,
    order: 2,
  },
  {
    id: "father_name",
    name: "father_name",
    label: "Name of Father",
    type: "text",
    required: true,
    visible: true,
    order: 3,
  },
  {
    id: "address",
    name: "address",
    label: "Address",
    type: "textarea",
    required: true,
    visible: true,
    order: 4,
  },
  {
    id: "place",
    name: "place",
    label: "Place",
    type: "text",
    required: true,
    visible: true,
    order: 5,
  },
  {
    id: "district",
    name: "district",
    label: "District",
    type: "text",
    required: true,
    visible: true,
    order: 6,
  },
  {
    id: "phone",
    name: "phone",
    label: "Phone Number",
    type: "phone",
    required: true,
    visible: true,
    order: 7,
  },
  {
    id: "whatsapp",
    name: "whatsapp",
    label: "WhatsApp Number",
    type: "phone",
    required: true,
    visible: true,
    order: 8,
  },
];

export const DEFAULT_FACILITIES: string[] = [
  "Admissions available for Classes 8, 9, and Plus One",
  "Traditional Dars setup",
  "Facility to study up to UG alongside Mukhtasar study",
  "Special training in Hifz, public speaking, art, and literature",
  "Computer and library facilities",
  "Doura facility for Hafiz students",
];

export const DEFAULT_ADMISSION: AdmissionSettings = {
  // Institution & Header Information
  institutionName: "DARUSUFFA ACADEMY",
  institutionSubtitle: "MUHYISUNNA INTEGRATED DARS",
  institutionLocation: "Vadeesunna, Kolathur, Malappuram",
  formTitle: "ADMISSION FORM-2025",
  admissionYear: "2025",
  contactPhone: "+91 99610 09313",
  contactEmail: "darusuffaacademymsa@gmail.com",

  // Facilities list
  facilities: DEFAULT_FACILITIES,

  // Dynamic Form Fields
  formFields: DEFAULT_ADMISSION_FIELDS,

  eyebrow: "Know more about",
  title: "Admission",
  intro:
    "We welcome students who aspire to gain both academic excellence and moral grounding through a unique curriculum that combines modern education with Islamic values.",
  overviewText:
    "Our campus, located in a serene and spiritually enriching environment, offers the perfect setting for holistic development. Interested candidates are encouraged to contact the office or visit our campus for detailed admission procedures and guidance. Join us in shaping a future rooted in knowledge, character and faith.",
  callButtonText: "Call the office",
  whatsappButtonText: "Apply on WhatsApp",
  phoneOverride: "",
  whatsappOverride: "",
  card1Title: "Integrated Education with Purpose",
  card1Description:
    "Our institution nurtures students who are not only academically competent but also morally upright and spiritually guided. A well-structured curriculum integrates modern subjects with Islamic studies — Qur'an, Hadith, Fiqh, Islamic History and Ethics — creating a generation that excels in both worlds.",
  card2Title: "Learning Environment",
  card2Description:
    "The campus is peacefully situated in a serene and spiritually uplifting environment, ideal for focused learning, personal reflection and community life. Dedicated faculty, modern classrooms and co-curricular activities ensure the holistic development of every student.",
  howToApplyTitle: "How to apply",
  steps: [
    "Contact the office by phone or WhatsApp to check the current intake.",
    "Visit the campus at Vadeesunnah, Kolathur with previous academic records.",
    "Attend the interaction with the faculty and complete the admission formalities.",
  ],
  showEligibility: true,
  eligibilityTitle: "Eligibility Criteria",
  eligibilityText:
    "Applicants seeking admission to High School, Higher Secondary, and Integrated Dars programs should demonstrate satisfactory academic competence and a strong inclination toward moral and Islamic character. Parents/guardians accompany the applicant for the initial personal interaction.",
  showRequiredDocuments: true,
  requiredDocumentsTitle: "Required Documents",
  requiredDocuments: [
    "Original Transfer Certificate (TC) & Conduct Certificate from the last attended school",
    "Attested copy of previous marks list / academic grade transcript",
    "Birth certificate or valid official proof of date of birth",
    "Recent passport-size photographs of the student (4 copies)",
    "Copy of Aadhaar card (both student and parent/guardian)",
  ],
  academicSession: "2025-26",
  importantNotes:
    "Boarding & residential dars facilities are provided on-campus. Seats are limited for each batch to maintain individual mentoring standards.",
  availableCourses: [
    { value: "8th-class", label: "8th Class" },
    { value: "9th-class", label: "9th Class" },
    { value: "plus-one", label: "Plus One" },
    { value: "high-school", label: "High School" },
    { value: "higher-secondary", label: "Higher Secondary" },
    { value: "degree", label: "Degree" },
    { value: "integrated-dars", label: "Integrated Dars" },
    { value: "other", label: "Other" },
  ],
  availableYears: [
    { value: "2025-26", label: "2025-26" },
    { value: "2026-27", label: "2026-27" },
    { value: "2027-28", label: "2027-28" },
  ],
  showDownloadForm: true,
  downloadSource: "generated",
  formDownloadUrl: "",
  formFileName: "",
  formFileSize: "",
  downloadButtonText: "Download Admission Form",
  downloadDescription:
    "Prefer to fill out the form manually? Download and print our official application form, fill in your details, and submit it directly to the Darusuffa Academy admission office.",
  enquiryEyebrow: "Admission Enquiry",
  enquiryTitle: "Send us your enquiry",
  enquiryDescription:
    "Fill in the form below and our admission office will reach out to you with the next steps.",
  admissionImage: null,
};

async function fetchSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data || data.value === null || data.value === undefined) return fallback;
  if (Array.isArray(data.value)) {
    return data.value as unknown as T;
  }
  if (Array.isArray(fallback)) {
    return (Array.isArray(data.value) ? data.value : fallback) as T;
  }
  if (typeof fallback === "object" && fallback !== null) {
    return { ...fallback, ...(data.value as object) } as T;
  }
  return (data.value as unknown as T) ?? fallback;
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

export function useAdmissionSettings(): AdmissionSettings {
  const { data } = useQuery({
    queryKey: ["settings", "admission"],
    queryFn: async () => {
      const raw = await fetchSetting<AdmissionSettings>("admission", DEFAULT_ADMISSION);
      return {
        ...DEFAULT_ADMISSION,
        ...raw,
        facilities:
          Array.isArray(raw.facilities) && raw.facilities.length > 0
            ? raw.facilities
            : DEFAULT_FACILITIES,
        formFields:
          Array.isArray(raw.formFields) && raw.formFields.length > 0
            ? raw.formFields
            : DEFAULT_ADMISSION_FIELDS,
      };
    },
  });
  return (
    data ?? {
      ...DEFAULT_ADMISSION,
      facilities: DEFAULT_FACILITIES,
      formFields: DEFAULT_ADMISSION_FIELDS,
    }
  );
}

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["settings", "site"],
    queryFn: () => fetchSetting<SiteSettings>("site", DEFAULT_SITE),
  });
  return data ?? DEFAULT_SITE;
}

export function useAcademicSettings(): AcademicSettings {
  const { data } = useQuery({
    queryKey: ["settings", "academic"],
    queryFn: () => fetchSetting<AcademicSettings>("academic", DEFAULT_ACADEMIC),
  });
  return data ?? DEFAULT_ACADEMIC;
}

export function useAboutSettings(): AboutSettings {
  const { data } = useQuery({
    queryKey: ["settings", "about"],
    queryFn: () => fetchSetting<AboutSettings>("about", DEFAULT_ABOUT),
  });
  return data ?? DEFAULT_ABOUT;
}

export function usePageBanners(): PageBanners {
  const { data } = useQuery({
    queryKey: ["settings", "page_banners"],
    queryFn: async () => {
      const raw = await fetchSetting<PageBanners>("page_banners", DEFAULT_PAGE_BANNERS);
      return {
        ...DEFAULT_PAGE_BANNERS,
        ...(raw && typeof raw === "object" ? raw : {}),
      };
    },
  });
  return data ?? DEFAULT_PAGE_BANNERS;
}

export function usePageBanner(pageKey?: string | null): string | null {
  const banners = usePageBanners();
  const academic = useAcademicSettings();
  const about = useAboutSettings();

  if (!pageKey) return null;
  const normalizedKey = pageKey.toLowerCase().replace(/^\//, "").trim();

  // Direct lookup from page_banners
  if (banners[normalizedKey]) return banners[normalizedKey];

  // Specific fallback to page-level settings if configured there
  if (normalizedKey === "academic" && academic.bannerImage) {
    return academic.bannerImage;
  }
  if (normalizedKey === "about" && about.bannerImage) {
    return about.bannerImage;
  }

  // Common aliases
  if (normalizedKey === "gallery" && banners.media) return banners.media;
  if (normalizedKey === "media" && banners.gallery) return banners.gallery;
  if (normalizedKey === "news" && (banners.events || banners["news-events"])) {
    return banners.events || banners["news-events"];
  }
  if (normalizedKey === "events" && banners.news) return banners.news;

  return null;
}

export async function updatePageBanner(pageKey: string, url: string | null): Promise<void> {
  const normalizedKey = pageKey.toLowerCase().replace(/^\//, "").trim();

  // Fetch current page_banners
  const { data: currentRecord } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "page_banners")
    .maybeSingle();

  const currentObj =
    currentRecord?.value && typeof currentRecord.value === "object"
      ? (currentRecord.value as Record<string, string | null>)
      : {};

  const updated: Record<string, string | null> = {
    ...DEFAULT_PAGE_BANNERS,
    ...currentObj,
    [normalizedKey]: url,
  };

  // Sync common aliases
  if (normalizedKey === "gallery") updated.media = url;
  if (normalizedKey === "media") updated.gallery = url;
  if (normalizedKey === "news") updated.events = url;
  if (normalizedKey === "events") updated.news = url;

  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "page_banners",
      value: updated,
    },
    { onConflict: "key" },
  );

  if (error) throw error;
}

export function useStaffMembers() {
  const { data } = useQuery({
    queryKey: ["settings", "staff_members"],
    queryFn: async () => {
      const staff = await fetchSetting<StaffMember[]>("staff_members", DEFAULT_STAFF);
      return (staff && Array.isArray(staff) && staff.length > 0 ? staff : DEFAULT_STAFF).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
    },
  });
  return data ?? DEFAULT_STAFF;
}

export function useCommitteeMembers() {
  const { data } = useQuery({
    queryKey: ["settings", "committee_members"],
    queryFn: async () => {
      const committee = await fetchSetting<CommitteeMember[]>(
        "committee_members",
        DEFAULT_COMMITTEE,
      );
      return (committee && Array.isArray(committee) ? committee : DEFAULT_COMMITTEE).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
    },
  });
  return data ?? DEFAULT_COMMITTEE;
}

export function usePublishedPosts() {
  return useQuery({
    queryKey: ["posts", "published"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("published", true)
          .order("event_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
        if (error) {
          console.warn("[CMS] posts fetch error:", error);
          return [];
        }
        return (data ?? []) as Post[];
      } catch (err) {
        console.warn("[CMS] posts fetch exception:", err);
        return [];
      }
    },
  });
}

export function usePublishedAnnouncements() {
  return useQuery({
    queryKey: ["announcements", "published"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false });
        if (error) {
          console.warn("[CMS] announcements fetch error:", error);
          return [];
        }
        return (data ?? []) as Announcement[];
      } catch (err) {
        console.warn("[CMS] announcements fetch exception:", err);
        return [];
      }
    },
  });
}

export function usePublishedGallery() {
  return useQuery({
    queryKey: ["gallery", "published"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("gallery_images")
          .select("*")
          .eq("published", true)
          .order("sort_order")
          .order("created_at", { ascending: false });
        if (error) {
          console.warn("[CMS] gallery fetch error:", error);
          return [];
        }
        return (data ?? []) as GalleryImage[];
      } catch (err) {
        console.warn("[CMS] gallery fetch exception:", err);
        return [];
      }
    },
  });
}

export function usePublishedCourses() {
  return useQuery({
    queryKey: ["courses", "published"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("published", true)
          .order("sort_order");
        if (error) {
          console.warn("[CMS] courses fetch error:", error);
          return [];
        }
        return (data ?? []) as Course[];
      } catch (err) {
        console.warn("[CMS] courses fetch exception:", err);
        return [];
      }
    },
  });
}

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url) || url.startsWith("data:video/");
}

export interface GalleryImageMeta {
  album: string;
  caption?: string;
  eventId?: string;
  eventSlug?: string;
  mediaType?: "image" | "video";
}

export function parseGalleryMeta(rawCaption: string | null | undefined): GalleryImageMeta {
  if (!rawCaption) return { album: "General Gallery", caption: "" };
  const str = rawCaption.trim();
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const parsed = JSON.parse(str);
      return {
        album: parsed.album || parsed.title || "General Gallery",
        caption: parsed.caption || "",
        eventId: parsed.eventId || parsed.event_id,
        eventSlug: parsed.eventSlug || parsed.event_slug,
        mediaType: parsed.mediaType || (parsed.is_video ? "video" : undefined),
      };
    } catch {
      // fallback to plain text
    }
  }

  const bracketMatch = str.match(/^\[(.*?)\]\s*(.*)$/);
  if (bracketMatch) {
    return {
      album: bracketMatch[1].trim(),
      caption: bracketMatch[2].trim(),
    };
  }

  return {
    album: str,
    caption: str,
  };
}

export function serializeGalleryMeta(meta: GalleryImageMeta): string {
  if (
    !meta.eventId &&
    !meta.eventSlug &&
    (!meta.caption || meta.caption === meta.album) &&
    !meta.mediaType
  ) {
    return meta.album;
  }
  return JSON.stringify({
    album: meta.album,
    caption: meta.caption || "",
    eventId: meta.eventId,
    eventSlug: meta.eventSlug,
    mediaType: meta.mediaType,
  });
}

export interface GalleryAlbumItem {
  id: string;
  url: string;
  caption?: string;
  type?: "image" | "video";
  sort_order: number;
  published: boolean;
  created_at: string;
}

export interface GalleryAlbum {
  title: string;
  slug: string;
  caption?: string;
  coverImage: string;
  images: GalleryAlbumItem[];
  eventId?: string;
  count: number;
}

export function groupGalleryAlbums(images: GalleryImage[]): GalleryAlbum[] {
  const albumMap = new Map<string, GalleryAlbum>();

  for (const img of images) {
    const meta = parseGalleryMeta(img.caption);
    const albumTitle = meta.album || "General Gallery";
    const slug = slugify(albumTitle) || "album";

    const item: GalleryAlbumItem = {
      id: img.id,
      url: img.image_url,
      caption: meta.caption || img.caption,
      type: meta.mediaType || (isVideoUrl(img.image_url) ? "video" : "image"),
      sort_order: img.sort_order ?? 0,
      published: img.published,
      created_at: img.created_at,
    };

    if (!albumMap.has(slug)) {
      albumMap.set(slug, {
        title: albumTitle,
        slug,
        caption: meta.caption,
        coverImage: img.image_url,
        images: [item],
        eventId: meta.eventId,
        count: 1,
      });
    } else {
      const existing = albumMap.get(slug)!;
      existing.images.push(item);
      existing.count = existing.images.length;
      if (!existing.eventId && meta.eventId) {
        existing.eventId = meta.eventId;
      }
      // Prefer title with better capitalization or punctuation if available
      if (
        albumTitle.length > existing.title.length ||
        (albumTitle.includes("'") && !existing.title.includes("'"))
      ) {
        existing.title = albumTitle;
      }
    }
  }

  return Array.from(albumMap.values()).map((album) => ({
    ...album,
    images: [...album.images].sort((a, b) => a.sort_order - b.sort_order),
    coverImage: album.images.find((i) => i.type !== "video")?.url || album.images[0]?.url || "",
  }));
}

export function filterEventMedia(
  event: { id: string; title: string; slug?: string },
  images: GalleryImage[],
): GalleryAlbumItem[] {
  const normTitle = event.title.trim().toLowerCase();
  const normSlug = (event.slug ?? slugify(event.title)).trim().toLowerCase();
  const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanEventTitle = cleanStr(event.title);
  const cleanEventSlug = cleanStr(normSlug);

  const matched = images.filter((img) => {
    const meta = parseGalleryMeta(img.caption);
    if (meta.eventId && meta.eventId === event.id) return true;
    if (
      meta.eventSlug &&
      (meta.eventSlug.toLowerCase() === normSlug || cleanStr(meta.eventSlug) === cleanEventSlug)
    ) {
      return true;
    }
    const albumNorm = meta.album.trim().toLowerCase();
    if (albumNorm === normTitle || albumNorm === normSlug) return true;
    if (cleanStr(meta.album) === cleanEventTitle || cleanStr(meta.album) === cleanEventSlug) {
      return true;
    }
    return false;
  });

  return matched
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => {
      const meta = parseGalleryMeta(img.caption);
      return {
        id: img.id,
        url: img.image_url,
        caption: meta.caption || img.caption,
        type: meta.mediaType || (isVideoUrl(img.image_url) ? "video" : "image"),
        sort_order: img.sort_order ?? 0,
        published: img.published,
        created_at: img.created_at,
      };
    });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Uploads a file to the media bucket and returns a public-facing URL. */
export async function uploadMedia(file: File, folder = "uploads") {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  try {
    const { error } = await supabase.storage.from("site-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      console.warn("Storage upload failed, falling back to data URL:", error);
      return await fileToDataUrl(file);
    }
    // Return direct signed URL valid for 10 years (works everywhere: Firebase, Vercel, static preview, Node)
    const { data: signedData } = await supabase.storage
      .from("site-media")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signedData?.signedUrl) {
      return signedData.signedUrl;
    }
    return `/api/public/media/${path}`;
  } catch (err) {
    console.warn("Storage upload exception, falling back to data URL:", err);
    return await fileToDataUrl(file);
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['"`]/g, "")
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

/**
 * Extracts storage relative path from media URL (e.g. /api/public/media/gallery/abc.jpg -> gallery/abc.jpg)
 */
export function extractStoragePath(mediaUrl?: string | null): string | null {
  if (!mediaUrl) return null;
  // If it's an API route proxy: /api/public/media/path/to/file.ext
  const proxyMatch = mediaUrl.match(/^\/?api\/public\/media\/(.+)$/);
  if (proxyMatch?.[1]) {
    return decodeURIComponent(proxyMatch[1].split("?")[0]);
  }
  // If it's a Supabase storage signed URL: .../storage/v1/object/sign/site-media/path/to/file.ext?...
  const signedMatch = mediaUrl.match(/\/storage\/v1\/object\/sign\/site-media\/(.+?)(\?|$)/);
  if (signedMatch?.[1]) {
    return decodeURIComponent(signedMatch[1]);
  }
  // If it's a direct Supabase storage public URL: .../storage/v1/object/public/site-media/path/to/file.ext
  const directMatch = mediaUrl.match(/\/storage\/v1\/object\/public\/site-media\/(.+?)(\?|$)/);
  if (directMatch?.[1]) {
    return decodeURIComponent(directMatch[1]);
  }
  return null;
}

/**
 * Resolves a media URL to an accessible URL.
 * If the URL is a relative proxy (/api/public/media/...) and running on a client without a Node server (e.g. Firebase Hosting static),
 * this asynchronously obtains a direct signed URL from Supabase storage so the image displays reliably.
 */
const _resolvedMediaCache = new Map<string, string>();

export async function resolveMediaUrl(url?: string | null): Promise<string> {
  if (!url) return "";
  // If already absolute or data URL, return directly
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  // If in cache, return cached version
  if (_resolvedMediaCache.has(url)) {
    return _resolvedMediaCache.get(url)!;
  }
  const storagePath = extractStoragePath(url);
  if (storagePath) {
    try {
      const { data } = await supabase.storage
        .from("site-media")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);
      if (data?.signedUrl) {
        _resolvedMediaCache.set(url, data.signedUrl);
        return data.signedUrl;
      }
    } catch {
      // ignore
    }
  }
  return url;
}

/**
 * Safely deletes a file from the site-media storage bucket.
 * Uses the server-side media proxy DELETE endpoint or direct client storage remove.
 */
export async function deleteStoredMedia(mediaUrl?: string | null): Promise<boolean> {
  const path = extractStoragePath(mediaUrl);
  if (!path) return false;

  try {
    // 1. Attempt through server-side admin proxy (bypasses storage RLS safely)
    const res = await fetch(`/api/public/media/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
      method: "DELETE",
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn("[deleteStoredMedia] API route delete attempt failed:", err);
  }

  // 2. Fallback to client storage remove if authorized session is active
  try {
    const { error } = await supabase.storage.from("site-media").remove([path]);
    if (!error) return true;
  } catch (err) {
    console.warn("[deleteStoredMedia] Supabase client storage remove failed:", err);
  }

  return false;
}

// ==========================================
// OTHER SECTION: ART & LITERATURE
// ==========================================

export type ArtLiteratureCard = {
  id: string;
  title: string;
  body: string;
};

export type ArtLiteratureSettings = {
  eyebrow?: string;
  title: string;
  intro?: string;
  bodyContent?: string;
  imageUrl?: string | null;
  cards: ArtLiteratureCard[];
};

export const DEFAULT_ART_LITERATURE: ArtLiteratureSettings = {
  eyebrow: "Academic wing",
  title: "Art and Literature",
  intro:
    "Creativity as an extension of scholarship — writing, speech and art nurtured alongside the Dars.",
  bodyContent:
    "Art and literature at Darusuffa Academy — Amazio arts fest, campus magazines, calligraphy, oratory and creative writing.",
  imageUrl: null,
  cards: [
    {
      id: "strand-1",
      title: "Amazio Arts Fest",
      body: "The flagship literary fest of the institution — a vibrant celebration of knowledge, creativity and cultural expression across the campus.",
    },
    {
      id: "strand-2",
      title: "Magazines",
      body: "Student-run periodicals carrying essays, poetry, research notes and reflections in Arabic, English and Malayalam.",
    },
    {
      id: "strand-3",
      title: "Calligraphy & Design",
      body: "Workshops in Arabic calligraphy and visual design, connecting classical aesthetics with modern tools.",
    },
    {
      id: "strand-4",
      title: "Oratory & Debate",
      body: "Regular stages for public speaking, debate and recitation that build confidence and clarity.",
    },
  ],
};

export function useArtLiteratureSettings(): ArtLiteratureSettings {
  const { data } = useQuery({
    queryKey: ["settings", "art_literature"],
    queryFn: async () => {
      const raw = await fetchSetting<ArtLiteratureSettings>(
        "art_literature",
        DEFAULT_ART_LITERATURE,
      );
      return {
        ...DEFAULT_ART_LITERATURE,
        ...raw,
        cards: Array.isArray(raw?.cards) ? raw.cards : DEFAULT_ART_LITERATURE.cards,
      };
    },
  });
  return data ?? DEFAULT_ART_LITERATURE;
}

// ==========================================
// OTHER SECTION: LANGUAGE DOOR
// ==========================================

export type LanguageDoorCard = {
  id: string;
  name: string;
  note: string;
};

export type LanguageDoorSettings = {
  eyebrow?: string;
  title: string;
  intro?: string;
  bodyContent?: string;
  imageUrl?: string | null;
  languages: LanguageDoorCard[];
};

export const DEFAULT_LANGUAGE_DOOR: LanguageDoorSettings = {
  eyebrow: "Academic wing",
  title: "Language Door",
  intro:
    "A dedicated wing that opens the doors of language — so that knowledge learned is knowledge shared.",
  bodyContent:
    "Language Door at Darusuffa Academy builds fluency in Arabic, English, Urdu and Malayalam through daily practice, camps and public speaking sessions.",
  imageUrl: null,
  languages: [
    {
      id: "lang-1",
      name: "Arabic",
      note: "Classical grammar, composition and conversation rooted in the Dars tradition.",
    },
    {
      id: "lang-2",
      name: "English",
      note: "Daily spoken sessions, camps like Engspire and written expression.",
    },
    {
      id: "lang-3",
      name: "Urdu",
      note: "Reading and literature circles connecting students to scholarly heritage.",
    },
    {
      id: "lang-4",
      name: "Malayalam",
      note: "Oratory, essay and creative writing for the wider community.",
    },
  ],
};

export function useLanguageDoorSettings(): LanguageDoorSettings {
  const { data } = useQuery({
    queryKey: ["settings", "language_door"],
    queryFn: async () => {
      const raw = await fetchSetting<LanguageDoorSettings>("language_door", DEFAULT_LANGUAGE_DOOR);
      return {
        ...DEFAULT_LANGUAGE_DOOR,
        ...raw,
        languages: Array.isArray(raw?.languages) ? raw.languages : DEFAULT_LANGUAGE_DOOR.languages,
      };
    },
  });
  return data ?? DEFAULT_LANGUAGE_DOOR;
}

// ==========================================
// OTHER SECTION: MAGAZINE
// ==========================================

export type MagazineItem = {
  id: string;
  title: string;
  description?: string | null;
  cover_image?: string | null;
  publication_date?: string | null;
  source_type: "pdf" | "link";
  pdf_url?: string | null;
  pdf_filename?: string | null;
  external_url?: string | null;
  published: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
};

export const DEFAULT_MAGAZINES: MagazineItem[] = [
  {
    id: "mag-1",
    title: "Al-Bayan Annual Magazine",
    description:
      "Annual literary magazine featuring research articles, scholarly essays, creative prose, and Arabic poetry from campus students.",
    cover_image: null,
    publication_date: "2024",
    source_type: "link",
    external_url: "https://example.com/magazine-2024",
    published: true,
    sort_order: 1,
    created_at: "2024-03-01T00:00:00.000Z",
  },
  {
    id: "mag-2",
    title: "Noorul Huda Campus Edition",
    description:
      "Special cultural and academic edition highlighting campus achievements, Amazio fest reflections, and spiritual discourses.",
    cover_image: null,
    publication_date: "2023",
    source_type: "link",
    external_url: "https://example.com/magazine-2023",
    published: true,
    sort_order: 2,
    created_at: "2023-11-15T00:00:00.000Z",
  },
];

export function useMagazines(onlyPublished = false): {
  magazines: MagazineItem[];
  isLoading: boolean;
  refetch: () => void;
} {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["settings", "magazines"],
    queryFn: async () => {
      const raw = await fetchSetting<MagazineItem[]>("magazines", DEFAULT_MAGAZINES);
      const list = Array.isArray(raw) ? raw : DEFAULT_MAGAZINES;
      return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },
  });

  const all = data ?? DEFAULT_MAGAZINES;
  const filtered = onlyPublished ? all.filter((m) => m.published) : all;
  return { magazines: filtered, isLoading, refetch };
}

// ==========================================
// OTHER SECTION: SSF DA'WA
// ==========================================

export type SsfDawaMediaItem = {
  id: string;
  image_url: string;
  caption?: string;
  sort_order: number;
};

export type SsfDawaEvent = {
  id: string;
  event_name: string;
  date?: string | null;
  description?: string | null;
  images: SsfDawaMediaItem[];
  published: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
};

export type SsfDawaSettings = {
  eyebrow?: string;
  title: string;
  intro?: string;
  description1?: string;
  description2?: string;
  quote?: string;
  bannerImage?: string | null;
};

export const DEFAULT_SSF_DAWA_SETTINGS: SsfDawaSettings = {
  eyebrow: "Campus unit",
  title: "SSF Darusuffa Da'wa",
  intro: "Rooted in the values of truth, tolerance and wisdom.",
  description1:
    "Our institution proudly hosts an active SSF Da'wa Unit, functioning under the spiritual and intellectual guidance of the Sunni Students' Federation (SSF). The unit is dedicated to promoting the peaceful message of Islam through knowledge, character and service.",
  description2:
    "Through study circles, campus programmes, social service drives and community outreach, the unit trains students to carry the teachings of the Qur'an and Sunnah with wisdom and good conduct — engaging society with compassion rather than confrontation.",
  quote: "Invite to the way of your Lord with wisdom and beautiful preaching.",
  bannerImage: null,
};

export const DEFAULT_SSF_DAWA_EVENTS: SsfDawaEvent[] = [
  {
    id: "ssf-ev-1",
    event_name: "Annual Da'wa Meet & Moral Study Circle",
    date: "2024-02-15",
    description:
      "Campus-wide moral study circle gathering students and teachers to reflect on Islamic leadership, community responsibility, and dawah ethics.",
    images: [],
    published: true,
    sort_order: 1,
    created_at: "2024-02-15T00:00:00.000Z",
  },
  {
    id: "ssf-ev-2",
    event_name: "Community Outreach & Service Drive",
    date: "2023-11-20",
    description:
      "Students volunteering in local community care, educational support, and peaceful message dissemination across the region.",
    images: [],
    published: true,
    sort_order: 2,
    created_at: "2023-11-20T00:00:00.000Z",
  },
];

export function useSsfDawaSettings(): SsfDawaSettings {
  const { data } = useQuery({
    queryKey: ["settings", "ssf_dawa_settings"],
    queryFn: async () => {
      const raw = await fetchSetting<SsfDawaSettings>(
        "ssf_dawa_settings",
        DEFAULT_SSF_DAWA_SETTINGS,
      );
      return {
        ...DEFAULT_SSF_DAWA_SETTINGS,
        ...raw,
      };
    },
  });
  return data ?? DEFAULT_SSF_DAWA_SETTINGS;
}

export function useSsfDawaEvents(onlyPublished = false): {
  events: SsfDawaEvent[];
  isLoading: boolean;
  refetch: () => void;
} {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["settings", "ssf_dawa_events"],
    queryFn: async () => {
      const raw = await fetchSetting<SsfDawaEvent[]>("ssf_dawa_events", DEFAULT_SSF_DAWA_EVENTS);
      const list = Array.isArray(raw) ? raw : DEFAULT_SSF_DAWA_EVENTS;
      return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },
  });

  const all = data ?? DEFAULT_SSF_DAWA_EVENTS;
  const filtered = onlyPublished ? all.filter((e) => e.published) : all;
  return { events: filtered, isLoading, refetch };
}
