var DeployCredentials = React.createClass({
    getInitialState: function() {
        return {error: null};
    },
    onSubmit: function() {
        var aes  = new sjcl.cipher.aes(prepare_key_pw(this.refs.deployKey.value));
        var remember = this.refs.remember.checked;
        this.setState({ error: null });
        Server.exec("deploy-keys", {pass: stringhash('deploy', aes) }).then(function(keys) {
            var privKey = decrypt_key(aes, base64_to_a32(keys.privKey));
            me.data['deploy-key'] = privKey;
            if (remember) {
                me.data['deploy-pass'] = stringhash('deploy', aes);
                me.saveData();
            }
            hRouter.ready();
        }).catch(function(e) {
            this.setState({ error: true });
        }.bind(this));
    },
    render: function() {
        var error = '';
        if (this.state.error) {
            error = <div className="alert alert-danger">
                Invalid deploy password
                </div>;
        }
        return <div>
            <form className="form-signin" onSubmit={this.onSubmit}>
                <h2 className="form-signin-heading">Deploy passphrase</h2>
                { error }
                <label className="sr-only">Password</label>
                <input type="password" ref="deployKey" className="form-control" required autofocus />
                <input type="checkbox" value="remember-me" ref="remember" /> Remember me
                <button className="btn btn-lg btn-primary btn-block" type="submit">Prepare</button>
            </form>
        </div>;
    },
});

var DeployList = React.createClass({
    getInitialState: function() {
        return {deploy: []};
    },
    sign: function(blob) {
        var pk = new Uint8Array(me.data['deploy-key']);
        return nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeBase64(blob), pk));
    },
    deploy: function(record) {
        if (record.signature) {
            record.signature = null;
        } else {
            record.signature = this.sign(record.hash);
            record.deps.forEach(function(dep) {
                dep.signature = this.sign(dep.hash);
            }.bind(this));
        }
        this.setState({ deploy: this.state.deploy });
    },
    refresh: function() {
        Server.exec("deploy").then(function(response) {
            this.setState({ deploy: response });
        }.bind(this));
    },
    deployAll: function() {
        var records = {};
        this.state.deploy.forEach(function(record) {
            if (record.signature) {
                record.deps.forEach(function(r) {
                    records[r.hash] = r.signature;
                });
                records[record.hash] = record.signature;
            }
        });
        Server.exec("sign", records, function(err) {
            if (err) alert(err.text);
        });
        Server.exec("deploy").then(function(response) {
            this.setState({ deploy: response });
        }.bind(this));
    },
    render: function() {
        var deploy = 0;   
        var deployButton;
        for (var i in this.state.deploy) {
            if (this.state.deploy[i].signature) {
                deploy++; 
            }
        }
        if (deploy) {
            deployButton = <a onClick={this.deployAll} className="btn btn-danger">Deploy ({deploy} items)</a>; 
        }

        if (this.state.deploy.length === 0) {
            return <div>
                <div className="col-sm-12">
                    <div className="col-sm-8">
                        <a onClick={this.refresh } className="btn btn-success">Refresh</a>
                    </div>
                    <div className="col-sm-2">
                    </div>
                    <div>
                        {deployButton || ""}
                    </div>
                </div>
                <p>&nbsp;</p>
                <div className="col-sm-12">
                    <div className="alert alert-success">There is nothing to deploy</div>
                </div>
            </div>;
        }

        return <div>
            <div className="col-sm-12">
                <div className="col-sm-8">
                    <a onClick={this.refresh } className="btn btn-success">Refresh</a>
                </div>
                <div className="col-sm-2">
                </div>
                <div>
                    {deployButton || ""}
                </div>
            </div>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <td>Name</td>
                        <td>Size</td>
                        <td>Depedencies</td>
                        <td>#</td>
                    </tr>
                </thead>
                <tbody>
                    { this.state.deploy.map(function(record) {
                        var button = <a className="btn btn-success" onClick={this.deploy.bind(this, record)}>Approve</a>;
                        var deps = [];
                        if (record.signature) {
                            button = <a className="btn disabled btn-success" onClick={this.deploy.bind(this, record)}>Approve</a>; 
                        }
                        if (record.mime.match(/image/)) {
                            record.name = <img src={"/attach.php?id=" + record.file_id} width="150" />;
                        }

                        record.deps.forEach(function(dep) {
                            var html = <span key={dep.file_id}>{dep.name}</span>;
                            if (dep.mime.match(/image/)) {
                                html = <img key={dep.file_id} src={"/attach.php?id=" + dep.file_id} width="150" />;
                            }
                            deps.push(html);
                        });

                        return <tr key={record.file_id}>
                            <td>{record.name}</td>
                            <td>{record.size}</td>
                            <td>{deps}</td>
                            <td>{button}</td>
                        </tr>;
                    }.bind(this)) }
                </tbody>
            </table>
        </div>
    }
});
