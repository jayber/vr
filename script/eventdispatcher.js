function EventDispatcher(scoreLoader, sceneLoaded, blUser) {
    var self = this;

    var localEventTarget = new LocalEventTarget();
    self.target = localEventTarget;

    try {
        new WebSocketHandler(self, self.target, scoreLoader.loaded, sceneLoaded, blUser);
    } catch (e) {
        reportException(e);
        console.log("continuing in single player mode");
    }

    self.addEventListener = function (type, listener) {
        localEventTarget.addEventListener(type, listener);
    };

    self.setFreeForAll = function (value) {
        self.target.dispatch({event: "setFreeForAll", data: {value: value}});
    };
    self.clear = function () {
        self.target.dispatch({event: "clear"});
    };
    self.doubleUp = function () {
        self.target.dispatch({event: "doubleUp"});
    };
    self.toggleDiscoMode = function () {
        self.target.dispatch({event: "toggleDiscoMode"});
    };
    self.reload = function (index) {
        self.target.dispatch({event: "reload", data: {index: index}});
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
    var promise = Promise.resolve("start");
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
            const listener = stack[i];
            promise = promise.then(function () {
                return Promise.resolve(listener.call(self, param))
            });
        }
    };
}

function WebSocketHandler(eventDispatcher, target, scoreLoaded, sceneLoaded, blUser) {
    var self = this;
    var host = window.location.host;
    var spaceId = altspace.getSpace().then(function (space) {
        return space.sid;
    });
    var displayName = altspace.getUser().then(function (user) {
        return user.displayName;
    });
    var ws;
    var demoId = getUrlParameter("demo");
    var secondsTilRetry = 2; //don't move this

    function emitUnguarded(message) {
        ws.send(JSON.stringify(message));
    }

    function connect(spaceId, blUser, displayName) {
        if (ws) {
            ws.close();
        }

        ws = new WebSocket("ws://" + host + "/ws/" + spaceId + "/" + blUser.user.userId + ":" + displayName);

        ws.onclose = function () {
            if (secondsTilRetry < 33) {
                secondsTilRetry = secondsTilRetry * 2;
                console.log("ws closed! - trying to reopen in " + secondsTilRetry + " seconds");
                setTimeout(function () {
                    try {
                        connect(spaceId, blUser, displayName);
                    } catch (e) {
                        console.error(e);
                    }
                }, 1000 * secondsTilRetry);
            } else {
                console.log("ws closed! - giving up");
            }
        };

        ws.onopen = function () {
            eventDispatcher.target = self;
            console.log("ws opened");
            if (blUser.user.isModerator) {
                emit({event: "moderatorPresent"})
            }
            emitUnguarded({event: "unroll"});
        };

        ws.onerror = function (error) {
            console.error(error);
            reportException({message: "ws errored! " + JSON.stringify(error)});
        };

        ws.onmessage = function (event) {
            try {
                var msg = JSON.parse(event.data);
                if (msg.event != "ping") {
                    console.log("ws received: " + event.data);
                }
                target.dispatch(msg);
            } catch (e) {
                console.error(e);
                reportException(e);
            }
        };
    }

    function emit(message) {
        if (!demoId || demoId == blUser.user.userId) {
            emitUnguarded(message);
        }
    }

    self.dispatch = function (msg) {
        var type = msg.event;
        var param = msg.data;
        emit({event: type, data: param});
    };

    Promise.all([spaceId, blUser, displayName, scoreLoaded, sceneLoaded]).then(function (values) {
        connect(values[0], values[1], values[2]);
    });
}
