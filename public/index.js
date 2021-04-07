const socket = io();
const current_url = window.location.href;

socket.on("connect", () => {
  console.log("Connected to Server");

  const game = (url) => {
    let QRCodeElement;

    const createQR = () => {
      QRCodeElement = document.createElement("div");
      QRCodeElement.id = "qr-code";
      document.body.appendChild(QRCodeElement);
      QRCodeElement = document.getElementById("qr-code");

      const QRcode = new QRCode("qr-code");
      const qrurl = `${url}?id=${socket.id}`;
      QRcode.makeCode(qrurl);
    };

    const gameConnected = () => {
      createQR();
      socket.removeListener("game connected", gameConnected);
    };

    socket.emit("game connect");

    socket.on("game connected", gameConnected);
  };

  const controller = (gameId) => {
    socket.emit("controller connect", gameId);

    socket.on("controller connected", (connected) => {
      if (connected) {
        alert("Controller Successfully Connected!");

        const controllerState = {
          accelerate: false,
          rotation: {
            gamma: 0,
            beta: 0,
            alpha: 0,
          },
          orientation: {
            absolute: 0,
            gamma: 0,
            beta: 0,
            alpha: 0,
          },
          acceleration: {
            x: 0,
            y: 0,
            z: 0,
          },
          steer: 0,
        };

        const emitUpdates = () => {
          socket.emit("controller state change", controllerState);
        };

        const touchStart = (e) => {
          e.preventDefault();
          controllerState.accelerate = true;
          emiteUpdates();
        };

        const touchEnd = (e) => {
          e.preventDefault();
          controllerState.accelerate = false;
          emitUpdates();
        };

        const deviceMotion = (e) => {
          controllerState.steer = e.accelerationIncludingGravity.y / 100;
          controllerState.acceleration.x = e.acceleration.x;
          controllerState.acceleration.y = e.acceleration.y;
          controllerState.acceleration.z = e.acceleration.z;
          controllerState.rotation.gamma = e.rotationRate.gamma;
          controllerState.rotation.beta = e.rotationRate.beta;
          controllerState.rotation.alpha = e.rotationRate.alpha;
          emiteUpdates();
        };

        const deviceOrientation = (e) => {
          controllerState.orientation.absolute = e.absolute;
          controllerState.orientation.gamma = e.gamma;
          controllerState.orientation.beta = e.beta;
          controllerState.orientation.alpha = e.alpha;
        };

        document.body.addEventListener("touchstart", touchStart, false); // iOS & Android
        document.body.addEventListener("MSPointerDown", touchStart, false); // Windows Phone
        document.body.addEventListener("touchend", touchEnd, false); // iOS & Android
        document.body.addEventListener("MSPointerUp", touchEnd, false); // Windows Phone
        window.addEventListener("devicemotion", deviceMotion, false);
        window.addEventListener("deviceorientation", deviceOrientation, false);
      } else {
        alert("Unable to connect controller");
      }
    });
  };

  if (current_url.indexOf("?id=") > 0) {
    controller(current_url.split("?id=")[1]);
  } else {
    game(current_url);
  }
});
