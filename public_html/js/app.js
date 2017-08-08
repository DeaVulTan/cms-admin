var Server = new JSONful("/server.php");
Server.on('session', function (sessionId) {
    localStorage.sessionId = sessionId;
});

if (typeof localStorage.sessionId === "string") {
    Server.setSession(localStorage.sessionId);
}

var overlay = (function () {
    var overlay;
    function loading() {
        var opts = {
            lines: 13, // The number of lines to draw
            length: 11, // The length of each line
            width: 5, // The line thickness
            radius: 17, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            color: '#FFF', // #rgb or #rrggbb
            speed: 1, // Rounds per second
            trail: 60, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: 'auto', // Top position relative to parent in px
            left: 'auto' // Left position relative to parent in px
        };
        var target = document.createElement("div");
        document.body.appendChild(target);
        var spinner = new Spinner(opts).spin(target);
        overlay = iosOverlay({
            text: "Loading",
            spinner: spinner
        });
        return false;
    }

    return {
        hide: function () {
            if (overlay) {
                overlay.destroy();
                overlay = null;
            }
        },
        loading: function () {
            return loading();
        }
    };
})();

Server.on('request', function () {
    overlay.loading();
});

Server.on('response', function () {
    overlay.hide();
});
var CreateKeyModal = React.createClass({
    displayName: 'CreateKeyModal',

    getInitialState: function () {
        return { scope: '', deployPhrase: '' };
    },
    onSubmit: function () {
        var keys = nacl.sign.keyPair();
        var aes = new sjcl.cipher.aes(prepare_key_pw(this.refs.pass1.value));
        var args = {
            'id': nacl.util.encodeBase64(keys.publicKey),
            'privKey': a32_to_base64(encrypt_key(aes, keys.secretKey)),
            'passAes': stringhash('deploy', aes),
            'scope': this.refs.scope.value.split(/,+/g).map(function (n) {
                return $.trim(n);
            })
        };

        Server.exec("register-deploy-key", args).then((function (resp) {
            this.setState({ publicKey: resp.id });
        }).bind(this));
    },
    render: function () {
        var form = React.createElement(
            'form',
            { className: 'form-signin', onSubmit: this.onSubmit },
            React.createElement(
                'label',
                { className: 'sr-only' },
                'Deploy password'
            ),
            React.createElement('input', { type: 'password', ref: 'pass1', className: 'form-control', placeholder: 'Password', required: true }),
            React.createElement(
                'label',
                { className: 'sr-only' },
                'Scope (leave empty for global key)'
            ),
            React.createElement('input', { type: 'text', ref: 'scope', className: 'form-control', placeholder: 'Scope' })
        );
        var buttons = React.createElement(
            'div',
            null,
            React.createElement(
                'button',
                { type: 'button', className: 'btn btn-danger', 'data-dismiss': 'modal' },
                'Cancel'
            ),
            React.createElement(
                'a',
                { type: 'button', className: 'btn btn-primary', onClick: this.onSubmit },
                'Create'
            )
        );

        if (this.state.publicKey) {
            form = React.createElement(
                'div',
                { className: 'alert alert-success' },
                'Your public key is ',
                this.state.publicKey
            );
            buttons = React.createElement(
                'div',
                null,
                React.createElement(
                    'button',
                    { type: 'button', className: 'btn btn-primary', 'data-dismiss': 'modal' },
                    'Close'
                )
            );
        }

        return React.createElement(
            'div',
            { className: 'modal fade', id: 'myModal', tabindex: '-1', role: 'dialog', 'aria-labelledby': 'myModalLabel' },
            React.createElement(
                'div',
                { className: 'modal-dialog', role: 'document' },
                React.createElement(
                    'div',
                    { className: 'modal-content' },
                    React.createElement(
                        'div',
                        { className: 'modal-header' },
                        React.createElement(
                            'h4',
                            { className: 'modal-title', id: 'myModalLabel' },
                            'Create deploy key'
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'modalbody' },
                        form
                    ),
                    React.createElement(
                        'div',
                        { className: 'modal-footer' },
                        buttons
                    )
                )
            )
        );
    }
});

