function ScoreLoader(settings) {

    var self = this;

    var readableScore = {
        "kick": {src: "audio/kick2.wav", times: ["0:0/4", "0:2/4", "2:7/16", "2:7/8"]},
        "hat": {src: "audio/hat2.wav", times: ["0:2/4", "1:2/4", "2:2/4", "3:2/4"]},
        "snare": {src: "audio/snare2.wav", times: ["1:0/4", "2:1/4", "3:0/4"]},
        "bork": {src: "audio/guitar.wav", times: []},
        "beep": {src: "audio/siren.wav", times: []}
    };

    var beatExp = /(\d*):(\d*)\/(\d*)/;

    function parseTimes(times) {
        var parsedTimes = [];
        times.forEach(function (time) {
            var capture = beatExp.exec(time);
            var beat = capture[1];
            var nom = capture[2];
            var denom = capture[3];
            var seg = (settings.segmentsPerBeat / denom) * nom;
            var element = {beat: beat, seg: seg, count: settings.convertTimeToCount(beat, seg)};
            parsedTimes.push(element);
        });
        return parsedTimes;
    }

    self.reload = function () {
        var playableScore = new PlayableScore(settings);
        var sources = [];
        Object.keys(readableScore).forEach(function (key, index) {
            var instrumentPart = readableScore[key];
            instrumentPart.name = key;
            instrumentPart.parsedTimes = parseTimes(instrumentPart.times);
            playableScore.registerInstrument(key, instrumentPart.parsedTimes, instrumentPart.src);
            sources.push(instrumentPart.src);
        });

        self.score = playableScore;
        return sources;
    };

    var sources = self.reload();
    self.loaded = settings.load(sources);
}

function PlayableScore(settings) {

    var self = this;

    self.instruments = {};
    self.instrumentList = [settings.totalSegments];
    for (var i = 0; i < settings.totalSegments; i++) {
        self.instrumentList[i] = [];
    }

    self.registerInstrument = function (name, times, src) {
        self.instruments[name] = {name: name, times: times, src: src};
        times.forEach(function (time) {
            self.addInstrumentTrigger(time.count, name);
        });
    };

    self.removeInstrumentTrigger = function (count, instrument) {
        var index = self.instrumentList[count].indexOf(instrument);
        self.instrumentList[count].splice(index, 1);
    };

    self.addInstrumentTrigger = function (count, instrumentName) {
        var index = self.instrumentList[count].indexOf(instrumentName);
        if (index < 0) {
            self.instrumentList[count].push(instrumentName);
        }
    };
}
