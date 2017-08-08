function User(data) {
    for (var i in data) {
        if (data.hasOwnProperty(i)) {
            this[i] = data[i];
        }
    }

    if (!this.userData) {
        this.resetDatabase();
    } else {
        var secret = new Uint8Array(base64_to_a32(localStorage.secretKey));
        var encrypted = nacl.util.decodeBase64(this.userData);
        var nonce  = encrypted.slice(0, 24);

        try {
            var data = nacl.secretbox.open(encrypted.slice(24), nonce, secret);

            if (data === false) {
                throw new Error;
            } else {
                this.data = JSON.parse(nacl.util.encodeUTF8(data));
            }
        } catch (e) {
            this.resetDatabase();
        }
    }
};

User.prototype.canDeploy = function() {
    return this.data['deploy-key'];
};

User.prototype.resetDatabase = function() {
    this.data = {};
    this.saveData();
    return true;
};

User.prototype.saveData = function() {
    var str = JSON.stringify(this.data);
    var secret = new Uint8Array(base64_to_a32(localStorage.secretKey));
    var nonce  = nacl.randomBytes(24);
    var data   = nacl.secretbox(nacl.util.decodeUTF8(str), nonce, secret);

    var encrypted = new Uint8Array(nonce.length + data.length);
    for (var i = 0; i < nonce.length; ++i) {
        encrypted[i] = nonce[i];
    }
    for (var e = 0; e < data.length; ++e) {
        encrypted[e+i] = data[e];
    }

    Server.exec("store", {data: nacl.util.encodeBase64(encrypted)});
    return this;
};

