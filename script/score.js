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

    self.reload = function () {
        var playableScore = new PlayableScore(settings, readableScore.bpm, readableScore.beats);
        var sources = [];
        Object.keys(readableScore.instrumentParts).forEach(function (key, index) {
            var instrumentPart = readableScore.instrumentParts[key];
            playableScore.registerInstrument(key, parseTimes(instrumentPart.times), instrumentPart.src);
            sources.push(instrumentPart.src);
        });

        self.score = playableScore;
        return sources;
    };

    var sources = self.reload();
    self.loaded = settings.load(sources);
}

function PlayableScore(settings, bpm, beats) {
    var self = this;
    self.bpm = bpm;
    self.beats = beats;

    Object.defineProperty(self, 'totalSegments', {
        get: function () {
            return settings.segmentsPerBeat * self.beats;
        }
    });

    self.instruments = {};
    self.triggersByTime = [self.totalSegments];
    for (var i = 0; i < self.totalSegments; i++) {
        self.triggersByTime[i] = [];
    }

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

    var listeners = {};

    self.addEventListener = function (type, listener) {
        if (!(type in listeners)) {
            listeners[type] = [];
        }
        listeners[type].push(listener);
    };

    self.setBpm = function (bpm) {
        self.bpm = bpm;
        dispatch("bpm-change", bpm);
    };

    function dispatch(type, param) {
        if (!(type in listeners)) {
            return true;
        }
        var stack = listeners[type];
        for (var i = 0, l = stack.length; i < l; i++) {
            stack[i].call(self, param);
        }
    }

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

    function addTriggerTime(count, instrumentName, rate) {
        var trigger = new InstrumentTrigger(instrumentName, rate);
        var index = self.triggersByTime[count].indexOf(trigger);
        if (index < 0) {
            self.triggersByTime[count].push(trigger);
        }
    }
}

function InstrumentTrigger(instrumentName, rate) {
    var self = this;
    self.name = instrumentName;
    self.rate = rate;

    self.copy = function () {
        return new InstrumentTrigger(instrumentName, rate);
    };
}
