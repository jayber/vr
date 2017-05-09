function Markers(events, scoreLoader) {
    const startRadius = 0.175;
    const radiusStep = 0.05;

    this.toInstrumentAndCount = function (x, y) {
        var radius = Math.sqrt((x * x) + (y * y));
        var instCount = (radius - startRadius) / radiusStep;
        //console.log("x: " + x + ";y: " + y);

        var angle = Math.atan2(y, x);
        //this fixes minus values produced over 180d
        if (angle < 0) {
            angle = (2 * Math.PI) + angle;
        }

        var count = (angle / (2 * Math.PI / (scoreLoader.score.totalSegments - 1)) % scoreLoader.score.totalSegments);

        var result = {instrumentNumber: Math.round(instCount), count: Math.round(count)};
        //console.log(result);
        return result;
    };

    this.marker = function (count, instrument) {
        var angle = count * (2 * Math.PI / scoreLoader.score.totalSegments);
        var radius = startRadius + (instrument.instrumentIndex * radiusStep);
        var newX = Math.cos(angle) * radius;
        var newY = Math.sin(angle) * radius;

        var subElement = document.createElement("a-sphere");

        var subElementId = instrument.data + count;

        subElement.setAttribute("id", subElementId);
        subElement.setAttribute("class", instrument.data);
        subElement.setAttribute("radius", "0.027");
        subElement.setAttribute("position", newX + " 0.025 " + newY);
        subElement.setAttribute("buffer", false);
        subElement.setAttribute("skipCache", true);
        subElement.setAttribute("mergeTo", "." + instrument.data);

        instrument.flash(subElement);

        var clockFace = document.querySelector('#clock-face');
        clockFace.appendChild(subElement);
        subElement.setAttribute("material", "src", "#noise-texture");
        subElement.setAttribute("color", instrument.color);

        subElement.addEventListener("click", function (event) {
            events.removePlayTrigger(instrument.instrumentIndex, count, subElementId);
            event.handled = true;
        });
        return subElement
    }
}
