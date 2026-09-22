import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export type StudentBatch = "G4" | "G5" | "G6" | "G7" | "G8" | "G9";

export const STUDENT_BATCHES: StudentBatch[] = ["G4", "G5", "G6", "G7", "G8", "G9"];

export interface StoredStudent {
  id: string;
  name: string;
  batch: StudentBatch;
  login_code_hash: string;
  login_code_enc: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type StudentWorkType =
  "Speech" | "Poem" | "Article" | "Story" | "Essay" | "Drawing" | "Other";

export const STUDENT_WORK_TYPES: StudentWorkType[] = [
  "Speech",
  "Poem",
  "Article",
  "Story",
  "Essay",
  "Drawing",
  "Other",
];

export type StudentSubmissionStatus = "Submitted" | "Under Review" | "Approved" | "Rejected";

export interface StoredStudentSubmission {
  id: string;
  student_id: string;
  student_name: string;
  batch: StudentBatch;
  title: string;
  work_type: StudentWorkType;
  description?: string;
  content?: string;
  media_url?: string;
  file_url?: string;
  file_name?: string;
  status: StudentSubmissionStatus;
  is_published?: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// Locate or initialize the data directory
const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "students.db");
const STUDENTS_JSON_PATH = path.join(DATA_DIR, "students.json");
const SUBMISSIONS_JSON_PATH = path.join(DATA_DIR, "student_submissions.json");

// Secret keys for cryptographic operations
const SECRET_SALT =
  process.env["STUDENT_AUTH_SECRET"] ||
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
  "darusuffa-student-auth-salt-key-982163";

const ENC_KEY = crypto.createHash("sha256").update(SECRET_SALT).digest(); // 32 bytes

function hashLoginCode(code: string, studentId: string): string {
  return crypto
    .createHmac("sha256", SECRET_SALT)
    .update(`${studentId}:${code.trim()}`)
    .digest("hex");
}

function encryptCode(code: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  let enc = cipher.update(code.trim(), "utf8", "hex");
  enc += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${enc}`;
}

export function decryptCode(encString: string): string {
  try {
    const parts = encString.split(":");
    if (parts.length !== 3) return "---";
    const [ivHex, authTagHex, enc] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
    decipher.setAuthTag(authTag);
    let dec = decipher.update(enc, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch {
    return "---";
  }
}

// Session token generation and verification
export function createStudentSessionToken(student: {
  id: string;
  name: string;
  batch: StudentBatch;
}): string {
  const payload = {
    sub: student.id,
    name: student.name,
    batch: student.batch,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET_SALT).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyStudentSessionToken(
  token: string,
): { studentId: string; name: string; batch: StudentBatch } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", SECRET_SALT).update(body).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (json.exp && json.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      studentId: json.sub,
      name: json.name,
      batch: json.batch,
    };
  } catch {
    return null;
  }
}

// Initial student seed data exactly as specified in requirements
// Initial student seed data matching exact batch rosters
const INITIAL_STUDENTS_SEED: Array<{ code: string; name: string; batch: StudentBatch }> = [
  // G4
  { code: "101", name: "Sinan Vellila", batch: "G4" },
  { code: "102", name: "Sahl Padinjatumuri", batch: "G4" },
  { code: "103", name: "Ali Akbar Pazhamallur", batch: "G4" },
  { code: "104", name: "Jabir Gudallur", batch: "G4" },
  { code: "105", name: "Hafiz Sahl Kuttyadi", batch: "G4" },

  // G5
  { code: "106", name: "Shammas Kodumudi", batch: "G5" },
  { code: "107", name: "Shibili Pathakara", batch: "G5" },
  { code: "108", name: "Sinan Valamboor", batch: "G5" },
  { code: "109", name: "Hafiz Sayyid Shammas Karekkad", batch: "G5" },
  { code: "110", name: "Hafiz Sinan Karekkad", batch: "G5" },
  { code: "111", name: "Salmanulfaris Arakkuparamb", batch: "G5" },
  { code: "112", name: "Majid Pacheeri", batch: "G5" },

  // G6
  { code: "113", name: "Sahl Theyyotchira", batch: "G6" },
  { code: "114", name: "Nasih Koottilangadi", batch: "G6" },
  { code: "115", name: "Sabith Munyakurushi", batch: "G6" },
  { code: "116", name: "Shahul Arakkuparamb", batch: "G6" },
  { code: "117", name: "Manas Alamcode", batch: "G6" },
  { code: "118", name: "Shayan Kunnapalli", batch: "G6" },
  { code: "119", name: "Hashim Husain Koduvalli", batch: "G6" },
  { code: "120", name: "Adilshan Manjeri", batch: "G6" },
  { code: "121", name: "Uvais Thootha", batch: "G6" },
  { code: "122", name: "Arshad Arakkuparamb", batch: "G6" },
  { code: "123", name: "Siyaf Alippramba", batch: "G6" },
  { code: "124", name: "Ziyad Alippramba", batch: "G6" },
  { code: "125", name: "Muhammed Saljas", batch: "G6" },

  // G7
  { code: "126", name: "Rabeeh Mahe", batch: "G7" },
  { code: "127", name: "Sajil Vettichira", batch: "G7" },
  { code: "128", name: "Shameer Kollam", batch: "G7" },
  { code: "129", name: "Ajzal Kolathur", batch: "G7" },
  { code: "130", name: "Thayyib Kuttiyadi", batch: "G7" },

  // G8
  { code: "131", name: "Mubashir Pang", batch: "G8" },
  { code: "132", name: "Aboobacker Mahe", batch: "G8" },
  { code: "133", name: "Naseef Mahe", batch: "G8" },
  { code: "134", name: "Haseeb Arakkuparamb", batch: "G8" },
  { code: "135", name: "Anees Thootha", batch: "G8" },
  { code: "136", name: "Iyas Randathani", batch: "G8" },
  { code: "137", name: "Jemshad Valapuram", batch: "G8" },

  // G9
  { code: "138", name: "Thahir Kolathur", batch: "G9" },
  { code: "139", name: "Hafiz Pattambi", batch: "G9" },
  { code: "140", name: "Shamweel Thirur", batch: "G9" },
  { code: "141", name: "Swalih Kadngapuram", batch: "G9" },
  { code: "142", name: "Sayyid Muhammed Shayan", batch: "G9" },
];

let sqliteDb: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!sqliteDb) {
    sqliteDb = new DatabaseSync(DB_PATH);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        batch TEXT NOT NULL,
        login_code_hash TEXT NOT NULL,
        login_code_enc TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS student_submissions (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        batch TEXT NOT NULL,
        title TEXT NOT NULL,
        work_type TEXT NOT NULL,
        description TEXT DEFAULT '',
        content TEXT DEFAULT '',
        media_url TEXT DEFAULT '',
        file_url TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Submitted',
        is_published INTEGER NOT NULL DEFAULT 0,
        admin_notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Ensure is_published column exists on existing installations
    try {
      sqliteDb.exec(
        "ALTER TABLE student_submissions ADD COLUMN is_published INTEGER NOT NULL DEFAULT 0",
      );
    } catch {
      // Column already exists
    }

    // Sync and clean students table with exact official roster
    try {
      const allowedNames = new Set(INITIAL_STUDENTS_SEED.map((s) => s.name.toLowerCase()));
      const allDbStudents = sqliteDb.prepare("SELECT id, name FROM students").all() as Array<{
        id: string;
        name: string;
      }>;
      for (const st of allDbStudents) {
        if (!allowedNames.has(st.name.toLowerCase())) {
          sqliteDb.prepare("DELETE FROM students WHERE id = ?").run(st.id);
        }
      }

      const insertStmt = sqliteDb.prepare(`
        INSERT OR REPLACE INTO students (
          id, name, batch, login_code_hash, login_code_enc, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `);
      const now = new Date().toISOString();

      for (const item of INITIAL_STUDENTS_SEED) {
        const studentId = `stu-${item.code}`;
        const hash = hashLoginCode(item.code, studentId);
        const enc = encryptCode(item.code);
        insertStmt.run(studentId, item.name, item.batch, hash, enc, now, now);
      }
      syncStudentsToJson();
    } catch (err) {
      console.warn("[Students DB] Initial student roster sync error:", err);
    }
    // Restore any submissions from JSON backup if SQLite table is empty or missing items
    try {
      if (fs.existsSync(SUBMISSIONS_JSON_PATH)) {
        const fileContent = fs.readFileSync(SUBMISSIONS_JSON_PATH, "utf8");
        const list = JSON.parse(fileContent);
        if (Array.isArray(list) && list.length > 0) {
          const insertSubStmt = sqliteDb.prepare(`
            INSERT OR IGNORE INTO student_submissions (
              id, student_id, student_name, batch, title, work_type,
              description, content, media_url, file_url, file_name,
              status, is_published, admin_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const s of list) {
            if (s && s.id) {
              insertSubStmt.run(
                s.id,
                s.student_id,
                s.student_name,
                s.batch,
                s.title,
                s.work_type,
                s.description || "",
                s.content || "",
                s.media_url || "",
                s.file_url || "",
                s.file_name || "",
                s.status || "Submitted",
                s.is_published ? 1 : 0,
                s.admin_notes || "",
                s.created_at || new Date().toISOString(),
                s.updated_at || new Date().toISOString(),
              );
            }
          }
        }
      }
    } catch (subRestoreErr) {
      console.warn("[Students DB] Submissions restore error:", subRestoreErr);
    }
  }
  return sqliteDb;
}

