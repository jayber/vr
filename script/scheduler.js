function AudioAndAnimationScheduler(audioCtx) {
    //ALL time is in SECONDS (not millis)
    var self = this;
    self.segmentOnLength = 0.1;
    self.batchSegments = 8;
    self.audioCtx = audioCtx;
    self.listeners = {};

    self.addEventListener = function (type, listener) {
        if (!(type in self.listeners)) {
            self.listeners[type] = [];
        }
        self.listeners[type].push(listener);
    };

    self.dispatch = function (type, param) {
        if (!(type in self.listeners)) {
            return true;
        }
        var stack = self.listeners[type];
        for (var i = 0, l = stack.length; i < l; i++) {
            stack[i].call(self, param);
        }
    };

    self.start = function (secondsPerSegment, totalNoOfSegments, soundByTimes, soundBuffersMap) {
        console.log("Scheduler.start");
        self.secondsPerSegment = secondsPerSegment;
        self.totalSegments = totalNoOfSegments;
        self.soundsByTimes = soundByTimes;
        self.soundBuffersMap = soundBuffersMap;

        self.count = 0;
        self.playedCount = 0;
        self.segmentOffCount = 0;
        self.scheduleTime = 0;

        self.isRunning = true;
        self.startTime = self.audioCtx.currentTime;

        window.requestAnimationFrame(self.playAndSchedule);
    };

    self.stop = function () {
        self.isRunning = false;
        if (self.sourcesToCancel) {
            for (var i = 0; i < self.sourcesToCancel.length; i++) {
                var source = self.sourcesToCancel[i];
                if (source) {
                    console.log("Cancelling " + source);
                    source.stop();
                }
            }
        }
    };

    self.playAndSchedule = function () {
        const offset = self.batchSegments * self.secondsPerSegment;
        const elapsedTime = self.audioCtx.currentTime - self.startTime;
        self.scheduleSamples(elapsedTime, offset);
        self.fireSegmentEvents(elapsedTime, offset);
        if (self.isRunning) {
            window.requestAnimationFrame(self.playAndSchedule);
        }
    };

    self.scheduleSamples = function (elapsedTime, offset) {
        if (self.scheduleTime < elapsedTime) {
            const nextIndex = self.playedCount % self.totalSegments;
            const toIndex = nextIndex + self.batchSegments;
            const scheduleOffset = offset + (self.secondsPerSegment * self.totalSegments * Math.floor(self.playedCount / self.totalSegments));

            self.scheduleFromStartTime(nextIndex, toIndex, scheduleOffset);

            self.playedCount += self.batchSegments;
            self.scheduleTime = self.scheduleTime + offset;
        }
    };

    function calcNextSegmentTime(offset, count) {
        return ( count * self.secondsPerSegment) + offset;
    }

    self.fireSegmentEvents = function (elapsedTime, offset) {
        var nextSegmentTime = calcNextSegmentTime(offset, self.count);

        if (self.segmentOffCount < self.count && (nextSegmentTime < elapsedTime || (elapsedTime - self.segmentOffTime) > self.segmentOnLength)) {
            console.log("fireSegmentOff - count: " + self.count + "; elapsedTime: " + elapsedTime);
            self.dispatch("timeoff", self.count % self.totalSegments);
            self.segmentOffCount = self.count;
            self.segmentOffTime = elapsedTime;
        }

        while (nextSegmentTime < elapsedTime) {
            console.log("fireSegmentOn - nextSegmentTime: " + nextSegmentTime + "; elapsedTime: " + elapsedTime);
            self.dispatch("time", self.count % self.totalSegments);
            self.count++;
            nextSegmentTime = calcNextSegmentTime(offset, self.count);
        }
    };

    self.scheduleFromStartTime = function (from, to, offset) {
        self.sourcesToCancel = [];
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
                    self.sourcesToCancel.push(source);
                });
            }
        }
    };
}