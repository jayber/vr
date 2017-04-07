var score = [
    {instrument: "kick", src: "audio/kick.WAV", times: ["0:0/4", "0:2/4", "2:0/4", "2:2/4", "3:2/4"]},
    {instrument: "hat", src: "audio/hat.WAV", times: ["1:0/4", "3:0/4"]},
    {instrument: "snare", src: "audio/snare.WAV", times: ["3:1/4", "3:3/4"]},
    {instrument: "bork", src: "audio/blork.wav", times: ["3:0/4"]},
    {instrument: "beep", src: "audio/beep.wav", times: ["3:0/4", "3:1/4", "3:2/4", "3:3/4"]}
];

function ScoreLoader(scheduler, settings) {
    var instrumentCount = 0;
    var beatExp = /(\d*):/;
    var denomExp = /\/(\d*)/;
    var nomExp = /:(\d*)\//;

    function parseTimes(times) {
        var parsedTimes = [];
        times.forEach(function (time) {
            var beat = beatExp.exec(time)[1];
            var denom = denomExp.exec(time)[1];
            var nom = nomExp.exec(time)[1];
            var element = {beat: beat, seg: (settings.segmentsPerBeat / denom) * nom};
            parsedTimes.push(element);
        });
        return parsedTimes;
    }

    function generateMarkers(times, el) {
        var count = instrumentCount++;
        times.forEach(function (time) {
            var angle = (time.beat * (360 / settings.beats)) + (time.seg * (360 / (settings.segmentsPerBeat * settings.beats)));

            var subElement = document.createElement("a-sphere");
            subElement.setAttribute("radius", "0.027");
            var clockFace = document.querySelector('#clock-face');

            var startRad = 0.134;
            var step = 0.05;
            var rad = startRad + (instrumentCount * step);

            var newX = Math.cos(angle * (Math.PI / 180)) * rad;
            var newY = Math.sin(angle * (Math.PI / 180)) * rad;
            subElement.setAttribute("position", newY + " -0.025 " + newX);

            var color = el.getAttribute("material").color;
            subElement.setAttribute("color", color);
            clockFace.appendChild(subElement);

            settings.setFlashing(el, subElement);
        });
    }

    function listenToSchedule(times, instrument) {
        scheduler.addEventListener("time", function (count) {
            var beatTime = settings.convertToBeatTime(count);
            if (times.find(function (element) {
                    return element.beat == beatTime.beatCount && element.seg == beatTime.seg;
                })) {
                instrument.emit('playtime', beatTime);
            }
        });

        scheduler.addEventListener("timeoff", function (count) {
            instrument.emit('playoff');
        });
    }

    score.forEach(function (score) {
        var instrument = document.querySelector("#" + score.instrument);
        var times = parseTimes(score.times);
        generateMarkers(times, instrument);

        settings.registerSound(score.src, times);
        listenToSchedule(times, instrument);
    });
}