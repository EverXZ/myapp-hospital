const API_URL = "http://localhost:3000/api/medicos";
import { showModal, showToast } from "../ui/modal";


// 1. Cargar Médicos
async function cargarMedicos() {
  try {
    const response = await fetch(API_URL);
    const medicos = await response.json();

    const tbody = document.getElementById("tablaMedicos");
    tbody.innerHTML = "";

    medicos.forEach((m) => {
      const fila = `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-3 font-bold text-indigo-600">#${
                              m.id_medico
                            }</td>
                            <td class="p-3 font-medium text-gray-800">${
                              m.nombre_completo
                            }</td>
                            <td class="p-3"><span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">${
                              m.especialidad
                            }</span></td>
                            <td class="p-3 text-sm">${m.numero_licencia}</td>
                            <td class="p-3 text-sm">${m.telefono || "-"}</td>
                        </tr>
                    `;
      tbody.innerHTML += fila;
    });
  } catch (error) {
    console.error("Error cargando médicos:", error);
  }
}

// 2. guardar médico
document.getElementById("formMedico").addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    nombre_completo: document.getElementById("nombre").value,
    especialidad: document.getElementById("especialidad").value,
    numero_licencia: document.getElementById("licencia").value,
    telefono: document.getElementById("telefono").value,
    email: document.getElementById("email").value,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (response.ok) {
       showModal({
        title: "Médico registrado",
        content: "El especialista fue guardado correctamente."
        });
      document.getElementById("formMedico").reset();
      cargarMedicos();
    } else {
      showToast("Error: Licencia duplicada", "error");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

// inciar
cargarMedicos();
