let allPatients = [];

        async function loadPatients() {
            try {
                const res = await fetch('http://localhost:3000/api/usuarios'); // Fetching all users, need to filter or use specific endpoint
                // Actually, server.js has /api/usuarios returning 'usuario' table. 
                // But 'usuario' table doesn't have Name/DNI directly (it's in 'paciente' table).
                // I need an endpoint to get ALL patients with details.
                // Current /api/usuarios is just 'usuario' table.
                // I'll assume I need to fetch 'paciente' table directly or join.
                // Let's check server.js... 
                // I don't have a specific 'GET /api/pacientes' (all). I have 'GET /api/medicos/:id/pacientes' (distinct).
                // I should add 'GET /api/pacientes' to server.js or use a raw query here if I could (I can't).
                // I will add 'GET /api/pacientes' to server.js in next step. For now I'll write code expecting it.
                
                const resPac = await fetch('http://localhost:3000/api/pacientes'); // New Endpoint
                if(resPac.ok) {
                    allPatients = await resPac.json();
                    renderPatients(allPatients);
                }
            } catch (error) {
                console.error(error);
            }
        }

        function renderPatients(list) {
            const tbody = document.getElementById('patientsList');
            tbody.innerHTML = list.map(p => `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3">${p.id_paciente}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">${p.nombre_completo}</td>
                    <td class="px-4 py-3">${p.dni}</td>
                    <td class="px-4 py-3">${p.email}</td>
                </tr>
            `).join('');
        }

        function filterPatients() {
            const term = document.getElementById('searchDni').value.toLowerCase();
            const filtered = allPatients.filter(p => p.dni.includes(term));
            renderPatients(filtered);
        }

        document.getElementById('createPatientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('nombre').value,
                dni: document.getElementById('dni').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                rol: 'Paciente'
            };

            try {
                const res = await fetch('http://localhost:3000/api/admin/crear_usuario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if(res.ok) {
                    alert('Paciente registrado');
                    document.getElementById('createPatientForm').reset();
                    loadPatients();
                } else {
                    alert('Error al registrar');
                }
            } catch (error) {
                console.error(error);
            }
        });

        loadPatients();