const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Mock data
let productos = [
  { id: 1, nombre: "Leche Entera", precio: 1.2, stock: 50, categoria: "Lácteos" },
  { id: 2, nombre: "Pan Integral", precio: 0.9, stock: 30, categoria: "Panadería" },
  { id: 3, nombre: "Manzanas", precio: 2.5, stock: 100, categoria: "Frutas" },
  { id: 4, nombre: "Huevos (docena)", precio: 2.0, stock: 25, categoria: "Huevería" },
  { id: 5, nombre: "Papel Higiénico", precio: 3.5, stock: 80, categoria: "Limpieza" },
];

let usuarios = [];
let carritos = {}; // usuarioId: [ { productoId, cantidad } ]
let ordenes = [];

// ------------------------------------
// Productos
// ------------------------------------
app.get('/productos', (req, res) => {
  res.json(productos);
});

app.get('/productos/:id', (req, res) => {
  const producto = productos.find(p => p.id == req.params.id);
  producto ? res.json(producto) : res.status(404).json({ error: "Producto no encontrado" });
});

app.post('/productos', (req, res) => {
  const nuevo = { ...req.body, id: productos.length + 1 };
  productos.push(nuevo);
  res.status(201).json(nuevo);
});

app.put('/productos/:id', (req, res) => {
  const idx = productos.findIndex(p => p.id == req.params.id);
  if (idx !== -1) {
    productos[idx] = { ...productos[idx], ...req.body };
    res.json(productos[idx]);
  } else {
    res.status(404).json({ error: "Producto no encontrado" });
  }
});

app.delete('/productos/:id', (req, res) => {
  productos = productos.filter(p => p.id != req.params.id);
  res.json({ mensaje: "Producto eliminado" });
});

// ------------------------------------
// Usuarios
// ------------------------------------
app.post('/usuarios/registro', (req, res) => {
  const nuevo = { ...req.body, id: usuarios.length + 1 };
  usuarios.push(nuevo);
  res.status(201).json(nuevo);
});

app.post('/usuarios/login', (req, res) => {
  const usuario = usuarios.find(u => u.email === req.body.email && u.password === req.body.password);
  usuario ? res.json({ mensaje: "Login exitoso", usuario }) : res.status(401).json({ error: "Credenciales incorrectas" });
});

// ------------------------------------
// Carrito
// ------------------------------------
app.get('/carrito/:usuarioId', (req, res) => {
  const carrito = carritos[req.params.usuarioId] || [];
  res.json(carrito);
});

app.post('/carrito/:usuarioId/agregar', (req, res) => {
  const { productoId, cantidad } = req.body;
  const usuarioId = req.params.usuarioId;

  if (!carritos[usuarioId]) carritos[usuarioId] = [];

  const existente = carritos[usuarioId].find(item => item.productoId == productoId);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carritos[usuarioId].push({ productoId, cantidad });
  }

  res.json(carritos[usuarioId]);
});

app.post('/carrito/:usuarioId/eliminar', (req, res) => {
  const { productoId } = req.body;
  const usuarioId = req.params.usuarioId;

  if (!carritos[usuarioId]) return res.status(404).json({ error: "Carrito vacío" });

  carritos[usuarioId] = carritos[usuarioId].filter(item => item.productoId != productoId);
  res.json({ mensaje: "Producto eliminado del carrito" });
});

app.post('/carrito/:usuarioId/vaciar', (req, res) => {
  carritos[req.params.usuarioId] = [];
  res.json({ mensaje: "Carrito vaciado" });
});

// ------------------------------------
// Órdenes
// ------------------------------------
app.post('/ordenes', (req, res) => {
  const { usuarioId, metodoPago, direccionEnvio } = req.body;

  if (!carritos[usuarioId] || carritos[usuarioId].length === 0) {
    return res.status(400).json({ error: "El carrito está vacío" });
  }

  const nuevaOrden = {
    id: ordenes.length + 1,
    usuarioId,
    productos: carritos[usuarioId],
    metodoPago,
    direccionEnvio,
    fecha: new Date().toISOString()
  };

  ordenes.push(nuevaOrden);
  carritos[usuarioId] = []; // Vaciar carrito tras la compra

  res.status(201).json(nuevaOrden);
});

app.get('/ordenes/:usuarioId', (req, res) => {
  const ordenesUsuario = ordenes.filter(o => o.usuarioId == req.params.usuarioId);
  res.json(ordenesUsuario);
});

// ------------------------------------
app.listen(port, () => {
  console.log(`🛒 API de Supermercado escuchando en http://localhost:${port}`);
});
