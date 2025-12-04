const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.rol !== 'Administrador') { // Check role
             // window.location.href = 'login.html'; // Uncomment in prod
        }

        function logout() {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }