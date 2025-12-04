const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const database_config = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'consultorio_db'
};

// --- CONEXIÓN A BASE DE DATOS ---
const db = mysql.createConnection({
    host: database_config.host,
    user: database_config.user,
    password: database_config.password,
    database: database_config.database
});

db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log(`Conectado a la Base de Datos: ${database_config.database}`);
});

// ==========================================
// 1. AUTHENTICATION (Login & Register)
// ==========================================

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM usuario WHERE username = ? AND password = ?';
    
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).send(err);
        
        if (results.length > 0) {
            const user = results[0];
            // Fetch specific role details
            let roleQuery = '';
            let roleIdField = '';
            
            if (user.rol === 'Paciente') {
                roleQuery = 'SELECT * FROM paciente WHERE id_usuario = ?';
                roleIdField = 'id_paciente';
            } else if (user.rol === 'Medico') {
                roleQuery = 'SELECT * FROM medico WHERE id_usuario = ?';
                roleIdField = 'id_medico';
            } else {
                // Admin
                return res.json({ message: 'Login exitoso', user: { ...user, id_rol: null } });
            }

            db.query(roleQuery, [user.id_usuario], (errRole, roleResults) => {
                if (errRole) return res.status(500).send(errRole);
                const roleData = roleResults[0];
                res.json({ 
                    message: 'Login exitoso', 
                    user: { 
                        ...user, 
                        [roleIdField]: roleData ? roleData[roleIdField] : null,
                        nombre_completo: roleData ? roleData.nombre_completo : 'Admin'
                    } 
                });
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    });
});

// Register (Patient) using Stored Procedure
app.post('/api/register', (req, res) => {
    const { nombre, dni, email, password } = req.body;
    const sql = 'CALL sp_registrar_paciente_usuario(?, ?, ?, ?)';
    
    db.query(sql, [nombre, dni, email, password], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.sqlMessage || 'Error al registrar' });
        }
        res.json({ message: 'Paciente registrado exitosamente' });
    });
});

// ==========================================
// 2. PACIENTES (User Portal)
// ==========================================

// Get My Treatments (Processes)
app.get('/api/pacientes/:id/tratamientos', (req, res) => {
    const { id } = req.params; // id_paciente
    const sql = `
        SELECT tp.*, m.nombre_completo as medico
        FROM tratamiento_proceso tp
        JOIN medico m ON tp.id_medico = m.id_medico
        WHERE tp.id_paciente = ?
        ORDER BY tp.fecha_inicio DESC
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get My Appointments
app.get('/api/pacientes/:id/citas', (req, res) => {
    const { id } = req.params; // id_paciente
    const sql = `
        SELECT c.*, m.nombre_completo as medico, tp.nombre_tratamiento
        FROM cita c
        JOIN medico m ON c.id_medico = m.id_medico
        LEFT JOIN tratamiento_proceso tp ON c.id_proceso = tp.id_proceso
        WHERE c.id_paciente = ?
        ORDER BY c.fecha_hora DESC
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// ==========================================
// 3. MEDICOS (Doctor Portal)
// ==========================================

// Get My Patients (Distinct)
app.get('/api/medicos/:id/pacientes', (req, res) => {
    const { id } = req.params; // id_medico
    const sql = `
        SELECT DISTINCT p.* 
        FROM tratamiento_proceso tp
        JOIN paciente p ON tp.id_paciente = p.id_paciente
        WHERE tp.id_medico = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get My Treatments (All)
app.get('/api/medicos/:id/tratamientos', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT tp.*, p.nombre_completo as paciente
        FROM tratamiento_proceso tp
        JOIN paciente p ON tp.id_paciente = p.id_paciente
        WHERE tp.id_medico = ?
        ORDER BY tp.fecha_inicio DESC
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Start New Treatment Process
app.post('/api/tratamientos', (req, res) => {
    const { id_paciente, id_medico, nombre_tratamiento, fecha_inicio } = req.body;
    const sql = 'INSERT INTO tratamiento_proceso (id_paciente, id_medico, nombre_tratamiento, fecha_inicio) VALUES (?, ?, ?, ?)';
    db.query(sql, [id_paciente, id_medico, nombre_tratamiento, fecha_inicio], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Tratamiento iniciado', id: result.insertId });
    });
});

// Get All Treatment Processes (for Admin)
app.get('/api/tratamientos/procesos', (req, res) => {
    const sql = `
        SELECT tp.*, p.nombre_completo as paciente, m.nombre_completo as medico
        FROM tratamiento_proceso tp
        JOIN paciente p ON tp.id_paciente = p.id_paciente
        JOIN medico m ON tp.id_medico = m.id_medico
        ORDER BY tp.fecha_inicio DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Finalize Treatment (Request or Action)
app.put('/api/tratamientos/:id/estado', (req, res) => {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    const sql = 'UPDATE tratamiento_proceso SET estado = ?, observaciones_finales = ? WHERE id_proceso = ?';
    db.query(sql, [estado, observaciones, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Estado de tratamiento actualizado' });
    });
});

// ==========================================
// 4. CITAS & HISTORIA CLINICA
// ==========================================

// Create Appointment
app.post('/api/citas', (req, res) => {
    const { fecha_hora, motivo, id_paciente, id_medico, id_proceso } = req.body;
    const sql = 'INSERT INTO cita (fecha_hora, motivo, id_paciente, id_medico, id_proceso) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [fecha_hora, motivo, id_paciente, id_medico, id_proceso], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Cita agendada', id: result.insertId });
    });
});

