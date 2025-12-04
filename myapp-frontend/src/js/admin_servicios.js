const API_URL = 'http://localhost:3000/api/servicios';

        async function loadServices() {
            try {
                const res = await fetch(API_URL); 
                if(res.ok) {
                    const services = await res.json();
                    renderServices(services);
                }
            } catch (error) {
                console.error(error);
            }
        }

        function renderServices(list) {
            const tbody = document.getElementById('servicesList');
            tbody.innerHTML = list.map(s => `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3">${s.id_servicio}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">${s.nombre}</td>
                    <td class="px-4 py-3">${s.descripcion || '-'}</td>
                    <td class="px-4 py-3">$${s.costo}</td>
                    <td class="px-4 py-3">
                        <button onclick="deleteService(${s.id_servicio})" class="text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                </tr>
            `).join('');
        }

        document.getElementById('createServiceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('nombre').value,
                descripcion: document.getElementById('descripcion').value,
                costo: document.getElementById('costo').value
            };

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if(res.ok) {
                    alert('Servicio creado');
                    document.getElementById('createServiceForm').reset();
                    loadServices();
                } else {
                    alert('Error al crear servicio');
                }
            } catch (error) {
                console.error(error);
            }
        });

        async function deleteService(id) {
            if(!confirm('¿Seguro que desea eliminar este servicio?')) return;
            try {
                const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if(res.ok) {
                    loadServices();
                } else {
                    alert('Error al eliminar');
                }
            } catch (error) {
                console.error(error);
            }
        }

        loadServices();