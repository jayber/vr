function Scheduler() {

    this.count = 0;
    this.repeatCount = 0;
    var self = this;

    self.start = function (segmentDuration, noOfSegments, noOfBeats, noOfRepeats, beatDuration, el) {
        self.el = el;
        self.count = 0;
        self.repeatCount = 0;

        self.soundsByTimes = self.indexSoundsByTime(noOfBeats, noOfSegments, self.soundList);

        self.play(self.soundsByTimes[0][0]);
        setTimeout(self.getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats, self.soundsByTimes), segmentDuration);
    };

    self.emitEvents = function (beatCount, count, noOfSegments, now) {
        var currentSegment = count % noOfSegments;

        self.el.emit('time', {beatCount: beatCount, seg: currentSegment, now: now});

    };

    self.getTimedFunction = function (segmentDuration, noOfSegments, noOfBeats, noOfRepeats, soundTimes) {
        return function () {
            var beatCount = Math.floor(self.count / noOfSegments);
            if (beatCount == noOfBeats) {
                self.count = 0;
                beatCount = 0;
                self.repeatCount++;
            }
            if (self.repeatCount == noOfRepeats) {
                //clearInterval(player);
                //close();
            } else {
                var now = Date.now();

                var nextCount = self.count + 1;
                var nextBeat = 0;
                var nextSegment = 0;
                if (nextCount < noOfSegments * noOfBeats) {
                    nextBeat = Math.floor(nextCount / noOfSegments);
                    nextSegment = nextCount % noOfSegments;
                }

                if (!(nextCount == noOfSegments * noOfBeats && self.repeatCount == noOfRepeats - 1)) {
                    self.play(soundTimes[nextBeat][nextSegment]);
                }

                self.emitEvents(beatCount, self.count, noOfSegments, now);
                self.count++;
                setTimeout(self.getTimedFunction(segmentDuration, noOfSegments, noOfBeats, noOfRepeats, soundTimes), segmentDuration);
            }
        }
    };

    self.play = function (sounds) {
        if (sounds.length > 0) {
            sounds.forEach(function (soundName) {
                var source = audioCtx.createBufferSource();
                source.buffer = soundBuffersMap[soundName];
                source.connect(audioCtx.destination);
                source.start();
            });
        }
    };

    self.indexSoundsByTime = function (noOfBeats, noOfSegments, soundList) {
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
    };

    self.registerSound = function (src, times) {
        if (self.soundList == undefined) {
            self.soundList = [{name: src, times: times}];
        } else {
            self.soundList.push({name: src, times: times});
        }
    };
}