function SoundSettings() {
    var self = this;
    self.segmentsPerBeat = 32;

    self.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var gain = self.audioCtx.createGain();
    gain.connect(self.audioCtx.destination);
    self.output = gain;
    self.soundBuffersMap = {};
    self.mute = false;

    var eventSources = ["audio/satan2.wav", "audio/groot.wav"];

    self.load = function (sources) {
        return new Promise(function (resolve, reject) {
            var completedCount = 0;
            sources.forEach(function (src) {
                var loader = new AudioSampleLoader();
                loader.src = src;
                loader.ctx = self.audioCtx;
                loader.onload = function () {
                    self.soundBuffersMap[src] = loader.response;
                    completedCount++;
                    if (completedCount == sources.length) {
                        resolve("Success");
                    }
                };
                loader.send();
            })
        });
    };

    self.play = function (src) {
        var source = self.audioCtx.createBufferSource();
        source.buffer = self.soundBuffersMap[src];
        source.connect(self.audioCtx.destination);
        source.start();
    };

    self.incrementVol = function () {
        gain.gain.value = gain.gain.value + 0.1;
    };

    self.decrementVol = function () {
        gain.gain.value = gain.gain.value - 0.1;
    };

    self.load(eventSources);
}
