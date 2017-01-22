const bpm = 110;
const beatDuration = 60000 / bpm;
const noOfSegments = 32;
const segmentDuration = beatDuration / noOfSegments;

const noOfBeats = 4;
const noOfRepeats = 4;

AFRAME.registerComponent('beat', {
    init: function () {
        var self = this;
        setTimeout(function () {
            var worker = new Worker('/script/worker.js');
            worker.onmessage = function (event) {
                var eventName = event.data.name;
                self.el.emit(eventName, event.data.data);
            };
            worker.postMessage([segmentDuration, noOfSegments, noOfBeats, noOfRepeats]);

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
