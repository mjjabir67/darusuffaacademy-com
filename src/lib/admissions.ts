import { supabase } from "@/integrations/supabase/client";
import type { AdmissionApplication, AdmissionApplicationStatus, Enquiry } from "@/lib/cms";

export interface ApplicationFormValues {
  class_to_join: string;
  student_name: string;
  father_name: string;
  address: string;
  place: string;
  district: string;
  phone: string;
  whatsapp: string;
  [key: string]: string;
}

export function parseEnquiryToApplication(enquiry: Enquiry): AdmissionApplication {
  let customFields: Record<string, string> = {};
  let status: AdmissionApplicationStatus = "New";
  let appId = enquiry.id;
  let whatsapp = enquiry.phone;
  let address = "";
  let place = "";
  let district = "";
  let classToJoin = enquiry.course.replace(/^Admission:\s*/i, "").trim();

  if (enquiry.message && enquiry.message.includes("--PAYLOAD--:")) {
    try {
      const payloadStr = enquiry.message.split("--PAYLOAD--:")[1];
      const payload = JSON.parse(payloadStr);
      if (payload && typeof payload === "object") {
        if (payload.id) appId = payload.id;
        if (payload.whatsapp || payload.whatsapp_number) {
          whatsapp = payload.whatsapp || payload.whatsapp_number;
        }
        if (payload.address) address = payload.address;
        if (payload.place) place = payload.place;
        if (payload.district) district = payload.district;
        if (payload.class_to_join) classToJoin = payload.class_to_join;
        if (payload.status) status = payload.status as AdmissionApplicationStatus;
        if (payload.custom_fields) customFields = payload.custom_fields;
      }
    } catch {
      // ignore json parse error
    }
  }

  // Fallback to enquiry status if not in payload
  if (status === "New") {
    if (enquiry.is_contacted) {
      status = "Accepted";
    } else if (enquiry.is_read) {
      status = "Reviewing";
    }
  }

  return {
    id: appId,
    student_name: enquiry.student_name,
    father_name: enquiry.parent_name,
    class_to_join: classToJoin || "General",
    phone: enquiry.phone,
    whatsapp: whatsapp || enquiry.phone,
    address: address,
    place: place,
    district: district,
    status: status,
    created_at: enquiry.created_at,
    notes: "",
    custom_fields: customFields,
  };
}