function seedInitialStudents(db: DatabaseSync) {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO students (
      id, name, batch, login_code_hash, login_code_enc, active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const item of INITIAL_STUDENTS_SEED) {
    const studentId = `stu-${item.code}`;
    const hash = hashLoginCode(item.code, studentId);
    const enc = encryptCode(item.code);
    insertStmt.run(studentId, item.name, item.batch, hash, enc, now, now);
  }

  // Backup to JSON
  syncStudentsToJson();
}

interface StudentDbRow {
  id: string;
  name: string;
  batch: string;
  login_code_hash: string;
  login_code_enc: string;
  active: number | boolean;
  created_at: string;
  updated_at: string;
}

interface SubmissionDbRow {
  id: string;
  student_id: string;
  student_name: string;
  batch: string;
  title: string;
  work_type: string;
  description?: string;
  content?: string;
  media_url?: string;
  file_url?: string;
  file_name?: string;
  status?: string;
  is_published?: number | boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

function syncStudentsToJson() {
  try {
    if (!sqliteDb) return;
    const rows = sqliteDb.prepare("SELECT * FROM students ORDER BY batch ASC, name ASC").all();
    const list = (rows as unknown as StudentDbRow[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      batch: String(r.batch) as StudentBatch,
      login_code_hash: String(r.login_code_hash),
      login_code_enc: String(r.login_code_enc),
      active: Boolean(r.active),
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    }));
    fs.writeFileSync(STUDENTS_JSON_PATH, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.warn("[Students DB] syncStudentsToJson error:", err);
  }
}

function syncSubmissionsToJson() {
  try {
    if (!sqliteDb) return;
    const rows = sqliteDb
      .prepare("SELECT * FROM student_submissions ORDER BY created_at DESC")
      .all();
    const list = (rows as unknown as SubmissionDbRow[]).map((r) => ({
      id: String(r.id),
      student_id: String(r.student_id),
      student_name: String(r.student_name),
      batch: String(r.batch) as StudentBatch,
      title: String(r.title),
      work_type: String(r.work_type) as StudentWorkType,
      description: String(r.description || ""),
      content: String(r.content || ""),
      media_url: String(r.media_url || ""),
      file_url: String(r.file_url || ""),
      file_name: String(r.file_name || ""),
      status: String(r.status || "Submitted") as StudentSubmissionStatus,
      is_published: Boolean(r.is_published),
      admin_notes: String(r.admin_notes || ""),
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    }));
    fs.writeFileSync(SUBMISSIONS_JSON_PATH, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.warn("[Students DB] syncSubmissionsToJson error:", err);
  }
}

// ----------------- STUDENT OPERATIONS -----------------

export function getAllStudents(): StoredStudent[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM students ORDER BY batch ASC, name ASC").all();
  return (rows as unknown as StudentDbRow[]).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    batch: String(r.batch) as StudentBatch,
    login_code_hash: String(r.login_code_hash),
    login_code_enc: String(r.login_code_enc),
    active: Boolean(r.active),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }));
}

