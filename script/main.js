function reportException(e) {
    var data;
    altspace.getUser().then(function (user) {
        try {
            if (e.error) {
                data = {userId: user.userId + ":" + user.displayName, message: e.error.message, stack: e.error.stack};
            } else if (e.message) {
                data = {userId: user.userId + ":" + user.displayName, message: e.message, stack: ""};
            } else {
                e.userId = user.userId + "-" + user.displayName;
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
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var instruments = new Instruments(scoreLoader);
    var eventDispatcher = new EventDispatcher(scheduler, instruments, scoreLoader);
    var markers = new Markers(eventDispatcher, scoreLoader);
    InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler);
    PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader);
    CockpitComponents(soundSettings);
})();
