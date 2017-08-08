var cruds = {};

var Header =  React.createClass({
    getInitialState: function() {
        return {currentCrud: null};
    },
    logout: function() {
        Server.exec("logout")
            .then(main);
    },
    render: function() {
        return (<div>
        <nav className="navbar navbar-inverse navbar-fixed-top">
            <div className="container-fluid">
                <div className="navbar-header">
                    <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
                    <span className="sr-only">Toggle navigation</span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    </button>
                    <a className="navbar-brand" href="#">Project name</a>
                </div>
                <div id="navbar" className="navbar-collapse collapse">
                    <ul className="nav navbar-nav navbar-right">
                        <li><a href="#" onClick={this.logout}>Logout</a></li>
                    </ul>
                    <form className="navbar-form navbar-right">
                        <input type="text" className="form-control" placeholder="Search..." />
                    </form>
                </div>
            </div>
        </nav>
        <div className="container-fluid">
            <div className="row">
                <div className="col-sm-3 col-md-2 sidebar">
                    <ul className="nav nav-sidebar">
                        {this.props.items.map(function(item, id) {
                            if (this.state.current === item.url) {
                                return (<li className="active" key={id}><a href={hRouter.url("list", item.url)}>{item.label}</a></li>)
                            } else {
                                return (<li key={id}><a href={hRouter.url("list", item.url)}>{item.label}</a></li>)
                            }
                        }.bind(this))}
                    </ul>
                </div>
            </div>
        </div>
        <div id="main" className="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main">
            <h1 id="title" className="page-header">{urlLabel[this.state.current]}</h1>
            <div id="main_body">
            </div>
        </div>
        <div id="modals"></div>
        </div>);
    }
});

var me;
var Page = null;
var urlLabel = {};
function main() {
    Server.exec("info").then(function(info) {
        if (!info.me) {
            ReactDOM.render(
                <LoginList />,
                document.getElementById('container')
            ); 
        } else {
            info.tables.map(function(item) {
                urlLabel[item.url] = item.label;
            });
            Page = ReactDOM.render(
                <Header items={info.tables} />,
                document.getElementById('container')
            );
            me = new User(info.me);
        }
        hRouter.ready();
    }).catch(function() {
        if (document.location.hash === "") {
            ReactDOM.render(
                <LoginList />,
                document.getElementById('container')
            ); 
        }
        hRouter.ready();
    });
}
main();
    