export function getStudentById(id: string): StoredStudent | null {
  const db = getDb();
  const r = db.prepare("SELECT * FROM students WHERE id = ?").get(id) as unknown as
    StudentDbRow | undefined;
  if (!r) return null;
  return {
    id: String(r.id),
    name: String(r.name),
    batch: String(r.batch) as StudentBatch,
    login_code_hash: String(r.login_code_hash),
    login_code_enc: String(r.login_code_enc),
    active: Boolean(r.active),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

export function createStudent(data: {
  name: string;
  batch: StudentBatch;
  login_code: string;
  active?: boolean;
}): StoredStudent {
  const db = getDb();
  const cleanCode = data.login_code.trim();
  const id = `stu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const hash = hashLoginCode(cleanCode, id);
  const enc = encryptCode(cleanCode);
  const now = new Date().toISOString();
  const activeInt = data.active !== false ? 1 : 0;

  db.prepare(
    `
    INSERT INTO students (
      id, name, batch, login_code_hash, login_code_enc, active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(id, data.name.trim(), data.batch, hash, enc, activeInt, now, now);

  syncStudentsToJson();
  return {
    id,
    name: data.name.trim(),
    batch: data.batch,
    login_code_hash: hash,
    login_code_enc: enc,
    active: data.active !== false,
    created_at: now,
    updated_at: now,
  };
}

export function updateStudent(
  id: string,
  updates: {
    name?: string;
    batch?: StudentBatch;
    login_code?: string;
    active?: boolean;
  },
): StoredStudent | null {
  const existing = getStudentById(id);
  if (!existing) return null;

  const db = getDb();
  const now = new Date().toISOString();

  const newName = updates.name !== undefined ? updates.name.trim() : existing.name;
  const newBatch = updates.batch !== undefined ? updates.batch : existing.batch;
  const newActive =
    updates.active !== undefined ? (updates.active ? 1 : 0) : existing.active ? 1 : 0;

  let newHash = existing.login_code_hash;
  let newEnc = existing.login_code_enc;

  if (updates.login_code && updates.login_code.trim().length > 0) {
    const clean = updates.login_code.trim();
    newHash = hashLoginCode(clean, id);
    newEnc = encryptCode(clean);
  }

  db.prepare(
    `
    UPDATE students SET
      name = ?,
      batch = ?,
      login_code_hash = ?,
      login_code_enc = ?,
      active = ?,
      updated_at = ?
    WHERE id = ?
  `,
  ).run(newName, newBatch, newHash, newEnc, newActive, now, id);

  syncStudentsToJson();
  return getStudentById(id);
}

export function deleteStudent(id: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM students WHERE id = ?").run(id);
  db.prepare("DELETE FROM student_submissions WHERE student_id = ?").run(id);
  syncStudentsToJson();
  syncSubmissionsToJson();
  return true;
}

export function getActiveStudents(
  batch?: string,
): Array<{ id: string; name: string; batch: StudentBatch }> {
  const db = getDb();
  let query = "SELECT id, name, batch FROM students WHERE active = 1";
  const params: unknown[] = [];
  if (batch && batch !== "All") {
    query += " AND batch = ?";
    params.push(batch);
  }
  query += " ORDER BY name ASC";
  const rows = db.prepare(query).all(...params) as Array<{
    id: string;
    name: string;
    batch: string;
  }>;
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    batch: String(r.batch) as StudentBatch,
  }));
}

