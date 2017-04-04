function RequestAnimationFrameScheduler(audioCtx) {
    var self = this;

    self.audioCtx = audioCtx;

    self.start = function (segmentDuration, totalNoOfSegments, noOfRepeats, soundByTimes, el) {
        console.log("RequestAnimationFrameScheduler.start");
        self.count = 0;
        self.repeatCount = 0;
        self.segmentDuration = segmentDuration;
        self.noOfRepeats = noOfRepeats;
        self.el = el;

        self.soundsByTimes = soundByTimes;
        self.startTime = self.audioCtx.currentTime * 1000;
        self.nextSound = 0;

        window.requestAnimationFrame(function () {
            self.playCurrent(totalNoOfSegments)
        });
    };

    self.playCurrent = function (totalNoOfSegments) {

        const batchSize = 4;
        const to = self.nextSound + batchSize;
        const offset = batchSize * self.segmentDuration;
        self.schedule(self.nextSound, to, offset);
        self.nextSound = to;

        var critTime = (self.count * self.segmentDuration) + (self.repeatCount * totalNoOfSegments * self.segmentDuration) + offset;
        var elapsedTime = (audioCtx.currentTime * 1000) - self.startTime;

        if (critTime < elapsedTime) {
            console.log("playCurrent - critTime: " + critTime + "; elapsedTime: " + Math.floor(elapsedTime));
            sound.emitEvents(self.count, self.el);
            self.count++;
        }

        if (self.count < totalNoOfSegments) {
            window.requestAnimationFrame(function () {
                self.playCurrent(totalNoOfSegments)
            });
        } else if (self.repeatCount < self.noOfRepeats - 1) {
            self.count = 0;
            self.repeatCount++;
            window.requestAnimationFrame(function () {
                self.playCurrent(totalNoOfSegments)
            });
        }
    };

    self.schedule = function (from, to, offset) {

        for (var i = from; i < to; i++) {
            var sounds = self.soundsByTimes[i];

            if (sounds != undefined && sounds.length > 0) {
                sounds.forEach(function (soundName) {
                    var source = self.audioCtx.createBufferSource();
                    source.buffer = sound.soundBuffersMap[soundName];
                    source.connect(self.audioCtx.destination);
                    var when = ((i * self.segmentDuration ) + offset) / 1000;
                    console.log("scheduling " + soundName + " for " + when);
                    source.start(self.audioCtx.currentTime + when);
                });
            }
        }

    };
}

function AudioContextScheduler(audioCtx) {
    var self = this;

    self.audioCtx = audioCtx;

    self.start = function (segmentDuration, totalNoOfSegments, noOfRepeats, soundByTimes, el) {
        console.log("AudioContextScheduler.start");
        self.count = 0;
        self.repeatCount = 0;
        self.segmentDuration = segmentDuration;
        self.noOfRepeats = noOfRepeats;
        self.el = el;

        self.soundsByTimes = soundByTimes;

        self.schedule(totalNoOfSegments, noOfRepeats)
    };

    self.schedule = function (totalNoOfSegments, noOfRepeats) {

        for (var j = 0; j < noOfRepeats; j++) {
            var repeatOffset = j * totalNoOfSegments * self.segmentDuration / 1000;
            for (var i = 0; i < totalNoOfSegments; i++) {
                var sounds = self.soundsByTimes[i];

                if (sounds != undefined && sounds.length > 0) {
                    sounds.forEach(function (soundName) {
                        var source = self.audioCtx.createBufferSource();
                        source.buffer = sound.soundBuffersMap[soundName];
                        source.connect(self.audioCtx.destination);
                        var when = (i * self.segmentDuration / 1000) + repeatOffset;
                        console.log("scheduling " + soundName + " for " + when);
                        source.start(self.audioCtx.currentTime + when);
                    });
                }
            }
        }
    };
}