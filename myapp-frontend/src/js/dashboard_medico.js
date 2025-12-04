const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.rol !== 'Medico') {
            window.location.href = 'login.html';
        }
        document.getElementById('userName').textContent = user.nombre_completo;
        
        let recetaItems = [];
        let medicamentos = [];

        function logout() {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }

        async function loadData() {
            // 1. Cargar Citas (Pendientes e Historial)
            const resCitas = await fetch(`http://localhost:3000/api/citas?id_medico=${user.id_medico}`);
            const citas = await resCitas.json();
            
            const pendientes = citas.filter(c => c.estado === 'Pendiente');
            const historialCitas = citas.filter(c => c.estado !== 'Pendiente');
            
            // Render Pendientes
            document.getElementById('citasList').innerHTML = pendientes.length ? pendientes.map(c => `
                <div class="p-3 border rounded hover:shadow-md transition cursor-pointer bg-white" onclick="openConsulta(${c.id_cita}, '${c.paciente}')">
                    <div class="flex justify-between items-start">
                        <h3 class="font-bold text-gray-800">${c.paciente}</h3>
                        <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Pendiente</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${new Date(c.fecha_hora).toLocaleString()}</p>
                    <p class="text-xs text-gray-500 mt-1 italic">"${c.motivo}"</p>
                    <button class="mt-2 text-xs text-teal-600 font-semibold hover:underline">Atender -></button>
                </div>
            `).join('') : '<p class="text-gray-500 text-sm">No hay citas pendientes.</p>';

            // Render Historial Citas
            document.getElementById('citasHistorialList').innerHTML = historialCitas.length ? historialCitas.map(c => `
                <div class="p-2 border-b text-sm">
                    <p class="font-semibold">${c.paciente}</p>
                    <p class="text-xs text-gray-500">${new Date(c.fecha_hora).toLocaleDateString()} - ${c.estado}</p>
                </div>
            `).join('') : '<p class="text-gray-500 text-sm">Sin historial.</p>';

            // 2. Cargar Tratamientos (Activos e Historial)
            try {
                const resTrat = await fetch(`http://localhost:3000/api/medicos/${user.id_medico}/tratamientos`);
                if(resTrat.ok) {
                    const tratamientos = await resTrat.json();
                    const activos = tratamientos.filter(t => t.estado !== 'Finalizado');
                    const historialTrat = tratamientos.filter(t => t.estado === 'Finalizado');

                    // Render Activos
                    document.getElementById('tratamientosActivosList').innerHTML = activos.length ? activos.map(t => `
                        <div class="p-3 border rounded bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 class="font-bold text-gray-800">${t.nombre_tratamiento}</h3>
                                <p class="text-sm text-gray-600">Paciente: ${t.paciente}</p>
                                <p class="text-xs text-blue-600">Estado: ${t.estado}</p>
                            </div>
                        </div>
                    `).join('') : '<p class="text-gray-500 text-sm">No hay tratamientos activos.</p>';

                    // Render Historial Tratamientos
                    document.getElementById('tratamientosHistorialList').innerHTML = historialTrat.length ? historialTrat.map(t => `
                        <div class="p-2 border-b text-sm">
                            <p class="font-semibold">${t.nombre_tratamiento}</p>
                            <p class="text-xs text-gray-500">${t.paciente} - Finalizado</p>
                        </div>
                    `).join('') : '<p class="text-gray-500 text-sm">Sin historial.</p>';
                }
            } catch(e) { console.error(e); }

            // 3. Cargar Mis Pacientes
            try {
                const resPac = await fetch(`http://localhost:3000/api/medicos/${user.id_medico}/pacientes`);
                if(resPac.ok) {
                    const pacientes = await resPac.json();
                    document.getElementById('pacientesList').innerHTML = pacientes.length ? pacientes.map(p => `
                        <div class="p-2 border rounded bg-gray-50 flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-800">${p.nombre_completo}</span>
                            <span class="text-xs text-gray-500">ID: ${p.id_paciente}</span>
                        </div>
                    `).join('') : '<p class="text-gray-500 text-sm">No tienes pacientes asignados.</p>';
                }
            } catch(e) { console.error(e); }

            // 4. Cargar Medicamentos para el select
            const resMeds = await fetch('http://localhost:3000/api/medicamentos');
            medicamentos = await resMeds.json();
            const select = document.getElementById('medicamentoSelect');
            select.innerHTML = '<option value="">Seleccionar Medicamento...</option>' + 
                medicamentos.map(m => `<option value="${m.id_medicamento}">${m.nombre} (Stock: ${m.stock})</option>`).join('');
        }

        function openConsulta(idCita, pacienteName) {
            document.getElementById('consultaPanel').classList.remove('hidden');
            document.getElementById('idCitaAtencion').value = idCita;
            document.getElementById('consultaPanel').scrollIntoView({ behavior: 'smooth' });
        }

        function closeConsulta() {
            document.getElementById('consultaPanel').classList.add('hidden');
            document.getElementById('consultaForm').reset();
            recetaItems = [];
            renderReceta();
        }

        function addMedicamento() {
            const idMed = document.getElementById('medicamentoSelect').value;
            const cantidad = document.getElementById('cantidadMed').value;
            const dosis = document.getElementById('dosisMed').value;
            
            if(!idMed || !cantidad || !dosis) return alert("Completa los datos del medicamento");

            const med = medicamentos.find(m => m.id_medicamento == idMed);
            recetaItems.push({ id_medicamento: idMed, nombre: med.nombre, cantidad: parseInt(cantidad), dosis });
            renderReceta();
            
            document.getElementById('medicamentoSelect').value = "";
            document.getElementById('cantidadMed').value = "";
            document.getElementById('dosisMed').value = "";
        }

        function renderReceta() {
            const list = document.getElementById('recetaList');
            list.innerHTML = recetaItems.map((item, index) => `
                <li class="flex justify-between items-center bg-gray-50 p-1 rounded">
                    <span>${item.nombre} (x${item.cantidad}) - ${item.dosis}</span>
                    <button type="button" onclick="removeReceta(${index})" class="text-red-500 text-xs">X</button>
                </li>
            `).join('');
        }

        window.removeReceta = (index) => {
            recetaItems.splice(index, 1);
            renderReceta();
        };

        document.getElementById('consultaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id_cita = document.getElementById('idCitaAtencion').value;
            const diagnostico = document.getElementById('diagnostico').value;
            const observaciones = document.getElementById('observaciones').value;

            const body = {
                id_cita,
                diagnostico,
                observaciones,
                recetas: recetaItems
            };

            try {
                const res = await fetch('http://localhost:3000/api/consultas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                
                if(res.ok) {
                    alert('Consulta guardada exitosamente');
                    closeConsulta();
                    loadData();
                } else {
                    alert('Error al guardar consulta');
                }
            } catch (error) {
                console.error(error);
            }
        });

        document.getElementById('tratamientoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id_paciente = document.getElementById('idPacienteTrat').value;
            const nombre_tratamiento = document.getElementById('nombreTrat').value;
            
            try {
                const res = await fetch('http://localhost:3000/api/tratamientos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_paciente,
                        id_medico: user.id_medico,
                        nombre_tratamiento,
                        fecha_inicio: new Date().toISOString().split('T')[0]
                    })
                });
                if(res.ok) {
                    alert('Tratamiento iniciado');
                    document.getElementById('tratamientoForm').reset();
                    loadData();
                }
            } catch (error) {
                console.error(error);
            }
        });

        loadData();