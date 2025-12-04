const API_URL = "http://localhost:3000/api/pacientes";

// 1. Función para Cargar Pacientes
async function cargarPacientes() {
  try {
    const response = await fetch(API_URL);
    const pacientes = await response.json();

    const tbody = document.getElementById("tablaPacientes");
    tbody.innerHTML = ""; // Limpiar tabla

    pacientes.forEach((p) => {
      const fila = `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-3 font-bold">${p.id_paciente}</td>
                            <td class="p-3">${p.nombre_completo}</td>
                            <td class="p-3">${p.dni}</td>
                            <td class="p-3">${p.telefono}</td>
                            <td class="p-3">
                                <button class="text-blue-500 hover:text-blue-700">Ver</button>
                            </td>
                        </tr>
                    `;
      tbody.innerHTML += fila;
    });
  } catch (error) {
    console.error("Error cargando pacientes:", error);
  }
}

// 2. Función para Guardar Paciente
document
  .getElementById("formPaciente")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      nombre_completo: document.getElementById("nombre").value,
      dni: document.getElementById("dni").value,
      fecha_nacimiento: document.getElementById("fecha_nacimiento").value,
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
        alert("Paciente registrado!");
        document.getElementById("formPaciente").reset();
        cargarPacientes(); // Recargar la tabla
      } else {
        alert("Error al registrar");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Cargar al iniciar
cargarPacientes();
