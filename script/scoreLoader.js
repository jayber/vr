function ScoreLoader(settings) {
    var self = this;

    self.readableScores = [{
        "bpm": 180,
        "beats": 4,
        instrumentParts: {
            "kick": {src: "audio/kick2.wav", times: ["0:1/4", "2:3/4"]},
            "hat": {
                src: "audio/hat2.wav",
                times: ["0:1/4", "0:2/4", "0:3/4", "1:1/4", "1:2/4", "1:3/4", "2:1/4", "2:2/4", "2:3/4", "3:1/4", "3:2/4", "3:3/4"]
            },
            "snare": {src: "audio/snare2.wav", times: ["1:1/4", "3:1/4"]},
            "bork": {src: "audio/siren.wav", times: []},
            "beep": {src: "audio/bass.wav", times: []}
        }
    }, {
        "bpm": 130,
        "beats": 4,
        instrumentParts: {
            "kick": {src: "audio/kick2.wav", times: ["0:0/4", "0:2/4", "2:7/16", "2:7/8"]},
            "hat": {src: "audio/hat2.wav", times: ["0:2/4", "1:2/4", "2:2/4", "3:2/4"]},
            "snare": {src: "audio/snare2.wav", times: ["1:0/4", "2:1/4", "3:0/4"]},
            "bork": {src: "audio/yo.wav", times: []},
            "beep": {src: "audio/truck.wav", times: []}
        }
    }, {
        "bpm": 120,
        "beats": 4,
        instrumentParts: {
            "kick": {src: "audio/kick2.wav", times: ["0:0/4", "1:0/4", "2:0/4", "3:0/4"]},
            "hat": {src: "audio/hat2.wav", times: ["0:2/4", "1:2/4", "2:2/4", "3:2/4"]},
            "snare": {src: "audio/clap27.wav", times: []},
            "bork": {src: "audio/cmon.wav", times: []},
            "beep": {src: "audio/piano.wav", times: []}
        }
    }, {
        "bpm": 140,
        "beats": 4,
        instrumentParts: {
            "kick": {src: "audio/dskick.wav", times: ["0:0/4", "1:0/4", "2:0/4", "2:3/4", "3:0/4", "3:1/4"]},
            "hat": {
                src: "audio/hat2.wav",
                times: ["0:0/4", "0:2/4", "1:0/4", "1:2/4", "2:0/4", "2:2/4", "3:0/4", "3:2/4"]
            },
            "snare": {src: "audio/dssnare.wav", times: ["0:2/4", "1:2/4", "2:2/4", "3:2/4"]},
            "bork": {src: "audio/wub.wav", times: []},
            "beep": {src: "audio/zingk.wav", times: []}
        }
    }, {
        "bpm": 160,
        "beats": 4,
        instrumentParts: {
            "kick": {src: "audio/oddkick.wav", times: ["0:0/4", "0:2/4", "1:0/4", "1:2/4", "3:0/4"]},
            "hat": {
                src: "audio/hat2.wav",
                times: ["0:0/4", "0:2/4", "1:0/4", "1:2/4", "2:0/4", "2:2/4", "3:0/4", "3:2/4"]
            },
            "snare": {src: "audio/odd1.wav", times: ["1:2/4", "2:0/4", "3:2/4"]},
            "bork": {src: "audio/odd3.wav", times: []},
            "beep": {src: "audio/odd4.wav", times: []}
        }
    }];


    self.score = new ScorePlayer(settings);

    self.reload = function (index) {
        self.scoreIndex = index;
        var currentScore = self.readableScores[index];
        var sources = self.score.load(currentScore);
        self.loaded = settings.load(sources);
    };

    self.reload(0);
}

