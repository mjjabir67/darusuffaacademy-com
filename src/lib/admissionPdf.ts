import type { AdmissionSettings } from "./cms";

export async function generateAdmissionPdf(settings: AdmissionSettings): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const html2canvasModule = await import("html2canvas-pro");
  const html2canvas = html2canvasModule.default || html2canvasModule;

  // Create an offscreen wrapper container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px"; // 210mm at 96dpi (A4)
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#1e293b";
  container.style.fontFamily =
    '"Noto Sans Malayalam", "Lexend Deca", "Figtree", "Outfit", -apple-system, BlinkMacSystemFont, sans-serif';
  container.style.padding = "32px 36px";
  container.style.boxSizing = "border-box";
  container.style.lineHeight = "1.4";
  container.style.fontSize = "12px";

  const year = settings.admissionYear || "2025";
  const institutionName = settings.institutionName || "DARUSUFFA ACADEMY";
  const subtitle = settings.institutionSubtitle || "MUHYISUNNA INTEGRATED DARS";
  const location = settings.institutionLocation || "Vadeesunna, Kolathur, Malappuram";
  const formTitle = settings.formTitle || `ADMISSION FORM-${year}`;
  const phone = settings.contactPhone || "+91 99610 09313";
  const email = settings.contactEmail || "darusuffaacademymsa@gmail.com";

  const facilities =
    settings.facilities && settings.facilities.length > 0 ? settings.facilities : [];

  const visibleFields = (settings.formFields || [])
    .filter((f) => f.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Build HTML template
  container.innerHTML = `
    <div style="border: 2px solid #2d4568; padding: 22px; border-radius: 6px; position: relative;">
      
      <!-- Photo Box Top Right -->
      <div style="position: absolute; top: 22px; right: 22px; width: 105px; height: 130px; border: 1.5px dashed #64748b; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6px; box-sizing: border-box; background: #f8fafc; font-size: 10px; color: #64748b;">
        <span style="font-weight: 600; margin-bottom: 4px;">AFFIX PHOTO</span>
        <span>Passport size photo here</span>
      </div>

      <!-- Header Information -->
      <div style="margin-right: 120px; min-height: 125px;">
        <div style="font-size: 21px; font-weight: 800; letter-spacing: 0.05em; color: #1a2f4c; text-transform: uppercase;">
          ${institutionName}
        </div>
        <div style="font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 0.06em; margin-top: 3px;">
          ${subtitle}
        </div>
        <div style="font-size: 11px; color: #334155; margin-top: 4px;">
          ${location}
        </div>
        <div style="font-size: 10.5px; color: #475569; margin-top: 3px;">
          <strong>Phone:</strong> ${phone} &nbsp;|&nbsp; <strong>Email:</strong> ${email}
        </div>
        <div style="margin-top: 8px; font-size: 10px; color: #64748b; font-style: italic;">
          Reg. Office &amp; Integrated Campus under Kolathur Irshadiyya
        </div>
      </div>

      <!-- Title Banner -->
      <div style="background: #203554; color: #ffffff; padding: 6px 14px; border-radius: 4px; text-align: center; font-weight: 700; font-size: 13.5px; letter-spacing: 0.08em; margin: 10px 0 14px 0; text-transform: uppercase;">
        ${formTitle}
      </div>

      <!-- Facilities Summary (Supports Malayalam & English) -->
      ${
        facilities.length > 0
          ? `
        <div style="background: #f1f5f9; border-left: 3.5px solid #203554; padding: 8px 12px; margin-bottom: 16px; border-radius: 0 4px 4px 0;">
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.04em;">
            Facilities &amp; Highlights / സൗകര്യങ്ങൾ:
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; font-size: 10.5px; color: #334155; font-family: 'Noto Sans Malayalam', sans-serif;">
            ${facilities.map((fac) => `<div>• ${fac}</div>`).join("")}
          </div>
        </div>
      `
          : ""
      }

      <!-- APPLICANT INFORMATION SECTION -->
      <div style="border-top: 1.5px solid #cbd5e1; padding-top: 12px; margin-top: 10px;">
        <div style="font-size: 12.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <span>APPLICANT INFORMATION / വിദ്യാർത്ഥിയുടെ വിവരങ്ങൾ</span>
          <span style="font-size: 9.5px; font-weight: normal; color: #64748b; text-transform: none;">(Fill in BLOCK letters)</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${visibleFields
            .map((field) => {
              if (field.type === "select" && field.options && field.options.length > 0) {
                return `
                <div style="display: flex; align-items: baseline; font-size: 11.5px;">
                  <div style="width: 170px; font-weight: 600; color: #1e293b; flex-shrink: 0;">
                    ${field.label} ${field.required ? '<span style="color:#e11d48;">*</span>' : ""}:
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 16px; flex-grow: 1;">
                    ${field.options
                      .map(
                        (opt) => `
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 13px; height: 13px; border: 1.5px solid #475569; border-radius: 2px;"></span>
                        <span style="color: #334155;">${opt}</span>
                      </span>
                    `,
                      )
                      .join("")}
                  </div>
                </div>
              `;
              }

              if (field.type === "textarea") {
                return `
                <div style="font-size: 11.5px;">
                  <div style="display: flex; align-items: baseline; margin-bottom: 8px;">
                    <span style="width: 170px; font-weight: 600; color: #1e293b; flex-shrink: 0;">
                      ${field.label} ${field.required ? '<span style="color:#e11d48;">*</span>' : ""}:
                    </span>
                    <span style="flex-grow: 1; border-bottom: 1px dotted #64748b; height: 15px;"></span>
                  </div>
                  <div style="border-bottom: 1px dotted #64748b; height: 18px; margin-left: 170px;"></div>
                </div>
              `;
              }

              return `
                <div style="display: flex; align-items: baseline; font-size: 11.5px;">
                  <div style="width: 170px; font-weight: 600; color: #1e293b; flex-shrink: 0;">
                    ${field.label} ${field.required ? '<span style="color:#e11d48;">*</span>' : ""}:
                  </div>
                  <div style="flex-grow: 1; border-bottom: 1px dotted #64748b; height: 15px;"></div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>

      <!-- DECLARATION & SIGNATURES -->
      <div style="margin-top: 24px; padding-top: 14px; border-top: 1.5px solid #cbd5e1; font-size: 10px; color: #334155;">
        <div style="margin-bottom: 22px; line-height: 1.5;">
          <strong>Declaration / പ്രഖ്യാപനം:</strong> I hereby declare that all the information provided in this application is accurate and true to the best of my knowledge. I promise to abide by all the rules and discipline of Darusuffa Academy.
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; margin-top: 28px;">
          <div>
            <div style="border-top: 1px solid #475569; padding-top: 5px; font-size: 10px; font-weight: 600; color: #1e293b;">
              Date &amp; Place
            </div>
          </div>
          <div>
            <div style="border-top: 1px solid #475569; padding-top: 5px; font-size: 10px; font-weight: 600; color: #1e293b;">
              Signature of Applicant
            </div>
          </div>
          <div>
            <div style="border-top: 1px solid #475569; padding-top: 5px; font-size: 10px; font-weight: 600; color: #1e293b;">
              Signature of Parent / Guardian
            </div>
          </div>
        </div>
      </div>

      <!-- OFFICE USE ONLY -->
      <div style="margin-top: 20px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; padding: 10px 14px; font-size: 10px;">
        <div style="font-weight: 700; color: #334155; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">
          FOR OFFICE USE ONLY / ഓഫീസ് ഉപയോഗത്തിന് മാത്രം
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; align-items: baseline;">
          <div>Adm No: <span style="display:inline-block; border-bottom: 1px solid #94a3b8; width: 60px;"></span></div>
          <div>Date: <span style="display:inline-block; border-bottom: 1px solid #94a3b8; width: 70px;"></span></div>
          <div>Class: <span style="display:inline-block; border-bottom: 1px solid #94a3b8; width: 60px;"></span></div>
          <div style="text-align: right;">Principal / Rector: <span style="display:inline-block; border-bottom: 1px solid #94a3b8; width: 70px;"></span></div>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    // Wait for fonts if available
    if ("fonts" in document) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(container, {
      scale: 2, // 2x for sharp printing
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Add image with small margin (5mm)
    const margin = 6;
    const printWidth = pdfWidth - margin * 2;
    const printHeight = (canvas.height * printWidth) / canvas.width;

    pdf.addImage(
      imgData,
      "PNG",
      margin,
      margin,
      printWidth,
      Math.min(printHeight, pdfHeight - margin * 2),
    );

    const cleanYear = year.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Darusuffa_Academy_Admission_Form_${cleanYear}.pdf`;

    pdf.save(filename);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
