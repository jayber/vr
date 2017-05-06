function EventDispatcher(scoreLoader, sceneLoaded) {
    var self = this;

    var localEventTarget = new LocalEventTarget();
    self.target = localEventTarget;

    try {
        new WebSocketHandler(self, self.target, scoreLoader.loaded, sceneLoaded);
    } catch (e) {
        reportException(e);
        console.log("continuing in single player mode");
    }

    self.addEventListener = function (type, listener) {
        localEventTarget.addEventListener(type, listener);
    };

    self.doubleUp = function () {
        self.target.dispatch({event: "doubleUp"});
    };
    self.toggleDiscoMode = function () {
        self.target.dispatch({event: "toggleDiscoMode"});
    };
    self.reload = function () {
        self.target.dispatch({event: "reload"});
    };
    self.start = function () {
        self.target.dispatch({event: "start"});
    };
    self.stop = function () {
        self.target.dispatch({event: "stop"});
    };
    self.incrementBpm = function () {
        self.target.dispatch({event: "incrementBpm"});
    };
    self.decrementBpm = function () {
        self.target.dispatch({event: "decrementBpm"});
    };
    self.addPlayTrigger = function (data) {
        self.target.dispatch({event: "addPlayTrigger", data: data});
    };
    self.removePlayTrigger = function (instrumentIndex, count, elementId) {
        self.target.dispatch({
            event: "removePlayTrigger",
            data: {instrumentIndex: instrumentIndex, count: count, elementId: elementId}
        });
    }
}

function LocalEventTarget() {
    var self = this;

    var listeners = {};

    self.addEventListener = function (type, listener) {
        if (!(type in listeners)) {
            listeners[type] = [];
        }
        listeners[type].push(listener);
    };

    self.dispatch = function (msg) {
        var type = msg.event;
        var param = msg.data;
        if (!(type in listeners)) {
            return true;
        }
        var stack = listeners[type];
        for (var i = 0, l = stack.length; i < l; i++) {
            stack[i].call(self, param);
        }
    };
}

function WebSocketHandler(eventDispatcher, target, scoreLoaded, sceneLoaded) {
    var self = this;
    var host = window.location.host;
    var spaceId = altspace.getSpace().then(function (space) {
        return space.sid;
    });
    var userId = altspace.getUser().then(function (user) {
        return user.userId;
    });
    var displayName = altspace.getUser().then(function (user) {
        return user.displayName;
    });
    var ws;
    var demoId = getUrlParameter("demo");

    function emitUnguarded(message) {
        ws.send(JSON.stringify(message));
    }

    function init(spaceId, userId, displayName) {
        if (ws != undefined) {
            ws.close();
        }

        ws = new WebSocket("ws://" + host + "/ws/" + spaceId + "/" + userId + ":" + displayName);

        var tries = 1;
        ws.onclose = function () {
            if (tries < 100) {
                tries = tries * 2;
                console.log("ws closed! - trying to reopen in " + tries + " seconds");
                setTimeout(function () {
                    try {
                        init(spaceId, userId, displayName);
                    } catch (e) {
                        reportException(e);
                    }
                }, 1000 * tries);
            } else {
                reportException({message: "ws closed! - giving up"});
            }
        };

        ws.onopen = function () {
            eventDispatcher.target = self;
            console.log("ws opened");
            emitUnguarded({event: "unroll"});
        };

        ws.onerror = function (error) {
            reportException({message: "ws errored! " + JSON.stringify(error)});
        };

        ws.onmessage = function (event) {
            try {
                var msg = JSON.parse(event.data);
                target.dispatch(msg);
            } catch (e) {
                reportException(e);
            }
        };

        self.dispatch = function (msg) {
            var type = msg.event;
            var param = msg.data;
            self.emit({event: type, data: param});
        };

        self.emit = function (message) {
            if (!demoId || demoId == userId) {
                emitUnguarded(message);
            }
        };
    }

    Promise.all([spaceId, userId, displayName, scoreLoaded, sceneLoaded]).then(function (values) {
        init(values[0], values[1], values[2]);
    });
}