function createReleaseKey() {
    if (!document.getElementById('myModal')) {
        ReactDOM.render(React.createElement(CreateKeyModal, null), document.getElementById('modals'));
    }
    $('#myModal').modal({ backdrop: 'static', keyboard: false });
}
var BabelUI = React.createClass({
    displayName: "BabelUI",

    getInitialState: function () {
        return { strings: [] };
    },
    sendToBabel: function () {
        if (confirm("Please review all the strings before sending to Babel. After sending to Babel our translators will start working on the strings. Are you sure the strings are ready?")) {
            Server.exec('babel_push').then((function (r) {
                this.setState({ strings: r });
            }).bind(this));
        }
        return false;
    },
    render: function () {
        return React.createElement(
            "div",
            null,
            React.createElement(
                "a",
                { onClick: this.sendToBabel, className: "btn btn-default" },
                "Send to Babel"
            ),
            React.createElement(
                "table",
                { className: "table table-striped" },
                React.createElement(
                    "thead",
                    null,
                    React.createElement(
                        "tr",
                        null,
                        React.createElement(
                            "td",
                            null,
                            "Context"
                        ),
                        React.createElement(
                            "td",
                            null,
                            "Text"
                        )
                    )
                ),
                React.createElement(
                    "tbody",
                    null,
                    this.state.strings.map(function (record) {
                        return React.createElement(
                            "tr",
                            { key: record.id },
                            React.createElement(
                                "td",
                                null,
                                record.context
                            ),
                            React.createElement("td", { dangerouslySetInnerHTML: { __html: record.text } })
                        );
                    })
                )
            )
        );
    }
});
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
    data += '=='.substr(2 - data.length * 3 & 3);

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
    var o1,
        o2,
        o3,
        h1,
        h2,
        h3,
        h4,
        bits,
        i = 0,
        ac = 0,
        dec = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data += '';

    do {
        // unpack four hexets into three octets using index points in b64
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
        } else if (h4 === 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
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

    var o1,
        o2,
        o3,
        h1,
        h2,
        h3,
        h4,
        bits,
        i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

    do {
        // pack three octets into four hexets
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
    return r ? enc.slice(0, r - 3) : enc;
}

// array of 32-bit words to string (big endian)
function a32_to_str(a) {
    var b = '';

    for (var i = 0; i < a.length * 4; i++) {
        b = b + String.fromCharCode(a[i >> 2] >>> 24 - (i & 3) * 8 & 255);
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
    var a = Array(b.length + 3 >> 2);
    for (var i = 0; i < b.length; i++) {
        a[i >> 2] |= b.charCodeAt(i) << 24 - (i & 3) * 8;
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
var DeployCredentials = React.createClass({
    displayName: 'DeployCredentials',

    getInitialState: function () {
        return { error: null };
    },
    onSubmit: function () {
        var aes = new sjcl.cipher.aes(prepare_key_pw(this.refs.deployKey.value));
        var remember = this.refs.remember.checked;
        this.setState({ error: null });
        Server.exec("deploy-keys", { pass: stringhash('deploy', aes) }).then(function (keys) {
            var privKey = decrypt_key(aes, base64_to_a32(keys.privKey));
            me.data['deploy-key'] = privKey;
            if (remember) {
                me.data['deploy-pass'] = stringhash('deploy', aes);
                me.saveData();
            }
            hRouter.ready();
        }).catch((function (e) {
            this.setState({ error: true });
        }).bind(this));
    },
    render: function () {
        var error = '';
        if (this.state.error) {
            error = React.createElement(
                'div',
                { className: 'alert alert-danger' },
                'Invalid deploy password'
            );
        }
        return React.createElement(
            'div',
            null,
            React.createElement(
                'form',
                { className: 'form-signin', onSubmit: this.onSubmit },
                React.createElement(
                    'h2',
                    { className: 'form-signin-heading' },
                    'Deploy passphrase'
                ),
                error,
                React.createElement(
                    'label',
                    { className: 'sr-only' },
                    'Password'
                ),
                React.createElement('input', { type: 'password', ref: 'deployKey', className: 'form-control', required: true, autofocus: true }),
                React.createElement('input', { type: 'checkbox', value: 'remember-me', ref: 'remember' }),
                ' Remember me',
                React.createElement(
                    'button',
                    { className: 'btn btn-lg btn-primary btn-block', type: 'submit' },
                    'Prepare'
                )
            )
        );
    }
});

var DeployList = React.createClass({
    displayName: 'DeployList',

    getInitialState: function () {
        return { deploy: [] };
    },
    sign: function (blob) {
        var pk = new Uint8Array(me.data['deploy-key']);
        return nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeBase64(blob), pk));
    },
    deploy: function (record) {
        if (record.signature) {
            record.signature = null;
        } else {
            record.signature = this.sign(record.hash);
            record.deps.forEach((function (dep) {
                dep.signature = this.sign(dep.hash);
            }).bind(this));
        }
        this.setState({ deploy: this.state.deploy });
    },
    refresh: function () {
        Server.exec("deploy").then((function (response) {
            this.setState({ deploy: response });
        }).bind(this));
    },
    deployAll: function () {
        var records = {};
        this.state.deploy.forEach(function (record) {
            if (record.signature) {
                record.deps.forEach(function (r) {
                    records[r.hash] = r.signature;
                });
                records[record.hash] = record.signature;
            }
        });
        Server.exec("sign", records, function (err) {
            if (err) alert(err.text);
        });
        Server.exec("deploy").then((function (response) {
            this.setState({ deploy: response });
        }).bind(this));
    },
    render: function () {
        var deploy = 0;
        var deployButton;
        for (var i in this.state.deploy) {
            if (this.state.deploy[i].signature) {
                deploy++;
            }
        }
        if (deploy) {
            deployButton = React.createElement(
                'a',
                { onClick: this.deployAll, className: 'btn btn-danger' },
                'Deploy (',
                deploy,
                ' items)'
            );
        }

        if (this.state.deploy.length === 0) {
            return React.createElement(
                'div',
                null,
                React.createElement(
                    'div',
                    { className: 'col-sm-12' },
                    React.createElement(
                        'div',
                        { className: 'col-sm-8' },
                        React.createElement(
                            'a',
                            { onClick: this.refresh, className: 'btn btn-success' },
                            'Refresh'
                        )
                    ),
                    React.createElement('div', { className: 'col-sm-2' }),
                    React.createElement(
                        'div',
                        null,
                        deployButton || ""
                    )
                ),
                React.createElement(
                    'p',
                    null,
                    ' '
                ),
                React.createElement(
                    'div',
                    { className: 'col-sm-12' },
                    React.createElement(
                        'div',
                        { className: 'alert alert-success' },
                        'There is nothing to deploy'
                    )
                )
            );
        }

        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { className: 'col-sm-12' },
                React.createElement(
                    'div',
                    { className: 'col-sm-8' },
                    React.createElement(
                        'a',
                        { onClick: this.refresh, className: 'btn btn-success' },
                        'Refresh'
                    )
                ),
                React.createElement('div', { className: 'col-sm-2' }),
                React.createElement(
                    'div',
                    null,
                    deployButton || ""
                )
            ),
            React.createElement(
                'table',
                { className: 'table table-striped' },
                React.createElement(
                    'thead',
                    null,
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            'Name'
                        ),
                        React.createElement(
                            'td',
                            null,
                            'Size'
                        ),
                        React.createElement(
                            'td',
                            null,
                            'Depedencies'
                        ),
                        React.createElement(
                            'td',
                            null,
                            '#'
                        )
                    )
                ),
                React.createElement(
                    'tbody',
                    null,
                    this.state.deploy.map((function (record) {
                        var button = React.createElement(
                            'a',
                            { className: 'btn btn-success', onClick: this.deploy.bind(this, record) },
                            'Approve'
                        );
                        var deps = [];
                        if (record.signature) {
                            button = React.createElement(
                                'a',
                                { className: 'btn disabled btn-success', onClick: this.deploy.bind(this, record) },
                                'Approve'
                            );
                        }
                        if (record.mime.match(/image/)) {
                            record.name = React.createElement('img', { src: "/attach.php?id=" + record.file_id, width: '150' });
                        }

                        record.deps.forEach(function (dep) {
                            var html = React.createElement(
                                'span',
                                { key: dep.file_id },
                                dep.name
                            );
                            if (dep.mime.match(/image/)) {
                                html = React.createElement('img', { key: dep.file_id, src: "/attach.php?id=" + dep.file_id, width: '150' });
                            }
                            deps.push(html);
                        });

                        return React.createElement(
                            'tr',
                            { key: record.file_id },
                            React.createElement(
                                'td',
                                null,
                                record.name
                            ),
                            React.createElement(
                                'td',
                                null,
                                record.size
                            ),
                            React.createElement(
                                'td',
                                null,
                                deps
                            ),
                            React.createElement(
                                'td',
                                null,
                                button
                            )
                        );
                    }).bind(this))
                )
            )
        );
    }
});
var editors = {};
function destroyEditor() {
    editors = {};
}

