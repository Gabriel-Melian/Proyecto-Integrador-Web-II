const express = require('express');//Importar Express
const cors = require('cors');//Importar el modulo cors
const traductor = require('node-google-translate-skidz');//Importo el modulo traductor.
const bodyParser = require('body-parser');//Importar el modulo body-parser para parsear y manejar los datos
const app = express();//Crear instancia de Express
const PORT = 3000;//Especifica el puerto de escucha

const fs = require('fs');//Importa el módulo 'fs' para leer archivos. Fail system

//Middleware para analizar el cuerpo de las solicitudes
app.use(bodyParser.json());

//Middleware para habilitar CORS
app.use(cors());

let ofertas = JSON.parse(fs.readFileSync('./ofertas.json', 'utf-8'));//Lee los datos del archivo ofertas.json

//Middleware para el parsing de JSON
app.use(express.json());

//Endpoint para obtener ofertas
app.get('/ofertas', (req, res) => {
  res.json(ofertas);//Devuelve el arreglo de ofertas en formato JSON
});

//No se pueden llamar funciones del server.js desde el lado del cliente
//Esta funcion debe ir del lado del cliente, en una iteracion que la llame para guardar los titulos y descripciones
async function traducir(titulo, descripcion, categoria) {
    try {
        const tituloTrad= await traductor({
            text: titulo,
            source: 'en',
            target: 'es'
        });

        const descripcionTrad = await traductor({
            text: descripcion,
            source: 'en',
            target: 'es'
        });

        const categoriaTrad = await traductor({
          text: categoria,
          source: 'en',
          target: 'es'
      });

        //Devuelve un objeto con el titulo, descripcion y categoria
        return {
            title: tituloTrad.translation,
            description: descripcionTrad.translation,
            category: categoriaTrad.translation
        };
    } catch (error) {
        console.error('Error al traducir:', error);
        throw new Error('Error al traducir el texto');
    }
}

//Endpoint para traducir
app.post('/traducir', async (req, res) => {
  try {
      const { titulo, descripcion, categoria } = req.body;
      const traducciones = await traducir(titulo, descripcion, categoria);
      res.json(traducciones);
  } catch (error) {
      console.error('Error al traducir:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
});
//http://localhost:3000/traducir -> colocar en el navegador. Cannot GET /traducir

//Endpoint para agregar un producto en oferta
app.post('/ofertas', (req, res) => {
  const { id, descuento } = req.body;//Obtener ID y descuento de la peticion
  //Verifico ID y descuento
  if (!id || !descuento) {
    return res.status(400).json({ error: 'Se requiere un ID y un porcentaje de descuento' });
  }
  ofertas.push({ id, descuento });//Pusheo el producto en oferta
  res.status(201).json({ message: 'Producto en oferta agregado correctamente' });
});

//Endpoint para manejar la solicitud de compra
app.post('/compra', (req, res) => {
  //Obtener los datos de la compra del cuerpo de la solicitud
  const compra = req.body;

  //Leer el archivo compras.json
  fs.readFile('compras.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo compras.json', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    //console.log('Contenido del archivo compras.json:', data);//Depurar

    let compras = [];

    //Intento analizar el contenido del archivo compras.json
    try {
      compras = JSON.parse(data);
    } catch (parseError) {
      console.error('Error al analizar el archivo compras.json', parseError);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    //console.log('Compras antes de agregar la nueva compra:', compras);//Depurar

    //Pusheo la nueva compra
    compras.push(compra);

    //console.log('Compras después de agregar la nueva compra:', compras);//Depurar

    //Escribo la lista actualizada de compras en el archivo compras.json
    fs.writeFile('compras.json', JSON.stringify(compras, null, 2), err => {
      if (err) {
        console.error('Error al escribir en el archivo compras.json', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      //Respuesta exitosa
      res.status(200).json({ message: 'Compra registrada exitosamente' });
    });
  });
});

app.listen(PORT, () => {//Inicia el servidor
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
//http://localhost:3000/ofertas -> colocar en el navegador.
//Ctrl + c -> para detener el servidor en ejecucion.
//cd "C:\Users\Admin\Desktop\Desarrollo de software\2024\Web ll\Integrador" -> ruta.
//node server.js -> inicia el servidor.

//El carrito se borra cuando se hace la compra de los productos pero se guarda en el servidor carrito.json por ej. No hay inicio de sesion.
//Guardar la compra en un JSON, esta debera estar en el lado del servidor. Agregar clave (IdCompra).
//Mientras no se realice una compra de un producto, el carrito permanece intacto.
//Localstorage, consultar esto.