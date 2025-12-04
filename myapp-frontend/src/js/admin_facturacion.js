 async function loadData() {
            // Pendientes
            const resPend = await fetch('http://localhost:3000/api/facturas/pendientes');
            const pendientes = await resPend.json();
            document.getElementById('pendientesList').innerHTML = pendientes.length ? pendientes.map(p => `
                <div class="flex justify-between items-center p-3 border rounded bg-yellow-50">
                    <div>
                        <p class="font-bold text-gray-800">${p.paciente}</p>
                        <p class="text-xs text-gray-500">Dr. ${p.medico} - ${new Date(p.fecha_hora).toLocaleDateString()}</p>
                    </div>
                    <button onclick="generarFactura(${p.id_cita}, ${p.id_paciente})" class="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700">Generar Factura</button>
                </div>
            `).join('') : '<p class="text-gray-500">No hay cobros pendientes.</p>';

            // Historial
            const resHist = await fetch('http://localhost:3000/api/facturas/historial');
            const historial = await resHist.json();
            document.getElementById('historialList').innerHTML = historial.length ? historial.map(f => `
                <div class="flex justify-between items-center p-3 border-b">
                    <div>
                        <p class="font-bold text-gray-800">Factura #${f.id_factura}</p>
                        <p class="text-xs text-gray-500">${f.paciente}</p>
                        <p class="text-xs text-gray-400">${new Date(f.fecha_emision).toLocaleString()}</p>
                    </div>
                    <span class="font-bold text-green-600">$${f.total}</span>
                </div>
            `).join('') : '<p class="text-gray-500">Sin historial.</p>';
        }

        async function generarFactura(idCita, idPaciente) {
            if(!confirm("¿Generar factura?")) return;
            try {
                const res = await fetch('http://localhost:3000/api/facturas/generar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_cita: idCita, id_paciente: idPaciente })
                });
                if(res.ok) {
                    alert('Factura generada');
                    loadData();
                }
            } catch (error) { console.error(error); }
        }

        loadData();