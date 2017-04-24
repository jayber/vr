function AudioAndAnimationScheduler(soundSettings) {
    var audioCtx = soundSettings.audioCtx;
    //ALL time is in SECONDS (not millis)
    const self = this;
    const timeOnLength = 0.1;
    const segmentsPerBatch = 32;

    function getGrain() {
        if (isGearVR()) {
            return 4;
        } else {
            return 1;
        }
    }

    const timeEventGranularity = getGrain();
    const listeners = {};
    const countListeners = [];

    var count = 0;
    var segmentOffCount = 0;
    var playedCount = 0;
    var scheduleTime = 0;

    var isRunning = false;
    var startTime;

    var segmentOffTime;
    var sourcesToCancel;

    self.registerInstrument = function (instrumentPart) {
        if (self.soundList == undefined) {
            self.soundList = [soundSettings.totalSegments];
            for (var i = 0; i < soundSettings.totalSegments; i++) {
                self.soundList[i] = [];
            }
        }
        instrumentPart.parsedTimes.forEach(function (time) {
            self.addTriggerTime(time.count, instrumentPart.src);
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

    self.addCountListener = function (time, listener) {
        if (countListeners[time] == undefined) {
            countListeners[time] = [];
        }
        countListeners[time].push(listener);
    };

    self.addCountsListener = function (times, listener) {
        times.forEach(function (time) {
            self.addCountListener(time.count, listener);
        })
    };

    self.removeCountListener = function (time, listener) {
        var index = countListeners[time].indexOf(listener);
        countListeners[time].splice(index, 1);
    };

    self.addEventListener = function (type, listener) {
        if (!(type in listeners)) {
            listeners[type] = [];
        }
        listeners[type].push(listener);
    };

    self.start = function () {
        console.log("Scheduler.start");

        count = 0;
        segmentOffCount = 0;
        playedCount = 0;
        scheduleTime = 0;

        startTime = audioCtx.currentTime;
        isRunning = true;

        window.requestAnimationFrame(playAndSchedule);
        dispatch("start");
    };

    self.stop = function () {
        if (isRunning) {
            isRunning = false;
            if (sourcesToCancel) {
                for (var i = 0; i < sourcesToCancel.length; i++) {
                    var source = sourcesToCancel[i];
                    if (source) {
                        //console.log("Cancelling " + source);
                        source.stop();
                    }
                }
            }
            dispatch("stop");
            dispatch("timeoff", count % soundSettings.totalSegments);
        }
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

    function dispatchCount(count) {
        if (countListeners[count] == undefined) {
            return true;
        }
        var stack = countListeners[count];
        for (var i = 0, l = stack.length; i < l; i++) {
            stack[i].call(self, count);
        }
    }

    function playAndSchedule() {
        const offset = segmentsPerBatch * soundSettings.getSegmentDuration();
        const elapsedTime = audioCtx.currentTime - startTime;
        scheduleSamples(elapsedTime, offset);
        fireSegmentEvents(elapsedTime, offset);
        if (isRunning) {
            window.requestAnimationFrame(playAndSchedule);
        }
    }

    function scheduleSamples(elapsedTime, offset) {
        while (scheduleTime < elapsedTime) {
            const nextIndex = playedCount % soundSettings.totalSegments;
            const toIndex = nextIndex + segmentsPerBatch;
            const scheduleOffset = offset + (soundSettings.getSegmentDuration() * soundSettings.totalSegments * Math.floor(playedCount / soundSettings.totalSegments));

            scheduleFromStartTime(nextIndex, toIndex, scheduleOffset);

            playedCount += segmentsPerBatch;
            scheduleTime = scheduleTime + offset;
        }
    }

    function calcNextSegmentTime(offset, count) {
        return ( count * soundSettings.getSegmentDuration()) + offset;
    }

    function fireSegmentEvents(elapsedTime, offset) {
        var nextSegmentTime = calcNextSegmentTime(offset, count);

        if (segmentOffCount < count && (nextSegmentTime < elapsedTime || (elapsedTime - segmentOffTime) > timeOnLength)) {
            //console.log("fireSegmentOff - count: " + count + "; elapsedTime: " + elapsedTime);
            dispatch("timeoff", count % soundSettings.totalSegments);
            segmentOffCount = count;
            segmentOffTime = elapsedTime;
        }

        if (nextSegmentTime < elapsedTime) {
            var pendingNextSegmentTime = calcNextSegmentTime(offset, count + 1);
            while (pendingNextSegmentTime < elapsedTime) {
                dispatchCount(count % soundSettings.totalSegments);
                count++;
                pendingNextSegmentTime = calcNextSegmentTime(offset, count + 1);
            }
            if (count % timeEventGranularity == 0) {
                dispatch("time", count % soundSettings.totalSegments);
            }
            dispatchCount(count % soundSettings.totalSegments);
        }
    }

    function scheduleFromStartTime(from, to, offset) {
        sourcesToCancel = [];
        for (var i = from; i < to; i++) {
            var sounds = self.soundList[i];
            if (sounds != undefined && sounds.length > 0) {
                sounds.forEach(function (soundName) {
                    var when = startTime + offset + (i * soundSettings.getSegmentDuration() );
                    if (when > audioCtx.currentTime) {
                        if (!soundSettings.mute) {
                            var source = audioCtx.createBufferSource();
                            source.buffer = soundSettings.soundBuffersMap[soundName];
                            source.connect(soundSettings.output);
                            //console.log("scheduling " + soundName + " for " + when + " with " + offset);
                            source.start(when);
                            sourcesToCancel.push(source);
                        }
                    }
                });
            }
        }
    }
}
