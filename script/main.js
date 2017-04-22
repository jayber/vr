function reportException(e) {
    var data;
    altspace.getUser().then(function (user) {
        try {
            if (e.error) {
                data = {userId: user.userId, message: e.error.message, stack: e.error.stack};
            } else if (e.message) {
                data = {userId: user.userId, message: e.message, stack: ""};
            } else {
                e.userId = user.userId;
                data = JSON.stringify(e);
            }
            $.get("error", data);
        } catch (e) {
        }
    });
}

function serverLog(message) {
    altspace.getUser().then(function (user) {
        $.get("log", {userId: user.userId, message: message});
    });
}

window.addEventListener('error', function (e) {
    reportException(e);
});

(function () {
    serverLog("userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var scheduler = new AudioAndAnimationScheduler(soundSettings.audioCtx);
    var events = new EventDispatcher(scoreLoader.loaded);
    var markers = new Markers(soundSettings, events);
    var instruments = new Instruments(scoreLoader.score, soundSettings, markers, scheduler);
    events.init(new LocalTarget(scheduler, soundSettings, instruments.instruments));
    Cockpit(soundSettings);
    Pedestal(events, scheduler, soundSettings, markers);
})();
