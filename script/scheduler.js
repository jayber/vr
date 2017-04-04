function AudioAndAnimationScheduler(audioCtx) {
    //ALL time is in SECONDS (not millis)
    var self = this;

    self.audioCtx = audioCtx;

    self.start = function (secondsPerSegment, totalNoOfSegments, soundByTimes, soundBuffersMap, segmentListener) {
        console.log("Scheduler.start");
        self.count = 0;
        self.secondsPerSegment = secondsPerSegment;
        self.soundBuffersMap = soundBuffersMap;
        self.totalSegments = totalNoOfSegments;
        self.segmentListener = segmentListener;

        self.soundsByTimes = soundByTimes;
        self.startTime = self.audioCtx.currentTime;
        self.playedCount = 0;
        self.batchSize = 4;
        self.offset = self.batchSize * self.secondsPerSegment;
        self.scheduleTime = 0;
        self.schedOffset = self.offset;

        self.isRunning = true;

        window.requestAnimationFrame(function () {
            self.playAndSchedule();
        });
    };

    self.stop = function () {
        self.isRunning = false;
    };

    self.playAndSchedule = function () {
        const elapsedTime = self.audioCtx.currentTime - self.startTime;
        self.scheduleSamples(elapsedTime);
        self.fireEvent(elapsedTime);
        if (self.isRunning) {
            window.requestAnimationFrame(function () {
                self.playAndSchedule();
            });
        }
    };

    self.scheduleSamples = function (elapsedTime) {
        if (self.scheduleTime < elapsedTime) {
            const nextIndex = self.playedCount % self.totalSegments;
            const toIndex = nextIndex + self.batchSize;
            const scheduleOffset = self.offset + (self.secondsPerSegment * self.totalSegments * Math.floor(self.playedCount / self.totalSegments));

            self.scheduleFromStartTime(nextIndex, toIndex, scheduleOffset);

            self.playedCount += self.batchSize;
            self.scheduleTime = self.scheduleTime + self.offset;
        }
    };

    self.fireEvent = function (elapsedTime) {
        var nextSegmentTime = (self.count * self.secondsPerSegment) + self.offset;
        if (nextSegmentTime < elapsedTime) {
            console.log("playCurrent - nextSegmentTime: " + nextSegmentTime + "; elapsedTime: " + Math.floor(elapsedTime));
            self.segmentListener(self.count % self.totalSegments);
            self.count++;
        }
    };

    self.scheduleFromStartTime = function (from, to, offset) {
        for (var i = from; i < to; i++) {
            var sounds = self.soundsByTimes[i];
            if (sounds != undefined && sounds.length > 0) {
                sounds.forEach(function (soundName) {
                    var source = self.audioCtx.createBufferSource();
                    source.buffer = self.soundBuffersMap[soundName];
                    source.connect(self.audioCtx.destination);
                    var when = self.startTime + offset + (i * self.secondsPerSegment );
                    console.log("scheduling " + soundName + " for " + when + " with " + offset);
                    source.start(when);
                });
            }
        }
    };
}