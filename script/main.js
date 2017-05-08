(function () {
    serverLog("userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    altspace.open(getFullUrl("comment.html"), "_experience", {icon: getFullUrl("img/bugform.png"), hidden: true});

    var sceneLoaded = makeSceneLoadedPromise();
    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var eventDispatcher = new EventDispatcher(scoreLoader, sceneLoaded);
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var instruments = new Instruments(scoreLoader, eventDispatcher);
    var animations = new AnimationManager(scheduler, soundSettings, eventDispatcher);
    var markers = new Markers(eventDispatcher, scoreLoader);
    InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler, animations, sceneLoaded);
    PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations, instruments);
    CockpitComponents(soundSettings, animations);

    eventDispatcher.addEventListener("reload", function () {
        scheduler.stop();
        scoreLoader.reload();
        instruments.reload();
    });

    eventDispatcher.addEventListener("doubleUp", function () {
        scoreLoader.score.doubleUp();
        instruments.reload();
    });

    eventDispatcher.addEventListener("incrementBpm", function () {
        scheduler.stop();
        scoreLoader.score.bpm = scoreLoader.score.bpm + 1;
    });

    eventDispatcher.addEventListener("decrementBpm", function () {
        scheduler.stop();
        scoreLoader.score.bpm = scoreLoader.score.bpm - 1;
    });

    eventDispatcher.addEventListener("stop", function () {
        scheduler.stop();
    });

    eventDispatcher.addEventListener("start", function () {
        scheduler.start(scoreLoader.score);
    });

})();