function go() {
    var url = HashRouter.url.apply(HashRouter, arguments);
    document.location.hash = url;
}

function initEditor() {
    $('textarea.markdown').each(function () {
        editors[$(this).attr('name')] = new SimpleMDE({
            element: this,
            autoDownloadFontAwesome: false,
            spellChecker: false,
            previewRender: function (plainText) {
                plainText = plainText.replace(/(#+)(.)/, "$1 $2");
                plainText = plainText.replace(/\(([0-9a-f]{24})\)/ig, "(attach.php?id=$1)");
                return this.parent.markdown(plainText);
            }
        });
    });
    $('textarea.html.not-ready').removeClass('not-ready').ckeditor({
        filebrowserImageUploadUrl: '/upload-img.php?sessionId=' + localStorage.sessionId
    });
}

var CrudInput = React.createClass({
    displayName: 'CrudInput',

    onChange: function (event) {
        this.setState({ value: event.target.value });
    },
    render: function () {
        var field = this.props.field;
        var type = field.type;
        this.state = this.state || {};
        if (!this.state.value) {
            this.state.value = this.props.value || "";
        }

        switch (field.type) {
            case "markdown":
            case "html":
            case "textarea":
                return React.createElement('textarea', { ref: field.name, className: "form-control not-ready " + field.type, extra: field.type, name: field.name, onChange: this.onChange, value: this.state.value });

            case "inline":
                return React.createElement(
                    'div',
                    { className: 'sub inline' },
                    field.inputs.map((function (field, xid) {
                        var id = "field_" + this.props.id;
                        return React.createElement(
                            'div',
                            { className: 'col-sm-6', key: "inline-input-" + xid },
                            React.createElement(
                                'div',
                                { className: 'form-group' },
                                React.createElement(
                                    'label',
                                    null,
                                    field.label
                                ),
                                React.createElement(CrudInput, { field: field, ref: id, id: id, record_id: this.props.record_id,
                                    table: this.props.table, value: field.value || "" })
                            )
                        );
                    }).bind(this)),
                    React.createElement('div', { className: 'clearfix' })
                );

            case "sub":
                return React.createElement(
                    'div',
                    { className: 'sub' },
                    this.state.value.map(function (sub, i) {
                        return React.createElement(CrudForm, { key: "sub-" + i + "_" + sub.id, fields: sub.form, table: 'sub', sub: 'sub', prefix: field.name + "." + i });
                    })
                );
            case "upload":
                if (!this.props.record_id) {
                    return;
                }

                return React.createElement(MultiFileUploadInput, {
                    name: field.name, url: "/upload.php?id=" + this.props.record_id + "&table=" + this.props.table + "&m=1",
                    filter: field.extra,
                    value: this.state.value,
                    record_id: this.props.record_id,
                    table: this.props.table,
                    prefix: '/attach.php?id=' });

            case "file":
                if (!this.props.record_id) {
                    return;
                }

                return React.createElement(FileUploadInput, { name: field.name, url: "/upload.php?id=" + this.props.record_id + "&table=" + this.props.table, filter: field.extra, value: this.state.value, prefix: '/attach.php?id=' });
                break;
            case "select":
                return React.createElement(
                    'select',
                    { ref: field.name, className: 'form-control', name: field.name, value: this.state.value, onChange: this.onChange },
                    field.values.map((function (value, id) {
                        return React.createElement(
                            'option',
                            { key: id, value: id },
                            value
                        );
                    }).bind(this))
                );
        }

        return React.createElement('input', { type: type, ref: field.name, className: 'form-control', value: this.state.value, name: field.name, placeholder: '', onChange: this.onChange });
    }
});

var CRUD_cache = {};
var CrudForm = React.createClass({
    displayName: 'CrudForm',

    componentDidMount: function () {
        setTimeout(initEditor);
    },
    getData: function () {
        var data = {};
        $(this.refs.form).serializeArray().map(function (value) {
            var parts = value.name.split(/\./g);
            if (parts.length === 1) {
                data[parts[0]] = value.value;
                return;
            }
            var leaf = data;
            for (var p = 0; p < parts.length - 1; ++p) {
                if (!leaf[parts[p]]) {
                    leaf[parts[p]] = isNaN(parseInt(leaf[parts[p + 1]])) ? {} : [];
                }
                leaf = leaf[parts[p]];
            }
            leaf[parts[p]] = value.value;
        });
        for (var i in editors) {
            if (editors.hasOwnProperty(i)) {
                data[i] = editors[i].value();
            }
        }
        return data;
    },
    onSubmit: function (event) {
        event.preventDefault();

        delete CRUD_cache[this.props.id];
        this.saved = true;
        var data = this.getData();
        Server.exec('save', { data: data, id: this.props.id, table: this.props.table, embed: this.props.embed }).then((function (response) {
            if (this.props.embed) {
                go("edit", this.props.embed.table, this.props.embed.id);
            } else {
                go("list", this.props.table, 1);
            }
        }).bind(this)).catch(function (error) {
            alert("Error while saving the document:\n" + error.text);
        });
        return false;
    },
    componentWillUnmount: function () {
        if (this.saved || !CRUD_cache[this.props.id]) {
            return destroyEditor();
        }
        var data = this.getData();
        CRUD_cache[this.props.id] = CRUD_cache[this.props.id].map(function (v) {
            v.value = data[v.name];
            return v;
        });
        return destroyEditor();
    },
    render: function () {
        var formBody = this.props.fields.map((function (field, xid) {
            var id = "field_" + (this.props.id || "");
            if (this.props.prefix) {
                field.name = this.props.prefix + "." + field.name;
            }
            if (field.type === "children") {
                return "";
            }
            return React.createElement(
                'div',
                { className: 'form-group', key: id + xid },
                React.createElement(
                    'label',
                    null,
                    field.label
                ),
                React.createElement(CrudInput, { ref: id, field: field, id: id, record_id: this.props.id, table: this.props.table, value: field.value || "" })
            );
        }).bind(this));

        var postForm = this.props.fields.map((function (field, xid) {
            if (field.type !== "children") {
                return "";
            }

            var list = field.value;
            return React.createElement(
                'div',
                { className: 'form-group', key: "children-" + xid },
                React.createElement(
                    'p',
                    null,
                    ' '
                ),
                React.createElement(CrudList, {
                    fields: list.fields,
                    table: list.table,
                    pages: list.pages.pages,
                    info: list.info || "",
                    records: list.records,
                    reference: [this.props.table, field.name, this.props.id] })
            );
        }).bind(this));

        if (this.props.sub) {
            return React.createElement(
                'div',
                null,
                formBody
            );
        }
        return React.createElement(
            'form',
            { ref: 'form' },
            formBody,
            React.createElement(
                'button',
                { type: 'button', onClick: this.onSubmit, className: 'btn btn-default' },
                'Save'
            ),
            postForm
        );
    }
});
var cruds = {};

var Header = React.createClass({
    displayName: "Header",

    getInitialState: function () {
        return { currentCrud: null };
    },
    logout: function () {
        Server.exec("logout").then(main);
    },
    render: function () {
        return React.createElement(
            "div",
            null,
            React.createElement(
                "nav",
                { className: "navbar navbar-inverse navbar-fixed-top" },
                React.createElement(
                    "div",
                    { className: "container-fluid" },
                    React.createElement(
                        "div",
                        { className: "navbar-header" },
                        React.createElement(
                            "button",
                            { type: "button", className: "navbar-toggle collapsed", "data-toggle": "collapse", "data-target": "#navbar", "aria-expanded": "false", "aria-controls": "navbar" },
                            React.createElement(
                                "span",
                                { className: "sr-only" },
                                "Toggle navigation"
                            ),
                            React.createElement("span", { className: "icon-bar" }),
                            React.createElement("span", { className: "icon-bar" }),
                            React.createElement("span", { className: "icon-bar" })
                        ),
                        React.createElement(
                            "a",
                            { className: "navbar-brand", href: "#" },
                            "Project name"
                        )
                    ),
                    React.createElement(
                        "div",
                        { id: "navbar", className: "navbar-collapse collapse" },
                        React.createElement(
                            "ul",
                            { className: "nav navbar-nav navbar-right" },
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { href: "#", onClick: this.logout },
                                    "Logout"
                                )
                            )
                        ),
                        React.createElement(
                            "form",
                            { className: "navbar-form navbar-right" },
                            React.createElement("input", { type: "text", className: "form-control", placeholder: "Search..." })
                        )
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "container-fluid" },
                React.createElement(
                    "div",
                    { className: "row" },
                    React.createElement(
                        "div",
                        { className: "col-sm-3 col-md-2 sidebar" },
                        React.createElement(
                            "ul",
                            { className: "nav nav-sidebar" },
                            this.props.items.map((function (item, id) {
                                if (this.state.current === item.url) {
                                    return React.createElement(
                                        "li",
                                        { className: "active", key: id },
                                        React.createElement(
                                            "a",
                                            { href: hRouter.url("list", item.url) },
                                            item.label
                                        )
                                    );
                                } else {
                                    return React.createElement(
                                        "li",
                                        { key: id },
                                        React.createElement(
                                            "a",
                                            { href: hRouter.url("list", item.url) },
                                            item.label
                                        )
                                    );
                                }
                            }).bind(this))
                        )
                    )
                )
            ),
            React.createElement(
                "div",
                { id: "main", className: "col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main" },
                React.createElement(
                    "h1",
                    { id: "title", className: "page-header" },
                    urlLabel[this.state.current]
                ),
                React.createElement("div", { id: "main_body" })
            ),
            React.createElement("div", { id: "modals" })
        );
    }
});

var me;
var Page = null;
var urlLabel = {};
function main() {
    Server.exec("info").then(function (info) {
        if (!info.me) {
            ReactDOM.render(React.createElement(LoginList, null), document.getElementById('container'));
        } else {
            info.tables.map(function (item) {
                urlLabel[item.url] = item.label;
            });
            Page = ReactDOM.render(React.createElement(Header, { items: info.tables }), document.getElementById('container'));
            me = new User(info.me);
        }
        hRouter.ready();
    }).catch(function () {
        if (document.location.hash === "") {
            ReactDOM.render(React.createElement(LoginList, null), document.getElementById('container'));
        }
        hRouter.ready();
    });
}
main();
var Register = React.createClass({
    displayName: "Register",

    getInitialState: function () {
        return { user: null };
    },
    onSubmit: function (e) {
        e.preventDefault();
        var pass1 = this.refs.pass1.value;
        var pass2 = this.refs.pass2.value;
        if (!pass1) {
            return this.setState({ error: "You password cannot empty" });
        }
        if (pass1.length < 5) {
            return this.setState({ error: "Your password must be at least 5 letters long" });
        }
        if (pass1 !== pass2) {
            return this.setState({ error: "Your password doesn't match" });
        }
        this.setState({ error: null });
        var aes = new sjcl.cipher.aes(prepare_key_pw(pass1));
        var keys = nacl.box.keyPair();

        Server.exec("confirm_registration", {
            id: this.state.user.id,
            hash: this.props.hash,
            publicKey: a32_to_base64(keys.publicKey),
            secretKey: a32_to_base64(encrypt_key(aes, keys.secretKey)),
            login_hash: stringhash(this.state.user.email, aes)
        }).then((function () {
            this.setState({ success: true, message: "Your account is activated, please login" });
        }).bind(this)).catch((function (e) {
            this.setState({ error: e.text });
        }).bind(this));
    },
    render: function () {
        if (this.state.success || this.state.fatalError) {
            var className = this.state.success ? 'info' : 'danger';
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "form",
                    { className: "form-signin", onSubmit: this.onSubmit },
                    React.createElement(
                        "div",
                        { className: "alert alert-" + className },
                        this.state.message
                    )
                )
            );
        }
        if (!this.state.user) {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "form",
                    { className: "form-signin", onSubmit: this.onSubmit },
                    React.createElement(
                        "div",
                        null,
                        "Loading"
                    )
                )
            );
        }
        var error;
        if (this.state.error) {
            error = React.createElement(
                "div",
                { className: "alert alert-danger" },
                this.state.error
            );
        }

        return React.createElement(
            "div",
            null,
            React.createElement(
                "form",
                { className: "form-signin", onSubmit: this.onSubmit },
                React.createElement(
                    "h2",
                    { className: "form-signin-heading" },
                    "Welcome ",
                    this.state.user.email
                ),
                React.createElement(
                    "div",
                    { className: "alert alert-info" },
                    "You are about to create your password for MEGA's CMS admin. ",
                    React.createElement("br", null),
                    "Please choose a strong password."
                ),
                error,
                React.createElement(
                    "label",
                    { className: "sr-only" },
                    "Password"
                ),
                React.createElement("input", { type: "password", ref: "pass1", className: "form-control", placeholder: "Password", required: true }),
                React.createElement(
                    "label",
                    { className: "sr-only" },
                    "Repeat Password"
                ),
                React.createElement("input", { type: "password", ref: "pass2", className: "form-control", placeholder: "Repeat Password", required: true }),
                React.createElement("div", { className: "checkbox" }),
                React.createElement(
                    "button",
                    { className: "btn btn-lg btn-primary btn-block", type: "submit" },
                    "Register"
                )
            )
        );
    }
});

