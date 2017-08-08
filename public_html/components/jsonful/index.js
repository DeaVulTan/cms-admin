var JSONful = require('./jsonful').JSONful;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

JSONful.getXhr = function() {
    return new XMLHttpRequest;
};

exports.JSONful = JSONful;
