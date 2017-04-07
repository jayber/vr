function AudioAndAnimationScheduler(audioCtx) {
    //ALL time is in SECONDS (not millis)
    const self = this;
    const timeOnLength = 0.1;
    const segmentsPerBatch = 16;
    const timeEventGranularity = 2;
    const listeners = {};
    const countListeners = [];

    var count = 0;
    var segmentOffCount = 0;
    var playedCount = 0;
    var scheduleTime = 0;

    var isRunning = false;
    var startTime;
    var secondsPerSegment;
    var totalSegments;
    var soundsBySegment;
    var soundBuffersMap;

    var segmentOffTime;
    var sourcesToCancel;

    self.addCountListener = function (times, listener) {
        times.forEach(function (time) {
            if (countListeners[time] == undefined) {
                countListeners[time] = [];
            }
            countListeners[time].push(listener);
        })
    };

    self.addEventListener = function (type, listener) {
        if (!(type in listeners)) {
            listeners[type] = [];
        }
        listeners[type].push(listener);
    };

    self.start = function (secondsPerSegmentP, totalNoOfSegments, soundsBySegmentP, soundBuffers) {
        console.log("Scheduler.start");
        secondsPerSegment = secondsPerSegmentP;
        totalSegments = totalNoOfSegments;
        soundsBySegment = soundsBySegmentP;
        soundBuffersMap = soundBuffers;

        count = 0;
        segmentOffCount = 0;
        playedCount = 0;
        scheduleTime = 0;

        startTime = audioCtx.currentTime;
        isRunning = true;

        window.requestAnimationFrame(playAndSchedule);
    };

    self.stop = function () {
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
        const offset = segmentsPerBatch * secondsPerSegment;
        const elapsedTime = audioCtx.currentTime - startTime;
        scheduleSamples(elapsedTime, offset);
        fireSegmentEvents(elapsedTime, offset);
        if (isRunning) {
            window.requestAnimationFrame(playAndSchedule);
        }
    }

    function scheduleSamples(elapsedTime, offset) {
        while (scheduleTime < elapsedTime) {
            const nextIndex = playedCount % totalSegments;
            const toIndex = nextIndex + segmentsPerBatch;
            const scheduleOffset = offset + (secondsPerSegment * totalSegments * Math.floor(playedCount / totalSegments));

            scheduleFromStartTime(nextIndex, toIndex, scheduleOffset);

            playedCount += segmentsPerBatch;
            scheduleTime = scheduleTime + offset;
        }
    }

    function calcNextSegmentTime(offset, count) {
        return ( count * secondsPerSegment) + offset;
    }

    function fireSegmentEvents(elapsedTime, offset) {
        var nextSegmentTime = calcNextSegmentTime(offset, count);

        if (segmentOffCount < count && (nextSegmentTime < elapsedTime || (elapsedTime - segmentOffTime) > timeOnLength)) {
            //console.log("fireSegmentOff - count: " + count + "; elapsedTime: " + elapsedTime);
            dispatch("timeoff", count % totalSegments);
            segmentOffCount = count;
            segmentOffTime = elapsedTime;
        }

        while (nextSegmentTime < elapsedTime) {
            //console.log("fireSegmentOn - nextSegmentTime: " + nextSegmentTime + "; elapsedTime: " + elapsedTime);
            if (count % timeEventGranularity == 0) {
                dispatch("time", count % totalSegments);
            }
            dispatchCount(count % totalSegments);
            count++;
            nextSegmentTime = calcNextSegmentTime(offset, count);
        }
    }

    function scheduleFromStartTime(from, to, offset) {
        sourcesToCancel = [];
        for (var i = from; i < to; i++) {
            var sounds = soundsBySegment[i];
            if (sounds != undefined && sounds.length > 0) {
                sounds.forEach(function (soundName) {
                    var source = audioCtx.createBufferSource();
                    source.buffer = soundBuffersMap[soundName];
                    source.connect(audioCtx.destination);
                    var when = startTime + offset + (i * secondsPerSegment );
                    //console.log("scheduling " + soundName + " for " + when + " with " + offset);
                    source.start(when);
                    sourcesToCancel.push(source);
                });
            }
        }
    }
}