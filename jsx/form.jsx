var editors = {};
function destroyEditor() {
    editors = {};
}

function go() {
    var url = HashRouter.url.apply(HashRouter, arguments);
    document.location.hash = url;
}

function initEditor() {
    $('textarea.markdown').each(function() {
        editors[$(this).attr('name')] = new SimpleMDE({ 
            element: this, 
            autoDownloadFontAwesome: false,
            spellChecker: false,
            previewRender: function(plainText) {
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
    onChange: function(event) {
        this.setState({value: event.target.value});
    },
    render: function() {
        var field = this.props.field;
        var type  = field.type;
        this.state = this.state || {};
        if (!this.state.value) {
            this.state.value = this.props.value || "";
        }

        switch (field.type) {
        case "markdown":
        case "html":
        case "textarea":
            return (<textarea ref={field.name} className={"form-control not-ready " + (field.type)} extra={field.type} name={field.name} onChange={this.onChange} value={this.state.value} />);

        case "inline":
            return <div className="sub inline">
                {field.inputs.map(function(field, xid) {
                    var id = "field_" + this.props.id;
                    return <div className="col-sm-6" key={"inline-input-" + xid}>
                        <div className="form-group">
                            <label>{field.label}</label>
                            <CrudInput field={field} ref={id} id={id} record_id={this.props.record_id}
                                table={this.props.table} value={field.value || ""} />
                        </div>
                    </div>;
                }.bind(this))}
                    <div className="clearfix"></div>
                </div>
    
        case "sub":
            return <div className="sub">
                    {this.state.value.map(function(sub, i) {
                        return <CrudForm key={"sub-" + i + "_"+sub.id} fields={sub.form} table="sub" sub="sub" prefix={field.name + "." + i} />;
                    })}
                </div>;
        case "upload":
            if (!this.props.record_id) {
                return;
            }

            return <MultiFileUploadInput 
                name={field.name} url={"/upload.php?id=" + this.props.record_id + "&table=" + this.props.table + "&m=1"} 
                filter={field.extra} 
                value={this.state.value}
                record_id={this.props.record_id}
                table={this.props.table}
                prefix="/attach.php?id=" />

        case "file":
            if (!this.props.record_id) {
                return;
            }

            return <FileUploadInput name={field.name} url={"/upload.php?id=" + this.props.record_id + "&table=" + this.props.table} filter={field.extra} value={this.state.value} prefix="/attach.php?id=" />
            break;
        case "select":
            return (
                <select ref={field.name} className="form-control" name={field.name} value={this.state.value} onChange={this.onChange}>
                { field.values.map(function(value, id) {
                    return (<option key={id} value={id}>{value}</option>);
                }.bind(this)) }
                </select>
            );
        }

        return (<input type={type} ref={field.name} className="form-control" value={this.state.value} name={field.name} placeholder="" onChange={this.onChange} />);
    }
});

var CRUD_cache = {};
var CrudForm = React.createClass({
    componentDidMount: function() {
        setTimeout(initEditor);
    },
    getData: function() {
        var data = {};
        $(this.refs.form).serializeArray().map(function(value) {
            var parts = value.name.split(/\./g);
            if (parts.length === 1) {
                data[parts[0]] = value.value;
                return;
            }
            var leaf = data;
            for (var p = 0; p < parts.length-1; ++p) {
                if (!leaf[parts[p]]) {
                    leaf[parts[p]] = isNaN(parseInt(leaf[parts[p+1]])) ? {} : []; 
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
    onSubmit: function(event) {
        event.preventDefault();

        delete CRUD_cache[ this.props.id ];
        this.saved = true;
        var data = this.getData();
        Server.exec('save', { data: data, id: this.props.id, table: this.props.table, embed: this.props.embed })
            .then(function(response) {
                if (this.props.embed) {
                    go("edit", this.props.embed.table, this.props.embed.id);
                } else {
                    go("list", this.props.table, 1);
                }
            }.bind(this)).catch(function(error) {
                alert("Error while saving the document:\n" + error.text);
            });
        return false;
    },
    componentWillUnmount: function() {
        if (this.saved || !CRUD_cache[this.props.id]) {
            return destroyEditor();
        }
        var data = this.getData();
        CRUD_cache[this.props.id] = CRUD_cache[this.props.id].map(function(v) {
            v.value = data[v.name];
            return v;
        });
        return destroyEditor();
    },
    render: function() {
        var formBody = this.props.fields.map(function(field, xid) {
            var id = "field_" + (this.props.id || "");
            if (this.props.prefix) {
                field.name = this.props.prefix + "." + field.name;
            }
            if (field.type === "children") {
                return "";
            }
            return (
                <div className="form-group" key={id + xid}>
                    <label>{field.label}</label>
                    <CrudInput ref={id} field={field} id={id} record_id={this.props.id} table={this.props.table} value={field.value || ""} />
                </div>
            );
        }.bind(this));

        var postForm = this.props.fields.map(function(field, xid) {
            if (field.type !== "children") {
                return "";
            }
            
            var list = field.value
            return <div className="form-group" key={"children-" + xid}>
                <p>&nbsp;</p>
                <CrudList 
                    fields={list.fields}
                    table={list.table}
                    pages={list.pages.pages}
                    info={list.info||""} 
                    records={list.records} 
                    reference = {[this.props.table, field.name, this.props.id]}/>
            </div>
        }.bind(this));

        if (this.props.sub) {
            return <div>{formBody}</div>;
        }
        return (
            <form ref="form">
                {formBody}
                <button type="button" onClick={this.onSubmit} className="btn btn-default">Save</button>
                {postForm}
            </form>
        );
    }
});
