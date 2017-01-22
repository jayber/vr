var logTime = Date.now();
var count = 0;
var repeatCount = 0;
var lastSegmentTime;

function logInterval(count) {
    var time = Date.now();
    console.log("seg:" + count + " interval - expected:" + lastExpectedInterval + "; actual:" + (time - logTime));
    logTime = time;
}

function emitEvents(beatCount, count, noOfSegments) {
    var currentSegment = count % noOfSegments;
    postMessage({name: 'time', data: {beatCount: beatCount, seg: currentSegment}});
    if (count % noOfSegments == 0) {
        postMessage({name: 'beat', data: {}});
    }
}

function adjustInterval(segmentDuration) {
    var time = Date.now();
    var lastInterval = time - lastSegmentTime;
    var adjustedInterval = segmentDuration + segmentDuration - lastInterval;
    lastSegmentTime = time;
    lastExpectedInterval = adjustedInterval;
    console.log("adjusted interval: " + adjustedInterval);
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
            close();
        } else {
            emitEvents(beatCount, count, noOfSegments);
            logInterval(count);
            count++;
            var adjustedInterval = adjustInterval(segmentDuration);
            setTimeout(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats), adjustedInterval);
        }
    }
}

onmessage = function (event) {
    console.log("Worker.onmesage");
    lastSegmentTime = Date.now();
    var segmentDuration = event.data[0];
    var noOfSegments = event.data[1];
    var noOfBeats = event.data[2];
    var noOfRepeats = event.data[3];
    lastExpectedInterval = segmentDuration;
    setTimeout(getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats), segmentDuration);
};