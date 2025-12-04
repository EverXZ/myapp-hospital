const API_URL = "http://localhost:3000/api/tratamientos";

// 1. Cargar Tratamientos
async function cargarTratamientos() {
  try {
    const response = await fetch(API_URL);
    const lista = await response.json();

    const tbody = document.getElementById("tablaTratamientos");
    tbody.innerHTML = "";

    lista.forEach((item) => {
      const fila = `
                        <tr class="border-b hover:bg-gray-50 transition">
                            <td class="p-4 font-mono text-xs text-gray-400">#${
                              item.id_tratamiento
                            }</td>
                            <td class="p-4 font-bold text-gray-800">${
                              item.nombre
                            }</td>
                            <td class="p-4 italic text-gray-500">${
                              item.descripcion || "Sin descripción"
                            }</td>
                            <td class="p-4 text-right font-mono text-teal-700 font-bold">$${parseFloat(
                              item.costo
                            ).toFixed(2)}</td>
                        </tr>
                    `;
      tbody.innerHTML += fila;
    });
  } catch (error) {
    console.error("Error cargando tratamientos:", error);
  }
}

// 2. Guardar Tratamiento
document
  .getElementById("formTratamiento")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      nombre: document.getElementById("nombre").value,
      descripcion: document.getElementById("descripcion").value,
      costo: document.getElementById("costo").value,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (response.ok) {
        alert("✅ Servicio agregado al catálogo");
        document.getElementById("formTratamiento").reset();
        cargarTratamientos();
      } else {
        alert("❌ Error al registrar");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Iniciar
cargarTratamientos();
