function loadScore(settings) {

    var score = {
        "kick": {src: "audio/kick.WAV", times: ["0:0/4", "0:2/4", "2:0/4", "2:2/4", "3:2/4"]},
        "hat": {src: "audio/hat.WAV", times: ["1:0/4", "3:0/4"]},
        "snare": {src: "audio/snare.WAV", times: ["3:1/4", "3:3/4"]},
        "bork": {src: "audio/blork.wav", times: ["3:0/4"]},
        "beep": {src: "audio/beep.wav", times: ["3:0/4", "3:1/4", "3:2/4", "3:3/4"]}
    };

    var beatExp = /(\d*):/;
    var denomExp = /\/(\d*)/;
    var nomExp = /:(\d*)\//;

    function parseTimes(times) {
        var parsedTimes = [];
        times.forEach(function (time) {
            var beat = beatExp.exec(time)[1];
            var denom = denomExp.exec(time)[1];
            var nom = nomExp.exec(time)[1];
            var seg = (settings.segmentsPerBeat / denom) * nom;
            var element = {beat: beat, seg: seg, count: settings.convertTimeToCount(beat, seg)};
            parsedTimes.push(element);
        });
        return parsedTimes;
    }

    Object.keys(score).forEach(function (key, index) {
        var instrumentPart = score[key];
        instrumentPart.parsedTimes = parseTimes(instrumentPart.times);
    });

    return score;
}