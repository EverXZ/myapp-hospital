async function loadData() {
            // Load Patients & Doctors for Selects
            const resPac = await fetch('http://localhost:3000/api/pacientes');
            const pacientes = await resPac.json();
            document.getElementById('pacienteSelect').innerHTML = '<option value="">Seleccionar Paciente...</option>' + 
                pacientes.map(p => `<option value="${p.id_paciente}">${p.nombre_completo}</option>`).join('');

            const resMed = await fetch('http://localhost:3000/api/medicos');
            const medicos = await resMed.json();
            document.getElementById('medicoSelect').innerHTML = '<option value="">Seleccionar Médico...</option>' + 
                medicos.map(m => `<option value="${m.id_medico}">${m.nombre_completo}</option>`).join('');

            // Load Treatments
            const resTrat = await fetch('http://localhost:3000/api/tratamientos/procesos');
            const tratamientos = await resTrat.json();
            
            document.getElementById('tratamientosList').innerHTML = tratamientos.length ? tratamientos.map(t => `
                <div class="p-3 border rounded hover:bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-gray-800">${t.nombre_tratamiento}</h3>
                        <p class="text-sm text-gray-600">Pac: ${t.paciente} | Dr: ${t.medico}</p>
                        <p class="text-xs text-blue-600 font-semibold">Estado: ${t.estado}</p>
                    </div>
                    ${t.estado !== 'Finalizado' ? 
                        `<button onclick="finalizarTratamiento(${t.id_proceso})" class="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700">Finalizar</button>` 
                        : '<span class="text-xs text-gray-400">Finalizado</span>'}
                </div>
            `).join('') : '<p class="text-gray-500">No hay tratamientos.</p>';
        }

        async function finalizarTratamiento(id) {
            if(!confirm("¿Finalizar tratamiento?")) return;
            try {
                const res = await fetch(`http://localhost:3000/api/tratamientos/${id}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'Finalizado', observaciones: 'Finalizado por Admin' })
                });
                if(res.ok) loadData();
            } catch (error) { console.error(error); }
        }

        document.getElementById('createTratamientoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                id_paciente: document.getElementById('pacienteSelect').value,
                id_medico: document.getElementById('medicoSelect').value,
                nombre_tratamiento: document.getElementById('nombreTrat').value,
                fecha_inicio: new Date().toISOString().split('T')[0]
            };

            try {
                const res = await fetch('http://localhost:3000/api/tratamientos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if(res.ok) {
                    alert('Tratamiento iniciado');
                    document.getElementById('createTratamientoForm').reset();
                    loadData();
                }
            } catch (error) { console.error(error); }
        });

        loadData();