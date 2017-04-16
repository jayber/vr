function EventDispatcher(scheduler, soundSettings, instruments, markers, score, scoreLoader) {
    var self = this;
    var localTarget = new LocalTarget(scheduler, soundSettings, instruments, markers, score);
    self.target = localTarget;

    try {
        new WebSocketHandler(self, localTarget, scoreLoader);
    } catch (e) {
        reportException(e);
        console.log("continuing in single player mode");
    }

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
    self.addPlayTrigger = function (data, events) {
        self.target.addPlayTrigger(data, events);
    };
    self.removePlayTrigger = function (instrumentIndex, count, elementId) {
        self.target.removePlayTrigger(instrumentIndex, count, elementId);
    }
}

function LocalTarget(scheduler, soundSettings, instruments, markers, score) {
    var self = this;
    self.start = function () {
        scheduler.start(soundSettings);
    };
    self.stop = function () {
        scheduler.stop();
    };
    self.incrementBpm = function () {
        soundSettings.setBpm(soundSettings.bpm + 1);
        scheduler.stop();
    };
    self.decrementBpm = function () {
        soundSettings.setBpm(soundSettings.bpm - 1);
        scheduler.stop();
    };
    self.addPlayTrigger = function (data, events) {
        var instrument = instruments[data.instrumentNumber];
        markers.marker(data.count, instrument, data.instrumentNumber, events);
        scheduler.addCountListener(data.count, instrument.countListener);
        soundSettings.addTriggerTime(data.count, score[instrument.data].src);
    };
    self.removePlayTrigger = function (instrumentIndex, count, elementId) {
        var subElement = document.querySelector("#" + elementId);
        document.querySelector("#clock-face").removeChild(subElement);
        instruments[instrumentIndex].removeTime(count);
    }
}

function WebSocketHandler(dispatcher, target, scoreLoader) {
    var self = this;
    var host = window.location.host;
    var spaceId = altspace.getSpace().then(function (space) {
        return space.sid
    });
    var userId = altspace.getUser().then(function (user) {
        return user.userId
    });
    //var host = "vr.beatlab.co";
    var ws;
    var tries = 1;
    init();

    function init() {
        if (ws != undefined) {
            ws.close();
        }

        Promise.all([spaceId, userId]).then(function (values) {
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
                    scoreLoader.addLoadListener(function () {
                        self.emit(JSON.stringify({event: "unroll"}));
                    });
                } else {
                    sceneEl.addEventListener("loaded", function () {
                        scoreLoader.addLoadListener(function () {
                            self.emit(JSON.stringify({event: "unroll"}));
                        });
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
                        target.addPlayTrigger(msg.data, dispatcher);
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
                    case "message":
                        console.log(msg.data);
                        break;
                    case "ping":
                        console.log("ping");
                        break;
                }
            };
        });
    }

    self.start = function () {
        self.emit(JSON.stringify({event: "start"}));
    };
    self.stop = function () {
        self.emit(JSON.stringify({event: "stop"}));
    };
    self.incrementBpm = function () {
        self.emit(JSON.stringify({event: "incrementBpm"}));
    };
    self.decrementBpm = function () {
        self.emit(JSON.stringify({event: "decrementBpm"}));
    };
    self.addPlayTrigger = function (data) {
        self.emit(JSON.stringify({event: "addPlayTrigger", data: data}));
    };
    self.removePlayTrigger = function (instrumentIndex, count, elementId) {
        self.emit(JSON.stringify({
            event: "removePlayTrigger",
            data: {instrumentIndex: instrumentIndex, count: count, elementId: elementId}
        }));
    };

    self.emit = function (message) {
        ws.send(message);
    };
}
