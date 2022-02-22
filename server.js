const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const bodyParser = require("body-parser");
const path = require('path');
const Joi = require('joi');
const dotenv = require('dotenv')

dotenv.config()
const db = require("./db");

const collection = "todo";

const User = require('./model/user')
const app = express()
const schema = Joi.object().keys({
    todo: Joi.string().required()
});
app.use(express.static('public'))

const PORT = process.env.PORT || 3000
app.set('view engine', 'ejs')

// mongodb://127.0.0.1:27017/login-app-db
mongoose.connect( process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
app.get('/', (req, res) => res.render('home'))
app.use(express.json())

app.get('/login', (req, res) => res.render('login'))
app.get('/signup', (req, res) => res.render('signup'))

const JWT_SECRET = 'jugubduuha9winjs99w999'
//login
app.post('/login', async (req, res) => {

    const {
        username,
        password
    } = req.body
    const user = await User.findOne({
        username
    }).lean()

    if (!user) {
        return res.json({
            status: 'error',
            error: 'Invalid username or password'
        })
    }
    const auth = await bcrypt.compare(password, user.password)
    if (auth) {
        //password combination is successful

        const token = jwt.sign({
            id: user._id,
            username: user.username
        }, JWT_SECRET)
        return res.json({
            status: 'ok',
            data: token
        })
    }


    res.json({
        status: 'ok',
        data: 'Something Random'
    })
})

//signup
app.post('/signup', async (req, res) => {

    //hashing the passwords
    const {
        username,
        password: plainTextPassword
    } = req.body

    if (!username || typeof username !== 'string') {
        return res.json({
            status: 'error',
            error: 'Invalid Username'
        })
    }
    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json({
            status: 'error',
            error: 'Invalid password'
        })
    }
    if (plainTextPassword < 5) {
        return res.json({
            status: 'error',
            error: 'Password should be 6 characters'
        })
    }


    const password = await bcrypt.hash(plainTextPassword, 10)

    try {
        const response = await User.create({
            username,
            password
        })
        console.log('User Created Successfully!', response)

    } catch (error) {
        if (error.code === 11000) {
            //duplicate key
            return res.json({
                status: 'error',
                error: 'Username already in use!'
            })
        }
        throw error

    }
    res.json({
        status: 'ok'
    })
})

//courses
app.get('/courses',(req,res)=> res.render('courses'))

//logout
app.get('/logout',(req, res)=>{
    // req.logout();
    res.redirect('/');
  });

//task Manager
app.use(bodyParser.json());
app.get('/t', (req, res) => {
    res.render('index');
});

// read
app.get('/getTodos', (req, res) => {
    db.getDB().collection(collection).find({}).toArray((err, documents) => {
        if (err)
            console.log(err);
        else {
            res.json(documents);
        }
    });
});

// update
app.put('/:id', (req, res) => {
    const todoID = req.params.id;
    const userInput = req.body;
    db.getDB().collection(collection).findOneAndUpdate({
        _id: db.getPrimaryKey(todoID)
    }, {
        $set: {
            todo: userInput.todo
        }
    }, {
        returnOriginal: false
    }, (err, result) => {
        if (err)
            console.log(err);
        else {
            res.json(result);
        }
    });
});


//create
app.post('/t', (req, res, next) => {
    const userInput = req.body;
    Joi.validate(userInput, schema, (err, result) => {
        if (err) {
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        } else {
            db.getDB().collection(collection).insertOne(userInput, (err, result) => {
                if (err) {
                    const error = new Error("Failed to insert Task Document");
                    error.status = 400;
                    next(error);
                } else
                    res.json({
                        result: result,
                        document: result.ops[0],
                        msg: "Successfully inserted Task!",
                        error: null
                    });
            });
        }
    })
});



//delete
app.delete('/:id', (req, res) => {
    const todoID = req.params.id;
    db.getDB().collection(collection).findOneAndDelete({
        _id: db.getPrimaryKey(todoID)
    }, (err, result) => {
        if (err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }else {
             res.json(result);
            
        }

    });
});

app.use((err, req, res, next) => {
    res.status(err.status).json({
        error: {
            message: err.message
        }
    });
})


db.connect((err) => {
    if (err) {
        console.log('unable to connect to database');
        process.exit(1);
    } else {
        console.log('Connected for task manager')
    }
});

//end of task manager
app.listen(PORT, (req, res) => console.log('App listening at port 3000'))