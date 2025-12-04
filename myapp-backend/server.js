const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Permite conectar con Vite
app.use(bodyParser.json());

const database_config = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hospital_pre'
};


// --- CONEXIÓN A BASE DE DATOS ---
const db = mysql.createConnection({
    host: database_config.host,
    user: database_config.user,
    password: database_config.password,   // <--- ASEGÚRATE QUE ESTA SEA TU CONTRASEÑA REAL DE WORKBENCH
    database: database_config.database // <--- CORREGIDO: Debe coincidir con el nombre en MySQL Workbench
});

// Eliminado el "++" que causaba el error aquí

db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log(`Conectado a la Base de Datos: ${database_config.database}`);
});

//! EndPoints: Punto de intercambio de datos.

//? Pacientes

// 1. Obtener todos los pacientes
app.get('/api/pacientes', (req, res) => {
    const sql = 'SELECT * FROM paciente ORDER BY id_paciente DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. Crear un nuevo paciente
app.post('/api/pacientes', (req, res) => {
    const { nombre_completo, dni, fecha_nacimiento, telefono, email } = req.body;
    const sql = 'INSERT INTO paciente (nombre_completo, dni, fecha_nacimiento, telefono, email) VALUES (?, ?, ?, ?, ?)';
    
    db.query(sql, [nombre_completo, dni, fecha_nacimiento, telefono, email], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, message: 'Paciente creado exitosamente' });
    });
});

//? Medicos

// 3. Obtener todos los médicos
app.get('/api/medicos', (req, res) => {
    const sql = 'SELECT * FROM medico ORDER BY id_medico DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 4. Crear un nuevo médico
app.post('/api/medicos', (req, res) => {
    const { nombre_completo, especialidad, numero_licencia, telefono, email } = req.body;
    const sql = 'INSERT INTO medico (nombre_completo, especialidad, numero_licencia, telefono, email) VALUES (?, ?, ?, ?, ?)';
    
    db.query(sql, [nombre_completo, especialidad, numero_licencia, telefono, email], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, message: 'Médico creado exitosamente' });
    });
});

//? Citas

