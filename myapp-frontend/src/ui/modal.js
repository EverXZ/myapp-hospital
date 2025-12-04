// Modal global que sea visto como componente para que sea reutilizable en las demás.

export function showModal({ title = "Mensaje", content = "", onClose = null }) {
    cerrarModal(); // por si ya existe uno

    const modal = document.createElement("div");
    modal.id = "global-modal";
    modal.className =
        "fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50";

    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6 animate-scaleIn">
            <h2 class="text-xl font-semibold text-gray-800 mb-3">${title}</h2>
            <p class="text-gray-600 mb-4">${content}</p>

            <div class="text-right">
                <button id="closeModalBtn"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeModalBtn").onclick = () => {
        cerrarModal();
        if (onClose) onClose();
    };
}

export function cerrarModal() {
    const modal = document.getElementById("global-modal");
    if (modal) modal.remove();
}

// Mensaje de error desde abajo :p

export function showToast(message, type = "success") {
    const toast = document.createElement("div");

    const colors = {
        success: "bg-green-600",
        error: "bg-red-600",
        warning: "bg-yellow-500",
    };

    toast.className = `
        fixed bottom-4 left-1/2 -translate-x-1/2
        text-white px-4 py-3 rounded-lg shadow-lg z-50
        ${colors[type] || colors.success}
        animate-toastIn
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("animate-toastOut");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}
