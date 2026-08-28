export const CONTACT = {
  address: "Vadeesunnah, Kolathur PO, 679338, Malappuram, Kerala",
  phones: ["+91 99610 09313", "+91 79025 20097"],
  email: "darusuffaacademymsa@gmail.com",
  whatsapp: "+91 70346 49996",
  mapQuery: "Vadeesunnah+Kolathur+Malappuram+Kerala",
};

export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  tag: "News" | "Event" | "Upcoming";
  summary: string;
  body: string;
};

export const NEWS: NewsItem[] = [
  {
    slug: "engspire",
    title: "Engspire",
    date: "Aug 01 – 10, 2025",
    tag: "News",
    summary:
      "A ten-day English proficiency camp to sharpen the communication skills and confidence of our students.",
    body: "Our institution organized a ten-day English proficiency camp aimed at enhancing the communication skills and confidence of our students. The sessions were led by Ashiq Shaheer Adani from Ma'din Academy, whose engaging teaching style and valuable experience made the classes both effective and inspiring.",
  },
  {
    slug: "amazio-2026",
    title: "Amazio — The Rooted Tree",
    date: "Vadeesunna Arts Fest 2026",
    tag: "Upcoming",
    summary:
      "The flagship literary and arts fest of the academy returns as a celebration of knowledge, creativity and culture.",
    body: "AMAZIO, the flagship literary fest of our institution, unfolds as a vibrant celebration of knowledge, creativity and cultural expression. The 2026 edition, themed 'The Rooted Tree', brings together competitions in literature, oratory, calligraphy and the arts across the Vadeesunna campus.",
  },
  {
    slug: "noorvia",
    title: "Noorvia — Spiritual Journey",
    date: "Nov 14 – 24, 2025",
    tag: "Event",
    summary:
      "A ten-day spiritual journey programme of reflection, remembrance and character building.",
    body: "Noorvia is a guided spiritual journey held on campus, combining daily dhikr circles, Qur'anic reflection sessions and talks by visiting scholars, designed to deepen the inner life of every student.",
  },
];

export const FACULTY = [
  {
    name: "Sayyid Murthala Shihab Saqafi Thiroorkkad",
    role: "Chairman",
  },
  {
    name: "Shaheer Anas Adani Aykkarappadi",
    role: "Principal",
  },
  {
    name: "Muhyissunna Dars Faculty",
    role: "Senior Ustads — Fiqh, Hadith & Tafsir",
  },
  {
    name: "Academic Wing",
    role: "Humanities, Languages & Social Sciences",
  },
];
