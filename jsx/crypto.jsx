function encrypt_key(cipher, a) {
    if (!a) {
        a = [];
    }
    if (a.length === 4) {
        return cipher.encrypt(a);
    }
    var x = [];
    for (var i = 0; i < a.length; i += 4) {
        x = x.concat(cipher.encrypt([a[i], a[i + 1], a[i + 2], a[i + 3]]));
    }
    return x;
}

function decrypt_key(cipher, a) {
    if (a.length === 4) {
        return cipher.decrypt(a);
    }

    var x = [];
    for (var i = 0; i < a.length; i += 4) {
        x = x.concat(cipher.decrypt([a[i], a[i + 1], a[i + 2], a[i + 3]]));
    }
    return x;
}


// unsubstitute standard base64 special characters, restore padding
function base64urldecode(data) {
    data += '=='.substr((2 - data.length * 3) & 3)

    if (typeof atob === 'function') {
        data = data.replace(/\-/g, '+').replace(/_/g, '/').replace(/,/g, '');

        try {
            return atob(data);
        } catch (e) {
            return '';
        }
    }

    // http://kevin.vanzonneveld.net
    // +   original by: Tyler Akins (http://rumkin.com)
    // +   improved by: Thunder.m
    // +      input by: Aman Gupta
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   bugfixed by: Pellentesque Malesuada
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // *     example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
    // *     returns 1: 'Kevin van Zonneveld'
    // mozilla has this native
    // - but breaks in 2.0.0.12!
    //if (typeof this.window['atob'] === 'function') {
    //    return atob(data);
    //}
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        dec = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data += '';

    do { // unpack four hexets into three octets using index points in b64
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 === 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        }
        else if (h4 === 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        }
        else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while (i < data.length);

    dec = tmp_arr.join('');

    return dec;
}

// substitute standard base64 special characters to prevent JSON escaping, remove padding
function base64urlencode(data) {
    if (typeof btoa === 'function') {
        return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64a[h1] + b64a[h2] + b64a[h3] + b64a[h4];
    } while (i < data.length);

    enc = tmp_arr.join('');
    var r = data.length % 3;
    return (r ? enc.slice(0, r - 3) : enc);
}

// array of 32-bit words to string (big endian)
function a32_to_str(a) {
    var b = '';

    for (var i = 0; i < a.length * 4; i++) {
        b = b + String.fromCharCode((a[i >> 2] >>> (24 - (i & 3) * 8)) & 255);
    }

    return b;
}

function base64_to_a32(s) {
    return str_to_a32(base64urldecode(s));
}

function a32_to_base64(a) {
    return base64urlencode(a32_to_str(a));
}


function stringhash(s, aes) {
    if (typeof aes === "string") {
        aes = new sjcl.cipher.aes(prepare_key_pw(aes));
    }
    var s32 = str_to_a32(s);
    var h32 = [0, 0, 0, 0];

    for (i = 0; i < s32.length; i++) {
        h32[i & 3] ^= s32[i];
    }

    for (i = 16384; i--;) {
        h32 = aes.encrypt(h32);
    }

    return a32_to_base64([h32[0], h32[2]]);
}

function str_to_a32(b) {
    var a = Array((b.length + 3) >> 2);
    for (var i = 0; i < b.length; i++) {
        a[i >> 2] |= (b.charCodeAt(i) << (24 - (i & 3) * 8));
    }
    return a;
}

function prepare_key_pw(password) {
    return prepare_key(str_to_a32(password));
}

// convert user-supplied password array
function prepare_key(a) {
    var i, j, r;
    var aes = [];
    var pkey = [0x93C467E3, 0x7DB0C7A4, 0xD1BE3F81, 0x0152CB56];

    for (j = 0; j < a.length; j += 4) {
        key = [0, 0, 0, 0];
        for (i = 0; i < 4; i++) {
            if (i + j < a.length) {
                key[i] = a[i + j];
            }
        }
        aes.push(new sjcl.cipher.aes(key));
    }

    for (r = 65536; r--;) {
        for (j = 0; j < aes.length; j++) {
            pkey = aes[j].encrypt(pkey);
        }
    }

    return pkey;
}