function ScorePlayer(settings) {

    const beatExp = /(\d*):(\d*)\/(\d*)/;

    var self = this;
    var bpmVar;

    var triggersMap = {};
    var listeners = {};

    self.load = function (currentScore) {
        self.bpm = currentScore.bpm;
        self.beats = currentScore.beats;
        self.instruments = {};
        initTriggers();

        var sources = [];
        Object.keys(currentScore.instrumentParts).forEach(function (key) {
            var instrumentPart = currentScore.instrumentParts[key];
            var times = parseTimes(instrumentPart.times, key);
            self.instruments[key] = {name: key, times: times, src: instrumentPart.src};
            times.forEach(function (time) {
                addTriggerTime(time.count, key, time.trigger);
            });
            sources.push(instrumentPart.src);
        });
        return sources;
    };

    Object.defineProperty(self, 'bpm', {
        set: function (bpmP) {
            bpmVar = bpmP < 666 ? bpmP > 1 ? bpmP : 1 : 666;
            dispatch("bpm-change", bpmVar);
        }, get: function () {
            return bpmVar < 300 ? bpmVar : 300; //this is to prevent breaking, while still allowing 666 to be set
        }
    });

    Object.defineProperty(self, 'totalSegments', {
        get: function () {
            return settings.segmentsPerBeat * self.beats;
        }
    });

    self.getDisplayBpm = function () {
        return bpmVar
    };

    self.clear = function () {
        initTriggers();
        Object.keys(self.instruments).forEach(function (key) {
            self.instruments[key].times = [];
        })
    };

    self.doubleUp = function () {
        var j = 0;
        for (var i = self.triggersByTime.length; i < self.totalSegments * 2; i++) {
            var elements = self.triggersByTime[j++];
            self.triggersByTime[i] = [];
            elements.forEach(function (element) {
                self.triggersByTime[i].push(element.copy());
            });
        }
        Object.keys(self.instruments).forEach(function (key) {
            var totalTimes = self.instruments[key].times.length;
            for (var i = 0; i < totalTimes; i++) {
                self.instruments[key].times[i + totalTimes] = {
                    count: self.instruments[key].times[i].count + self.totalSegments,
                    trigger: self.instruments[key].times[i].trigger.copy()
                };
            }
        });
        self.beats = self.beats * 2;
    };

    self.getSegmentDuration = function () {
        return 60 / self.bpm / settings.segmentsPerBeat;
    };

    self.addEventListener = function (type, listener) {
        if (!(type in listeners)) {
            listeners[type] = [];
        }
        listeners[type].push(listener);
    };

    self.removeInstrumentTrigger = function (count, instrumentName) {
        var index = self.triggersByTime[count].findIndex(function (element) {
            return element.name === instrumentName;
        });
        if (index > -1) {
            self.triggersByTime[count].splice(index, 1);
        }

        var indexToo = self.instruments[instrumentName].times.findIndex(function (element) {
            return element.count == count;
        });
        if (indexToo > -1) {
            self.instruments[instrumentName].times.splice(indexToo, 1);
        }
    };

    self.addInstrumentTrigger = function (count, instrumentName) {
        var trigger = new InstrumentTrigger(instrumentName);
        addTriggerTime(count, instrumentName, trigger);
        self.instruments[instrumentName].times.push({count: count, trigger: trigger});
        return trigger;
    };

    self.getTrigger = function (count, instrumentName) {
        return triggersMap[instrumentName + count];
    };

    self.pitchUp = function (count, instrumentName) {
        return ++triggersMap[instrumentName + count].rate;
    };

    self.pitchDown = function (count, instrumentName) {
        return --triggersMap[instrumentName + count].rate;
    };

    function initTriggers() {
        self.triggersByTime = [self.totalSegments];
        for (var i = 0; i < self.totalSegments; i++) {
            self.triggersByTime[i] = [];
        }
    }

    function convertTimeToCount(beat, seg) {
        return Math.round((settings.segmentsPerBeat * beat) + seg);
    }

    function parseTimes(times, instrumentName) {
        var parsedTimes = [];
        times.forEach(function (time) {
            var capture = beatExp.exec(time);
            var beat = capture[1];
            var nom = capture[2];
            var denom = capture[3];
            var seg = (settings.segmentsPerBeat / denom) * nom;
            var trigger = new InstrumentTrigger(instrumentName);
            var element = {count: convertTimeToCount(beat, seg), trigger: trigger};
            parsedTimes.push(element);
        });
        return parsedTimes;
    }

    function findTriggerIndex(array, name) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].name === name) {
                return i;
            }
        }
        return -1;
    }

    function addTriggerTime(count, instrumentName, trigger) {
        if (!self.triggersByTime[count]) {
            self.triggersByTime[count] = [];
        }
        var index = findTriggerIndex(self.triggersByTime[count], instrumentName);
        if (index < 0) {
            self.triggersByTime[count].push(trigger);
            triggersMap[instrumentName + count] = trigger;
        }
    }

    function dispatch(type, param) {
        if (!(type in listeners)) {
            return true;
        }
        var stack = listeners[type];
        for (var i = 0, l = stack.length; i < l; i++) {
            stack[i].call(self, param);
        }
    }
}

/**
 * Rate is number of semitones up (+) or down (-) from A-4 (440Hz)
 */
function InstrumentTrigger(instrumentName, rate) {
    var self = this;
    self.name = instrumentName;
    if (!rate) {
        rate = 0;
    }
    self.rate = rate;

    self.copy = function () {
        return new InstrumentTrigger(instrumentName, self.rate);
    };
}
