(function () {
    serverLog("referrer: " + document.referrer + "; userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    altspace.open(getFullUrl("comment.html"), "_experience", {icon: getFullUrl("img/bugform.png"), hidden: true});

    var blUser = altspace.getUser().then(function (user) {
        return new BLUser(user);
    });

    var sceneLoaded = makeSceneLoadedPromise();
    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var eventDispatcher = new EventDispatcher(scoreLoader, sceneLoaded, blUser);
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var markers = new Markers(eventDispatcher, scoreLoader);
    var instruments = new Instruments(scoreLoader, eventDispatcher, markers);
    var animations = new AnimationManager(scheduler, soundSettings, eventDispatcher, scoreLoader);
    InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler, animations, sceneLoaded);
    PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations, blUser, instruments);
    CockpitComponents(soundSettings, animations);

    eventDispatcher.addEventListener("reload", function (data) {
        scheduler.stop();
        scoreLoader.reload(data.index);
        return scoreLoader.loaded.then(function () {
            instruments.reload();
        })
    });

    eventDispatcher.addEventListener("freeForAllOn", function () {
        blUser.then(function (user) {
            user.setFreeForAll(true);
        });
    });

    eventDispatcher.addEventListener("freeForAllOff", function () {
        blUser.then(function (user) {
            user.setFreeForAll(false);
        });
    });

    eventDispatcher.addEventListener("moderatorAbsent", function () {
        blUser.then(function (user) {
            user.moderatorPresent = false;
        });
    });

    eventDispatcher.addEventListener("moderatorPresent", function () {
        blUser.then(function (user) {
            user.moderatorPresent = true;
        });
    });

    eventDispatcher.addEventListener("clear", function () {
        scoreLoader.score.clear();
        instruments.reload();
    });

    eventDispatcher.addEventListener("doubleUp", function () {
        scoreLoader.score.doubleUp();
        instruments.reload();
    });

    eventDispatcher.addEventListener("incrementBpm", function () {
        scheduler.stop();
        scoreLoader.score.bpm = scoreLoader.score.getDisplayBpm() + 1;
    });

    eventDispatcher.addEventListener("decrementBpm", function () {
        scheduler.stop();
        scoreLoader.score.bpm = scoreLoader.score.getDisplayBpm() - 1;
    });

    eventDispatcher.addEventListener("stop", function () {
        scheduler.stop();
    });

    eventDispatcher.addEventListener("start", function () {
        return scoreLoader.loaded.then(function () {
            scheduler.start(scoreLoader.score);
        });
    });

})();