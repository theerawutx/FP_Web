// let express = require('express');
// let app = express();
// let bodyParser = require('body-parser');
// let mysql = require('mysql');

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // homepage route
// app.get('/', (req, res) => {
//     return res.send({ 
//         error: false, 
//         message: 'Welcome to RESTful CRUD API with NodeJS, Express, MYSQL',
//         written_by: 'Patiphan',
//         published_on: 'https://milerdev.dev'
//     })
// })

// // connection to mysql database
// let dbCon = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'fp'
// })
// dbCon.connect();

// app.get('/user', (req, res) => {
//     dbCon.query('SELECT * FROM books', (error, results, fields) => {
//         if (error) throw error;

//         let message = ""
//         if (results === undefined || results.length == 0) {
//             message = "Books table is empty";
//         } else {
//             message = "Successfully retrieved all books";
//         }
//         return res.send({ error: false, data: results, message: message});
//     })
// })


// app.listen(3000, () => {
//     console.log('Node App is running on port 3000');
// })
