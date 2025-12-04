async function loadData() {
            // Medicamentos
            const resMeds = await fetch('http://localhost:3000/api/inventario/medicamentos');
            const meds = await resMeds.json();
            document.getElementById('medsList').innerHTML = meds.map(m => `
                <tr class="bg-white border-b">
                    <td class="px-4 py-2 font-medium text-gray-900">${m.nombre}</td>
                    <td class="px-4 py-2 ${m.stock < 10 ? 'text-red-600 font-bold' : ''}">${m.stock}</td>
                    <td class="px-4 py-2">
                        <button onclick="openRestockModal('medicamento', ${m.id_medicamento}, '${m.nombre}')" class="text-blue-600 hover:underline">Re-stock</button>
                    </td>
                </tr>
            `).join('');

            // Equipos
            const resEq = await fetch('http://localhost:3000/api/inventario/equipos');
            const equipos = await resEq.json();
            document.getElementById('equiposList').innerHTML = equipos.map(e => `
                <tr class="bg-white border-b">
                    <td class="px-4 py-2 font-medium text-gray-900">${e.nombre}</td>
                    <td class="px-4 py-2">${e.estado}</td>
                    <td class="px-4 py-2">
                        <span class="text-gray-400">-</span>
                    </td>
                </tr>
            `).join('');
        }

        function openRestockModal(type, id, name) {
            document.getElementById('modalType').value = type;
            document.getElementById('modalId').value = id;
            document.getElementById('modalItemName').innerText = `Item: ${name}`;
            document.getElementById('modalQty').value = 1;
            document.getElementById('restockModal').classList.remove('hidden');
        }

        function closeRestockModal() {
            document.getElementById('restockModal').classList.add('hidden');
        }

        async function confirmRestock() {
            const type = document.getElementById('modalType').value;
            const id = document.getElementById('modalId').value;
            const qty = document.getElementById('modalQty').value;

            if(!qty || qty <= 0) return alert('Cantidad inválida');

            try {
                const res = await fetch(`http://localhost:3000/api/inventario/${type}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cantidad: parseInt(qty) })
                });
                if(res.ok) {
                    alert('Stock actualizado');
                    closeRestockModal();
                    loadData();
                } else {
                    alert('Error al actualizar');
                }
            } catch (error) { console.error(error); }
        }

        loadData();