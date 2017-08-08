#!/usr/bin/env node
var coffeebar = require('coffeebar')

coffeebar(['eventemitter.coffee', 'jsonful.coffee', 'node_modules/promise-coffee/promise.coffee'], {
    header: false,
    output: 'jsonful.js'
})

coffeebar(['eventemitter.coffee', 'jsonful.coffee', 'node_modules/promise-coffee/promise.coffee'], {
    minify: true,
    output: 'jsonful.min.js',
})
