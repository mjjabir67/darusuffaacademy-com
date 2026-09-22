import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

export type StudentBatch = "G4" | "G5" | "G6" | "G7" | "G8" | "G9";

export const STUDENT_BATCHES: StudentBatch[] = ["G4", "G5", "G6", "G7", "G8", "G9"];

export interface StudentProfile {
  id: string;
  name: string;
  batch: StudentBatch;
}

const STORAGE_TOKEN_KEY = "darusuffa_student_token";
const STORAGE_PROFILE_KEY = "darusuffa_student_profile";

export function getStoredStudentToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredStudentProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStudentSession(token: string, profile: StudentProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn("[student-auth] Failed to persist session:", err);
  }
}

export function clearStudentSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_PROFILE_KEY);
  } catch (err) {
    console.warn("[student-auth] Failed to clear session:", err);
  }
}

export function useStudentAuth(redirectToLogin = false) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(getStoredStudentToken());
  const [student, setStudent] = useState<StudentProfile | null>(getStoredStudentProfile());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearStudentSession();
    setToken(null);
    setStudent(null);
    navigate({ to: "/student-login" });
  }, [navigate]);

  useEffect(() => {
    const storedToken = getStoredStudentToken();
    if (!storedToken) {
      setLoading(false);
      if (redirectToLogin) {
        navigate({ to: "/student-login" });
      }
      return;
    }

    let isMounted = true;
    fetch("/api/student/session", {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Session expired or invalid");
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.valid && data.student) {
          setStudent(data.student);
          setToken(storedToken);
          setStudentSession(storedToken, data.student);
        } else {
          clearStudentSession();
          setStudent(null);
          setToken(null);
          if (redirectToLogin) {
            navigate({ to: "/student-login" });
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Session verification failed");
        clearStudentSession();
        setStudent(null);
        setToken(null);
        if (redirectToLogin) {
          navigate({ to: "/student-login" });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [redirectToLogin, navigate]);

  return {
    token,
    student,
    loading,
    error,
    isAuthenticated: Boolean(token && student),
    logout,
  };
}
