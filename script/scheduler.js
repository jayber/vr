function ScriptNodeScheduler(audioCtx) {
    var self = this;

    self.audioCtx = audioCtx;

    self.start = function (segmentDuration, totalNoOfSegments, noOfRepeats, soundByTimes, el) {
        console.log("ScriptNodeScheduler.start");
        self.count = 0;
        self.repeatCount = 0;
        self.segmentDuration = segmentDuration;
        self.noOfRepeats = noOfRepeats;
        self.el = el;

        self.soundsByTimes = soundByTimes;

        var scriptNode = self.audioCtx.createScriptProcessor(512, 1, 1);

        var dummy = self.audioCtx.createOscillator();
        dummy.connect(scriptNode);

        scriptNode.onaudioprocess = function (event) {
            self.playCurrent(totalNoOfSegments, dummy, scriptNode)
        };

        scriptNode.connect(self.audioCtx.destination);
        self.startTime = self.audioCtx.currentTime * 1000;
        dummy.start();
    };

    self.playCurrent = function (totalNoOfSegments, driverNode, scriptNode) {
        var critTime = (self.count * self.segmentDuration) + (self.repeatCount * totalNoOfSegments * self.segmentDuration);
        var elapsedTime = (self.audioCtx.currentTime * 1000) - self.startTime;

        if (critTime < elapsedTime) {
            console.log("playCurrent - critTime: " + critTime + "; elapsedTime: " + Math.floor(elapsedTime));
            sound.emitEvents(self.count, self.el);
            sound.play(self.soundsByTimes[self.count]);
            self.count++;
        }

        if (self.count == totalNoOfSegments) {
            if (self.repeatCount < self.noOfRepeats - 1) {
                self.count = 0;
                self.repeatCount++;
            } else {
                console.log("stop");
                scriptNode.disconnect(self.audioCtx.destination);
                driverNode.stop();
            }
        }
    };
}

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

        window.requestAnimationFrame(function () {
            self.playCurrent(totalNoOfSegments)
        });
    };

    self.playCurrent = function (totalNoOfSegments) {
        var critTime = (self.count * self.segmentDuration) + (self.repeatCount * totalNoOfSegments * self.segmentDuration);
        var elapsedTime = (audioCtx.currentTime * 1000) - self.startTime;

        if (critTime < elapsedTime) {
            console.log("playCurrent - critTime: " + critTime + "; elapsedTime: " + Math.floor(elapsedTime));
            sound.emitEvents(self.count, self.el);
            sound.play(self.soundsByTimes[self.count]);
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