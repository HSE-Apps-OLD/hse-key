const express = require('express')
const {format} = require('util');
const dotenv = require('dotenv')
const cors = require('cors')
const config = dotenv.config()
const app = express()


// db
const db = require('./db/mongo')
db.on("open", () => console.log("Mongo Connected"))

//body parser
app.use(express.json({extended: false}))

app.use(cors())


// routes
const static = require('./routes/static')
const user = require('./routes/user')
const phone = require('./routes/phone')
app.use("/static/", static)
app.use("/user", user)
app.use("/phone", phone)

app.get('/', async (req, res) => {
    res.send('hi')
})


const PORT = process.env.PORT || 8080
app.listen(PORT, (err) => err ? console.log(err) : console.log(`Running on port ${PORT}`))