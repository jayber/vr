var logTime = Date.now();
var count = 0;
var repeatCount = 0;
var lastSegmentTime;

var player;
var soundsByTimes;
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
            //close();
        } else {
            var now = Date.now();

            var nextCount = count + 1;
            var nextBeat = 0;
            var nextSegment = 0;
            if (nextCount < noOfSegments * noOfBeats) {
                nextBeat = Math.floor(nextCount / noOfSegments);
                nextSegment = nextCount % noOfSegments;
            }

            if (!(nextCount == noOfSegments * noOfBeats && repeatCount == noOfRepeats - 1)) {
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

function schedule(sounds, when) {
    if (sounds.length > 0) {
        postMessage({name: 'schedule', sounds: sounds, when: when});
    }
}

function indexSoundsByTime(noOfBeats, noOfSegments, soundList) {
    var soundsByTimes = [noOfBeats];
    for (var i = 0; i < noOfBeats; i++) {
        soundsByTimes[i] = [noOfSegments];
        for (var j = 0; j < noOfSegments; j++) {
            soundsByTimes[i][j] = [];
        }
    }
    soundList.forEach(function (element) {
        element.times.forEach(function (time) {
            soundsByTimes[time[0]][time[1]].push(element.name);
        });
    });
    return soundsByTimes;
}

onmessage = function (event) {
    var payload = event.data;
    switch (payload.name) {
        case "start":
            count = 0;
            repeatCount = 0;
            lastSegmentTime = Date.now();
            var segmentDuration = payload.data[0];
            var noOfSegments = payload.data[1];
            var noOfBeats = payload.data[2];
            var noOfRepeats = payload.data[3];
            var beatDuration = payload.data[4];
            lastExpectedInterval = segmentDuration;
            //player = setInterval(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats), segmentDuration);

            soundsByTimes = indexSoundsByTime(noOfBeats, noOfSegments, soundList);

            schedule(soundsByTimes[0][0], segmentDuration, beatDuration);
            setTimeout(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats, soundsByTimes), segmentDuration);
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