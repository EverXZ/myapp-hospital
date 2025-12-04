 async function loadData() {
            // Load Patients
            const resPac = await fetch('http://localhost:3000/api/pacientes');
            const pacientes = await resPac.json();
            document.getElementById('pacienteSelect').innerHTML = '<option value="">Seleccionar Paciente...</option>' + 
                pacientes.map(p => `<option value="${p.id_paciente}">${p.nombre_completo} (DNI: ${p.dni})</option>`).join('');

            // Load Doctors
            const resMed = await fetch('http://localhost:3000/api/medicos');
            const medicos = await resMed.json();
            document.getElementById('medicoSelect').innerHTML = '<option value="">Seleccionar Médico...</option>' + 
                medicos.map(m => `<option value="${m.id_medico}">${m.nombre_completo} (${m.especialidad})</option>`).join('');

            // Load Services
            const resServ = await fetch('http://localhost:3000/api/servicios');
            const servicios = await resServ.json();
            document.getElementById('servicioSelect').innerHTML = '<option value="">Ninguno / Consulta General</option>' + 
                servicios.map(s => `<option value="${s.id_servicio}">${s.nombre} ($${s.costo})</option>`).join('');

            // Load Appointments
            const resCitas = await fetch('http://localhost:3000/api/citas');
            const citas = await resCitas.json();
            document.getElementById('citasList').innerHTML = citas.length ? citas.map(c => `
                <div class="p-3 border rounded hover:bg-gray-50 flex justify-between items-center">
                    <div>
                        <p class="font-bold text-gray-800">${new Date(c.fecha_hora).toLocaleString()}</p>
                        <p class="text-sm text-gray-600">Pac: ${c.paciente} | Dr: ${c.medico}</p>
                        <p class="text-xs text-gray-500">Servicio: <span class="font-semibold">${c.servicio || 'General'}</span></p>
                        <p class="text-xs text-gray-500 italic">"${c.motivo}"</p>
                    </div>  
                    <span class="text-xs px-2 py-1 rounded ${getStatusColor(c.estado)}">${c.estado}</span>
                </div>
            `).join('') : '<p class="text-gray-500">No hay citas registradas.</p>';
        }

        function getStatusColor(status) {
            if(status === 'Pendiente') return 'bg-yellow-100 text-yellow-800';
            if(status === 'Completada') return 'bg-blue-100 text-blue-800';
            if(status === 'Facturada') return 'bg-green-100 text-green-800';
            return 'bg-gray-100 text-gray-800';
        }

        document.getElementById('createCitaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                id_paciente: document.getElementById('pacienteSelect').value,
                id_medico: document.getElementById('medicoSelect').value,
                id_servicio: document.getElementById('servicioSelect').value || null,
                fecha_hora: document.getElementById('fecha').value,
                motivo: document.getElementById('motivo').value
            };

            try {
                const res = await fetch('http://localhost:3000/api/citas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if(res.ok) {
                    alert('Cita agendada');
                    document.getElementById('createCitaForm').reset();
                    loadData();
                } else {
                    alert('Error al agendar');
                }
            } catch (error) {
                console.error(error);
            }
        });

        loadData();