// Get Appointments (General or filtered)
app.get('/api/citas', (req, res) => {
    const { id_medico, fecha } = req.query;
    let sql = `
        SELECT c.*, p.nombre_completo as paciente, m.nombre_completo as medico 
        FROM cita c
        JOIN paciente p ON c.id_paciente = p.id_paciente
        JOIN medico m ON c.id_medico = m.id_medico
        WHERE 1=1
    `;
    const params = [];
    if (id_medico) {
        sql += ' AND c.id_medico = ?';
        params.push(id_medico);
    }
    if (fecha) {
        sql += ' AND DATE(c.fecha_hora) = ?';
        params.push(fecha);
    }
    sql += ' ORDER BY c.fecha_hora ASC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Save Consultation (Historia Clinica)
app.post('/api/consultas', (req, res) => {
    const { id_cita, diagnostico, observaciones, recetas } = req.body;
    
    const sql = 'INSERT INTO historia_clinica (id_cita, diagnostico, observaciones) VALUES (?, ?, ?)';
    db.query(sql, [id_cita, diagnostico, observaciones], (err, result) => {
        if (err) return res.status(500).send(err);
        
        const id_historia = result.insertId;

        // Update Cita status
        db.query('UPDATE cita SET estado = "Completada" WHERE id_cita = ?', [id_cita]);
        
        // Save Recetas (if any)
        if (recetas && recetas.length > 0) {
            const values = recetas.map(r => [id_historia, r.id_medicamento, r.dosis, r.cantidad]);
            // Insert into receta_medica (assuming table exists now)
            const sqlReceta = 'INSERT INTO receta_medica (id_historia, id_medicamento, dosis, cantidad) VALUES ?';
            db.query(sqlReceta, [values], (errReceta) => {
                if(errReceta) console.error("Error guardando receta:", errReceta);
                
                // Update Stock
                recetas.forEach(r => {
                    db.query('UPDATE medicamento SET stock = stock - ? WHERE id_medicamento = ?', [r.cantidad, r.id_medicamento]);
                });
            });
        }

        res.json({ message: 'Consulta guardada', id: result.insertId });
    });
});

// ==========================================
// 5. ADMIN & FACTURACION
// ==========================================

// Get All Users/Doctors/Patients (for Admin)
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM usuario', (err, results) => res.json(results));
});

// A. Ver citas listas para cobrar (SOLO las 'Completada')
app.get('/api/facturas/pendientes', (req, res) => {
    const sql = `
        SELECT c.id_cita, c.fecha_hora, p.id_paciente, p.nombre_completo as paciente, m.nombre_completo as medico
        FROM cita c
        JOIN paciente p ON c.id_paciente = p.id_paciente
        JOIN medico m ON c.id_medico = m.id_medico
        WHERE c.estado = 'Completada'
        ORDER BY c.fecha_hora DESC
    `;
    db.query(sql, (err, results) => {
        res.json(results);
    });
});

// B. Generar Factura
app.post('/api/facturas/generar', (req, res) => {
    const { id_cita, id_paciente } = req.body;
    
    // Simple logic: Fixed cost or calculate from services if implemented.
    // For now, let's assume a fixed cost of $50 for consultation.
    const total = 50.00;

    const sql = 'INSERT INTO factura (id_paciente, total) VALUES (?, ?)';
    db.query(sql, [id_paciente, total], (err, result) => {
        if (err) return res.status(500).send(err);
        const id_factura = result.insertId;

        // Update Cita status to 'Facturada'
        db.query('UPDATE cita SET estado = "Facturada" WHERE id_cita = ?', [id_cita]);

        res.json({ message: 'Factura generada', id: result.insertId, total });
    });
});

