import { supabase } from "@/integrations/supabase/client";
import defaultStudentsList from "./default-students.json";
import defaultSubmissionsList from "./default-submissions.json";

export type StudentBatch = "G4" | "G5" | "G6" | "G7" | "G8" | "G9";
export const STUDENT_BATCHES: StudentBatch[] = ["G4", "G5", "G6", "G7", "G8", "G9"];

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

export interface Student {
  id: string;
  name: string;
  batch: StudentBatch;
  login_code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentSubmission {
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

// In-memory cache for ultra-fast UI rendering
let cachedStudents: Student[] | null = null;
let cachedSubmissions: StudentSubmission[] | null = null;

// Helper to safely parse JSON from a fetch response without throwing SyntaxError on HTML (e.g. <!DOCTYPE html>)
export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";

    // If response is HTML or not JSON, do not attempt res.json()
    if (!contentType.includes("application/json")) {
      return {
        ok: false,
        data: null,
        error: `Server returned non-JSON content (${contentType.split(";")[0] || "unknown"})`,
      };
    }

    const data = (await res.json()) as T;
    return {
      ok: res.ok,
      data,
      error: !res.ok ? "Request failed" : undefined,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ---------------------------------------------------------------------------
// ADMIN: STUDENTS MANAGEMENT
// ---------------------------------------------------------------------------

export async function fetchAdminStudents(): Promise<Student[]> {
  // 1. Try local server API first if running in full Node environment
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const apiResult = await safeFetchJson<{ students: Student[] }>("/api/admin/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (apiResult.ok && Array.isArray(apiResult.data?.students)) {
        cachedStudents = apiResult.data.students;
        return apiResult.data.students;
      }
    }
  } catch {
    // API not reachable
  }

  // 2. Fetch from Supabase site_settings (students_data key)
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "students_data")
      .maybeSingle();

    if (!error && data?.value && Array.isArray(data.value) && data.value.length > 0) {
      const list = data.value as Student[];
      cachedStudents = list;
      return list;
    }
  } catch (err) {
    console.warn("[StudentsService] Error reading from Supabase site_settings:", err);
  }

  // 3. Fallback to cached or bundled default students (73 verified students)
  if (cachedStudents && cachedStudents.length > 0) {
    return cachedStudents;
  }

  const defaults = (defaultStudentsList as Student[]) || [];
  cachedStudents = defaults;
  return defaults;
}

export async function createAdminStudent(payload: {
  name: string;
  batch: StudentBatch;
  login_code: string;
  active?: boolean;
}): Promise<Student> {
  const cleanName = payload.name.trim();
  const cleanCode = payload.login_code.trim();

  if (!cleanName) {
    throw new Error("Student name is required.");
  }
  if (!cleanCode || !/^\d{3}$/.test(cleanCode)) {
    throw new Error("Login code must be exactly 3 digits (e.g. 101).");
  }

  const currentStudents = await fetchAdminStudents();

  // Check code uniqueness within batch
  const existingCode = currentStudents.find(
    (s) => s.batch === payload.batch && s.login_code === cleanCode,
  );
  if (existingCode) {
    throw new Error(
      `Login code ${cleanCode} is already assigned to ${existingCode.name} in batch ${payload.batch}.`,
    );
  }

  const now = new Date().toISOString();
  const newStudent: Student = {
    id: `stu-${payload.batch.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    batch: payload.batch,
    login_code: cleanCode,
    active: payload.active !== false,
    created_at: now,
    updated_at: now,
  };

  const updatedStudents = [newStudent, ...currentStudents];
  cachedStudents = updatedStudents;

  // Persist directly to Supabase site_settings
  const { error: sbError } = await supabase
    .from("site_settings")
    .upsert({ key: "students_data", value: updatedStudents }, { onConflict: "key" });

  if (sbError) {
    console.error("[StudentsService] Failed to save student to Supabase:", sbError);
    // Non-fatal if session has temporary network issue
  }

  // Also notify server API if available
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      await safeFetchJson("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    // ignore
  }

  return newStudent;
}

export async function updateAdminStudent(payload: {
  id: string;
  name?: string;
  batch?: StudentBatch;
  login_code?: string;
  active?: boolean;
}): Promise<Student> {
  const currentStudents = await fetchAdminStudents();
  const index = currentStudents.findIndex((s) => s.id === payload.id);
  if (index === -1) {
    throw new Error("Student not found.");
  }

  const existing = currentStudents[index];
  const now = new Date().toISOString();

  const updatedStudent: Student = {
    ...existing,
    name: payload.name !== undefined ? payload.name.trim() : existing.name,
    batch: payload.batch !== undefined ? payload.batch : existing.batch,
    login_code: payload.login_code !== undefined ? payload.login_code.trim() : existing.login_code,
    active: payload.active !== undefined ? payload.active : existing.active,
    updated_at: now,
  };

  const updatedStudents = [...currentStudents];
  updatedStudents[index] = updatedStudent;
  cachedStudents = updatedStudents;

  // Persist to Supabase site_settings
  const { error: sbError } = await supabase
    .from("site_settings")
    .upsert({ key: "students_data", value: updatedStudents }, { onConflict: "key" });

  if (sbError) {
    console.error("[StudentsService] Failed to update student in Supabase:", sbError);
  }

  // Also notify server API if available
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      await safeFetchJson("/api/admin/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    // ignore
  }

  return updatedStudent;
}

export async function deleteAdminStudent(id: string): Promise<boolean> {
  const currentStudents = await fetchAdminStudents();
  const updatedStudents = currentStudents.filter((s) => s.id !== id);
  cachedStudents = updatedStudents;

  // Persist to Supabase
  const { error: sbError } = await supabase
    .from("site_settings")
    .upsert({ key: "students_data", value: updatedStudents }, { onConflict: "key" });

  if (sbError) {
    console.error("[StudentsService] Failed to delete student in Supabase:", sbError);
  }

  // Also notify server API if available
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      await safeFetchJson(`/api/admin/students?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // ignore
  }

  return true;
}

