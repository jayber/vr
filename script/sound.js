var sound = new function Sound() {

    var self = this;

    self.bpm = 110;
    self.beatDuration = 60000 / self.bpm;
    self.noOfSegments = 4;
    self.segmentDuration = Math.floor(self.beatDuration / self.noOfSegments);
    self.noOfBeats = 4;
    self.noOfRepeats = 4;
    self.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    self.soundBuffersMap = {};
    self.totalNoOfSegments = self.noOfSegments * self.noOfBeats;

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

    self.play = function (sounds) {
        if (sounds.length > 0) {
            sounds.forEach(function (soundName) {
                var source = self.audioCtx.createBufferSource();
                source.buffer = self.soundBuffersMap[soundName];
                source.connect(self.audioCtx.destination);
                source.start();
            });
        }
    };

    self.emitEvents = function (count, el) {
        var currentSegment = count % self.noOfSegments;
        var beatCount = Math.floor(count / self.noOfSegments);

        el.emit('time', {beatCount: beatCount, seg: currentSegment});
    };

    self.indexSoundsBySegment = function () {
        var soundsByTimes = [self.totalNoOfSegments];
        for (var i = 0; i < self.totalNoOfSegments; i++) {
            soundsByTimes[i] = [];
        }

        self.soundList.forEach(function (element) {
            element.times.forEach(function (time) {
                var index = ((Number(time[0]) * self.noOfSegments) + Number(time[1]));
                soundsByTimes[index].push(element.name);
            });
        });
        return soundsByTimes;
    };
};