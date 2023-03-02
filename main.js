let scene, camera, renderer, cube, xrButton;

// Создаем сцену, камеру и рендерер
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Создаем куб
const geometry = new THREE.BoxGeometry(1, 1, 1);
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("texture.jpg");
const material = [
  new THREE.MeshBasicMaterial({ map: texture }),
  new THREE.MeshBasicMaterial({ map: texture }),
  new THREE.MeshBasicMaterial({ map: texture }),
  new THREE.MeshBasicMaterial({ map: texture }),
  new THREE.MeshBasicMaterial({ map: texture }),
  new THREE.MeshBasicMaterial({ map: texture }),
];
cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Настраиваем позиционирование и поворот куба в AR
let anchor = null;
let hitTestSource = null;

function setupXR() {
  navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
    // if (supported) {
      xrButton = document.getElementById('arButton');
      console.log('xrButton: ', xrButton);
      document.body.appendChild(xrButton);

      xrButton.addEventListener("click", () => {
        console.log('123');
        navigator.xr
          .requestSession("immersive-ar", { requiredFeatures: ["hit-test"] })
          .then((session) => {
            // xrButton.style.display = "none";

            session.addEventListener("end", () => {
            //   xrButton.style.display = "block";
              if (anchor !== null) {
                anchor.detach();
              }
              if (hitTestSource !== null) {
                hitTestSource.cancel();
                hitTestSource = null;
              }
            });

            const xrRenderer = new THREE.WebXRRenderer({ alpha: true });
            xrRenderer.setSize(window.innerWidth, window.innerHeight);
            xrRenderer.setClearColor(new THREE.Color("black"), 0);

            // Добавляем куб в AR сцену
            session.addEventListener("select", () => {
              cube.visible = false;
              session.add(anchor);
              anchor = null;
            });

            // Обновляем anchor при перемещении устройства
            session.addEventListener("inputsourceschange", (event) => {
              const inputSources = event.session.inputSources;
              let found = false;
              for (let i = 0; i < inputSources.length; i++) {
                if (
                  inputSources[i].targetRayMode === "tracked-pointer" &&
                  inputSources[i].hand === "none"
                ) {
                  found = true;
                  if (hitTestSource === null) {
                    hitTestSource = session.requestHitTestSource({
                      space: inputSources[i].targetRaySpace,
                    });
                  }
                }
              }
              if (!found && hitTestSource !== null) {
                hitTestSource.cancel();
                hitTestSource = null;
              }
            });

            // Выполняем hit-test и создаем anchor
            session.requestReferenceSpace("viewer").then((referenceSpace) => {
              session.requestAnimationFrame((time, frame) => {
                const pose = frame.getViewerPose(referenceSpace);
                if (pose !== null) {
                  if (hitTestSource !== null) {
                    const hitTestResults =
                      frame.getHitTestResults(hitTestSource);
                    if (hitTestResults.length > 0) {
                      const hit = hitTestResults[0];
                      const pose = hit.getPose(referenceSpace);
                      const position = new THREE.Vector3().fromArray(
                        pose.transform.position
                      );
                      const quaternion = new THREE.Quaternion().fromArray(
                        pose.transform.orientation
                      );
                      anchor = new THREE.Group();
                      anchor.position.copy(position);
                      anchor.quaternion.copy(quaternion);
                      anchor.add(cube);
                      cube.visible = true;
                    }
                  }
                }
                xrRenderer.render(scene, camera);
              });
            });

            document.body.appendChild(xrRenderer.domElement);
            session.updateRenderState({
              baseLayer: xrRenderer.xr.getWebGLLayer(),
            });
          });
      });
      navigator.xr.addEventListener("devicechange", checkSupportedState);
      checkSupportedState();
    // }
  });
}

function checkSupportedState() {
  navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
    if (supported) {
    //   xrButton.style.display = "block";
    } else {
    //   xrButton.style.display = "none";
    }
  });
}

// Рендерим сцену каждый кадр
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

setupXR();
animate();
