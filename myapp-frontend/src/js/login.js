document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Redirect based on role
                    if (data.user.rol === 'Paciente') {
                        window.location.href = 'dashboard_paciente.html';
                    } else if (data.user.rol === 'Medico') {
                        window.location.href = 'dashboard_medico.html';
                    } else if (data.user.rol === 'Administrador') {
                        window.location.href = 'dashboard_admin.html';
                    }
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al conectar con el servidor');
            }
        });