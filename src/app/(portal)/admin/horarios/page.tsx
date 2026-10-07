import Placeholder from "../../placeholder";
import { modificarHorarios } from './actions';

export default async function HorariosPage() {
  // En un caso real, aquí cargaríamos los médicos activos desde la base de datos
  const medicosMock = [
    { id: '1', nombre: 'Dr. Clínico - Medicina General' },
    { id: '2', nombre: 'Dra. Pediatra - Pediatría' },
    { id: '3', nombre: 'Dr. Traumatólogo - Traumatología' },
  ];

  // Mock de la agenda actual para reflejar la tabla inferior del wireframe
  const agendaActual = [
    { id: 1, dia: 'Lunes', franja: '08:00 - 12:00', duracion: 30 },
    { id: 2, dia: 'Miércoles', franja: '14:00 - 18:00', duracion: 30 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-6 border-b pb-4 text-slate-800">
        Modificación de Horarios
      </h1>

      <form action={modificarHorarios} className="space-y-6">
        {/* Seleccionar Profesional */}
        <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-md">
          <label htmlFor="doctorId" className="font-semibold text-slate-700 min-w-[200px]">
            Seleccionar Profesional
          </label>
          <select 
            name="doctorId" 
            id="doctorId" 
            className="flex-1 border-slate-300 rounded-md p-2 border focus:ring-blue-500"
            required
          >
            <option value="">[Lista de Profesionales - Especialidad]</option>
            {medicosMock.map(medico => (
              <option key={medico.id} value={medico.id}>{medico.nombre}</option>
            ))}
          </select>
        </div>

        {/* Configuración de Disponibilidad */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-700">Configuración de Disponibilidad</h2>
          
          <div className="flex space-x-6">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia, index) => (
              <label key={dia} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  name="dias" 
                  value={dia} 
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{dia}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <label htmlFor="horaInicio" className="text-sm font-semibold">Hora Inicio</label>
              <input type="time" name="horaInicio" id="horaInicio" className="border rounded-md p-2" required />
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="horaFin" className="text-sm font-semibold">Hora Fin</label>
              <input type="time" name="horaFin" id="horaFin" className="border rounded-md p-2" required />
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="duracion" className="text-sm font-semibold">Duración Turno</label>
              <select name="duracion" id="duracion" className="border rounded-md p-2" required>
                <option value="">XX min</option>
                <option value="15">15 min</option>
                <option value="20">20 min</option>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4 border-t pt-4">
          <button type="button" className="px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 font-semibold">
            Guardar Cambios
          </button>
        </div>
      </form>

      {/* Agenda Actual del Profesional */}
      <div className="mt-12">
        <h2 className="font-bold text-slate-700 mb-4">Agenda Actual del Profesional</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm">
                <th className="p-3 font-semibold">DÍA</th>
                <th className="p-3 font-semibold">FRANJA HORARIA</th>
                <th className="p-3 font-semibold">DURACIÓN</th>
                <th className="p-3 font-semibold">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {agendaActual.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-slate-800">{item.dia}</td>
                  <td className="p-3 text-slate-800">{item.franja}</td>
                  <td className="p-3 text-slate-800">{item.duracion} min</td>
                  <td className="p-3">
                    <button className="text-sm text-blue-600 hover:underline">Eliminar/Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
