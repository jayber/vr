function SoundSettings() {
    var self = this;
    self.bpm = 130;
    self.beats = 4;
    self.segmentsPerBeat = 32;
    self.totalSegments = self.segmentsPerBeat * self.beats;

    self.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var gain = self.audioCtx.createGain();
    gain.connect(self.audioCtx.destination);
    self.output = gain;
    self.soundBuffersMap = {};
    self.mute = false;

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

    self.getSegmentDuration = function () {
        return 60 / self.bpm / self.segmentsPerBeat;
    };

    self.load = function (sources) {
        return new Promise(function (resolve, reject) {
            var completedCount = 0;
            sources.forEach(function (src) {
                var loader = new AudioSampleLoader();
                loader.src = src;
                loader.ctx = self.audioCtx;
                loader.onload = function () {
                    self.soundBuffersMap[src] = loader.response;
                    completedCount++;
                    if (completedCount == sources.length) {
                        resolve("Success");
                    }
                };
                loader.send();
            })
        });
    };

    self.convertTimeToCount = function (beat, seg) {
        return Math.round((self.segmentsPerBeat * beat) + seg);
    };

    self.play = function (src) {
        var source = self.audioCtx.createBufferSource();
        source.buffer = self.soundBuffersMap[src];
        source.connect(self.audioCtx.destination);
        source.start();
    };

    self.incrementVol = function () {
        gain.gain.value = gain.gain.value + 0.1;
    };

    self.decrementVol = function () {
        gain.gain.value = gain.gain.value - 0.1;
    }
}