// ---------------------------------------------------------------------------
// ADMIN: SUBMISSIONS MANAGEMENT
// ---------------------------------------------------------------------------

export async function fetchAdminSubmissions(): Promise<StudentSubmission[]> {
  // 1. Try local server API
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const apiResult = await safeFetchJson<{ submissions: StudentSubmission[] }>(
        "/api/admin/submissions",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (apiResult.ok && Array.isArray(apiResult.data?.submissions)) {
        cachedSubmissions = apiResult.data.submissions;
        return apiResult.data.submissions;
      }
    }
  } catch {
    // API not reachable
  }

  // 2. Fetch from Supabase site_settings (student_submissions_data)
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "student_submissions_data")
      .maybeSingle();

    if (!error && data?.value && Array.isArray(data.value)) {
      const list = data.value as StudentSubmission[];
      cachedSubmissions = list;
      return list;
    }
  } catch (err) {
    console.warn("[StudentsService] Error fetching submissions from Supabase:", err);
  }

  if (cachedSubmissions && cachedSubmissions.length > 0) {
    return cachedSubmissions;
  }

  const defaults = (defaultSubmissionsList as StudentSubmission[]) || [];
  cachedSubmissions = defaults;
  return defaults;
}

export async function updateAdminSubmission(payload: {
  id: string;
  status: StudentSubmissionStatus;
  is_published?: boolean;
  admin_notes?: string;
}): Promise<StudentSubmission> {
  const currentSubmissions = await fetchAdminSubmissions();
  const index = currentSubmissions.findIndex((s) => s.id === payload.id);
  if (index === -1) {
    throw new Error("Submission not found.");
  }

  const existing = currentSubmissions[index];
  const now = new Date().toISOString();

  const updated: StudentSubmission = {
    ...existing,
    status: payload.status,
    is_published: payload.is_published !== undefined ? payload.is_published : existing.is_published,
    admin_notes: payload.admin_notes !== undefined ? payload.admin_notes : existing.admin_notes,
    updated_at: now,
  };

  const updatedList = [...currentSubmissions];
  updatedList[index] = updated;
  cachedSubmissions = updatedList;

  // Persist to Supabase site_settings
  await supabase
    .from("site_settings")
    .upsert({ key: "student_submissions_data", value: updatedList }, { onConflict: "key" });

  // Also call API if available
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      await safeFetchJson("/api/admin/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    // ignore
  }

  return updated;
}

