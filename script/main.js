const bpm = 110;
const beatDuration = 60000 / bpm;
const noOfSegments = 8;
const segmentDuration = beatDuration / noOfSegments;

const noOfBeats = 4;
const noOfRepeats = 4;

AFRAME.registerComponent('beat', {
    logTime: Date.now(),
    count: 0,
    repeatCount: 0,

    logInterval: function (count) {
        var time = Date.now();
        console.log("seg:" + count + " interval - expected:" + this.lastExpectedInterval + "; actual:" + (time - this.logTime));
        this.logTime = time;
    },

    emitEvents: function (el, beatCount, count) {
        var currentSegment = count % noOfSegments;
        el.emit('time', {beatCount: beatCount, seg: currentSegment}, false);
        if (count % noOfSegments == 0) {
            el.emit('beat');
        }
    },

    adjustInterval: function (self) {
        var time = Date.now();
        var lastInterval = time - self.lastSegmentTime;
        var adjustedInterval = lastInterval > segmentDuration ? segmentDuration + segmentDuration - lastInterval : segmentDuration;
        self.lastSegmentTime = time;
        self.lastExpectedInterval = adjustedInterval;
        console.log("adjusted interval: " + adjustedInterval);
        return adjustedInterval;
    },

    timedAction: function (self) {
        return function () {
            var el = self.el;
            var beatCount = Math.floor(self.count / noOfSegments);
            if (beatCount == noOfBeats) {
                self.count = 0;
                beatCount = 0;
                self.repeatCount++;
            }
            if (self.repeatCount == noOfRepeats) {
                console.log("end");
            } else {
                self.emitEvents(el, beatCount, self.count);
                self.logInterval(self.count);
                self.count++;
                var adjustedInterval = self.adjustInterval(self);
                setTimeout(self.timedAction(self), adjustedInterval);
            }
        }
    },

    init: function () {
        var self = this;
        setTimeout(function () {
            self.lastSegmentTime = Date.now();
            self.lastExpectedInterval = segmentDuration;
            var player = setTimeout(self.timedAction(self), segmentDuration);
        }, 4000);
    }
});

AFRAME.registerComponent('time-listener', {
    schema: {
        src: {type: 'string', default: ''},
        beat: {type: 'array'},
        seg: {type: 'array'}
    },

    init: function () {
        var el = this.el;
        var self = this;
        var zip = this.data.beat.map(function (element, index) {
            return [element, self.data.seg[index]];
        });
        var beater = document.querySelector(this.data.src);
        beater.addEventListener("time", function (event) {
            if (zip.length == 0) {
                el.emit('play');
            } else if (zip.find(function (element) {
                    return element[0] == event.detail.beatCount && element[1] == event.detail.seg;
                })) {
                el.emit('play');
            }
        });
    }
});

AFRAME.registerComponent('bpm-label', {
    init: function () {
        var el = this.el;
        el.setAttribute("n-text", {text: bpm + " BPM", fontSize: "1pt"});
    }
});

AFRAME.registerComponent('beat-listener', {
    schema: {
        src: {type: 'string', default: ''}
    },
    init: function () {
        var el = this.el;
        var beater = document.querySelector(this.data.src);
        beater.addEventListener("beat", function (event) {
            el.emit('beat');
        });
    }
});

AFRAME.registerComponent('animate-theta', {
    init: function () {
        var self = this;
        var el = this.el;
        self.degreesPerBeat = (360 / noOfBeats);
        self.degreesPerMilli = self.degreesPerBeat / beatDuration;
        el.addEventListener("beat", function (event) {
            self.lastBeatTime = Date.now();
            if (self.currentBeat !== undefined && self.currentBeat < noOfBeats - 1) {
                self.currentBeat++;
            } else {
                self.currentBeat = 0;
            }

        });
        el.addEventListener("play", function (event) {
            var now = Date.now();
            var currentDegrees = (self.degreesPerBeat * self.currentBeat) + ((now - self.lastBeatTime) * self.degreesPerMilli);
            if (currentDegrees <= 360) {
                el.setAttribute("geometry", "thetaLength", currentDegrees);
            }
        });
    }
});

AFRAME.registerComponent('flash', {
    schema: {
        on: {type: 'string', default: ''},
        from: {type: 'string', default: ''},
        delay: {type: 'number', default: ''},
        dur: {type: 'number', default: ''},
        to: {type: 'string', default: ''}
    },
    init: function () {
        var el = this.el;
        var self = this;
        el.addEventListener(this.data.on, function () {
            setTimeout(function () {
                el.setAttribute('material', 'color', self.data.to);
            }, self.data.delay);
            setTimeout(function () {
                el.setAttribute('material', 'color', self.data.from);
            }, self.data.delay + self.data.dur);
        });
    }
});
