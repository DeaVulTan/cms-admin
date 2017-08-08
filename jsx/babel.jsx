var BabelUI = React.createClass({
    getInitialState: function() {
        return { strings: [] };
    },
    sendToBabel: function() {
        if (confirm("Please review all the strings before sending to Babel. After sending to Babel our translators will start working on the strings. Are you sure the strings are ready?")) {
            Server.exec('babel_push').then(function(r) {
                this.setState({ strings: r});
            }.bind(this));
        }
        return false;
    },
    render: function() {
        return <div>
            <a onClick={this.sendToBabel} className="btn btn-default">Send to Babel</a>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <td>Context</td>
                        <td>Text</td>
                    </tr>
                </thead>
                <tbody>
                    { this.state.strings.map(function(record) {
                        return <tr key={record.id}>
                            <td>{record.context}</td>
                            <td dangerouslySetInnerHTML={{__html: record.text}}></td>
                        </tr>
                    }) }
                </tbody>
            </table>
        </div>;
    }
});
