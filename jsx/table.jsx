var CrudList = React.createClass({
    getInitialState: function() {
        return {records: this.props.records || []};
    },
    delete: function(event) {
        if (confirm("Are you sure to delete this entry? There is no wayback")) {
            var obj = event.currentTarget;
            Server.exec("delete", { id: obj.getAttribute('data-id'), table: this.props.table, parent: this.props.reference || null })
                .then(function(response) {
                    this.setState(response);
                }.bind(this))
        }
        return false;
    },
    render: function() {
        var btn = "Create";
        var link = hRouter.url("create", this.props.table);
        if (this.props.reference) {
            btn = "Create " + this.props.reference[1];
            link = hRouter.url("push", this.props.table, this.props.reference[2], this.props.reference[1], this.props.reference[0]);
        }
        return (
            <div>
            <div><em>{this.props.info}</em></div>
            <a href={link} className="btn btn-success">{btn}</a>
            <table className="table table-striped">
                <thead>
                    <tr>
                        {this.props.fields.map(function(entry, id) {
                            return (<th key={id}>{entry}</th>);
                        })}
                        <th className="buttons">#</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.records.map(function(row, id) {
                        var link = hRouter.url("edit", this.props.table, row.id);
                        if (this.props.reference) {
                            link = hRouter.url("edit_push", this.props.table, row.id, this.props.reference[2], this.props.reference[1], this.props.reference[0]);
                        }
                        return (<tr key={id}>
                            {this.props.fields.map(function(entry, id) {
                                return (<td key={id}>{row[entry]}</td>);
                            })}
                            <td className="buttons">
                                <a href={link} className="btn btn-success">Edit</a>
                                <a onClick={this.delete} data-id={row.id} className="btn btn-danger">Delete</a>
                            </td>
                        </tr>);
                    }.bind(this)) }
                </tbody>
            </table>
            <nav>
              <ul className="pagination">
                    {this.props.pages.map(function(page, id) {
                        return <li key={id}><a href={hRouter.url("list", this.props.table, page)}>{page}</a></li>
                    }.bind(this)) }
                </ul>
            </nav>
        </div>
        );
    },
});
