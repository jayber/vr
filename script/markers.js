function Markers(eventDispatcher, scoreLoader) {
    const startRadius = 0.175;
    const radiusStep = 0.05;
    const pitchStep = 0.03;
    const MAX_RATE = 47;
    const MIN_RATE = -48;
    this.startRadius = startRadius;
    this.radiusStep = radiusStep;

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


    function createStick(markerPos) {
        var start = new THREE.Vector3(0, 0, 0);
        var finish = new THREE.Vector3(0, 0 - markerPos, 0);
        var geometry = new THREE.TubeGeometry(new THREE.LineCurve3(start, finish), 1, 0.001, 4, false);

        var tube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({}));
        return tube;
    }

    this.createStickElement = function (markerElement, markerPos, instrument, markerId) {
        var tube = createStick(markerPos.y);
        var stick = document.createElement("a-entity");
        stick.setAttribute("class", "stick");
        stick.setAttribute("id", "stick" + markerId);
        stick.setObject3D("mesh", tube);
        markerElement.appendChild(stick);

        stick.setAttribute('material', {color: instrument.color});
        stick.setAttribute("altspace-cursor-collider", "enabled", "false");
        instrument.flash(stick);
    };

    this.createPitchBoard = function (parent, instrument, count) {
        var element = document.querySelector(".billboard");
        if (element) {
            element.parentNode.removeChild(element);
        }

        var board = document.createElement("a-plane");
        board.setAttribute("n-billboard", "");
        board.setAttribute("class", "billboard");
        board.setAttribute("height", "0.07");
        board.setAttribute("width", "0.15");
        board.setAttribute("material", "src:#pitch");
        var position = setYFromWorld(parent, 0.07);
        board.setAttribute("position", position.x + " " + position.y + " " + position.z);
        board.setAttribute("transparent", "true");
        board.setAttribute("n-mesh-collider", "convex:false");
        board.setAttribute("altspace-cursor-collider", "enabled:true");

        board.addEventListener("click", function (event) {
            var point = event.detail.point;
            board.object3D.worldToLocal(point);
            if (point.z < -0.04 && point.z > -0.07) {
                if (scoreLoader.score.getTrigger(count, instrument.data).rate < MAX_RATE) {
                    eventDispatcher.pitchUp(instrument.instrumentIndex, count);
                }
            } else if (point.z > 0.04 && point.z < 0.07) {
                if (scoreLoader.score.getTrigger(count, instrument.data).rate > MIN_RATE) {
                    eventDispatcher.pitchDown(instrument.instrumentIndex, count);
                }
            }
            event.handled = true;
        });
        parent.appendChild(board);
    };

    function showOctaveRiser(markerElement, octaves) {

        var board = document.createElement("a-plane");
        board.setAttribute("n-billboard", "");
        var plusSign = octaves > 0 ? "+" : "";
        var textWidth = octaves > 1 ? "0.42" : octaves == 1 ? "0.4" : octaves == 0 ? "0.3" : "0.35";
        board.setAttribute("n-text", "width:" + textWidth + ";height:1;horizontalAlign:left;fontSize:1pt;text:" + plusSign + octaves);
        board.setAttribute("class", "billboard");
        board.setAttribute("height", "0.22");
        board.setAttribute("width", "0.38");
        board.setAttribute("scale", "0.35 0.35 0.35");
        var text = Math.abs(octaves) == 1 ? "octave" : "octaves";
        board.setAttribute("material", "src:#" + text);
        var position = setYFromWorld(markerElement, 0.1);
        board.setAttribute("position", position.x + " " + position.y + " " + position.z);
        board.setAttribute("transparent", "true");
        board.setAttribute("altspace-cursor-collider", "enabled:false");

        var animation = document.createElement("a-animation");
        animation.setAttribute("attribute", "position");
        animation.setAttribute("dur", "4000");
        animation.setAttribute("to", "1 2 0");

        board.appendChild(animation);
        markerElement.appendChild(board);
        setTimeout(function () {
            markerElement.removeChild(board);
        }, 5000);
    }

    function setYFromWorld(markerElement, y) {
        var position = markerElement.object3D.getWorldPosition();
        position.y += y;
        position = markerElement.object3D.worldToLocal(position);
        return position;
    }

    function updateOctaveBars(markerElement, octaves) {
        //var elements = markerElement.querySelectorAll(".bar");
        $(".bar", markerElement).each(function (index, element) {
            element.parentNode.removeChild(element);
        });
        var noOfBars = Math.abs(octaves);
        for (var i = 0; i < noOfBars; i++) {
            var bar = document.createElement("a-plane");
            bar.setAttribute("class", "bar");
            bar.setAttribute("height", "0.0015");
            bar.setAttribute("width", "0.05");
            bar.setAttribute("side", "double");
            bar.setAttribute("rotation", "45 90 0");
            var y = 0.0325 + (i * 0.0078);
            y = octaves > 0 ? y * -1 : y;
            var position = setYFromWorld(markerElement, y);
            bar.setAttribute("position", position.x + " " + position.y + " " + position.z);
            markerElement.appendChild(bar);
        }
    }

    this.pitchElement = function (markerElement, pitch, baseColor, isUp) {
        var displacement = pitch % 12;
        if (displacement < 0) {
            displacement = 12 + displacement
        }
        var pos = displacement * pitchStep;

        var octaves = Math.floor(pitch / 12);
        if ((isUp && (displacement == 0)) || (!isUp && (displacement == 11))) {
            showOctaveRiser(markerElement, octaves);
            updateOctaveBars(markerElement, octaves);
        }
        markerElement.object3D.position.y = pos;
        $(markerElement).children(".stick").each(function (index, stick) {
            var tube = createStick(pos);
            tube.material.color = new THREE.Color(baseColor);
            stick.setObject3D("mesh", tube);
        })
    };

    this.marker = function (count, instrument, trigger) {
        var angle = count * (2 * Math.PI / scoreLoader.score.totalSegments);
        var radius = startRadius + (instrument.instrumentIndex * radiusStep);
        var newX = Math.cos(angle) * radius;
        var newY = Math.sin(angle) * radius;

        var subElement = document.createElement("a-sphere");

        var subElementId = instrument.data + count;
        var displacement = (trigger.rate % 12) * pitchStep;

        subElement.setAttribute("id", subElementId);
        subElement.setAttribute("class", instrument.data);
        subElement.setAttribute("radius", "0.027");
        subElement.setAttribute("position", newX + " " + displacement + " " + newY);
        subElement.setAttribute("buffer", false);
        subElement.setAttribute("skipCache", true);
        subElement.setAttribute("mergeTo", "." + instrument.data);
        subElement.setAttribute("segments-height", "6");
        subElement.setAttribute("segments-width", "10");

        instrument.flash(subElement);

        var clockFace = document.querySelector('#clock-face');
        clockFace.appendChild(subElement);
        subElement.setAttribute("material", "src", "#noise-texture");

        var octaves = Math.floor(trigger.rate / 12);
        subElement.setAttribute("color", instrument.color);

        this.createStickElement(subElement, new THREE.Vector3(newX, displacement, newY), instrument, subElementId);

        subElement.addEventListener("click", function (event) {
            if (!event.handled) {
                eventDispatcher.removePlayTrigger(instrument.instrumentIndex, count, subElementId);
                event.handled = true;
            }
        });
        return subElement
    }
}
