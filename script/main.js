(function () {
    serverLog("userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    altspace.open(getFullUrl("comment.html"), "_experience", {icon: getFullUrl("img/bugform.png"), hidden: true});

    var sceneLoaded = makeSceneLoadedPromise();
    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var eventDispatcher = new EventDispatcher(scoreLoader, sceneLoaded);
    var instruments = new Instruments(scoreLoader, eventDispatcher);
    var animations = new AnimationManager(scheduler, soundSettings, eventDispatcher);
    var markers = new Markers(eventDispatcher, scoreLoader);
    InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler, animations, sceneLoaded);
    PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations, instruments);
    CockpitComponents(soundSettings, animations);
})();