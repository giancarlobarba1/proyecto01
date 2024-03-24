const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const port = 3000
const mysql = require('mysql')


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'proyecto01'
});

// Establecer conexión a la base de datos
connection.connect(err => {
  if (err) {
      console.error('Error al conectar a MySQL:', err);
      return;
  }
  console.log('Conexión a MySQL establecida');
});


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Cache-Control", "public, max-age=3600"); 

  next();
});

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Error interno del servidor');
// });

// app.use((req, res, next) => {
//   const url = req.url;
//   const divisiones = url.split('/');
//   const final = divisiones.pop();
//   res.status(404).send('No se encuentra el elemento ' + final);
//   next();
// });



app.get('/', (req, res) => {
  res.send('Hola humano.')
  // console.log(res.status())

})


app.listen(port, () => {
  console.log(`Aplicacion desplegada en el puerto:  ${port}`)
})

app.get('/eimy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    app.use(express.static(path.join(__dirname, 'public')));
})


app.get('/productos', (req, res) => {
  const queryCategorias = 'SELECT DISTINCT categoria FROM prods';
  connection.query(queryCategorias, (err, categorias) => {
      if (err) {
          console.error('Error al buscar categorías en MySQL:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
      }
      const queryProductosAleatorios = 'SELECT * FROM prods ORDER BY RAND() LIMIT 10';
      connection.query(queryProductosAleatorios, (err, productosAleatorios) => {
          if (err) {
              console.error('Error al buscar prods aleatorios en MySQL:', err);
              return res.status(500).json({ error: 'Error interno del servidor' });
          }
          fs.readFile(path.join(__dirname, 'public', 'productos.html'), 'utf8', (err, data) => {
              if (err) {
                  console.error('Error al leer el archivo HTML:', err);
                  return res.status(500).send('Error interno del servidor');
              }
              const productosHTML = data
                  .replace('{{ categorias }}', JSON.stringify(categorias))
                  .replace('{{ productosAleatorios }}', JSON.stringify(productosAleatorios));
              res.send(productosHTML);
          });
      });
  });
});


app.get('/productos/:sku', (req, res) => {
  const sku = req.params.sku;
  const query = 'SELECT * FROM prods WHERE sku = ?';
  
  connection.query(query, [sku], (err, results) => {
    if (err) {
      console.error('Error al buscar el producto en MySQL:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const queryProductosRelacionados = 'SELECT * FROM prods ORDER BY RAND() LIMIT 7';

    connection.query(queryProductosRelacionados, [sku], (err, productosRelacionados) => {
      if (err) {
          console.error('Error al buscar productos relacionados en MySQL:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
      }

      fs.readFile(path.join(__dirname, 'public', 'producto.html'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo HTML:', err);
            return res.status(500).send('Error interno del servidor');
        }

        const productoHTML = data
            .replace('{{ nombre }}', results[0].nombre_producto)
            .replace('{{ sku }}', results[0].sku)
            .replace('{{ categoria }}', results[0].categoria)
            .replace('{{ descripcion }}', results[0].descripcion)
            .replace('{{ precio_venta }}', results[0].precio_venta)
            .replace('{{ precio_renta }}', results[0].precio_renta)
            .replace('{{ cantidad }}', results[0].cantidad)
            .replace('{{ productosRelacionados }}', JSON.stringify(productosRelacionados));


        res.send(productoHTML);
        })
      
    })
  })
})

app.use((req, res, next) => {
  const error = {
    mensaje: 'El elemento que trata de utilizar no esta disponible o no se encuentra en el servidor.',
    ruta: req.url
};

  fs.readFile(path.join(__dirname, 'public', '404.html'), 'utf8', (err, data) => {
      if (err) {
          console.error('Error al leer el archivo HTML:', err);
          return res.status(500).send('Error interno del servidor');
      }

      // Reemplaza las variables en el HTML con los datos del error
      data = data.replace('{{mensaje}}', error.mensaje);
      data = data.replace('{{ruta}}', error.ruta);

      res.status(404).send(data);
  });
})