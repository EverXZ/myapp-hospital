 const API_URL = 'http://localhost:3000/api/medicamentos';

        // 1. Cargar Inventario
        async function cargarInventario() {
            try {
                const response = await fetch(API_URL);
                const lista = await response.json();
                
                const tbody = document.getElementById('tablaMedicamentos');
                tbody.innerHTML = ''; 

                lista.forEach(m => {
                    // Lógica visual para stock bajo
                    let stockClass = "bg-green-100 text-green-800";
                    let estadoTexto = "Disponible";
                    
                    if (m.stock <= 5 && m.stock > 0) {
                        stockClass = "bg-yellow-100 text-yellow-800";
                        estadoTexto = "Bajo Stock";
                    } else if (m.stock === 0) {
                        stockClass = "bg-red-100 text-red-800";
                        estadoTexto = "Agotado";
                    }

                    const fila = `
                        <tr class="border-b hover:bg-gray-50 transition">
                            <td class="p-4 font-mono text-xs text-gray-400">#${m.id_medicamento}</td>
                            <td class="p-4 font-bold text-gray-800">${m.nombre}</td>
                            <td class="p-4 text-gray-500">${m.principio_activo || '-'}</td>
                            <td class="p-4 text-center font-bold text-lg">${m.stock}</td>
                            <td class="p-4 text-right font-mono">$${parseFloat(m.precio_unitario).toFixed(2)}</td>
                            <td class="p-4 text-center">
                                <span class="${stockClass} px-2 py-1 rounded-full text-xs font-bold">${estadoTexto}</span>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += fila;
                });
            } catch (error) {
                console.error('Error cargando inventario:', error);
            }
        }

        // 2. Guardar Medicamento
        document.getElementById('formMedicamento').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const datos = {
                nombre: document.getElementById('nombre').value,
                principio_activo: document.getElementById('principio').value,
                stock: document.getElementById('stock').value,
                precio_unitario: document.getElementById('precio').value
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });

                if (response.ok) {
                    alert('✅ Medicamento registrado');
                    document.getElementById('formMedicamento').reset();
                    cargarInventario();
                } else {
                    alert('❌ Error al registrar');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });

        // Iniciar
        cargarInventario();