var logTime = Date.now();
var count = 0;
var repeatCount = 0;
var lastSegmentTime;

var player;

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

function getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats) {
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
            emitEvents(beatCount, count, noOfSegments, now);
            //logInterval(count);
            count++;
            var adjustedInterval = adjustInterval(segmentDuration, now);
            setTimeout(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats), adjustedInterval);
        }
    }
}

onmessage = function (event) {
    lastSegmentTime = Date.now();
    var segmentDuration = event.data[0];
    var noOfSegments = event.data[1];
    var noOfBeats = event.data[2];
    var noOfRepeats = event.data[3];
    lastExpectedInterval = segmentDuration;
    //player = setInterval(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats), segmentDuration);
    setTimeout(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats), segmentDuration);
};