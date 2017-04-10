function SoundSettings() {
    var self = this;

    self.bpm = 110;
    self.beats = 4;
    self.segmentsPerBeat = 32;
    self.totalSegments = self.segmentsPerBeat * self.beats;
    self.beatDuration = 60 / self.bpm;
    self.segmentDuration = self.beatDuration / self.segmentsPerBeat;

    self.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    self.soundBuffersMap = {};

    self.load = function (src) {
        var loader = new AudioSampleLoader();
        loader.src = src;
        loader.ctx = self.audioCtx;
        loader.onload = function () {
            self.soundBuffersMap[src] = loader.response;
        };
        loader.send();
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
        self.load(src);
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

    self.convertTimeToCount = function (time) {
        return self.convertTimeToCount2(time.beat, time.seg);
    };

    self.convertTimeToCount2 = function (beat, seg) {
        return (self.segmentsPerBeat * beat) + seg;
    }
}