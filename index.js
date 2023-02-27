const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.urlencoded({ extended: false }));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 3600 * 1000 // 1hr
}));


// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.render('login');
    }
    next();
}
const ifLoggedin = (req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/main');
    }
    next();
}
/////////////////////////////////////////////////////////
app.get("/register", (req, res, next) => {
    res.render('register');
});
app.get("/main", (req, res, next) => {
    res.render('main');
});
app.get("/main", ifNotLoggedin, (req, res, next) => {
    dbConnection.query("SELECT * FROM `user` ", [req.session.userID])
        .then(([rows]) => {
            res.render('main', { data: rows });
        });
});
app.get("/user", ifNotLoggedin, (req, res, next) => {
    dbConnection.query("SELECT * FROM `user` ", [req.session.userID])
        .then(([rows]) => {
            res.render('user', { data: rows });
        });
});
// app.get("/user_edit", ifNotLoggedin, (req, res, next) => {
//     dbConnection.query("SELECT * FROM `user` ", [req.session.userID])
//         .then(([rows]) => {
//             res.render('user_edit', { data: rows });
//         });
// });



// ROOT PAGE
app.get('/', ifNotLoggedin, (req, res, next) => {
    dbConnection.execute("SELECT `name` FROM `user` WHERE `id`=?", [req.session.userID])
        .then(([rows]) => {
            res.render('main', {
                name: rows[0].name
            });
        });

});// END OF ROOT PAGE

//Register
app.post('/register', ifLoggedin,
    // post data validation(using express-validator)
    [
        body('user_email', 'Invalid email address!').isEmail().custom((value) => {
            return dbConnection.execute('SELECT `email` FROM `user` WHERE `email`=?', [value])
                .then(([rows]) => {
                    if (rows.length > 0) {
                        return Promise.reject('This E-mail already in use!');
                    }
                    return true;
                });
        }),
        body('user_name', 'Username is Empty!').trim().not().isEmpty(),
        body('user_pass', 'The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
    ],// end of post data validation
    (req, res, next) => {

        const validation_result = validationResult(req);
        const { user_name, user_pass, user_email } = req.body;
        // IF validation_result HAS NO ERROR
        if (validation_result.isEmpty()) {
            // password encryption (using bcryptjs)
            bcrypt.hash(user_pass, 12).then((hash_pass) => {
                // INSERTING USER INTO DATABASE
                dbConnection.execute("INSERT INTO `user`(`name`,`email`,`password`) VALUES(?,?,?)", [user_name, user_email, hash_pass])
                    .then(result => {
                        res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
                        href = "/login"
                    }).catch(err => {
                        // THROW INSERTING USER ERROR'S
                        if (err) throw err;
                    });
            })
                .catch(err => {
                    // THROW HASING ERROR'S
                    if (err) throw err;
                })
        }
        else {
            // COLLECT ALL THE VALIDATION ERRORS
            let allErrors = validation_result.errors.map((error) => {
                return error.msg;
            });
            // REDERING login-register PAGE WITH VALIDATION ERRORS
            res.render('login', {
                register_error: allErrors,
                old_data: req.body
            });
        }
    });

// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.execute('SELECT email FROM user WHERE email=?', [value])
            .then(([rows]) => {
                if (rows.length == 1) {
                    return true;

                }
                return Promise.reject('Invalid Email Address!');

            });
    }),
    body('user_pass', 'Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const { user_pass, user_email } = req.body;
    if (validation_result.isEmpty()) {

        dbConnection.execute("SELECT * FROM `user` WHERE `email`=?", [user_email])
            .then(([rows]) => {
                bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                    if (compare_result === true) {
                        req.session.isLoggedIn = true;
                        req.session.userID = rows[0].id;

                        res.redirect('/');
                    }
                    else {
                        res.render('login', {
                            login_errors: ['Invalid Password!']
                        });
                    }
                })
                    .catch(err => {
                        if (err) throw err;
                    });


            }).catch(err => {
                if (err) throw err;
            });
    }
    else {
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login', {
            login_errors: allErrors
        });
    }
});

// LOGOUT
app.get('/logout', (req, res) => {
    //session destroy
    req.session = null;
    res.redirect('/');
});




app.get("/user_edit/(:id)",ifNotLoggedin, (req,res,next) => {
    let id = req.params.id;
    dbConnection.query('SELECT * FROM user WHERE id = ?', [id], [res,req])
    .then(([rows]) => {
        res.render('user_edit',{data:rows[0]});
    });
  });
 
  
  app.post('/user_edit/(:id)', 
// post data validation(using express-validator)
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT email FROM user WHERE email=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass,user_email,id} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            dbConnection.query("UPDATE user SET name = ?, email = ?, password = ? WHERE id = "+ id,[user_name,user_email, hash_pass])
            .then(result => {
                res.send(`<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
                <center><br><br>EDIT SUCCESS <br><br>
                <a href="/admin" class="btn btn-primary">ADMIN</a></center>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }

});

app.get('/delete/(:id)', (req, res) => {
    let id = req.params.id;
        dbConnection.query('DELETE FROM user WHERE id = ?', [id], [res,req])
        .then(([rows]) => {
            res.redirect('/user');
        }); 
        });


app.use('/', (req, res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});


app.listen(3000, () => console.log("Server is Running..."));
