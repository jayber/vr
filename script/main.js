(function () {
    serverLog("userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    altspace.open(getFullUrl("comment.html"), "_experience", {icon: getFullUrl("img/bugform.png"), hidden: true});

    var blUser = altspace.getUser().then(function (user) {
        return new BLUser(user);
    });

    var sceneLoaded = makeSceneLoadedPromise();
    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var eventDispatcher = new EventDispatcher(scoreLoader, sceneLoaded, blUser);
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var instruments = new Instruments(scoreLoader, eventDispatcher);
    var animations = new AnimationManager(scheduler, soundSettings, eventDispatcher, scoreLoader);
    var markers = new Markers(eventDispatcher, scoreLoader);
    InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler, animations, sceneLoaded);
    PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations, blUser);
    CockpitComponents(soundSettings, animations);

    eventDispatcher.addEventListener("reload", function (data) {
        scheduler.stop();
        scoreLoader.reload(data.index);
        return scoreLoader.loaded.then(function () {
            instruments.reload();
        })
    });

    eventDispatcher.addEventListener("setFreeForAll", function (data) {
        blUser.then(function (user) {
            user.setFreeForAll(data.value)
        });
    });

    eventDispatcher.addEventListener("moderatorAbsent", function () {
        blUser.then(function (user) {
            user.setFreeForAll(true)
        });
    });

    eventDispatcher.addEventListener("moderatorPresent", function () {
        blUser.then(function (user) {
            user.setFreeForAll(false)
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