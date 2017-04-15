function SoundSettings() {
    var self = this;
    self.bpm = 130;
    self.beats = 4;
    self.segmentsPerBeat = 32;
    self.totalSegments = self.segmentsPerBeat * self.beats;

    self.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    self.soundBuffersMap = {};

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

    self.removeTriggerTime = function (count, src) {
        var index = self.soundList[count].indexOf(src);
        self.soundList[count].splice(index, 1);
    };

    self.addTriggerTime = function (count, src) {
        var index = self.soundList[count].indexOf(src);
        if (index < 0) {
            self.soundList[count].push(src);
        }
    };

    self.registerSound = function (src, times) {
        if (self.soundList == undefined) {
            self.soundList = [self.totalSegments];
            for (var i = 0; i < self.totalSegments; i++) {
                self.soundList[i] = [];
            }
        }

        times.forEach(function (time) {
            self.soundList[time.count].push(src);
        });
    };

    self.convertTimeToCount = function (beat, seg) {
        return Math.round((self.segmentsPerBeat * beat) + seg);
    }
}
