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
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var scoreLoader = new ScoreLoader(soundSettings, scheduler);
    var eventDispatcher = new EventDispatcher(scoreLoader.loaded);
    var markers = new Markers(soundSettings, eventDispatcher);
    var instruments = new Instruments(scoreLoader.score, soundSettings, markers, scheduler);
    eventDispatcher.init(new LocalEventTarget(scheduler, soundSettings, instruments.instruments));
    Cockpit(soundSettings);
    Pedestal(eventDispatcher, scheduler, soundSettings, markers);
})();
