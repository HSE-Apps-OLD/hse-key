const {setConfig} = require('./config')

setConfig().then(() => require('./server.js'))