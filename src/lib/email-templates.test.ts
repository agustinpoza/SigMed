import { describe, expect, it } from "vitest";
import { buildCancellationEmail } from "@/lib/email-templates";

const base = {
  patientName: "Ana",
  doctorName: "Dr. Pérez, Juan",
  specialty: "CLINICO",
  // 18:30 UTC = 15:30 en Argentina (UTC-3).
  startsAt: new Date("2026-10-12T18:30:00.000Z"),
  endsAt: new Date("2026-10-12T19:00:00.000Z"),
  reason: "El profesional tuvo una urgencia",
  reprogramUrl: "https://sigmed.example/paciente/turnos?reprogramar=turno-1",
};

describe("RF-10: plantilla de cancelacion", () => {
  it("incluye fecha, hora, medico, especialidad y motivo", () => {
    const email = buildCancellationEmail(base);

    expect(email.subject).toContain("Turno cancelado");
    expect(email.text).toContain("Ana");
    expect(email.text).toContain("Dr. Pérez, Juan");
    expect(email.text).toContain("Clínica médica");
    expect(email.text).toContain("12 de octubre de 2026");
    expect(email.text).toContain("15:30");
    expect(email.text).toContain(base.reason);
    expect(email.text).toContain(base.reprogramUrl);
    expect(email.html).toContain(base.reprogramUrl);
  });

  it("usa la hora de Argentina aunque el servidor este en otra zona", () => {
    const email = buildCancellationEmail(base);

    expect(email.text).toContain("15:30");
    expect(email.text).not.toContain("18:30");
  });

  it("indica cuando no hay motivo informado", () => {
    const email = buildCancellationEmail({ ...base, reason: null });

    expect(email.text).toContain("Sin motivo informado.");
  });

  it("escapa HTML en los valores interpolados", () => {
    const email = buildCancellationEmail({
      ...base,
      patientName: '<script>alert("x")</script>',
      reason: "<b>urgencia</b> & cita",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("&lt;b&gt;urgencia&lt;/b&gt; &amp; cita");
    // El texto plano conserva los caracteres originales.
    expect(email.text).toContain("<b>urgencia</b> & cita");
  });

  it("omite la hora de fin cuando no se informa", () => {
    const email = buildCancellationEmail({ ...base, endsAt: undefined });

    expect(email.text).toContain("15:30");
    expect(email.text).not.toContain("de 15:30 a");
  });
});
