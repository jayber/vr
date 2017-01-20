const bpm = 60;
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
        var currentSegment = count - (beatCount * noOfSegments);
        el.emit('time', {beatCount: beatCount, seg: currentSegment}, false);
        if (count % noOfSegments == 0) {
            el.emit('beat');
        }
    },

    adjustInterval: function (self) {
        var time = Date.now();
        var lastInterval = time - self.lastSegmentTime;
        var adjustedInterval = segmentDuration + segmentDuration - lastInterval;
        self.lastSegmentTime = time;
        self.lastExpectedInterval = adjustedInterval;
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
                console.log("adjusted interval: " + adjustedInterval);
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
            if (zip.find(function (element) {
                    return element[0] == event.detail.beatCount && element[1] == event.detail.seg;
                })) {

                el.emit('play');
            }
        });
    }
});

AFRAME.registerComponent('beat-listener', {
    schema: {
        src: {type: 'string', default: ''}
    },
    init: function () {
        var el = this.el;
        var self = this;
        var beater = document.querySelector(this.data.src);
        beater.addEventListener("beat", function (event) {
            el.emit('beat');
        });
    }
});

AFRAME.registerComponent('animate-theta', {
    init: function () {
        var self = this;
        self.degreesPerBeat = (360 / noOfBeats);
        self.degreesPerMilli = self.degreesPerBeat / beatDuration;
        this.el.addEventListener("beat", function (event) {
            self.beatTime = Date.now();
            if (self.curBeat !== undefined && self.curBeat < noOfBeats - 1) {
                self.curBeat++;
            } else {
                self.curBeat = 0;
            }

        });
    },

    tick: function (time, timeDelta) {
        var el = this.el;
        if (this.beatTime) {
            var interval = Date.now() - this.beatTime;
            var beatFraction = interval / beatDuration;
            if (beatFraction < 1) {
                var thetaLength = (this.degreesPerBeat * beatFraction) + (this.degreesPerBeat * this.curBeat);
                el.setAttribute("geometry", "thetaLength", thetaLength);
            }
        }
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
        /*el.addEventListener(this.data.on, function () {
         setTimeout(function () {
         el.setAttribute('material', 'color', self.data.to);
         }, self.data.delay);
         setTimeout(function () {
         el.setAttribute('material', 'color', self.data.from);
         }, self.data.delay + self.data.dur);
         });*/
    }
});
