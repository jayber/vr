function EventDispatcher(scoreLoader, sceneLoaded, blUserPromise) {
    var self = this;

    var localEventTarget = new LocalEventTarget();
    self.target = localEventTarget;

    try {
        new WebSocketHandler(self, self.target, scoreLoader.loaded, sceneLoaded, blUserPromise);
    } catch (e) {
        reportException(e);
        console.log("continuing in single player mode");
    }

    self.addEventListener = function (type, listener) {
        localEventTarget.addEventListener(type, listener);
    };

    self.setFreeForAll = function (value) {
        if (value) {
            self.target.dispatch({event: "freeForAllOn"});
        } else {
            self.target.dispatch({event: "freeForAllOff"});
        }
    };
    self.modOnlyOff = function () {
        self.target.dispatch({event: "modOnlyOff"});
    };
    self.modOnlyOn = function () {
        self.target.dispatch({event: "modOnlyOn"});
    };
    self.clear = function () {
        self.target.dispatch({event: "clear"});
    };
    self.doubleUp = function () {
        self.target.dispatch({event: "doubleUp"});
    };
    self.discoModeOff = function () {
        self.target.dispatch({event: "discoModeOff"});
    };
    self.discoModeOn = function () {
        self.target.dispatch({event: "discoModeOn"});
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
        serverLog("addTrigger: count=" + data.count);
        self.target.dispatch({event: "addPlayTrigger", data: data});
    };
    self.removePlayTrigger = function (instrumentIndex, count, elementId) {
        serverLog("removeTrigger: elementId=" + elementId, "; count=" + count);
        self.target.dispatch({
            event: "removePlayTrigger",
            data: {instrumentNumber: instrumentIndex, count: count, elementId: elementId}
        });
    };
    self.pitchUp = function (instrumentNumber, count) {
        serverLog("pitchUp: count=" + count);
        self.target.dispatch({event: "pitchUp", data: {instrumentIndex: instrumentNumber, count: count}});
    };
    self.pitchDown = function (instrumentNumber, count) {
        serverLog("pitchDown: count=" + count);
        self.target.dispatch({event: "pitchDown", data: {instrumentIndex: instrumentNumber, count: count}});
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
        stack.forEach(function (element) {
            promise = promise.then(function () {
                try {
                    var call = element.call(self, param);
                    return Promise.resolve(call);
                } catch (e) {
                    console.error(e, e.stack);
                    reportException(e);
                }
            });
        });
    };
}

function WebSocketHandler(eventDispatcher, target, scoreLoaded, sceneLoaded, blUserPromise) {
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

        ws = new WebSocket("ws://" + host + "/ws/" + spaceId + "/" + blUser.user.userId + "?displayName=" + displayName);

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
        blUserPromise.then(function (blUser) {
            if (blUser.demoer || (!demoId && (!blUser.modOnly || blUser.moderator))) {
                emitUnguarded(message);
            }
        });
    }

    self.dispatch = function (msg) {
        var type = msg.event;
        var param = msg.data;
        emit({event: type, data: param});
    };

    Promise.all([spaceId, blUserPromise, displayName, scoreLoaded, sceneLoaded]).then(function (values) {
        connect(values[0], values[1], values[2]);
    });
}