var LoginList = React.createClass({
    displayName: "LoginList",

    getInitialState: function () {
        return { error: false };
    },
    onSubmit: function (e) {
        e.preventDefault();
        var that = this;

        var aes = new sjcl.cipher.aes(prepare_key_pw(this.refs.inputPassword.value));

        Server.exec("login", { hash: stringhash(this.refs.inputEmail.value, aes) }).catch(function () {
            that.setState({ error: true });
        }).then(function (response) {
            if (!response) return;
            localStorage.publicKey = response.publicKey;
            localStorage.secretKey = a32_to_base64(decrypt_key(aes, base64_to_a32(response.secretKey)));
            main();
        });
    },
    render: function () {
        var error = [];
        if (this.state.error) {
            error = React.createElement(
                "div",
                { className: "alert alert-danger" },
                "Invalid username or password"
            );
        }
        return React.createElement(
            "div",
            null,
            React.createElement(
                "form",
                { className: "form-signin", onSubmit: this.onSubmit },
                React.createElement(
                    "h2",
                    { className: "form-signin-heading" },
                    "Please sign in"
                ),
                error,
                React.createElement(
                    "label",
                    { className: "sr-only" },
                    "Email address"
                ),
                React.createElement("input", { type: "email", ref: "inputEmail", className: "form-control", placeholder: "Email address", required: true, autofocus: true }),
                React.createElement(
                    "label",
                    { className: "sr-only" },
                    "Password"
                ),
                React.createElement("input", { type: "password", ref: "inputPassword", className: "form-control", placeholder: "Password", required: true }),
                React.createElement(
                    "div",
                    { className: "checkbox" },
                    React.createElement(
                        "label",
                        null,
                        React.createElement("input", { type: "checkbox", value: "remember-me" }),
                        " Remember me"
                    )
                ),
                React.createElement(
                    "button",
                    { className: "btn btn-lg btn-primary btn-block", type: "submit" },
                    "Sign in"
                )
            )
        );
    }
});
function checkSession() {
    if (!me) {
        ReactDOM.render(React.createElement(LoginList, null), document.getElementById('container'));
    }
    return !!me;
}

