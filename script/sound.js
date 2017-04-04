var sound = new function Sound() {
    var self = this;

    self.bpm = 110;
    self.beats = 4;
    self.segmentsPerBeat = 4;
    self.totalSegments = self.segmentsPerBeat * self.beats;
    self.beatDuration = 60000 / self.bpm;
    self.segmentDuration = Math.floor(self.beatDuration / self.segmentsPerBeat);

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

    self.registerSound = function (src, times) {
        if (self.soundList == undefined) {
            self.soundList = [{name: src, times: times}];
        } else {
            self.soundList.push({name: src, times: times});
        }
    };

    self.emitEvents = function (count, el) {
        var currentSegment = count % self.segmentsPerBeat;
        var beatCount = Math.floor(count / self.segmentsPerBeat);

        el.emit('time', {beatCount: beatCount, seg: currentSegment});
    };

    self.indexSoundsBySegment = function () {
        var soundsByTimes = [self.totalSegments];
        for (var i = 0; i < self.totalSegments; i++) {
            soundsByTimes[i] = [];
        }

        self.soundList.forEach(function (element) {
            element.times.forEach(function (time) {
                var index = ((Number(time[0]) * self.segmentsPerBeat) + Number(time[1]));
                soundsByTimes[index].push(element.name);
            });
        });
        return soundsByTimes;
    };
};