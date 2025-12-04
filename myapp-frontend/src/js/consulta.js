const API_BASE = "http://localhost:3000/api";
let recetaTemporal = []; // Array para guardar lo que vamos agregando

// 1. Cargar Datos Iniciales
async function init() {
  // Cargar Citas
  const resCitas = await fetch(`${API_BASE}/citas/pendientes`);
  const citas = await resCitas.json();
  const selectCita = document.getElementById("selectCita");

  if (citas.length === 0) {
    selectCita.innerHTML =
      '<option value="">No hay pacientes en sala de espera</option>';
  } else {
    selectCita.innerHTML =
      '<option value="">Seleccione al paciente...</option>';
    citas.forEach((c) => {
      const hora = new Date(c.fecha_hora).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      selectCita.innerHTML += `<option value="${c.id_cita}">${hora} - ${c.paciente}</option>`;
    });
  }

  // Cargar Tratamientos (Checkboxes)
  const resTrat = await fetch(`${API_BASE}/tratamientos`);
  const tratamientos = await resTrat.json();
  const divTrat = document.getElementById("listaTratamientos");
  divTrat.innerHTML = "";
  tratamientos.forEach((t) => {
    divTrat.innerHTML += `
                    <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 p-1 rounded">
                        <input type="checkbox" name="tratamiento" value="${t.id_tratamiento}" class="h-4 w-4 text-red-600 rounded">
                        <span class="text-sm font-medium">${t.nombre}</span>
                    </label>
                `;
  });

  // Cargar Medicamentos (Select)
  const resMed = await fetch(`${API_BASE}/medicamentos`);
  const medicamentos = await resMed.json();
  const selectMed = document.getElementById("selectMedicamento");
  medicamentos.forEach((m) => {
    selectMed.innerHTML += `<option value="${m.id_medicamento}" data-nombre="${m.nombre}">
                    ${m.nombre} (Stock: ${m.stock})
                </option>`;
  });
}

// 2. Funciones para la Receta (Frontend)
window. agregarMedicamento = function() {
  const select = document.getElementById("selectMedicamento");
  const id = select.value;
  const nombre =
    select.options[select.selectedIndex].getAttribute("data-nombre"); // Truco para sacar el nombre
  const cantidad = document.getElementById("cantMed").value;
  const dosis = document.getElementById("dosisMed").value;

  if (!id || !cantidad || !dosis)
    return alert("Complete los datos del medicamento");

  // Agregar al array temporal
  recetaTemporal.push({ id_medicamento: id, nombre, cantidad, dosis });
  renderizarTablaReceta();

  // Limpiar inputs pequeños
  document.getElementById("cantMed").value = 1;
  document.getElementById("dosisMed").value = "";
}

function renderizarTablaReceta() {
  const tbody = document.getElementById("tablaReceta");
  const emptyMsg = document.getElementById("emptyReceta");

  tbody.innerHTML = "";

  if (recetaTemporal.length > 0) {
    emptyMsg.classList.add("hidden");
    recetaTemporal.forEach((item, index) => {
      tbody.innerHTML += `
                        <tr class="border-b">
                            <td class="p-2 text-xs font-bold">${item.nombre}<br><span class="text-gray-500 font-normal">${item.dosis}</span></td>
                            <td class="p-2 text-center text-xs">${item.cantidad}</td>
                            <td class="p-2 text-center">
                                <button type="button" onclick="eliminarMed(${index})" class="text-red-500 hover:text-red-700 font-bold">×</button>
                            </td>
                        </tr>
                    `;
    });
  } else {
    emptyMsg.classList.remove("hidden");
  }
}

function eliminarMed(index) {
  recetaTemporal.splice(index, 1);
  renderizarTablaReceta();
}

// 3. Enviar Formulario Completo
document
  .getElementById("formConsulta")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener tratamientos seleccionados
    const checkboxes = document.querySelectorAll(
      'input[name="tratamiento"]:checked'
    );
    const tratamientosSeleccionados = Array.from(checkboxes).map(
      (cb) => cb.value
    );

    const datos = {
      id_cita: document.getElementById("selectCita").value,
      diagnostico: document.getElementById("diagnostico").value,
      observaciones: document.getElementById("observaciones").value,
      tratamientos: tratamientosSeleccionados,
      recetas: recetaTemporal, // Enviamos el array que armamos
    };

    if (!datos.id_cita) return alert("Seleccione un paciente");

    try {
      const response = await fetch(`${API_BASE}/consultas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (response.ok) {
        alert("✅ Consulta guardada y stock actualizado");
        window.location.reload();
      } else {
        alert("❌ Error al guardar");
      }
    } catch (error) {
      console.error(error);
    }
  });

init();
