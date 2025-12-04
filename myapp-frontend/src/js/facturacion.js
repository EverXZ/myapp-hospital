 const API_BASE = 'http://localhost:3000/api';

        // 1. Cargar Pendientes (Solo 'Completada')
        async function cargarPendientes() {
            try {
                const res = await fetch(`${API_BASE}/facturas/pendientes`);
                const lista = await res.json();
                const contenedor = document.getElementById('listaPendientes');
                
                contenedor.innerHTML = '';
                if (lista.length === 0) {
                    contenedor.innerHTML = '<p class="text-gray-400 italic">No hay cobros pendientes.</p>';
                    return;
                }

                lista.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'border p-3 rounded hover:bg-red-50 flex justify-between items-center transition bg-gray-50';
                    card.innerHTML = `
                        <div>
                            <p class="font-bold text-gray-800">${item.paciente}</p>
                            <p class="text-xs text-gray-500">Médico: ${item.medico}</p>
                        </div>
                        <button onclick="generarFactura(${item.id_cita}, ${item.id_paciente})" class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 shadow-sm font-bold">
                            Cobrar
                        </button>
                    `;
                    contenedor.appendChild(card);
                });
            } catch (error) { console.error(error); }
        }

        // 2. Cargar Historial (Las ya 'Facturada')
        async function cargarHistorial() {
            try {
                const res = await fetch(`${API_BASE}/facturas/historial`);
                const lista = await res.json();
                const tbody = document.getElementById('tablaHistorial');
                
                tbody.innerHTML = '';
                lista.forEach(f => {
                    const fecha = new Date(f.fecha_emision).toLocaleDateString();
                    tbody.innerHTML += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-2 font-mono text-xs text-gray-400">#${f.id_factura}</td>
                            <td class="p-2 truncate max-w-[100px]">${f.paciente}</td>
                            <td class="p-2 text-right text-green-700 font-bold">$${f.total}</td>
                        </tr>
                    `;
                });
            } catch (error) { console.error(error); }
        }

        // 3. Generar Factura
        window.generarFactura = async function(idCita, idPaciente) {
            if(!confirm("¿Confirmar cobro y generar factura?")) return;

            try {
                const res = await fetch(`${API_BASE}/facturas/generar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_cita: idCita, id_paciente: idPaciente })
                });
                
                const data = await res.json();

                if (res.ok) {
                    mostrarRecibo(data);
                    // Actualizar ambas listas: quita de pendiente, agrega a historial
                    cargarPendientes(); 
                    cargarHistorial();
                } else {
                    alert("Error al facturar");
                }
            } catch (error) { console.error(error); }
        }

        function mostrarRecibo(data) {
            document.getElementById('reciboContainer').classList.remove('hidden');
            document.getElementById('reciboId').innerText = data.id_factura.toString().padStart(6, '0');
            document.getElementById('reciboFecha').innerText = new Date().toLocaleString();
            document.getElementById('reciboTotal').innerText = '$' + parseFloat(data.total).toFixed(2);
        }

        function limpiarRecibo() {
            document.getElementById('reciboContainer').classList.add('hidden');
        }

        // Iniciar
        cargarPendientes();
        cargarHistorial();