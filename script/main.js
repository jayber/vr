(function () {
    serverLog("userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    altspace.open(getFullUrl("comment.html"), "_experience", {icon: getFullUrl("img/bugform.png"), hidden: true});

    var sceneLoaded = makeSceneLoadedPromise();
    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var eventDispatcher = new EventDispatcher(scoreLoader, sceneLoaded);
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var instruments = new Instruments(scoreLoader, eventDispatcher);
    var animations = new AnimationManager(scheduler, soundSettings, eventDispatcher, scoreLoader);
    var markers = new Markers(eventDispatcher, scoreLoader);
    InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler, animations, sceneLoaded);
    PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations);
    CockpitComponents(soundSettings, animations);

    eventDispatcher.addEventListener("reload", function (data, resolve) {
        scheduler.stop();
        scoreLoader.reload(data.score);
        instruments.reload();
        scoreLoader.loaded.then(function () {
            resolve("success");
        })
    });

    eventDispatcher.addEventListener("doubleUp", function (data, resolve) {
        scoreLoader.score.doubleUp();
        instruments.reload();
        resolve();
    });

    eventDispatcher.addEventListener("incrementBpm", function (data, resolve) {
        scheduler.stop();
        scoreLoader.score.bpm = scoreLoader.score.bpm + 1;
        resolve();
    });

    eventDispatcher.addEventListener("decrementBpm", function (data, resolve) {
        scheduler.stop();
        scoreLoader.score.bpm = scoreLoader.score.bpm - 1;
        resolve();
    });

    eventDispatcher.addEventListener("stop", function (data, resolve) {
        scheduler.stop();
        resolve();
    });

    eventDispatcher.addEventListener("start", function (data, resolve) {
        scoreLoader.loaded.then(function () {
            scheduler.start(scoreLoader.score);
            resolve();
        });
    });

})();