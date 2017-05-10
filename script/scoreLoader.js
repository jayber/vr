function ScoreLoader(settings) {
    var self = this;

    var beatExp = /(\d*):(\d*)\/(\d*)/;

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
            "bork": {src: "audio/chime.wav", times: []},
            "beep": {src: "audio/piano.wav", times: []}
        }
    }];


    var playableScore = new PlayableScore(settings);
    self.score = playableScore;

    function convertTimeToCount(beat, seg) {
        return Math.round((settings.segmentsPerBeat * beat) + seg);
    }

    function parseTimes(times) {
        var parsedTimes = [];
        times.forEach(function (time) {
            var capture = beatExp.exec(time);
            var beat = capture[1];
            var nom = capture[2];
            var denom = capture[3];
            var seg = (settings.segmentsPerBeat / denom) * nom;
            var element = {beat: beat, seg: seg, count: convertTimeToCount(beat, seg)};
            parsedTimes.push(element);
        });
        return parsedTimes;
    }

    function registerInstruments(currentScore) {
        var sources = [];
        Object.keys(currentScore.instrumentParts).forEach(function (key) {
            var instrumentPart = currentScore.instrumentParts[key];
            playableScore.registerInstrument(key, parseTimes(instrumentPart.times), instrumentPart.src);
            sources.push(instrumentPart.src);
        });
        return sources;
    }

    self.reload = function (index) {
        self.scoreIndex = index;
        var currentScore = self.readableScores[index];
        self.score.init(currentScore.bpm, currentScore.beats);
        var sources = registerInstruments(currentScore);
        self.loaded = settings.load(sources);
    };

    self.reload(0);
}

function PlayableScore(settings) {
    var self = this;
    var bpmVar;

    var listeners = {};
    self.beats;

    self.clear = function () {
        initTriggers();
        Object.keys(self.instruments).forEach(function (key) {
            self.instruments[key].times = [];
        })
    };

    function initTriggers() {
        self.triggersByTime = [self.totalSegments];
        for (var i = 0; i < self.totalSegments; i++) {
            self.triggersByTime[i] = [];
        }
    }

    self.init = function (bpmP, beats) {
        self.bpm = bpmP;
        self.beats = beats;
        self.instruments = {};
        initTriggers();
    };

    function addTriggerTime(count, instrumentName, rate) {
        var trigger = new InstrumentTrigger(instrumentName, rate);
        var index = self.triggersByTime[count].indexOf(trigger);
        if (index < 0) {
            self.triggersByTime[count].push(trigger);
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

    Object.defineProperty(self, 'bpm', {
        set: function (bpmP) {
            bpmVar = bpmP;
            dispatch("bpm-change", bpmP);
        }, get: function () {
            return bpmVar < 300 ? bpmVar : 300; //this is to prevent breaking, while still allowing 666 to be set
        }
    });

    Object.defineProperty(self, 'totalSegments', {
        get: function () {
            return settings.segmentsPerBeat * self.beats;
        }
    });

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
                self.instruments[key].times[i + totalTimes] = {count: self.instruments[key].times[i].count + self.totalSegments};
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

    self.unregisterAll = function () {
        self.init(bpmVar, self.beats);
    };

    self.registerInstrument = function (name, times, src) {
        self.instruments[name] = {name: name, times: times, src: src};
        times.forEach(function (time) {
            addTriggerTime(time.count, name);
        });
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
        addTriggerTime(count, instrumentName);
        self.instruments[instrumentName].times.push({count: count})
    };
}

function InstrumentTrigger(instrumentName, rate) {
    var self = this;
    self.name = instrumentName;
    self.rate = rate;

    self.copy = function () {
        return new InstrumentTrigger(instrumentName, rate);
    };
}
