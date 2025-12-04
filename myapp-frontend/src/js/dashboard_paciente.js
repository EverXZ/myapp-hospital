const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.rol !== 'Paciente') {
            window.location.href = 'login.html';
        }
        document.getElementById('userName').textContent = user.nombre_completo;

        function logout() {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }

        async function loadData() {
            try {
                // Cargar Tratamientos
                const resTrat = await fetch(`http://localhost:3000/api/pacientes/${user.id_paciente}/tratamientos`);
                const tratamientos = await resTrat.json();
                
                const activos = tratamientos.filter(t => t.estado === 'Activo' || t.estado === 'En Curso' || t.estado === 'Solicitud Finalizacion');
                const historial = tratamientos.filter(t => t.estado === 'Finalizado');

                const renderTrat = (list) => list.length ? list.map(t => `
                    <div class="border-l-4 ${t.estado === 'Finalizado' ? 'border-gray-400' : 'border-green-500'} pl-4 py-2 bg-gray-50 rounded">
                        <h3 class="font-bold text-gray-800">${t.nombre_tratamiento}</h3>
                        <p class="text-sm text-gray-600">Dr. ${t.medico}</p>
                        <p class="text-xs text-gray-500">Inicio: ${new Date(t.fecha_inicio).toLocaleDateString()} - Estado: <span class="font-semibold">${t.estado}</span></p>
                    </div>
                `).join('') : '<p class="text-gray-500 text-sm">No hay registros.</p>';

                document.getElementById('tratamientosActivosList').innerHTML = renderTrat(activos);
                document.getElementById('tratamientosHistorialList').innerHTML = renderTrat(historial);

                // Cargar Citas
                const resCitas = await fetch(`http://localhost:3000/api/pacientes/${user.id_paciente}/citas`);
                const citas = await resCitas.json();
                
                // Separar citas futuras vs pasadas (o por estado)
                // Criterio: 'Pendiente' = Futura (o fecha > hoy). 'Completada'/'Cancelada'/'Facturada' = Historial.
                const futuras = citas.filter(c => c.estado === 'Pendiente');
                const pasadas = citas.filter(c => c.estado !== 'Pendiente');

                const renderCitas = (list) => list.length ? list.map(c => `
                    <div class="flex justify-between items-center border-b last:border-0 py-3">
                        <div>
                            <p class="font-semibold text-gray-800">${new Date(c.fecha_hora).toLocaleString()}</p>
                            <p class="text-sm text-gray-600">${c.motivo}</p>
                            <p class="text-xs text-gray-500">Dr. ${c.medico}</p>
                        </div>
                        <span class="px-2 py-1 text-xs rounded ${
                            c.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                            c.estado === 'Completada' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}">
                            ${c.estado}
                        </span>
                    </div>
                `).join('') : '<p class="text-gray-500 text-sm">No hay registros.</p>';

                document.getElementById('citasFuturasList').innerHTML = renderCitas(futuras);
                document.getElementById('citasHistorialList').innerHTML = renderCitas(pasadas);

            } catch (error) {
                console.error(error);
            }
        }

        loadData();