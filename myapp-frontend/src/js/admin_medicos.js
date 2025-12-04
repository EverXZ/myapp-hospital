 async function loadDoctors() {
            try {
                // Need endpoint to fetch all doctors.
                // Assuming GET /api/medicos
                const res = await fetch('http://localhost:3000/api/medicos'); 
                if(res.ok) {
                    const doctors = await res.json();
                    renderDoctors(doctors);
                }
            } catch (error) {
                console.error(error);
            }
        }

        function renderDoctors(list) {
            const tbody = document.getElementById('doctorsList');
            tbody.innerHTML = list.map(d => `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3">${d.id_medico}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">${d.nombre_completo}</td>
                    <td class="px-4 py-3">${d.especialidad}</td>
                    <td class="px-4 py-3">${d.email}</td>
                </tr>
            `).join('');
        }

        document.getElementById('createDoctorForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('nombre').value,
                especialidad: document.getElementById('especialidad').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                rol: 'Medico'
            };

            try {
                const res = await fetch('http://localhost:3000/api/admin/crear_usuario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if(res.ok) {
                    alert('Médico registrado');
                    document.getElementById('createDoctorForm').reset();
                    loadDoctors();
                } else {
                    alert('Error al registrar');
                }
            } catch (error) {
                console.error(error);
            }
        });

        loadDoctors();