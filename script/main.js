var bpm = 60;
var duration = 60000 / bpm;
var noOfSegments = 4;
var beatsPerClock = 4;
var repeats = 4;
var repeatCount = 0;

AFRAME.registerComponent('beat', {
    init: function () {
        var el = this.el;
        var curSeg = 0;
        var count = 0;
        setTimeout(function () {
            var player = setInterval(function () {
                var beatCount = Math.floor(count / noOfSegments);
                if (count % noOfSegments == 0) {
                    el.emit('beat');
                    curSeg = 0;
                }
                el.emit('beat-fraction', {beatCount: beatCount, seg: curSeg++}, false);
                if (beatCount == beatsPerClock) {
                    count = 0;
                    curSeg = 0;
                    repeatCount++;
                }
                if (repeatCount === repeats) {
                    clearInterval(player);
                    console.log("clear");
                }
                count++;
            }, duration / noOfSegments);
        }, 2000);
    }
});

AFRAME.registerComponent('time-listener', {
    schema: {
        src: {type: 'string', default: ''},
        beat: {type: 'array'},
        seg: {type: 'array'}
    },
    init: function () {
        console.log("beat=" + this.data.beat + ";seg=" + this.data.seg);
        var el = this.el;
        var self = this;
        var zip = this.data.beat.map(function (element, index) {
            return [element, self.data.seg[index]];
        });
        var beater = document.querySelector(this.data.src);
        beater.addEventListener("beat-fraction", function (event) {
            if (zip.find(function (element) {
                    return element[0] == event.detail.beatCount && element[1] == event.detail.seg;
                })) {
                el.emit('beat');
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
        /*this.el.addEventListener("beat", function (event) {
            self.beatTime = (new Date()).getTime();
            if (self.curBeat !== undefined && self.curBeat < beatsPerClock - 1) {
                self.curBeat++;
            } else {
                self.curBeat = 0;
            }

         });*/
    },
    tick: function (time, timeDelta) {
        var el = this.el;
        /*if (this.beatTime && repeatCount < repeats) {
            var interval = (new Date()).getTime() - this.beatTime;
            var beatFraction = interval / duration;
            var scaledBeatFraction = beatFraction / beatsPerClock;
            if (beatFraction < 1) {
                var thetaLength = (360 * scaledBeatFraction) + ((360 / beatsPerClock) * this.curBeat);
                el.setAttribute("geometry", "thetaLength", thetaLength);
            }
         }*/
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
