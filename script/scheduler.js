function Scheduler() {

    var self = this;

    self.start = function (segmentDuration, totalNoOfSegments, noOfRepeats, noOfSegments, el) {
        self.el = el;
        self.count = 0;
        self.repeatCount = 0;
        self.segmentDuration = segmentDuration;
        self.noOfRepeats = noOfRepeats;

        self.soundsByTimes = self.indexSoundsBySegment(totalNoOfSegments, self.soundList);

        self.startTime = audioCtx.currentTime * 1000;

        window.requestAnimationFrame(function () {
            self.playCurrent(totalNoOfSegments, noOfSegments)
        });
    };

    self.playCurrent = function (totalNoOfSegments, noOfSegments) {
        var critTime = (self.count * self.segmentDuration) + (self.repeatCount * totalNoOfSegments * self.segmentDuration);
        var elapsedTime = (audioCtx.currentTime * 1000) - self.startTime;

        if (critTime < elapsedTime) {
            console.log("playCurrent - critTime: " + critTime + "; elapsedTime: " + Math.floor(elapsedTime));
            self.emitEvents(self.count, noOfSegments);
            self.play(self.soundsByTimes[self.count]);
            self.count++;
        }

        if (self.count < totalNoOfSegments) {
            window.requestAnimationFrame(function () {
                self.playCurrent(totalNoOfSegments, noOfSegments)
            });
        } else if (self.repeatCount < self.noOfRepeats - 1) {
            self.count = 0;
            self.repeatCount++;
            window.requestAnimationFrame(function () {
                self.playCurrent(totalNoOfSegments, noOfSegments)
            });
        }
    };

    self.indexSoundsBySegment = function (totalNoOfSegments, soundList) {
        var soundsByTimes = [totalNoOfSegments];
        for (var i = 0; i < totalNoOfSegments; i++) {
            soundsByTimes[i] = [];
        }

        soundList.forEach(function (element) {
            element.times.forEach(function (time) {
                var index = ((Number(time[0]) * noOfSegments) + Number(time[1]));
                soundsByTimes[index].push(element.name);
            });
        });
        return soundsByTimes;
    };

    self.emitEvents = function (count, noOfSegments) {
        var currentSegment = count % noOfSegments;
        var beatCount = Math.floor(count / noOfSegments);

        self.el.emit('time', {beatCount: beatCount, seg: currentSegment});
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

    self.registerSound = function (src, times) {
        if (self.soundList == undefined) {
            self.soundList = [{name: src, times: times}];
        } else {
            self.soundList.push({name: src, times: times});
        }
    };
}