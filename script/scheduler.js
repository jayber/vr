function AudioAndAnimationScheduler(soundSettings) {
    var audioCtx = soundSettings.audioCtx;
    //ALL time is in SECONDS (not millis)
    const self = this;
    const timeOnLength = 0.05;
    const segmentsPerBatch = 32;

    var count = 0;
    var playedCount = 0;
    var scheduleTime = 0;

    var segmentOffTime = 0;
    var sourcesToCancel;
    var isRunning = false;
    var startTime;

    const listeners = {};
    var instrumentListeners = {};
    var offStack = [];

    function getGrain() {
        if (isGearVR()) {
            return 4;
        } else {
            return 1;
        }
    }

    const timeEventGranularity = getGrain();

    self.addInstrumentListener = function (name, onListener, offListener) {
        if (!(name in instrumentListeners)) {
            instrumentListeners[name] = {on: [], off: []};
        }
        instrumentListeners[name].on.push(onListener);
        instrumentListeners[name].off.push(offListener);
    };

    self.addEventListener = function (type, listener) {
        if (!(type in listeners)) {
            listeners[type] = [];
        }
        listeners[type].push(listener);
    };

    self.start = function (score) {
        console.log("Scheduler.start");
        self.score = score;

        count = 0;
        playedCount = 0;
        scheduleTime = 0;

        startTime = audioCtx.currentTime;
        isRunning = true;

        playAndSchedule();
        dispatch("start");
    };

    self.stop = function () {
        if (isRunning) {
            isRunning = false;
            if (sourcesToCancel) {
                for (var i = 0; i < sourcesToCancel.length; i++) {
                    var source = sourcesToCancel[i];
                    if (source) {
                        source.stop();
                    }
                }
            }
            dispatch("stop");
            dispatchOff();
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

    function dispatchOn(count) {
        if (self.score.instrumentList[count] == undefined) {
            return true;
        }
        var stack = self.score.instrumentList[count];
        for (var i = 0, l = stack.length; i < l; i++) {
            instrumentListeners[stack[i]].on.forEach(function (listener) {
                listener.call(self, count);
            });
            instrumentListeners[stack[i]].off.forEach(function (listener) {
                offStack.push(listener);
            });
        }
    }

    function dispatchOff() {
        while (offStack.length > 0) {
            offStack.pop().call(self);
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
        return (count * soundSettings.getSegmentDuration()) + offset;
    }

    function fireSegmentEvents(elapsedTime, offset) {
        if (offStack.length > 0 && ((elapsedTime - segmentOffTime) > timeOnLength)) {
            dispatchOff();
            segmentOffTime = elapsedTime;
        }

        var nextSegmentTime = calcNextSegmentTime(offset, count);
        if (nextSegmentTime < elapsedTime) {
            var pendingNextSegmentTime = calcNextSegmentTime(offset, count + 1);
            while (pendingNextSegmentTime < elapsedTime) {
                dispatchOn(count % soundSettings.totalSegments);
                count++;
                pendingNextSegmentTime = calcNextSegmentTime(offset, count + 1);
            }
            if (count % timeEventGranularity == 0) {
                dispatch("time", count % soundSettings.totalSegments);
            }
            dispatchOn(count % soundSettings.totalSegments);
        }
    }

    function scheduleFromStartTime(from, to, offset) {
        sourcesToCancel = [];
        for (var i = from; i < to; i++) {
            var instrumentNames = self.score.instrumentList[i];
            if (instrumentNames != undefined && instrumentNames.length > 0) {
                instrumentNames.forEach(function (instrumentName) {
                    var instrument = self.score.instruments[instrumentName];
                    var when = startTime + offset + (i * soundSettings.getSegmentDuration() );
                    if (when > audioCtx.currentTime) {
                        if (!soundSettings.mute) {
                            var source = audioCtx.createBufferSource();
                            source.buffer = soundSettings.soundBuffersMap[instrument.src];
                            source.connect(soundSettings.output);
                            source.start(when);
                            sourcesToCancel.push(source);
                        }
                    }
                });
            }
        }
    }
}
