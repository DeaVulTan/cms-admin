function checkSession() {
    if (!me) {
        ReactDOM.render(
            <LoginList />,
            document.getElementById('container')
        ); 
    }
    return !!me;
}

hRouter.route("register/:hash", function(hash) {
    var register = ReactDOM.render(<Register hash={hash} />, document.getElementById('container'));
    Server.exec("register", {hash: hash})
        .then(function(user) {
            register.setState({user: user});
        }).catch(function() {
            register.setState({ fatalError: true, message: "The link is no longer valid" });
        });
});

hRouter.addFilter('page', function(page) {
    page = parseInt(page);
    return page > 0;
});

hRouter.route("edit-push/:table/:id/:parent_id/:parent_prop/:parent_table", function(table, id, parent_id, parent_prop, parent_table) {
    Page.setState({ current: table });
    var embed = {id: parent_id, prop: parent_prop, table: parent_table};
    if (CRUD_cache[id]) {
        // resume editing
        ReactDOM.render(
            <CrudForm fields={CRUD_cache[id]} table={table} id={id} embed={embed} key={Math.random()} />,
            document.getElementById("main_body")
        );
        return;
    }
    Server.exec("form", {table: table, id: id})
        .then(function(form) {
            CRUD_cache[id] = form;
            ReactDOM.render(
                <CrudForm fields={form} table={table} id={id} embed={embed} key={Math.random()} />,
                document.getElementById("main_body")
            );
        });
}).name("edit_push").preRoute(checkSession);

hRouter.route("push/:table/:parent_id/:parent_prop/:parent_table", function(table, parent_id, parent_prop, parent_table) {
    Page.setState({ current: table });
    var embed = {id: parent_id, prop: parent_prop, table: parent_table};
    Server.exec("form", {table: table})
        .then(function(form) {
            ReactDOM.render(
                <CrudForm fields={form} table={table} id="new" embed={embed} key={Math.random()} />,
                document.getElementById("main_body")
            );
    });
}).name("push").preRoute(checkSession);

hRouter.route("new/:table", function(table) {
    Page.setState({ current: table });
    Server.exec("form", {table: table})
        .then(function(form) {
            ReactDOM.render(
                <CrudForm fields={form} table={table} id="new" key={Math.random()} />,
                document.getElementById("main_body")
            );
    });
}).name("create").preRoute(checkSession);

hRouter.route("list/babelstring/:page", function() {
    Page.setState({ current: "Babel Synchronization" });
    Server.exec("babel").then(function(response) {
        ReactDOM.render(
            <BabelUI />
        , document.getElementById('main_body')).setState({strings: response});
    });
});

hRouter.route("list/deploy_keys/:page", function() {
    Page.setState({ current: "Deploy Keys" });
    Server.exec("get_js_embed").then(function(response) {
        ReactDOM.render(
            <pre><code className="javascript">{response.code}</code></pre>
        , document.getElementById('main_body'));
        hljs.highlightBlock($('code')[0]);
    });
});

hRouter.route("list/deploy/:page", function(page) {
    if (!me.canDeploy()) {
        ReactDOM.render(
            <DeployCredentials />
        , document.getElementById('main_body'));
        return;
    }
    Page.setState({ current: "Deploy" });
    Server.exec("deploy").then(function(response) {
        ReactDOM.render(
            <DeployList />,
            document.getElementById("main_body")
        ).setState({ deploy: response });
    });
}).preRoute(checkSession);

hRouter.route("list/:table/:page", function(table, page) {
    Page.setState({ current: table });
    Server.exec("list", {table: table, page: page}).then(function(list) {
        var element = ReactDOM.render(
            <CrudList fields={list.fields} table={table} pages={list.pages.pages} info={list.info||""} />,
            document.getElementById('main_body')
        );
        element.setState({ records: list.records });
    });
}).name("list").setDefault("page", 1).preRoute(checkSession);

hRouter.route("edit/:table/:id", function(table, id) {
    if (CRUD_cache[id]) {
        // resume editing
        ReactDOM.render(
            <CrudForm fields={CRUD_cache[id]} table={table} id={id} key={Math.random()} />,
            document.getElementById("main_body")
        );
        return;
    }
    Server.exec("form", {table: table, id: id})
        .then(function(form) {
            CRUD_cache[id] = form;
            ReactDOM.render(
                <CrudForm fields={form} table={table} id={id} key={Math.random()} />,
                document.getElementById("main_body")
            );
        });
}).name("edit").preRoute(checkSession);

