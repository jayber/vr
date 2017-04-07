var sound = new function Sound() {
    var self = this;

    self.bpm = 110;
    self.beats = 4;
    self.segmentsPerBeat = 16;
    self.totalSegments = self.segmentsPerBeat * self.beats;
    self.beatDuration = 60 / self.bpm;
    self.segmentDuration = self.beatDuration / self.segmentsPerBeat;

    self.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    self.soundBuffersMap = {};

    self.setFlashing = function (srcEntity, el) {
        if (srcEntity.hasAttribute("flash")) {
            var flash = srcEntity.getAttribute("flash");
            srcEntity.addEventListener("playtime", function () {
                el.object3DMap["mesh"].material.color.set(flash.to);
            });
            srcEntity.addEventListener("playoff", function () {
                el.object3DMap["mesh"].material.color.set(flash.from);
            });
        }
    };

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
        self.load(src);
        if (self.soundList == undefined) {
            self.soundList = [self.totalSegments];
            for (var i = 0; i < self.totalSegments; i++) {
                self.soundList[i] = [];
            }
        }

        times.forEach(function (time) {
            var index = ((Number(time.beat) * self.segmentsPerBeat) + Number(time.seg));
            self.soundList[index].push(src);
        });
    };

    self.convertToBeatTime = function (count) {
        var currentSegment = count % self.segmentsPerBeat;
        var beatCount = Math.floor(count / self.segmentsPerBeat);
        return {beatCount: beatCount, seg: currentSegment};
    }
};