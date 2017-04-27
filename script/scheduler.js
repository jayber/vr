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
    const lastInstrumentSources = {};

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
        segmentOffTime = 0;

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
            dispatchInstrumentOff();
        }
    };

    function playAndSchedule() {
        const offset = segmentsPerBatch * self.score.getSegmentDuration();
        const elapsedTime = audioCtx.currentTime - startTime;
        scheduleSounds(elapsedTime, offset);
        fireSegmentEvents(elapsedTime, offset);
        if (isRunning) {
            window.requestAnimationFrame(playAndSchedule);
        }
    }

    function dispatch(type, param) {
        if (!(type in listeners)) {
            return true;
        }
        var stack = listeners[type];
        for (var i = 0, l = stack.length; i < l; i++) {
            stack[i].call(self, param);
        }
    }

    function dispatchInstrumentOn(count) {
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

    function dispatchInstrumentOff() {
        while (offStack.length > 0) {
            offStack.pop().call(self);
        }
    }

    function scheduleSounds(elapsedTime, offset) {
        while (scheduleTime < elapsedTime) {
            const nextIndex = playedCount % self.score.totalSegments;
            const toIndex = nextIndex + segmentsPerBatch;
            const accumulatedOffset = offset + (self.score.getSegmentDuration() * self.score.totalSegments * Math.floor(playedCount / self.score.totalSegments));

            scheduleTriggerBatch(nextIndex, toIndex, accumulatedOffset);

            playedCount += segmentsPerBatch;
            scheduleTime += offset;
        }
    }

    function calcNextSegmentTime(offset, count) {
        return (count * self.score.getSegmentDuration()) + offset;
    }

    function fireSegmentEvents(elapsedTime, offset) {
        if (offStack.length > 0 && ((elapsedTime - segmentOffTime) > timeOnLength)) {
            dispatchInstrumentOff();
            segmentOffTime = elapsedTime;
        }

        var nextSegmentTime = calcNextSegmentTime(offset, count);
        if (nextSegmentTime < elapsedTime) {
            var pendingNextSegmentTime = calcNextSegmentTime(offset, count + 1);
            while (pendingNextSegmentTime < elapsedTime) {
                dispatchInstrumentOn(count % self.score.totalSegments);
                if (count % soundSettings.segmentsPerBeat == 0) {
                    dispatch("beat", count);
                }
                count++;
                pendingNextSegmentTime = calcNextSegmentTime(offset, count + 1);
            }
            if (count % timeEventGranularity == 0) {
                dispatch("time", count % self.score.totalSegments);
            }
            dispatchInstrumentOn(count % self.score.totalSegments);
        }
    }

    function scheduleTriggerBatch(from, to, offset) {
        sourcesToCancel = [];
        for (var i = from; i < to; i++) {
            var instrumentNames = self.score.instrumentList[i];
            if (instrumentNames != undefined && instrumentNames.length > 0) {
                instrumentNames.forEach(function (instrumentName) {
                    var instrument = self.score.instruments[instrumentName];
                    var when = startTime + offset + (i * self.score.getSegmentDuration() );
                    if (when > audioCtx.currentTime) {
                        if (!soundSettings.mute) {
                            var oldSource = lastInstrumentSources[instrumentName];
                            if (oldSource) {
                                oldSource.stop(when);
                            }
                            var source = audioCtx.createBufferSource();
                            source.buffer = soundSettings.soundBuffersMap[instrument.src];
                            source.connect(soundSettings.output);
                            source.start(when);
                            sourcesToCancel.push(source);
                            lastInstrumentSources[instrumentName] = source;
                        }
                    }
                });
            }
        }
    }
}
