function ScriptNodeScheduler(audioCtx) {
    var self = this;

    self.audioCtx = audioCtx;

    self.start = function (segmentDuration, totalNoOfSegments, noOfRepeats, soundByTimes, el) {
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