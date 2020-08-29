const mongoose = require('mongoose')
const {config} = require('../config')

const {URI} = config

mongoose.connect(URI, {useUnifiedTopology: true, useNewUrlParser: true})
const db = mongoose.connection

module.exports = db