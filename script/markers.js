function Markers(eventDispatcher, scoreLoader) {
    const startRadius = 0.175;
    const radiusStep = 0.05;
    const pitchStep = 0.03;
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

    this.createBillboard = function (parent, instrumentIndex, count) {
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
        board.setAttribute("position", "0.025 0.1 0");
        board.setAttribute("transparent", "true");
        board.setAttribute("n-mesh-collider", "convex:false");
        board.setAttribute("altspace-cursor-collider", "enabled:true");

        var self = this;
        board.addEventListener("click", function (event) {
            var point = event.detail.point;
            board.object3D.worldToLocal(point);
            if (point.z < -0.04 && point.z > -0.06) {
                eventDispatcher.pitchUp(instrumentIndex, count);
            } else if (point.z > 0.04 && point.z < 0.06) {
                eventDispatcher.pitchDown(instrumentIndex, count);
            }
            event.handled = true;
        });
        parent.appendChild(board);
    };

    this.pitchElement = function (markerElement, pitch) {
        var pos = pitch * pitchStep;
        markerElement.object3D.position.y = pos;
        $(markerElement).children(".stick").each(function (index, stick) {
            var tube = createStick(pos);
            tube.material.color = markerElement.object3DMap["mesh"].material.color;
            stick.setObject3D("mesh", tube);
        })
    };

    this.marker = function (count, instrument) {
        var angle = count * (2 * Math.PI / scoreLoader.score.totalSegments);
        var radius = startRadius + (instrument.instrumentIndex * radiusStep);
        var newX = Math.cos(angle) * radius;
        var newY = Math.sin(angle) * radius;

        var subElement = document.createElement("a-sphere");

        var subElementId = instrument.data + count;
        var displacement = 0;

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
