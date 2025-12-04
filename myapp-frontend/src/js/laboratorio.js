      

        async function loadData() {
            try {
                const res = await fetch('http://localhost:3000/api/laboratorio');
                const ordenes = await res.json();
                
                const list = document.getElementById('ordenesList');
                list.innerHTML = ordenes.length ? ordenes.map(o => `
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <td class="px-4 py-2 font-medium text-gray-900">#${o.id_orden}</td>
                        <td class="px-4 py-2">${o.tipo_examen} <br> <span class="text-xs text-gray-500">${o.paciente}</span></td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-1 text-xs rounded ${
                                o.estado === 'Solicitado' ? 'bg-yellow-100 text-yellow-800' : 
                                o.estado === 'Procesando' ? 'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'}">
                                ${o.estado}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-600 truncate max-w-xs" title="${o.resultados || ''}">
                            ${o.resultados || '-'}
                        </td>
                        <td class="px-4 py-2">
                            ${o.estado !== 'Entregado' ? `
                                <button onclick="ingresarResultados(${o.id_orden})" class="text-purple-600 hover:underline text-xs">Ingresar Resultados</button>
                            ` : '<span class="text-gray-400 text-xs">Completado</span>'}
                        </td>
                    </tr>
                `).join('') : '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">No hay órdenes registradas.</td></tr>';
            } catch (error) {
                console.error(error);
                document.getElementById('ordenesList').innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-red-500">Error al cargar datos.</td></tr>';
            }
        }

        async function ingresarResultados(idOrden) {
            const resultados = prompt("Ingrese los resultados del examen:");
            if (!resultados) return;

            try {
                const res = await fetch(`http://localhost:3000/api/laboratorio/${idOrden}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resultados })
                });

                if (res.ok) {
                    alert('Resultados guardados');
                    loadData();
                } else {
                    alert('Error al guardar');
                }
            } catch (error) {
                console.error(error);
            }
        }

        document.getElementById('labForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id_cita = document.getElementById('idCitaLab').value;
            const tipo_examen = document.getElementById('tipoExamen').value;

            try {
                const res = await fetch('http://localhost:3000/api/laboratorio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_cita, tipo_examen })
                });
                if(res.ok) {
                    alert('Orden creada');
                    // loadData();
                }
            } catch (error) {
                console.error(error);
            }
        });