/**
 * Validates student login based on Name/ID + Batch + 3-digit Login Code.
 * Checks active status and compares hash in constant time.
 */
export function authenticateStudent(
  nameOrId: string,
  batch: string,
  loginCode: string,
): StoredStudent | null {
  if (!nameOrId || !batch || !loginCode) return null;

  const cleanIdentifier = nameOrId.trim().toLowerCase().replace(/\s+/g, " ");
  const cleanBatch = batch.trim().toUpperCase();
  const cleanCode = loginCode.trim();

  if (cleanCode.length !== 3 || !/^\d{3}$/.test(cleanCode)) {
    return null;
  }

  const all = getAllStudents();
  for (const student of all) {
    if (!student.active) continue;
    if (student.batch !== cleanBatch) continue;

    const dbName = student.name.trim().toLowerCase().replace(/\s+/g, " ");
    const matches = student.id === nameOrId.trim() || dbName === cleanIdentifier;

    if (matches) {
      // Verify hash
      const computedHash = hashLoginCode(cleanCode, student.id);
      try {
        const bufA = Buffer.from(student.login_code_hash);
        const bufB = Buffer.from(computedHash);
        if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
          return student;
        }
      } catch {
        // Fallback standard comparison if lengths differ
        if (student.login_code_hash === computedHash) {
          return student;
        }
      }
    }
  }

  return null;
}

