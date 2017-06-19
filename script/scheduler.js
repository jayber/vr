function AudioAndAnimationScheduler(soundSettings) {
    var audioCtx = soundSettings.audioCtx;
    //ALL time is in SECONDS (not millis)
    const self = this;
    const timeOnLength = 0.05;
    const segmentsPerBatch = 32;
    const A = Math.pow(2, 1 / 12);

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

        count = 0;
        playedCount = 0;
        scheduleTime = 0;
        segmentOffTime = 0;

        startTime = audioCtx.currentTime;
        isRunning = true;

        playAndSchedule(score);
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
            dispatchInstrumentOff(audioCtx.currentTime);
        }
    };

    function playAndSchedule(score) {
        const offset = segmentsPerBatch * score.getSegmentDuration();
        const elapsedTime = audioCtx.currentTime - startTime;
        scheduleSounds(elapsedTime, offset, score);
        fireSegmentEvents(elapsedTime, offset, score);
        dispatch("frameFinished");
        if (isRunning) {
            window.requestAnimationFrame(function () {
                playAndSchedule(score)
            });
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

    function dispatchInstrumentOn(count, score, elapsedTime) {
        if (score.triggersByTime[count] == undefined) {
            return true;
        }
        var stack = score.triggersByTime[count];
        for (var i = 0, l = stack.length; i < l; i++) {
            var name = stack[i].name;
            instrumentListeners[name].on.forEach(function (listener) {
                listener.call(self, count);
            });
            instrumentListeners[name].off.forEach(function (listener) {
                offStack.push({time: elapsedTime + timeOnLength, listener: listener});
            });
        }
    }

    function dispatchInstrumentOff(elapsedTime) {
        offStack = offStack.filter(function (off) {
            //console.log("off.time:" + off.time + "; elapsedTime:" + elapsedTime);
            var crit = off.time <= elapsedTime;
            if (crit) {
                off.listener.call(self);
            }
            return !crit;
        });
    }

    function scheduleSounds(elapsedTime, offset, score) {
        while (scheduleTime < elapsedTime) {
            const nextIndex = playedCount % score.totalSegments;
            const toIndex = nextIndex + segmentsPerBatch;
            const accumulatedOffset = offset + (score.getSegmentDuration() * score.totalSegments * Math.floor(playedCount / score.totalSegments));

            scheduleTriggerBatch(nextIndex, toIndex, accumulatedOffset, score);

            playedCount += segmentsPerBatch;
            scheduleTime += offset;
        }
    }

    function calcNextSegmentTime(offset, count, score) {
        return (count * score.getSegmentDuration()) + offset;
    }

    function fireSegmentEvents(elapsedTime, offset, score) {
        if (offStack.length > 0) {
            dispatchInstrumentOff(elapsedTime);
            segmentOffTime = elapsedTime;
        }

        var nextSegmentTime = calcNextSegmentTime(offset, count, score);
        if (nextSegmentTime < elapsedTime) {
            var pendingNextSegmentTime = calcNextSegmentTime(offset, count + 1, score);
            while (pendingNextSegmentTime < elapsedTime) {
                dispatchInstrumentOn(count % score.totalSegments, score, elapsedTime);
                if (count % soundSettings.segmentsPerBeat == 0) {
                    dispatch("beat", count);
                }
                count++;
                pendingNextSegmentTime = calcNextSegmentTime(offset, count + 1, score);
            }
            dispatch("time", count % score.totalSegments);
            dispatchInstrumentOn(count % score.totalSegments, score, elapsedTime);
        }
    }

    function scheduleTriggerBatch(from, to, offset, score) {
        sourcesToCancel = [];
        for (var i = from; i < to; i++) {
            var instrumentTriggers = score.triggersByTime[i];
            instrumentTriggers.forEach(function (trigger) {
                var instrument = score.instruments[trigger.name];
                var when = startTime + offset + (i * score.getSegmentDuration() );
                if (when > audioCtx.currentTime) {
                    if (!soundSettings.mute) {
                        var oldSource = lastInstrumentSources[trigger.name];
                        if (oldSource) {
                            oldSource.stop(when);
                        }
                        var source = audioCtx.createBufferSource();
                        source.buffer = soundSettings.soundBuffersMap[instrument.src];
                        source.playbackRate.value = Math.pow(A, trigger.rate);
                        source.connect(soundSettings.output);
                        source.start(when);
                        sourcesToCancel.push(source);
                        lastInstrumentSources[trigger.name] = source;
                    }
                }
            });
        }
    }
}
