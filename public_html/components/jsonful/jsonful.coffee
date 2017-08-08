module = {};
setImmediate = setTimeout;

merge = (a, b) ->
    for own key, value of b 
        a[key] = value;
    a

class JSONful extends EventEmitter
    constructor: (@server) ->
        @_queue = []
        @_headers = {}
        @_callback = @_sendRequest.bind(this)
        super()
        @on 'session', ((sessionId) ->
                @_headers['session'] = sessionId
            ).bind(this)

    _xhrRequest: (reqBody, onready) ->
        xhr = JSONful.getXhr()
        xhr.onload  = onready
        xhr.onerror = (() ->
                try
                    response = xhr.response || xhr.responseText
                catch e
                    response = ""
                error = new Error(response)
                error.status = xhr.status
                this.emit("error", error, (() ->
                    this._xhrRequest(reqBody, onready)
                ).bind(this))
            ).bind(this)

        this.emit("request")

        xhr.open "POST", @server, true
        xhr.responseType = 'json'
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send JSON.stringify(merge 
                requests: reqBody
            , @_headers)


    handle_responses: (responses, queue) ->
        for own key, value of responses
            if typeof value == "object" && value.error
                queue[key].failure value
            else
                queue[key].success value
        
        

    _sendRequest: () ->
        queue = @_queue
        requestBody = queue.map (b) ->
            [b.name, b.args]

        that = @;
        @_xhrRequest requestBody, () -> 
            try
                responses = if not @response and typeof @responseText == "string" then JSON.parse @responseText else @response
            catch e
                responses = ""

            that.emit("response")

            if not responses or not (responses instanceof Object) or not (responses.responses instanceof Array)
                that.emit("error", new Error("Invalid response from the server"), requestBody)
                return

            for own key, value of responses
                if typeof that["handle_" + key] == "function"
                    that["handle_" + key](value, queue)
                else
                    that.emit(key, value)


        @_queue = []

    setSession: (sessionId) ->
        @_headers['session'] = sessionId
        @


    exec: (name, args = [], callback = null) ->
        if (typeof args == "function")
            callback = args;
            args     = [];

        promise = new Promise ((success, failure) ->
             @_queue.push({name: name, args: args, success: success, failure: failure})
            ).bind(this)

        if typeof callback == "function"
            promise.then (response) ->
                callback null, response

            promise.catch (err) ->
                callback err, null

        clearTimeout @_sender
        @_sender = setTimeout(@_callback)
        promise 

JSONful.getXhr = () ->
    return new XMLHttpRequest

@JSONful = JSONful;
@Promise = Promise;
@EventEmitter = EventEmitter;
