function ScoreLoader(settings) {

    var self = this;
    var loadListeners = [];
    var loaded = false;

    self.addLoadListener = function (listener) {
        loadListeners.push(listener);
        if (loaded) {
            dispatchLoad();
        }
    };

    function dispatchLoad() {
        for (var i = 0, l = loadListeners.length; i < l; i++) {
            loadListeners[i].call(self);
        }
    }

    self.score = {
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

    var sources = [];
    Object.keys(self.score).forEach(function (key, index) {
        var instrumentPart = self.score[key];
        instrumentPart.parsedTimes = parseTimes(instrumentPart.times);
        sources.push(instrumentPart.src);
    });

    var promise = settings.load(sources);
    promise.then(function () {
        dispatchLoad();
    });
}
