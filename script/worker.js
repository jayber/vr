var logTime = Date.now();
var count = 0;
var repeatCount = 0;
var lastSegmentTime;

var player;

var soundTimes;

var soundList;

function logInterval(count) {
    var time = Date.now();
    postMessage({
        name: 'log',
        message: "seg:" + count + " interval - expected:" + lastExpectedInterval + "; actual:" + (time - logTime)
    });
    logTime = time;
}

function emitEvents(beatCount, count, noOfSegments, now) {
    var currentSegment = count % noOfSegments;
    postMessage({name: 'time', data: {beatCount: beatCount, seg: currentSegment, now: now}});

}

function adjustInterval(segmentDuration, time) {
    var lastInterval = time - lastSegmentTime;
    var adjustedInterval = lastInterval > segmentDuration ? segmentDuration + segmentDuration - lastInterval : segmentDuration;
    lastSegmentTime = time;
    lastExpectedInterval = adjustedInterval;
    //console.log("adjusted interval: " + adjustedInterval);
    return adjustedInterval;
}

function getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats, soundTimes) {
    return function () {
        var beatCount = Math.floor(count / noOfSegments);
        if (beatCount == noOfBeats) {
            count = 0;
            beatCount = 0;
            repeatCount++;
        }
        if (repeatCount == noOfRepeats) {
            //clearInterval(player);
            close();
        } else {
            var now = Date.now();

            var nextCount = count + 1;
            if (nextCount < noOfSegments * noOfBeats) {
                var nextBeat = Math.floor(nextCount / noOfSegments);
                var nextSegment = nextCount % noOfSegments;
                schedule(soundTimes[nextBeat][nextSegment], segmentDuration);
            }

            emitEvents(beatCount, count, noOfSegments, now);
            //logInterval(count);
            count++;
            var adjustedInterval = adjustInterval(segmentDuration, now);
            setTimeout(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats, soundTimes), adjustedInterval);
        }
    }
}

onmessage = function (event) {
    var payload = event.data;
    switch (payload.name) {
        case "start":
            lastSegmentTime = Date.now();
            var segmentDuration = payload.data[0];
            var noOfSegments = payload.data[1];
            var noOfBeats = payload.data[2];
            var noOfRepeats = payload.data[3];
            lastExpectedInterval = segmentDuration;
            //player = setInterval(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats), segmentDuration);

            if (soundTimes == undefined) {
                soundTimes = [noOfBeats];
                for (var i = 0; i < noOfBeats; i++) {
                    soundTimes[i] = [noOfSegments];
                    for (var j = 0; j < noOfSegments; j++) {
                        soundTimes[i][j] = [];
                    }
                }
                soundList.forEach(function (element) {
                    element.times.forEach(function (time) {
                        soundTimes[time[0]][time[1]].push(element.name);
                    });
                });
            }

            schedule(soundTimes[0][0], segmentDuration);
            setTimeout(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats, soundTimes), segmentDuration);
            break;
        case "register-sound":
            if (soundList == undefined) {
                soundList = [{name: payload.src, times: payload.times}];
            } else {
                soundList.push({name: payload.src, times: payload.times});
            }

            break;
    }
};

function schedule(sounds, when) {
    if (sounds.length > 0) {
        postMessage({name: 'schedule', sounds: sounds, when: when});
    }
}