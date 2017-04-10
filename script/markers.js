function Markers(soundSettings) {
    var startRadius = 0.175;
    var radiusStep = 0.05;

    this.toInstrumentAndCount = function (x, y) {
        var radius = Math.sqrt((x * x) + (y * y));
        var instCount = (radius - startRadius) / radiusStep;

        var angle = Math.atan2(y, x);
        if (angle < 0) {
            angle = (2 * Math.PI) - Math.abs(angle)
        }

        var count = (angle / (2 * Math.PI / soundSettings.totalSegments)) % soundSettings.totalSegments;

        return {instrumentNumber: Math.round(instCount), count: Math.round(count)};
    };

    this.marker = function (count, instrument, instrumentIndex) {
        var angle = count * (2 * Math.PI / soundSettings.totalSegments);
        var radius = startRadius + (instrumentIndex * radiusStep);
        var newX = Math.cos(angle) * radius;
        var newY = Math.sin(angle) * radius;

        var subElement = document.createElement("a-sphere");
        subElement.setAttribute("radius", "0.027");
        subElement.setAttribute("position", newX + " 0.025 " + newY);

        instrument.flash(instrument.el, subElement);

        var clockFace = document.querySelector('#clock-face');
        clockFace.appendChild(subElement);
        subElement.setAttribute("material", "src", "#noise-texture");
        subElement.setAttribute("color", instrument.color);

        subElement.addEventListener("click", function (event) {
            console.log("remove");
            clockFace.removeChild(subElement);
            instrument.removeTime(count);
            event.hasRemoved = true;
        });
    }
}