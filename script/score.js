function ScoreLoader(settings) {
    var self = this;
    var readableScore = {
        "bpm": 130,
        "beats": 4,
        instrumentParts: {
            "kick": {src: "audio/kick2.wav", times: ["0:0/4", "0:2/4", "2:7/16", "2:7/8"]},
            "hat": {src: "audio/hat2.wav", times: ["0:2/4", "1:2/4", "2:2/4", "3:2/4"]},
            "snare": {src: "audio/snare2.wav", times: ["1:0/4", "2:1/4", "3:0/4"]},
            "bork": {src: "audio/yo.wav", times: []},
            "beep": {src: "audio/truck.wav", times: []}
        }
    };

    var beatExp = /(\d*):(\d*)\/(\d*)/;

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

    function registerInstruments() {
        Object.keys(readableScore.instrumentParts).forEach(function (key, index) {
            var instrumentPart = readableScore.instrumentParts[key];
            playableScore.registerInstrument(key, parseTimes(instrumentPart.times), instrumentPart.src);
            sources.push(instrumentPart.src);
        });
    }

    self.reload = function () {
        self.score.unregisterAll();
        self.score.beats = readableScore.beats;
        registerInstruments();
        self.score.bpm = readableScore.bpm;
    };

    var playableScore = new PlayableScore(settings, readableScore.bpm, readableScore.beats);
    var sources = [];
    registerInstruments();

    self.score = playableScore;

    self.loaded = settings.load(sources);
}

function PlayableScore(settings, bpm, beats) {
    var self = this;
    var bpm = bpm;

    var listeners = {};
    self.beats = beats;

    function addTriggerTime(count, instrumentName, rate) {
        var trigger = new InstrumentTrigger(instrumentName, rate);
        var index = self.triggersByTime[count].indexOf(trigger);
        if (index < 0) {
            self.triggersByTime[count].push(trigger);
        }
    }

    function init() {
        self.instruments = {};
        self.triggersByTime = [self.totalSegments];
        for (var i = 0; i < self.totalSegments; i++) {
            self.triggersByTime[i] = [];
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
            bpm = bpmP;
            dispatch("bpm-change", bpm);
        }, get: function () {
            return bpm;
        }
    });

    Object.defineProperty(self, 'totalSegments', {
        get: function () {
            return settings.segmentsPerBeat * self.beats;
        }
    });

    init();

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
        init();
    };

    self.registerInstrument = function (name, times, src) {
        self.instruments[name] = {name: name, times: times, src: src};
        times.forEach(function (time) {
            addTriggerTime(time.count, name);
        });
    };

    self.removeInstrumentTrigger = function (count, instrumentName) {
        var index = self.triggersByTime[count].indexOf(instrumentName);
        self.triggersByTime[count].splice(index, 1);

        var indexToo = self.instruments[instrumentName].times.findIndex(function (element) {
            return element.count == count;
        });
        self.instruments[instrumentName].times.splice(indexToo, 1);
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
