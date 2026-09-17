import { createFileRoute } from "@tanstack/react-router";
import { createApplication } from "@/server/db/admission-applications";

export const Route = createFileRoute("/api/admissions/apply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();

          const {
            student_name,
            father_name,
            class_to_join,
            phone,
            phone_number,
            whatsapp,
            whatsapp_number,
            address,
            place,
            district,
            custom_fields,
          } = body;

          const studentName = String(student_name || "").trim();
          const fatherName = String(father_name || "").trim();
          const classToJoin = String(class_to_join || "").trim();
          const phoneVal = String(phone_number || phone || "").trim();
          const whatsappVal = String(whatsapp_number || whatsapp || phoneVal).trim();
          const addressVal = String(address || "").trim();
          const placeVal = String(place || "").trim();
          const districtVal = String(district || "").trim();

          if (
            !studentName ||
            !fatherName ||
            !classToJoin ||
            !phoneVal ||
            !addressVal ||
            !placeVal ||
            !districtVal
          ) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Please fill in all required applicant fields.",
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          // Persist in the dedicated Admission Applications database
          const newApplication = createApplication({
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
            status: "New",
            custom_fields: custom_fields || {},
          });

          // Optional sync with site_settings in Supabase if accessible
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: existingData } = await supabaseAdmin
              .from("site_settings")
              .select("value")
              .eq("key", "admission_applications")
              .maybeSingle();

            const existingList = Array.isArray(existingData?.value) ? existingData.value : [];
            await supabaseAdmin.from("site_settings").upsert(
              {
                key: "admission_applications",
                value: [newApplication, ...existingList],
              },
              { onConflict: "key" },
            );
          } catch (syncErr) {
            // Non-blocking: primary persistence is already secure in dedicated database
            console.warn("[API apply] Supabase site_settings sync note:", syncErr);
          }

          return new Response(
            JSON.stringify({
              success: true,
              message:
                "Application submitted successfully. Your application has been received by Darusuffa Academy.",
              application: newApplication,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          console.error("[API admissions/apply] Error:", err);
          return new Response(
            JSON.stringify({
              success: false,
              message: "An error occurred while submitting your application. Please try again.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