hRouter.route("register/:hash", function (hash) {
    var register = ReactDOM.render(React.createElement(Register, { hash: hash }), document.getElementById('container'));
    Server.exec("register", { hash: hash }).then(function (user) {
        register.setState({ user: user });
    }).catch(function () {
        register.setState({ fatalError: true, message: "The link is no longer valid" });
    });
});

hRouter.addFilter('page', function (page) {
    page = parseInt(page);
    return page > 0;
});

hRouter.route("edit-push/:table/:id/:parent_id/:parent_prop/:parent_table", function (table, id, parent_id, parent_prop, parent_table) {
    Page.setState({ current: table });
    var embed = { id: parent_id, prop: parent_prop, table: parent_table };
    if (CRUD_cache[id]) {
        // resume editing
        ReactDOM.render(React.createElement(CrudForm, { fields: CRUD_cache[id], table: table, id: id, embed: embed, key: Math.random() }), document.getElementById("main_body"));
        return;
    }
    Server.exec("form", { table: table, id: id }).then(function (form) {
        CRUD_cache[id] = form;
        ReactDOM.render(React.createElement(CrudForm, { fields: form, table: table, id: id, embed: embed, key: Math.random() }), document.getElementById("main_body"));
    });
}).name("edit_push").preRoute(checkSession);