// ----------------- SUBMISSION OPERATIONS -----------------

export function getAllSubmissions(): StoredStudentSubmission[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM student_submissions ORDER BY created_at DESC").all();
  return (rows as unknown as SubmissionDbRow[]).map((r) => ({
    id: String(r.id),
    student_id: String(r.student_id),
    student_name: String(r.student_name),
    batch: String(r.batch) as StudentBatch,
    title: String(r.title),
    work_type: String(r.work_type) as StudentWorkType,
    description: String(r.description || ""),
    content: String(r.content || ""),
    media_url: String(r.media_url || ""),
    file_url: String(r.file_url || ""),
    file_name: String(r.file_name || ""),
    status: String(r.status || "Submitted") as StudentSubmissionStatus,
    is_published: Boolean(r.is_published),
    admin_notes: String(r.admin_notes || ""),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }));
}

export function getSubmissionsByStudentId(studentId: string): StoredStudentSubmission[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM student_submissions WHERE student_id = ? ORDER BY created_at DESC")
    .all(studentId);
  return (rows as unknown as SubmissionDbRow[]).map((r) => ({
    id: String(r.id),
    student_id: String(r.student_id),
    student_name: String(r.student_name),
    batch: String(r.batch) as StudentBatch,
    title: String(r.title),
    work_type: String(r.work_type) as StudentWorkType,
    description: String(r.description || ""),
    content: String(r.content || ""),
    media_url: String(r.media_url || ""),
    file_url: String(r.file_url || ""),
    file_name: String(r.file_name || ""),
    status: String(r.status || "Submitted") as StudentSubmissionStatus,
    is_published: Boolean(r.is_published),
    admin_notes: String(r.admin_notes || ""),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }));
}

