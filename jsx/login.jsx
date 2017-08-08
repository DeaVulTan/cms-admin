var Register = React.createClass({
    getInitialState: function() {
        return {user: null};
    },
    onSubmit: function(e) {
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
        var aes  = new sjcl.cipher.aes(prepare_key_pw(pass1));
        var keys = nacl.box.keyPair();

        Server.exec("confirm_registration", {
            id: this.state.user.id,
            hash: this.props.hash,
            publicKey: a32_to_base64(keys.publicKey),
            secretKey: a32_to_base64(encrypt_key(aes, keys.secretKey)),
            login_hash: stringhash(this.state.user.email, aes),
        }).then(function() {
            this.setState({ success: true, message:  "Your account is activated, please login" });
        }.bind(this)).catch(function(e) {
            this.setState({error: e.text});
        }.bind(this));
    },
    render: function() {
        if (this.state.success || this.state.fatalError) {
            var className = this.state.success ? 'info' : 'danger';
            return (<div>
                <form className="form-signin" onSubmit={this.onSubmit}>
                    <div className={"alert alert-" + className}>
                        {this.state.message}
                    </div>
                </form>
            </div>);

        }
        if (!this.state.user) {
            return (<div>
                <form className="form-signin" onSubmit={this.onSubmit}>
                    <div>Loading</div> 
                </form>
            </div>);
        }
        var error;
        if (this.state.error) {
            error = <div className="alert alert-danger">{this.state.error}</div>
        }

        return (<div>
            <form className="form-signin" onSubmit={this.onSubmit}>
            <h2 className="form-signin-heading">Welcome {this.state.user.email}</h2>
            <div className="alert alert-info">
                You are about to create your password for MEGA's CMS admin. <br/>
                Please choose a strong password.
            </div>
            {error}
            <label className="sr-only">Password</label>
            <input type="password" ref="pass1" className="form-control" placeholder="Password" required />
            <label className="sr-only">Repeat Password</label>
            <input type="password" ref="pass2" className="form-control" placeholder="Repeat Password" required />
            <div className="checkbox">
            </div>
            <button className="btn btn-lg btn-primary btn-block" type="submit">Register</button>
            </form>
        </div>);
    }
});


var LoginList = React.createClass({
    getInitialState: function() {
        return {error: false};
    },
    onSubmit: function(e) {
        e.preventDefault();
        var that = this;

        var aes  = new sjcl.cipher.aes(prepare_key_pw(this.refs.inputPassword.value));

        Server.exec("login", { hash : stringhash(this.refs.inputEmail.value, aes) })
            .catch(function() {
                that.setState({ error: true});
            })
            .then(function(response) {
                if (!response) return;
                localStorage.publicKey = response.publicKey;
                localStorage.secretKey = a32_to_base64(decrypt_key(aes, base64_to_a32(response.secretKey)));
                main();
            });
    },
    render: function() {
        var error = [];
        if (this.state.error) {
            error = <div className="alert alert-danger">Invalid username or password</div>;
        }
        return (<div>
            <form className="form-signin" onSubmit={this.onSubmit}>
            <h2 className="form-signin-heading">Please sign in</h2>
            {error}
            <label className="sr-only">Email address</label>
            <input type="email" ref="inputEmail" className="form-control" placeholder="Email address" required autofocus />
            <label className="sr-only">Password</label>
            <input type="password" ref="inputPassword" className="form-control" placeholder="Password" required />
            <div className="checkbox">
            <label>
            <input type="checkbox" value="remember-me" /> Remember me
            </label>
            </div>
            <button className="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>
            </form>
        </div>);
    }
});