// Get Inventory (Meds & Equipment)
app.get('/api/inventario/medicamentos', (req, res) => {
    db.query('SELECT * FROM medicamento', (err, results) => res.json(results));
});
app.get('/api/inventario/equipos', (req, res) => {
    db.query('SELECT * FROM equipo_medico', (err, results) => res.json(results));
});

// ==========================================
// 6. LABORATORIO
// ==========================================

// Create Lab Order
app.post('/api/laboratorio', (req, res) => {
    const { id_cita, tipo_examen } = req.body;
    const sql = 'INSERT INTO orden_laboratorio (id_cita, tipo_examen) VALUES (?, ?)';
    db.query(sql, [id_cita, tipo_examen], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Orden de laboratorio creada', id: result.insertId });
    });
});

// Get Lab Orders
app.get('/api/laboratorio', (req, res) => {
    const sql = `
        SELECT ol.*, p.nombre_completo as paciente 
        FROM orden_laboratorio ol
        JOIN cita c ON ol.id_cita = c.id_cita
        JOIN paciente p ON c.id_paciente = p.id_paciente
        ORDER BY ol.fecha_orden DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Update Lab Result
app.put('/api/laboratorio/:id', (req, res) => {
    const { id } = req.params;
    const { resultados } = req.body;
    const sql = 'UPDATE orden_laboratorio SET resultados = ?, estado = "Entregado", fecha_resultado = NOW() WHERE id_orden = ?';
    db.query(sql, [resultados, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Resultados actualizados' });
    });
});

// ==========================================
// 7. ADMIN EXTENSIONS
// ==========================================

// Create User (Admin) - Handles both Patient and Doctor
app.post('/api/admin/crear_usuario', (req, res) => {
    const { nombre, dni, email, password, rol, especialidad } = req.body;
    
    // 1. Create User
    const sqlUser = 'INSERT INTO usuario (username, password, rol) VALUES (?, ?, ?)';
    db.query(sqlUser, [email, password, rol], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error creando usuario: ' + err.message });
        const id_usuario = result.insertId;

        // 2. Create Specific Role Entry
        let sqlRole = '';
        let params = [];

        if (rol === 'Paciente') {
            sqlRole = 'INSERT INTO paciente (id_usuario, nombre_completo, dni, email) VALUES (?, ?, ?, ?)';
            params = [id_usuario, nombre, dni, email];
        } else if (rol === 'Medico') {
            sqlRole = 'INSERT INTO medico (id_usuario, nombre_completo, especialidad, email) VALUES (?, ?, ?, ?)';
            params = [id_usuario, nombre, especialidad || 'General', email];
        } else {
            return res.json({ message: 'Usuario Admin creado (sin perfil extra)' });
        }

        db.query(sqlRole, params, (errRole, resultRole) => {
            if (errRole) return res.status(500).json({ error: 'Error creando perfil: ' + errRole.message });
            res.json({ message: `${rol} creado exitosamente` });
        });
    });
});

// Get All Patients (for Admin)
app.get('/api/pacientes', (req, res) => {
    db.query('SELECT * FROM paciente', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get All Doctors (for Admin)
app.get('/api/medicos', (req, res) => {
    db.query('SELECT * FROM medico', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Billing History
app.get('/api/facturas/historial', (req, res) => {
    const sql = `
        SELECT f.*, p.nombre_completo as paciente 
        FROM factura f
        JOIN paciente p ON f.id_paciente = p.id_paciente
        ORDER BY f.fecha_emision DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Inventory Re-stock
app.put('/api/inventario/:type/:id', (req, res) => {
    const { type, id } = req.params; // type: 'medicamento' or 'equipo'
    const { cantidad } = req.body; // Quantity to ADD
    
    let table = '';
    let idField = '';
    if (type === 'medicamento') {
        table = 'medicamento';
        idField = 'id_medicamento';
    } else if (type === 'equipo') {
        table = 'equipo_medico';
        idField = 'id_equipo';
    } else {
        return res.status(400).json({ error: 'Tipo inválido' });
    }

    const sql = `UPDATE ${table} SET stock = stock + ? WHERE ${idField} = ?`;
    db.query(sql, [cantidad, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Stock actualizado' });
    });
});


app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});