hRouter.route("push/:table/:parent_id/:parent_prop/:parent_table", function (table, parent_id, parent_prop, parent_table) {
    Page.setState({ current: table });
    var embed = { id: parent_id, prop: parent_prop, table: parent_table };
    Server.exec("form", { table: table }).then(function (form) {
        ReactDOM.render(React.createElement(CrudForm, { fields: form, table: table, id: 'new', embed: embed, key: Math.random() }), document.getElementById("main_body"));
    });
}).name("push").preRoute(checkSession);

hRouter.route("new/:table", function (table) {
    Page.setState({ current: table });
    Server.exec("form", { table: table }).then(function (form) {
        ReactDOM.render(React.createElement(CrudForm, { fields: form, table: table, id: 'new', key: Math.random() }), document.getElementById("main_body"));
    });
}).name("create").preRoute(checkSession);

hRouter.route("list/babelstring/:page", function () {
    Page.setState({ current: "Babel Synchronization" });
    Server.exec("babel").then(function (response) {
        ReactDOM.render(React.createElement(BabelUI, null), document.getElementById('main_body')).setState({ strings: response });
    });
});

hRouter.route("list/deploy_keys/:page", function () {
    Page.setState({ current: "Deploy Keys" });
    Server.exec("get_js_embed").then(function (response) {
        ReactDOM.render(React.createElement(
            'pre',
            null,
            React.createElement(
                'code',
                { className: 'javascript' },
                response.code
            )
        ), document.getElementById('main_body'));
        hljs.highlightBlock($('code')[0]);
    });
});

hRouter.route("list/deploy/:page", function (page) {
    if (!me.canDeploy()) {
        ReactDOM.render(React.createElement(DeployCredentials, null), document.getElementById('main_body'));
        return;
    }
    Page.setState({ current: "Deploy" });
    Server.exec("deploy").then(function (response) {
        ReactDOM.render(React.createElement(DeployList, null), document.getElementById("main_body")).setState({ deploy: response });
    });
}).preRoute(checkSession);