export async function deleteAdminSubmission(id: string): Promise<boolean> {
  const currentSubmissions = await fetchAdminSubmissions();
  const updatedList = currentSubmissions.filter((s) => s.id !== id);
  cachedSubmissions = updatedList;

  // Persist to Supabase site_settings
  await supabase
    .from("site_settings")
    .upsert({ key: "student_submissions_data", value: updatedList }, { onConflict: "key" });

  // Also call API if available
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      await safeFetchJson(`/api/admin/submissions?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // ignore
  }

  return true;
}

// ---------------------------------------------------------------------------
// PUBLIC / STUDENT LOGIN & WORKS
// ---------------------------------------------------------------------------

export async function fetchPublicStudentsForBatch(
  batch: StudentBatch,
): Promise<Array<{ id: string; name: string; batch: StudentBatch }>> {
  const allStudents = await fetchAdminStudents();
  return allStudents
    .filter((s) => s.batch === batch && s.active !== false)
    .map((s) => ({
      id: s.id,
      name: s.name,
      batch: s.batch,
    }));
}

export async function verifyStudentLogin(
  batch: StudentBatch,
  studentId: string,
  loginCode: string,
): Promise<{ success: boolean; token?: string; student?: Student; message?: string }> {
  const cleanCode = loginCode.trim();
  const allStudents = await fetchAdminStudents();
  const student = allStudents.find((s) => s.id === studentId && s.batch === batch);

  if (!student) {
    return { success: false, message: "Student record not found." };
  }

  if (student.active === false) {
    return {
      success: false,
      message: "Student account is currently inactive. Please contact administration.",
    };
  }

  if (student.login_code !== cleanCode) {
    return { success: false, message: "Incorrect 3-digit login code. Please try again." };
  }

  // Create client session token
  const payload = {
    id: student.id,
    name: student.name,
    batch: student.batch,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const token = btoa(JSON.stringify(payload));
  return {
    success: true,
    token,
    student,
  };
}

export async function fetchPublicStudentWorks(
  batchFilter?: string,
  typeFilter?: string,
): Promise<StudentSubmission[]> {
  const all = await fetchAdminSubmissions();
  return all
    .filter((w) => {
      if (w.status !== "Approved") return false;
      if (w.is_published === false) return false;
      if (batchFilter && batchFilter !== "All" && w.batch !== batchFilter) return false;
      if (typeFilter && typeFilter !== "All" && w.work_type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function fetchStudentMySubmissions(studentId: string): Promise<StudentSubmission[]> {
  const all = await fetchAdminSubmissions();
  return all
    .filter((w) => w.student_id === studentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function submitStudentWorkClient(
  student: { id: string; name: string; batch: StudentBatch },
  payload: {
    title: string;
    work_type: StudentWorkType;
    description?: string;
    content?: string;
    media_url?: string;
    file_url?: string;
    file_name?: string;
  },
): Promise<StudentSubmission> {
  const now = new Date().toISOString();
  const newSubmission: StudentSubmission = {
    id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    student_id: student.id,
    student_name: student.name,
    batch: student.batch,
    title: payload.title.trim(),
    work_type: payload.work_type,
    description: payload.description?.trim() || "",
    content: payload.content?.trim() || "",
    media_url: payload.media_url || "",
    file_url: payload.file_url || "",
    file_name: payload.file_name || "",
    status: "Approved", // Student portal auto-approves student works as designed
    is_published: true,
    admin_notes: "",
    created_at: now,
    updated_at: now,
  };

  const current = await fetchAdminSubmissions();
  const updatedList = [newSubmission, ...current];
  cachedSubmissions = updatedList;

  // 1. Save directly to Supabase site_settings
  try {
    await supabase
      .from("site_settings")
      .upsert({ key: "student_submissions_data", value: updatedList }, { onConflict: "key" });
  } catch (err) {
    console.warn("[StudentsService] site_settings save note:", err);
  }

  // 2. Also record in enquiries table as submission backup
  try {
    await supabase.from("enquiries").insert({
      student_name: student.name,
      parent_name: `Batch: ${student.batch}`,
      phone: student.id,
      email: `${student.id}@student.darusuffa.org`,
      course: `StudentWork: ${payload.work_type}`,
      admission_year: new Date().getFullYear().toString(),
      message: `[STUDENT WORK SUBMISSION]\nTitle: ${payload.title}\nType: ${payload.work_type}\nDescription: ${payload.description || ""}\nContent: ${payload.content || ""}\nMedia: ${payload.media_url || ""}\n--PAYLOAD--:${JSON.stringify(newSubmission)}`,
      is_read: false,
      is_contacted: false,
    });
  } catch {
    // Non-fatal
  }

  return newSubmission;
}

export async function updateStudentWorkClient(
  studentId: string,
  payload: {
    id: string;
    title: string;
    work_type: StudentWorkType;
    description?: string;
    content?: string;
    media_url?: string;
    file_url?: string;
    file_name?: string;
  },
): Promise<StudentSubmission> {
  const current = await fetchAdminSubmissions();
  const index = current.findIndex((w) => w.id === payload.id && w.student_id === studentId);
  if (index === -1) {
    throw new Error("Submission not found or unauthorized.");
  }

  const existing = current[index];
  const updated: StudentSubmission = {
    ...existing,
    title: payload.title.trim(),
    work_type: payload.work_type,
    description:
      payload.description !== undefined ? payload.description.trim() : existing.description,
    content: payload.content !== undefined ? payload.content.trim() : existing.content,
    media_url: payload.media_url !== undefined ? payload.media_url : existing.media_url,
    file_url: payload.file_url !== undefined ? payload.file_url : existing.file_url,
    file_name: payload.file_name !== undefined ? payload.file_name : existing.file_name,
    updated_at: new Date().toISOString(),
  };

  const updatedList = [...current];
  updatedList[index] = updated;
  cachedSubmissions = updatedList;

  try {
    await supabase
      .from("site_settings")
      .upsert({ key: "student_submissions_data", value: updatedList }, { onConflict: "key" });
  } catch {
    // ignore
  }

  return updated;
}

export async function deleteStudentWorkClient(
  studentId: string,
  submissionId: string,
): Promise<boolean> {
  const current = await fetchAdminSubmissions();
  const updatedList = current.filter((w) => !(w.id === submissionId && w.student_id === studentId));
  cachedSubmissions = updatedList;

  try {
    await supabase
      .from("site_settings")
      .upsert({ key: "student_submissions_data", value: updatedList }, { onConflict: "key" });
  } catch {
    // ignore
  }

  return true;
}
