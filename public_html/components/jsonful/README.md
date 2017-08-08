JSONful Javascript client
=========================

This is the JSONful Javascript client. It's designed for both, the server and NodeJS.

NodeJS
------

```bash
npm install --save jsonful
```

```js
var JSONful = require('jsonful').JSONful;

var c = new JSONful("http://localhost:9999/demo.php");
c.exec("is_prime", {q: 1}, function(err, is) {
    console.error("is prime", is);
});

c.exec("is_prime", {q: 2}, function(err, is) {
    console.error("is prime", is);
});

c.exec("is_prime", {q: 12}, function(err, is) {
    console.error("is prime", is);
});
```

Browser
-------

```bash
bower install jsonful
```