// 5. Obtener citas (con nombres de pacientes y médicos)
app.get('/api/citas', (req, res) => {
    const sql = `
        SELECT c.id_cita, c.fecha_hora, c.motivo, c.estado, 
               p.nombre_completo AS paciente, 
               m.nombre_completo AS medico
        FROM cita c
        JOIN paciente p ON c.id_paciente = p.id_paciente
        JOIN medico m ON c.id_medico = m.id_medico
        ORDER BY c.fecha_hora ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 6. Crear nueva cita
app.post('/api/citas', (req, res) => {
    const { fecha_hora, motivo, id_paciente, id_medico } = req.body;
    const sql = 'INSERT INTO cita (fecha_hora, motivo, id_paciente, id_medico) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [fecha_hora, motivo, id_paciente, id_medico], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Cita agendada correctamente', id: result.insertId });
    });
});

//? Tratamientos

// 7. Obtener lista de tratamientos
app.get('/api/tratamientos', (req, res) => {
    const sql = 'SELECT * FROM tratamiento ORDER BY nombre ASC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 8. Crear nuevo tratamiento
app.post('/api/tratamientos', (req, res) => {
    const { nombre, descripcion, costo } = req.body;
    const sql = 'INSERT INTO tratamiento (nombre, descripcion, costo) VALUES (?, ?, ?)';
    
    db.query(sql, [nombre, descripcion, costo], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Tratamiento creado', id: result.insertId });
    });
});

//? Consulta de Historia Clinica

// 9. Obtener citas PENDIENTES (Para que el médico elija cuál atender)
app.get('/api/citas/pendientes', (req, res) => {
    const sql = `
        SELECT c.id_cita, c.fecha_hora, p.nombre_completo as paciente 
        FROM cita c
        JOIN paciente p ON c.id_paciente = p.id_paciente
        WHERE c.estado = 'Pendiente'
        ORDER BY c.fecha_hora ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 10. Guardar Consulta Completa (Con Tratamientos y Recetas)
app.post('/api/consultas', (req, res) => {
    // AHORA RECIBIMOS TAMBIÉN "recetas"

    const { id_cita, diagnostico, observaciones, tratamientos, recetas } = req.body;

    // Paso A: Insertar la Historia Clínica
    const sqlHistoria = 'INSERT INTO historia_clinica (id_cita, diagnostico, observaciones) VALUES (?, ?, ?)';
    
    db.query(sqlHistoria, [id_cita, diagnostico, observaciones], (err, resultHistoria) => {
        if (err) return res.status(500).send(err);
        
        const id_historia = resultHistoria.insertId;

        // Paso B: Marcar la Cita como 'Completada'
        db.query('UPDATE cita SET estado = "Completada" WHERE id_cita = ?', [id_cita]);

        // Paso C: Insertar los tratamientos seleccionados (si hay)
        if (tratamientos && tratamientos.length > 0) {
            const values = tratamientos.map(id_trat => [id_historia, id_trat]);
            const sqlDetalle = 'INSERT INTO historia_tratamiento (id_historia, id_tratamiento) VALUES ?';
            
            db.query(sqlDetalle, [values], (errDetalle) => {
                if (errDetalle) console.error("Error guardando tratamientos:", errDetalle);
            });
        }

        // Paso D: GUARDAR RECETAS Y DESCONTAR STOCK (NUEVO)
        if (recetas && recetas.length > 0) {
            const valuesReceta = recetas.map(r => [id_historia, r.id_medicamento, r.dosis, r.cantidad]);
            
            // 1. Insertar en tabla receta_medica
            db.query('INSERT INTO receta_medica (id_historia, id_medicamento, dosis, cantidad) VALUES ?', [valuesReceta], (errReceta) => {
                if(errReceta) console.error("Error guardando receta:", errReceta);

                // 2. Actualizar Stock (Restar inventario)
                recetas.forEach(r => {
                    db.query('UPDATE medicamento SET stock = stock - ? WHERE id_medicamento = ?', [r.cantidad, r.id_medicamento]);
                });
            });
        }

        res.json({ message: 'Consulta y Receta guardadas con éxito', id_historia });
    });
});

//? Facturas

// ==========================================
// 6. MÓDULO DE FACTURACIÓN (CORREGIDO)
// ==========================================

// A. Ver citas listas para cobrar (SOLO las 'Completada')
app.get('/api/facturas/pendientes', (req, res) => {
    const sql = `
        SELECT c.id_cita, c.fecha_hora, p.id_paciente, p.nombre_completo as paciente, m.nombre_completo as medico
        FROM cita c
        JOIN paciente p ON c.id_paciente = p.id_paciente
        JOIN medico m ON c.id_medico = m.id_medico
        WHERE c.estado = 'Completada'  -- Solo las que el médico cerró pero no se han cobrado
        ORDER BY c.fecha_hora DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// B. Generar Factura y MOVER A HISTORIAL
app.post('/api/facturas/generar', (req, res) => {
    const { id_cita, id_paciente } = req.body;

    // 1. Calcular total
    const sqlItems = `
        SELECT t.nombre, t.costo 
        FROM historia_clinica hc
        JOIN historia_tratamiento ht ON hc.id_historia = ht.id_historia
        JOIN tratamiento t ON ht.id_tratamiento = t.id_tratamiento
        WHERE hc.id_cita = ?
    `;

    db.query(sqlItems, [id_cita], (err, items) => {
        if (err) return res.status(500).send(err);

        let total = 0;
        items.forEach(item => total += parseFloat(item.costo));
        if (total === 0) total = 50.00; 

        // 2. Crear la Factura
        const sqlFactura = 'INSERT INTO factura (id_paciente, total) VALUES (?, ?)';
        db.query(sqlFactura, [id_paciente, total], (err, resultFact) => {
            if (err) return res.status(500).send(err);
            const id_factura = resultFact.insertId;

            // 3. Guardar detalle
            if (items.length > 0) {
                const values = items.map(i => [id_factura, i.nombre, i.costo]);
                db.query('INSERT INTO detalle_factura (id_factura, concepto, precio_unitario) VALUES ?', [values]);
            } else {
                db.query('INSERT INTO detalle_factura (id_factura, concepto, precio_unitario) VALUES (?, ?, ?)', 
                [id_factura, 'Consulta Médica Estándar', 50.00]);
            }

            // 4. CRÍTICO: CAMBIAR ESTADO A 'Facturada'
            // Esto hace que desaparezca de la lista de pendientes
            db.query('UPDATE cita SET estado = "Facturada" WHERE id_cita = ?', [id_cita]);

            res.json({ message: 'Factura Generada', id_factura, total });
        });
    });
});

// C. Ver Historial de Facturas (YA COBRADAS)
app.get('/api/facturas/historial', (req, res) => {
    const sql = `
        SELECT f.id_factura, f.fecha_emision, f.total, p.nombre_completo as paciente
        FROM factura f
        JOIN paciente p ON f.id_paciente = p.id_paciente
        ORDER BY f.fecha_emision DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

//? Modulo de Farmacia

// A. Obtener inventario de medicamentos
app.get('/api/medicamentos', (req, res) => {
    db.query('SELECT * FROM medicamento ORDER BY nombre ASC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// B. Crear nuevo medicamento (Ingreso de inventario)
app.post('/api/medicamentos', (req, res) => {
    const { nombre, principio_activo, stock, precio_unitario } = req.body;
    db.query('INSERT INTO medicamento (nombre, principio_activo, stock, precio_unitario) VALUES (?, ?, ?, ?)', 
    [nombre, principio_activo, stock, precio_unitario], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, message: 'Medicamento registrado' });
    });
});

// C. Guardar Receta (Vinculada a una Historia Clínica existente)
// Nota: Normalmente esto se haría EN el momento de la consulta, pero lo haremos aparte por simplicidad.
app.post('/api/recetas', (req, res) => {
    const { id_historia, items } = req.body; 
    // items es un array: [{id_medicamento: 1, dosis: "1 cada 8h", cantidad: 2}, ...]

    if (!items || items.length === 0) return res.status(400).send("No hay medicamentos");

    const values = items.map(i => [id_historia, i.id_medicamento, i.dosis, i.cantidad]);
    
    // 1. Insertar la receta
    const sqlInsert = 'INSERT INTO receta_medica (id_historia, id_medicamento, dosis, cantidad) VALUES ?';
    db.query(sqlInsert, [values], (err, result) => {
        if (err) return res.status(500).send(err);

        // 2. ACTUALIZAR STOCK (Disminuir inventario)
        // Recorremos los items para restar el stock uno por uno (simple approach)
        items.forEach(item => {
            db.query('UPDATE medicamento SET stock = stock - ? WHERE id_medicamento = ?', 
            [item.cantidad, item.id_medicamento]);
        });

        res.json({ message: 'Receta guardada y stock actualizado' });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});