hRouter.route("list/:table/:page", function (table, page) {
    Page.setState({ current: table });
    Server.exec("list", { table: table, page: page }).then(function (list) {
        var element = ReactDOM.render(React.createElement(CrudList, { fields: list.fields, table: table, pages: list.pages.pages, info: list.info || "" }), document.getElementById('main_body'));
        element.setState({ records: list.records });
    });
}).name("list").setDefault("page", 1).preRoute(checkSession);

hRouter.route("edit/:table/:id", function (table, id) {
    if (CRUD_cache[id]) {
        // resume editing
        ReactDOM.render(React.createElement(CrudForm, { fields: CRUD_cache[id], table: table, id: id, key: Math.random() }), document.getElementById("main_body"));
        return;
    }
    Server.exec("form", { table: table, id: id }).then(function (form) {
        CRUD_cache[id] = form;
        ReactDOM.render(React.createElement(CrudForm, { fields: form, table: table, id: id, key: Math.random() }), document.getElementById("main_body"));
    });
}).name("edit").preRoute(checkSession);
var CrudList = React.createClass({
    displayName: "CrudList",

    getInitialState: function () {
        return { records: this.props.records || [] };
    },
    delete: function (event) {
        if (confirm("Are you sure to delete this entry? There is no wayback")) {
            var obj = event.currentTarget;
            Server.exec("delete", { id: obj.getAttribute('data-id'), table: this.props.table, parent: this.props.reference || null }).then((function (response) {
                this.setState(response);
            }).bind(this));
        }
        return false;
    },
    render: function () {
        var btn = "Create";
        var link = hRouter.url("create", this.props.table);
        if (this.props.reference) {
            btn = "Create " + this.props.reference[1];
            link = hRouter.url("push", this.props.table, this.props.reference[2], this.props.reference[1], this.props.reference[0]);
        }
        return React.createElement(
            "div",
            null,
            React.createElement(
                "div",
                null,
                React.createElement(
                    "em",
                    null,
                    this.props.info
                )
            ),
            React.createElement(
                "a",
                { href: link, className: "btn btn-success" },
                btn
            ),
            React.createElement(
                "table",
                { className: "table table-striped" },
                React.createElement(
                    "thead",
                    null,
                    React.createElement(
                        "tr",
                        null,
                        this.props.fields.map(function (entry, id) {
                            return React.createElement(
                                "th",
                                { key: id },
                                entry
                            );
                        }),
                        React.createElement(
                            "th",
                            { className: "buttons" },
                            "#"
                        )
                    )
                ),
                React.createElement(
                    "tbody",
                    null,
                    this.state.records.map((function (row, id) {
                        var link = hRouter.url("edit", this.props.table, row.id);
                        if (this.props.reference) {
                            link = hRouter.url("edit_push", this.props.table, row.id, this.props.reference[2], this.props.reference[1], this.props.reference[0]);
                        }
                        return React.createElement(
                            "tr",
                            { key: id },
                            this.props.fields.map(function (entry, id) {
                                return React.createElement(
                                    "td",
                                    { key: id },
                                    row[entry]
                                );
                            }),
                            React.createElement(
                                "td",
                                { className: "buttons" },
                                React.createElement(
                                    "a",
                                    { href: link, className: "btn btn-success" },
                                    "Edit"
                                ),
                                React.createElement(
                                    "a",
                                    { onClick: this.delete, "data-id": row.id, className: "btn btn-danger" },
                                    "Delete"
                                )
                            )
                        );
                    }).bind(this))
                )
            ),
            React.createElement(
                "nav",
                null,
                React.createElement(
                    "ul",
                    { className: "pagination" },
                    this.props.pages.map((function (page, id) {
                        return React.createElement(
                            "li",
                            { key: id },
                            React.createElement(
                                "a",
                                { href: hRouter.url("list", this.props.table, page) },
                                page
                            )
                        );
                    }).bind(this))
                )
            )
        );
    }
});
var FileMixin = {
    getInitialState: function () {
        return { value: "", file: false, progress: null };
    },
    result: function () {
        var html = [React.createElement(
            "div",
            { className: "alert " + (this.state.error ? "alert-danger" : "alert-success") },
            this.state.result
        )];
        if (this.state.error) {
            html.push(React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.beginUpload },
                "Retry upload"
            ));
        }
        return html;
    },
    beginUpload: function () {
        var that = this;
        var formData = new FormData();
        var request = new XMLHttpRequest();

        formData.append('sessionId', localStorage.sessionId);
        formData.append(this.props.name, this.state.file);
        request.onload = function () {
            var response = typeof this.response === "string" ? JSON.parse(this.response || this.responseText) : this.response;
            that.props.value = response[0];
            that.setState({ result: "File was uploaded successfully", value: response });
        };
        request.onerror = function () {
            that.setState({ error: true, result: "Upload failed." });
        };
        request.upload.onprogress = function (oEvent) {
            if (oEvent.lengthComputable) {
                that.setState({ progress: Math.max(1, Math.ceil(100 * (oEvent.loaded / oEvent.total))) });
            }
        };
        request.open('POST', this.props.url);
        request.responseType = 'json';
        request.send(formData);
        that.setState({ progress: 0 });
    },
    onChange: function (event) {
        var r = new RegExp(this.props.filter, 'i');
        var file = event.target.files[0];

        if (!(file.type || "").match(r)) {
            alert("Invalid file name, " + this.props.filter + " is expected");
            return false;
        }

        this.setState({ file: file });

        return false;
    }
};