export async function submitAdmissionApplication(
  appValues: ApplicationFormValues,
  admissionYear?: string,
): Promise<{ success: boolean; message: string; applicationId: string }> {
  const {
    class_to_join,
    student_name,
    father_name,
    address,
    place,
    district,
    phone,
    whatsapp,
    ...customRest
  } = appValues;

  const studentName = (student_name || "").trim();
  const fatherName = (father_name || "").trim();
  const classToJoin = (class_to_join || "").trim();
  const phoneVal = (phone || "").trim();
  const whatsappVal = (whatsapp || phoneVal).trim();
  const addressVal = (address || "").trim();
  const placeVal = (place || "").trim();
  const districtVal = (district || "").trim();
  const yearVal = admissionYear || new Date().getFullYear().toString();

  const generatedId = `APP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const applicationPayload: AdmissionApplication = {
    id: generatedId,
    student_name: studentName,
    father_name: fatherName,
    class_to_join: classToJoin,
    phone: phoneVal,
    whatsapp: whatsappVal,
    address: addressVal,
    place: placeVal,
    district: districtVal,
    status: "New",
    created_at: new Date().toISOString(),
    custom_fields: customRest,
  };

  // 1. Try server API endpoint first if running in full-stack Node environment
  let apiSucceeded = false;
  let apiMessage = "";
  let finalAppId = generatedId;

  try {
    const res = await fetch("/api/admissions/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_name: studentName,
        father_name: fatherName,
        class_to_join: classToJoin,
        phone: phoneVal,
        phone_number: phoneVal,
        whatsapp: whatsappVal,
        whatsapp_number: whatsappVal,
        address: addressVal,
        place: placeVal,
        district: districtVal,
        custom_fields: customRest,
      }),
    });

    const contentType = res.headers.get("content-type") || "";
    // Only attempt JSON parse if content-type is json
    if (contentType.includes("application/json")) {
      const resData = await res.json().catch(() => null);
      if (res.ok && resData && resData.success) {
        apiSucceeded = true;
        apiMessage =
          resData.message ||
          "Application submitted successfully. Your application has been received by Darusuffa Academy.";
        finalAppId = resData.application?.id || generatedId;
      }
    }
  } catch {
    // API endpoint not reachable or running in static hosting
  }

  if (apiSucceeded) {
    // Store in local storage cache for convenience
    try {
      const cached = JSON.parse(localStorage.getItem("darusuffa_my_admissions") || "[]");
      cached.unshift(applicationPayload);
      localStorage.setItem("darusuffa_my_admissions", JSON.stringify(cached.slice(0, 50)));
    } catch {
      // ignore
    }

    return {
      success: true,
      message: apiMessage,
      applicationId: finalAppId,
    };
  }

  // 2. Direct Supabase Storage via enquiries table (publicly authorized for anon insert)
  const structuredMessage = [
    "[ADMISSION APPLICATION]",
    `Application ID: ${generatedId}`,
    `Class: ${classToJoin}`,
    `Student: ${studentName}`,
    `Father: ${fatherName}`,
    `Phone: ${phoneVal}`,
    `WhatsApp: ${whatsappVal}`,
    `Address: ${addressVal}`,
    `Place: ${placeVal}`,
    `District: ${districtVal}`,
    `--PAYLOAD--:${JSON.stringify(applicationPayload)}`,
  ].join("\n");

  const emailVal =
    (customRest.email as string)?.trim() ||
    `${phoneVal.replace(/\D/g, "") || "applicant"}@admission.darusuffa.org`;

  const { error: sbError } = await supabase.from("enquiries").insert({
    student_name: studentName,
    parent_name: fatherName,
    phone: phoneVal,
    email: emailVal,
    course: `Admission: ${classToJoin}`,
    admission_year: yearVal,
    message: structuredMessage,
    is_read: false,
    is_contacted: false,
  });

  if (sbError) {
    console.error("[Admission] Database insert error:", sbError);
    throw new Error(
      "Unable to save your admission application. Please check your network connection and try again.",
    );
  }

  // Sync with site_settings admission_applications if possible
  try {
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "admission_applications")
      .maybeSingle();

    const existingList =
      settingsData?.value && Array.isArray(settingsData.value)
        ? (settingsData.value as AdmissionApplication[])
        : [];

    await supabase.from("site_settings").upsert(
      {
        key: "admission_applications",
        value: [applicationPayload, ...existingList],
      },
      { onConflict: "key" },
    );
  } catch {
    // Non-fatal if anon
  }

  // Local storage cache
  try {
    const cached = JSON.parse(localStorage.getItem("darusuffa_my_admissions") || "[]");
    cached.unshift(applicationPayload);
    localStorage.setItem("darusuffa_my_admissions", JSON.stringify(cached.slice(0, 50)));
  } catch {
    // ignore
  }

  return {
    success: true,
    message:
      "Application submitted successfully. Your application has been received by Darusuffa Academy.",
    applicationId: generatedId,
  };
}

export async function fetchAdmissionApplications(): Promise<AdmissionApplication[]> {
  const result: AdmissionApplication[] = [];
  const seenIds = new Set<string>();

  // 1. Try Server API if active
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (token) {
      const res = await fetch("/api/admissions/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const json = await res.json().catch(() => null);
        if (json && Array.isArray(json.applications)) {
          for (const app of json.applications) {
            if (app && app.id && !seenIds.has(app.id)) {
              seenIds.add(app.id);
              result.push(app);
            }
          }
        }
      }
    }
  } catch {
    // API not reachable
  }

  // 2. Fetch from Supabase enquiries table
  try {
    const { data: enqData, error: enqError } = await supabase
      .from("enquiries")
      .select("*")
      .like("message", "%[ADMISSION APPLICATION]%")
      .order("created_at", { ascending: false });

    if (!enqError && Array.isArray(enqData)) {
      for (const row of enqData) {
        const parsed = parseEnquiryToApplication(row as Enquiry);
        if (parsed.id && !seenIds.has(parsed.id)) {
          seenIds.add(parsed.id);
          result.push(parsed);
        }
      }
    }
  } catch (err) {
    console.warn("[Admissions] Failed to load from enquiries:", err);
  }

  // 3. Merge with site_settings admission_applications
  try {
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "admission_applications")
      .maybeSingle();

    if (settingsData?.value && Array.isArray(settingsData.value)) {
      for (const app of settingsData.value as AdmissionApplication[]) {
        if (app && app.id) {
          const existingIndex = result.findIndex((r) => r.id === app.id);
          if (existingIndex >= 0) {
            result[existingIndex] = { ...result[existingIndex], ...app };
          } else {
            seenIds.add(app.id);
            result.push(app);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateAdmissionApplicationStatus(
  appId: string,
  newStatus: AdmissionApplicationStatus,
  currentList: AdmissionApplication[],
  notes?: string,
): Promise<void> {
  // 1. Try API PATCH
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch("/api/admissions/applications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id: appId, status: newStatus, notes }),
    });
  } catch {
    // API not reachable
  }

  // 2. Update Supabase enquiries row if ID matches
  try {
    await supabase
      .from("enquiries")
      .update({
        is_read: true,
        is_contacted: newStatus === "Accepted",
      })
      .eq("id", appId);
  } catch {
    // Non-fatal
  }

  // 3. Update Supabase site_settings
  try {
    const updatedList = currentList.map((a) =>
      a.id === appId ? { ...a, status: newStatus, notes: notes ?? a.notes } : a,
    );
    await supabase
      .from("site_settings")
      .upsert({ key: "admission_applications", value: updatedList }, { onConflict: "key" });
  } catch {
    // Non-fatal
  }
}

export async function deleteAdmissionApplication(
  appId: string,
  currentList: AdmissionApplication[],
): Promise<void> {
  // 1. Try API DELETE
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch("/api/admissions/applications", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id: appId }),
    });
  } catch {
    // API not reachable
  }

  // 2. Delete from Supabase enquiries if matching
  try {
    await supabase.from("enquiries").delete().eq("id", appId);
  } catch {
    // Non-fatal
  }

  // 3. Update Supabase site_settings
  try {
    const filteredList = currentList.filter((a) => a.id !== appId);
    await supabase
      .from("site_settings")
      .upsert({ key: "admission_applications", value: filteredList }, { onConflict: "key" });
  } catch {
    // Non-fatal
  }
}
