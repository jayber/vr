function EventDispatcher(scheduler, instruments, scoreLoader) {
    var self = this;
    var loaded = scoreLoader.loaded;

    self.target = new LocalEventTarget(scheduler, instruments, scoreLoader);

    try {
        new WebSocketHandler(self, localTarget, loaded);
    } catch (e) {
        reportException(e);
        console.log("continuing in single player mode");
    }

    self.reload = function () {
        self.target.reload();
    };
    self.start = function () {
        self.target.start();
    };
    self.stop = function () {
        self.target.stop();
    };
    self.incrementBpm = function () {
        self.target.incrementBpm();
    };
    self.decrementBpm = function () {
        self.target.decrementBpm();
    };
    self.addPlayTrigger = function (data) {
        self.target.addPlayTrigger(data);
    };
    self.removePlayTrigger = function (instrumentIndex, count, elementId) {
        self.target.removePlayTrigger(instrumentIndex, count, elementId);
    }

}

function LocalEventTarget(scheduler, instruments, scoreLoader) {
    var self = this;
    self.start = function () {
        scheduler.start(scoreLoader.score);
    };
    self.reload = function () {
        scheduler.stop();
        scoreLoader.reload();
        instruments.reload();
    };
    self.stop = function () {
        scheduler.stop();
    };
    self.incrementBpm = function () {
        scheduler.stop();
        scoreLoader.score.setBpm(scoreLoader.score.bpm + 1);
    };
    self.decrementBpm = function () {
        scheduler.stop();
        scoreLoader.score.setBpm(scoreLoader.score.bpm - 1);
    };
    self.addPlayTrigger = function (data) {
        instruments.add(data);
    };
    self.removePlayTrigger = function (instrumentIndex, count, elementId) {
        instruments.remove(instrumentIndex, count, elementId);
    }
}

function WebSocketHandler(dispatcher, target, scoreLoaded) {
    var self = this;
    var host = window.location.host;
    var spaceId = altspace.getSpace().then(function (space) {
        return space.sid
    });
    var userId = altspace.getUser().then(function (user) {
        return user.userId
    });
    var ws;
    var tries = 1;
    init();

    function init() {
        if (ws != undefined) {
            ws.close();
        }

        Promise.all([spaceId, userId, scoreLoaded]).then(function (values) {
            ws = new WebSocket("ws://" + host + "/ws/" + values[0] + "/" + values[1]);

            ws.onclose = function () {
                if (tries < 500) {
                    tries = tries * 5;
                    console.log("ws closed! - trying to reopen in " + tries + " seconds");
                    setTimeout(function () {
                        try {
                            init();
                        } catch (e) {
                            reportException(e);
                        }
                    }, 1000 * tries);
                } else {
                    reportException({message: "ws closed! - giving up"});
                }
            };

            ws.onopen = function () {
                dispatcher.target = self;
                console.log("ws opened");
                var sceneEl = document.querySelector("a-scene");
                if (sceneEl.hasLoaded) {
                    self.emit({event: "unroll"});
                } else {
                    sceneEl.addEventListener("loaded", function () {
                        self.emit({event: "unroll"});
                    });
                }
            };

            ws.onerror = function (error) {
                reportException({message: "ws errored! " + JSON.stringify(error)});
            };

            ws.onmessage = function (event) {
                var msg = JSON.parse(event.data);
                var data = msg.data;

                switch (msg.event) {
                    case "removePlayTrigger":
                        console.log("ws received:removePlayTrigger");
                        target.removePlayTrigger(msg.data.instrumentIndex, msg.data.count, msg.data.elementId);
                        break;
                    case "addPlayTrigger":
                        console.log("ws received:addPlayTrigger");
                        target.addPlayTrigger(msg.data);
                        break;
                    case "incrementBpm":
                        console.log("ws received:incrementBpm");
                        target.incrementBpm();
                        break;
                    case "decrementBpm":
                        console.log("ws received:decrementBpm");
                        target.decrementBpm();
                        break;
                    case "start":
                        console.log("ws received:start");
                        target.start();
                        break;
                    case "stop":
                        console.log("ws received:stop");
                        target.stop();
                        break;
                    case "reload":
                        console.log("ws received:reload");
                        target.reload();
                        break;
                    case "message":
                        console.log(msg.data);
                        break;
                }
            };
        });
    }

    self.reload = function () {
        self.emit({event: "reload"});
    };
    self.start = function () {
        self.emit({event: "start"});
    };
    self.stop = function () {
        self.emit({event: "stop"});
    };
    self.incrementBpm = function () {
        self.emit({event: "incrementBpm"});
    };
    self.decrementBpm = function () {
        self.emit({event: "decrementBpm"});
    };
    self.addPlayTrigger = function (data) {
        self.emit({event: "addPlayTrigger", data: data});
    };
    self.removePlayTrigger = function (instrumentIndex, count, elementId) {
        self.emit({
            event: "removePlayTrigger",
            data: {instrumentIndex: instrumentIndex, count: count, elementId: elementId}
        });
    };

    self.emit = function (message) {
        ws.send(JSON.stringify(message));
    };
}
