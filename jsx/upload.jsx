var FileMixin = {
    getInitialState: function() {
        return { value: "", file: false, progress: null };
    },
    result: function() {
        var html = [(<div className={"alert " + (this.state.error ? "alert-danger" : "alert-success")}>{this.state.result}</div>)];
        if  (this.state.error) {
            html.push(<button className="btn btn-default" onClick={this.beginUpload}>Retry upload</button>);
        }
        return html;
    },
    beginUpload: function() {
        var that = this;
        var formData = new FormData();
        var request = new XMLHttpRequest();

        formData.append('sessionId', localStorage.sessionId);
        formData.append(this.props.name, this.state.file);
        request.onload = function() {
            var response = typeof this.response === "string" ? JSON.parse(this.response || this.responseText) : this.response;
            that.props.value = response[0];
            that.setState({ result: "File was uploaded successfully", value: response });
        };
        request.onerror = function() {
            that.setState({error: true,result: "Upload failed."});
        };
        request.upload.onprogress = function(oEvent) {
            if (oEvent.lengthComputable) {
                that.setState({ progress: Math.max(1, Math.ceil(100 * (oEvent.loaded/oEvent.total)))  })
            }
        };
        request.open('POST', this.props.url);
        request.responseType = 'json';
        request.send(formData);
        that.setState({ progress: 0 })

    },
    onChange: function(event) {
        var r = new RegExp(this.props.filter, 'i');
        var file = event.target.files[0];

        if (!(file.type||"").match(r)) {
            alert("Invalid file name, " + this.props.filter + " is expected");
            return false;
        }

        this.setState({ file: file });

        return false;
    },
};

var MultiFileUploadInput = React.createClass({
    mixins: [FileMixin],
    delete: function(file) {
        if (confirm("Are you sure to delete this file?")) {
            Server.exec("delete_file", {
                field: this.props.name,
                fileId: file.id,
                table: this.props.table,
                id: this.props.record_id
            }, function(response) {
                this.setState({value: response.response});
            }.bind(this));
        }
    },
    values: function() {
        return <table className="table table-striped">
        <thead>
            <tr>
                <th>Object ID</th>
                <th>Mime type</th>
                <th>Preview </th>
            </tr>
        </thead>
        <tbody>
            {(this.state.value||this.props.value||[]).map(function(value, id) {
                return <tr key={id}>
                    <td>{value.id}</td>
                    <td>{value.mime.match(/image/) ? <img src={this.props.prefix + value.id} width="300px" /> :  value.mime}</td>
                    <td><a className="btn btn-danger" onClick={this.delete.bind(this, value)}>Delete</a></td>
                </tr>;
            }.bind(this))}
        </tbody>
        </table>;
    },
    render: function() {
        if (this.state.result) {
            return <div>
                <div>{this.result()}</div>
                <div>{this.values()}</div>
            </div>;
        } else if (this.state.file) {
            return <div>
                <div>Upload file {this.state.file.name} ({humanFormat(this.state.file.size)}).</div>
                <div><button className="btn btn-default" onClick={this.beginUpload}>Begin upload</button></div>
                <div>{this.values()}</div>
            </div>;
        }
        return <div>
            <h4>Add new file</h4>
            <input type="file" onChange={this.onChange}  />
            <h4>Values</h4>
            { this.values() }
        </div>;
    }
});

var FileUploadInput = React.createClass({
    mixins: [FileMixin],
    value: function() {
        var val = this.props.value;
        if (val) { 
            return <img src={this.props.prefix + val} width="300px" />;
        }
    },
    render: function() {
        var file = this.state.file;
        if (this.state.result) {
            return <div>
                <div>{this.result()}</div>
                <div>{this.value()}</div>
            </div>;
        } else if (typeof this.state.progress === "number") {
            return <div>
                <div>Upload file {file.name} ({humanFormat(file.size)}).</div>
                <div>Uploading {this.state.progress}%</div>
                <div>{this.value()}</div>
            </div>;
        } else if (file) {
            return <div>
                <div>Upload file {file.name} ({humanFormat(file.size)}).</div>
                <div><button className="btn btn-default" onClick={this.beginUpload}>Begin upload</button></div>
                <div>{this.value()}</div>
            </div>;
        }
        return <div>
            <input type="file" onChange={this.onChange} value={this.state.value} />
            <div>{this.value()}</div>
        </div>;
    }
});

