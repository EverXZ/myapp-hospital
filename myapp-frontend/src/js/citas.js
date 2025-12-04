        const API_BASE = 'http://localhost:3000/api';

        // 1. Cargar Listas Desplegables (Pacientes y Médicos)
        async function cargarSelects() {
            // Cargar Pacientes
            const resPacientes = await fetch(`${API_BASE}/pacientes`);
            const pacientes = await resPacientes.json();
            const selectP = document.getElementById('selectPaciente');
            selectP.innerHTML = '<option value="">Seleccione Paciente</option>';
            pacientes.forEach(p => {
                selectP.innerHTML += `<option value="${p.id_paciente}">${p.nombre_completo} (DNI: ${p.dni})</option>`;
            });

            // Cargar Médicos
            const resMedicos = await fetch(`${API_BASE}/medicos`);
            const medicos = await resMedicos.json();
            const selectM = document.getElementById('selectMedico');
            selectM.innerHTML = '<option value="">Seleccione Médico</option>';
            medicos.forEach(m => {
                selectM.innerHTML += `<option value="${m.id_medico}">${m.nombre_completo} - ${m.especialidad}</option>`;
            });
        }

        // 2. Cargar Tabla de Citas
        async function cargarCitas() {
            try {
                const response = await fetch(`${API_BASE}/citas`);
                const citas = await response.json();
                
                const tbody = document.getElementById('tablaCitas');
                tbody.innerHTML = ''; 

                citas.forEach(c => {
                    // Formatear fecha para que se vea bonita
                    const fecha = new Date(c.fecha_hora).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
                    
                    const fila = `
                        <tr class="border-b hover:bg-purple-50 transition">
                            <td class="p-4 font-semibold text-gray-800">${fecha}</td>
                            <td class="p-4">${c.paciente}</td>
                            <td class="p-4 text-purple-700">${c.medico}</td>
                            <td class="p-4 italic text-gray-500">"${c.motivo}"</td>
                            <td class="p-4">
                                <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">${c.estado}</span>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += fila;
                });
            } catch (error) {
                console.error('Error cargando citas:', error);
            }
        }

        // 3. Guardar Nueva Cita
        document.getElementById('formCita').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const datos = {
                id_paciente: document.getElementById('selectPaciente').value,
                id_medico: document.getElementById('selectMedico').value,
                fecha_hora: document.getElementById('fecha_hora').value,
                motivo: document.getElementById('motivo').value
            };

            try {
                const response = await fetch(`${API_BASE}/citas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });

                if (response.ok) {
                    alert('✅ Cita agendada correctamente');
                    document.getElementById('formCita').reset();
                    cargarCitas();
                } else {
                    alert('❌ Error al agendar');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });

        // Inicializar todo
        cargarSelects();
        cargarCitas();