var MultiFileUploadInput = React.createClass({
    displayName: "MultiFileUploadInput",

    mixins: [FileMixin],
    delete: function (file) {
        if (confirm("Are you sure to delete this file?")) {
            Server.exec("delete_file", {
                field: this.props.name,
                fileId: file.id,
                table: this.props.table,
                id: this.props.record_id
            }, (function (response) {
                this.setState({ value: response.response });
            }).bind(this));
        }
    },
    values: function () {
        return React.createElement(
            "table",
            { className: "table table-striped" },
            React.createElement(
                "thead",
                null,
                React.createElement(
                    "tr",
                    null,
                    React.createElement(
                        "th",
                        null,
                        "Object ID"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Mime type"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Preview "
                    )
                )
            ),
            React.createElement(
                "tbody",
                null,
                (this.state.value || this.props.value || []).map((function (value, id) {
                    return React.createElement(
                        "tr",
                        { key: id },
                        React.createElement(
                            "td",
                            null,
                            value.id
                        ),
                        React.createElement(
                            "td",
                            null,
                            value.mime.match(/image/) ? React.createElement("img", { src: this.props.prefix + value.id, width: "300px" }) : value.mime
                        ),
                        React.createElement(
                            "td",
                            null,
                            React.createElement(
                                "a",
                                { className: "btn btn-danger", onClick: this.delete.bind(this, value) },
                                "Delete"
                            )
                        )
                    );
                }).bind(this))
            )
        );
    },
    render: function () {
        if (this.state.result) {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    null,
                    this.result()
                ),
                React.createElement(
                    "div",
                    null,
                    this.values()
                )
            );
        } else if (this.state.file) {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    null,
                    "Upload file ",
                    this.state.file.name,
                    " (",
                    humanFormat(this.state.file.size),
                    ")."
                ),
                React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "button",
                        { className: "btn btn-default", onClick: this.beginUpload },
                        "Begin upload"
                    )
                ),
                React.createElement(
                    "div",
                    null,
                    this.values()
                )
            );
        }
        return React.createElement(
            "div",
            null,
            React.createElement(
                "h4",
                null,
                "Add new file"
            ),
            React.createElement("input", { type: "file", onChange: this.onChange }),
            React.createElement(
                "h4",
                null,
                "Values"
            ),
            this.values()
        );
    }
});

var FileUploadInput = React.createClass({
    displayName: "FileUploadInput",

    mixins: [FileMixin],
    value: function () {
        var val = this.props.value;
        if (val) {
            return React.createElement("img", { src: this.props.prefix + val, width: "300px" });
        }
    },
    render: function () {
        var file = this.state.file;
        if (this.state.result) {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    null,
                    this.result()
                ),
                React.createElement(
                    "div",
                    null,
                    this.value()
                )
            );
        } else if (typeof this.state.progress === "number") {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    null,
                    "Upload file ",
                    file.name,
                    " (",
                    humanFormat(file.size),
                    ")."
                ),
                React.createElement(
                    "div",
                    null,
                    "Uploading ",
                    this.state.progress,
                    "%"
                ),
                React.createElement(
                    "div",
                    null,
                    this.value()
                )
            );
        } else if (file) {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    null,
                    "Upload file ",
                    file.name,
                    " (",
                    humanFormat(file.size),
                    ")."
                ),
                React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "button",
                        { className: "btn btn-default", onClick: this.beginUpload },
                        "Begin upload"
                    )
                ),
                React.createElement(
                    "div",
                    null,
                    this.value()
                )
            );
        }
        return React.createElement(
            "div",
            null,
            React.createElement("input", { type: "file", onChange: this.onChange, value: this.state.value }),
            React.createElement(
                "div",
                null,
                this.value()
            )
        );
    }
});
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
        var nonce = encrypted.slice(0, 24);

        try {
            var data = nacl.secretbox.open(encrypted.slice(24), nonce, secret);

            if (data === false) {
                throw new Error();
            } else {
                this.data = JSON.parse(nacl.util.encodeUTF8(data));
            }
        } catch (e) {
            this.resetDatabase();
        }
    }
};

User.prototype.canDeploy = function () {
    return this.data['deploy-key'];
};

User.prototype.resetDatabase = function () {
    this.data = {};
    this.saveData();
    return true;
};

User.prototype.saveData = function () {
    var str = JSON.stringify(this.data);
    var secret = new Uint8Array(base64_to_a32(localStorage.secretKey));
    var nonce = nacl.randomBytes(24);
    var data = nacl.secretbox(nacl.util.decodeUTF8(str), nonce, secret);

    var encrypted = new Uint8Array(nonce.length + data.length);
    for (var i = 0; i < nonce.length; ++i) {
        encrypted[i] = nonce[i];
    }
    for (var e = 0; e < data.length; ++e) {
        encrypted[e + i] = data[e];
    }

    Server.exec("store", { data: nacl.util.encodeBase64(encrypted) });
    return this;
};