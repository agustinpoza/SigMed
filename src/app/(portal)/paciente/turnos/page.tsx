import {
  clinicToday,
  getAvailableDoctorSlots,
  listDoctors,
  SPECIALTY_LABELS,
} from "@/lib/doctor-agenda";

type SearchParams = {
  fecha?: string;
  doctorId?: string;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function longDate(fecha: string): string {
  return new Date(`${fecha}T12:00:00-03:00`).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const fecha = params.fecha && DATE_ONLY.test(params.fecha) ? params.fecha : clinicToday();

  const doctors = await listDoctors();
  const selectedId = doctors.some((d) => d.id === params.doctorId) ? params.doctorId! : "";
  const selected = doctors.find((d) => d.id === selectedId) ?? null;

  const slots = selected ? await getAvailableDoctorSlots(selected.id, fecha) : [];

  return (
    <section className="rounded-xl border border-gray-400 bg-white p-6 shadow-md">
      <div className="mb-4 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Agenda pública de turnos</h1>
        <p className="text-sm text-slate-500">
          Turnos disponibles publicados automáticamente a partir de la
          disponibilidad de cada profesional.
        </p>
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="doctorId" className="text-sm font-semibold text-slate-700">
            Profesional
          </label>
          <select
            id="doctorId"
            name="doctorId"
            defaultValue={selectedId}
            className="min-w-[16rem] rounded-md border border-slate-300 bg-white p-2 text-slate-900 [color-scheme:light]"
          >
            <option value="">Todos los profesionales</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {SPECIALTY_LABELS[doctor.specialty]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fecha" className="text-sm font-semibold text-slate-700">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            name="fecha"
            defaultValue={fecha}
            className="rounded-md border border-slate-300 bg-white p-2 text-slate-900 [color-scheme:light]"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-800"
        >
          Buscar
        </button>
      </form>

      {selected ? (
        <div>
          <h2 className="font-bold text-slate-700">
            {selected.name} - {SPECIALTY_LABELS[selected.specialty]}
          </h2>
          <p className="mb-4 text-sm capitalize text-slate-500">{longDate(fecha)}</p>

          {slots.length === 0 ? (
            <p
              role="status"
              className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              No hay horarios disponibles publicados para esa fecha.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <li
                  key={slot.time}
                  className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {slot.time}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p
          role="status"
          className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
        >
          Elegí un profesional y una fecha para ver la agenda publicada.
        </p>
      )}
    </section>
  );
}