export function getSubmissionById(id: string): StoredStudentSubmission | null {
  const db = getDb();
  const r = db.prepare("SELECT * FROM student_submissions WHERE id = ?").get(id) as unknown as
    SubmissionDbRow | undefined;
  if (!r) return null;
  return {
    id: String(r.id),
    student_id: String(r.student_id),
    student_name: String(r.student_name),
    batch: String(r.batch) as StudentBatch,
    title: String(r.title),
    work_type: String(r.work_type) as StudentWorkType,
    description: String(r.description || ""),
    content: String(r.content || ""),
    media_url: String(r.media_url || ""),
    file_url: String(r.file_url || ""),
    file_name: String(r.file_name || ""),
    status: String(r.status || "Submitted") as StudentSubmissionStatus,
    is_published: Boolean(r.is_published),
    admin_notes: String(r.admin_notes || ""),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

export function getPublishedSubmissions(filter?: {
  work_type?: string;
  batch?: string;
}): StoredStudentSubmission[] {
  const db = getDb();
  let query =
    "SELECT * FROM student_submissions WHERE (is_published = 1 OR is_published IS NULL) AND status != 'Rejected'";
  const params: unknown[] = [];
  if (filter?.work_type && filter.work_type !== "All") {
    query += " AND work_type = ?";
    params.push(filter.work_type);
  }
  if (filter?.batch && filter.batch !== "All") {
    query += " AND batch = ?";
    params.push(filter.batch);
  }
  query += " ORDER BY created_at DESC";
  const rows = db.prepare(query).all(...params);
  return (rows as unknown as SubmissionDbRow[]).map((r) => ({
    id: String(r.id),
    student_id: String(r.student_id),
    student_name: String(r.student_name),
    batch: String(r.batch) as StudentBatch,
    title: String(r.title),
    work_type: String(r.work_type) as StudentWorkType,
    description: String(r.description || ""),
    content: String(r.content || ""),
    media_url: String(r.media_url || ""),
    file_url: String(r.file_url || ""),
    file_name: String(r.file_name || ""),
    status: String(r.status || "Approved") as StudentSubmissionStatus,
    is_published: true,
    admin_notes: "", // Never leak faculty notes to public
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }));
}

export function createSubmission(data: {
  student_id: string;
  student_name: string;
  batch: StudentBatch;
  title: string;
  work_type: StudentWorkType;
  description?: string;
  content?: string;
  media_url?: string;
  file_url?: string;
  file_name?: string;
}): StoredStudentSubmission {
  const db = getDb();
  const id = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO student_submissions (
      id, student_id, student_name, batch, title, work_type,
      description, content, media_url, file_url, file_name,
      status, is_published, admin_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', 1, '', ?, ?)
  `,
  ).run(
    id,
    data.student_id,
    data.student_name,
    data.batch,
    data.title.trim(),
    data.work_type,
    data.description?.trim() || "",
    data.content?.trim() || "",
    data.media_url || "",
    data.file_url || "",
    data.file_name || "",
    now,
    now,
  );

  syncSubmissionsToJson();

  return {
    id,
    student_id: data.student_id,
    student_name: data.student_name,
    batch: data.batch,
    title: data.title.trim(),
    work_type: data.work_type,
    description: data.description?.trim() || "",
    content: data.content?.trim() || "",
    media_url: data.media_url || "",
    file_url: data.file_url || "",
    file_name: data.file_name || "",
    status: "Approved",
    is_published: true,
    admin_notes: "",
    created_at: now,
    updated_at: now,
  };
}

export function updateSubmission(
  id: string,
  updates: Partial<StoredStudentSubmission>,
): StoredStudentSubmission | null {
  const existing = getSubmissionById(id);
  if (!existing) return null;

  const db = getDb();
  const now = new Date().toISOString();

  const title = updates.title !== undefined ? updates.title.trim() : existing.title;
  const work_type = updates.work_type !== undefined ? updates.work_type : existing.work_type;
  const description =
    updates.description !== undefined ? updates.description : existing.description;
  const content = updates.content !== undefined ? updates.content : existing.content;
  const media_url = updates.media_url !== undefined ? updates.media_url : existing.media_url;
  const file_url = updates.file_url !== undefined ? updates.file_url : existing.file_url;
  const file_name = updates.file_name !== undefined ? updates.file_name : existing.file_name;
  const status = updates.status !== undefined ? updates.status : existing.status;
  const is_published =
    updates.is_published !== undefined
      ? updates.is_published
        ? 1
        : 0
      : existing.is_published
        ? 1
        : 0;
  const admin_notes =
    updates.admin_notes !== undefined ? updates.admin_notes : existing.admin_notes;

  db.prepare(
    `
    UPDATE student_submissions SET
      title = ?,
      work_type = ?,
      description = ?,
      content = ?,
      media_url = ?,
      file_url = ?,
      file_name = ?,
      status = ?,
      is_published = ?,
      admin_notes = ?,
      updated_at = ?
    WHERE id = ?
  `,
  ).run(
    title,
    work_type,
    description,
    content,
    media_url,
    file_url,
    file_name,
    status,
    is_published,
    admin_notes,
    now,
    id,
  );

  syncSubmissionsToJson();
  return getSubmissionById(id);
}

export function deleteSubmission(id: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM student_submissions WHERE id = ?").run(id);
  syncSubmissionsToJson();
  return true;
}
