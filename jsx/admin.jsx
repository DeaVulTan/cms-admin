var CreateKeyModal = React.createClass({
    getInitialState: function() {
        return {scope: '', deployPhrase: ''};
    },
    onSubmit: function() {
        var keys = nacl.sign.keyPair();
        var aes  = new sjcl.cipher.aes(prepare_key_pw(this.refs.pass1.value));
        var args = {
            'id': nacl.util.encodeBase64(keys.publicKey),
            'privKey': a32_to_base64(encrypt_key(aes, keys.secretKey)),
            'passAes': stringhash('deploy', aes),
            'scope' : this.refs.scope.value.split(/,+/g).map(function(n) {
                return $.trim(n);
            })
        };
            
        Server.exec("register-deploy-key", args)
            .then(function(resp) {
                this.setState({ publicKey: resp.id });
            }.bind(this));
    },
    render: function() {
        var form = <form className="form-signin" onSubmit={this.onSubmit}>
            <label className="sr-only">Deploy password</label>
            <input type="password" ref="pass1" className="form-control" placeholder="Password" required />
            <label className="sr-only">Scope (leave empty for global key)</label>
            <input type="text" ref="scope" className="form-control" placeholder="Scope" />
        </form>;
        var buttons = <div>
            <button type="button" className="btn btn-danger" data-dismiss="modal">Cancel</button>
            <a type="button" className="btn btn-primary" onClick={this.onSubmit}>Create</a>
        </div>;

        if (this.state.publicKey) {
            form = <div className="alert alert-success">
                Your public key is {this.state.publicKey}
            </div>;
            buttons = <div>
                    <button type="button" className="btn btn-primary" data-dismiss="modal">Close</button>
            </div>
        }

        return <div className="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="myModalLabel">Create deploy key</h4>
                        </div>
                        <div className="modalbody">
                            {form}
                        </div>
                        <div className="modal-footer">
                            {buttons}
                        </div>
                    </div>
                </div>
            </div>;
    }
});

function createReleaseKey() {
    if (!document.getElementById('myModal')) {
        ReactDOM.render(
            <CreateKeyModal />,
            document.getElementById('modals')
        );
    }
    $('#myModal').modal({backdrop: 'static', keyboard: false});
}
