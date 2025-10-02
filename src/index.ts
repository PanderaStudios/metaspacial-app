import {
  AssetManifest,
  AssetType,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SessionMode,
  SRGBColorSpace,
  AssetManager,
  World,
  BoxGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  IBLTexture,
  DomeTexture,
  EnvironmentType, LocomotionEnvironment,
  OneHandGrabbable,
  PanelDocument
} from "@iwsdk/core";

import {
  AudioSource,
  DistanceGrabbable,
  MovementMode,
  Interactable,
  PanelUI,
  PlaybackMode,
  ScreenSpace,
  DirectionalLight, AmbientLight,
  createComponent, Types,
  createSystem, eq,
} from "@iwsdk/core";


import { PanelSystem } from "./panel.js";

import { Robot } from "./robot.js";

import { RobotSystem } from "./robot.js";

import { Insect, InsectSystem } from "./insect.js";

import { HealthSystem } from "./helth.js";

const assets: AssetManifest = {
  chimeSound: {
    url: "/audio/chime.mp3",
    type: AssetType.Audio,
    priority: "background",
  },
  webxr: {
    url: "/textures/webxr.png",
    type: AssetType.Texture,
    priority: "critical",
  },
  sunsetHDR: {
    url: "/hdr/808-hdri-skies-com.hdr",
    type: AssetType.HDRTexture,
    priority: 'critical',
  },
  environmentDesk: {
    url: "/gltf/environmentDesk/environmentDesk.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
  plantSansevieria: {
    url: "/gltf/plantSansevieria/plantSansevieria.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
  robot: {
    url: "/gltf/robot/robot.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
  insect: {
    url: '/gltf/insectoid_monster_rig_gltf/scene.gltf',
    type: AssetType.GLTF,
    priority: 'critical',
  },
};

export const Health = createComponent('Health', {
  current: { type: Types.Float32, default: 100 },
  max: { type: Types.Float32, default: 100 },
  regenerating: { type: Types.Boolean, default: false },
});

export const Position = createComponent('Position', {
  velocity: { type: Types.Vec3, default: [0, 0, 0] },
  target: { type: Types.Vec3, default: [0, 0, 0] },
});

World.create(document.getElementById("scene-container") as HTMLDivElement, {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: "always",
    // Optional structured features; layers/local-floor are offered by default
    features: { handTracking: true, layers: true },
  },
  features: {
    locomotion: { useWorker: true },
    grabbing: true,
    physics: false,
    sceneUnderstanding: false,
  },
  render: {
    defaultLighting: false, // Disable IWSDK's default IBL
  },
}).then((world) => {
  const { camera } = world;

  camera.position.set(-4, 1.5, -6);
  camera.rotateY(-Math.PI * 0.75);

    // Add traditional Three.js lights directly to the scene
  const directionalLight = new DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 5, 5);
  world.scene.add(directionalLight);

  const ambientLight = new AmbientLight(0x404040, .4);
  world.scene.add(ambientLight);

const levelRoot = world.activeLevel.value;

// Create a red cube
  const cubeGeometry = new BoxGeometry(.5, .5, .5);
  const redMaterial = new MeshStandardMaterial({ color: 0xff3333 });
  const cube = new Mesh(cubeGeometry, redMaterial);
  cube.position.set(-2, 2, -2);
  const cubeEntity = 
    world
      .createTransformEntity(cube)
        .addComponent(Interactable)
        .addComponent(DistanceGrabbable, {
         movementMode: MovementMode.MoveFromTarget,
    // translate: true,
    rotate: true,
    scale: true, // Can also resize it
         });

  // Create a green sphere
  const sphereGeometry = new SphereGeometry(0.25, 16, 16);
  const greenMaterial = new MeshStandardMaterial({ color: 0x33ff33 });
  const sphere = new Mesh(sphereGeometry, greenMaterial);
  sphere.position.set(2, 2, -2);
  const sphereEntity = 
    world
      .createTransformEntity(sphere)
      .addComponent(Interactable)
      .addComponent(DistanceGrabbable, {
        movementMode: MovementMode.MoveFromTarget,
        });

  // Create a blue floor plane
  // const floorGeometry = new PlaneGeometry(3, 3);
  // const blueMaterial = new MeshStandardMaterial({ color: 0xbbbbbb });
  // const floor = new Mesh(floorGeometry, blueMaterial);
  // floor.position.set(0, 0, -1);
  // floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  // const floorEntity = 
  //     world
  //       .createTransformEntity(floor)
  //       .addComponent(Interactable)
  //       .addComponent(DistanceGrabbable, {
  //        movementMode: MovementMode.MoveFromTarget,
  //        });

  const { scene: envMesh } = AssetManager.getGLTF("environmentDesk")!;
  envMesh.rotateY(Math.PI);
  envMesh.position.set(0, -0.1, 0);
  world
    .createTransformEntity(envMesh)
    .addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  const { scene: plantMesh } = AssetManager.getGLTF("plantSansevieria")!;

  plantMesh.position.set(1.2, 0.85, -1.8);

  world
    .createTransformEntity(plantMesh)
    .addComponent(Interactable)
    .addComponent(DistanceGrabbable, {
      movementMode: MovementMode.MoveFromTarget,
    });

levelRoot.addComponent(DomeTexture, {
  src: 'sunsetHDR', // Reference the asset key
  intensity: 1,
  //blurriness: 0.1, // Slight blur for softer look
});

  const { scene: robotMesh } = AssetManager.getGLTF("robot")!;
  // defaults for AR
  robotMesh.position.set(-1.2, 0.4, -1.8);
  robotMesh.scale.setScalar(1);

  robotMesh.position.set(-1.2, 0.95, -1.8);
  robotMesh.scale.setScalar(0.5);

  // Create a transform entity from the mesh
  const robotEntity = world.createTransformEntity(robotMesh);

  world
    .createTransformEntity(robotMesh)
    .addComponent(Interactable)
    .addComponent(Robot)
   // .addComponent(OneHandGrabbable)
    .addComponent(AudioSource, {
      src: "/audio/chime.mp3",
      maxInstances: 3,
      playbackMode: PlaybackMode.FadeRestart,
    });

  const { scene: insectMesh } = AssetManager.getGLTF("insect")!;
  // defaults for AR
  // insectMesh.position.set(-.6, 0.05, -1.8);
  // insectMesh.scale.setScalar(1);

  insectMesh.position.set(0, 0.8, -1.4);
  insectMesh.scale.setScalar(.1);

  // Create a transform entity from the mesh
  const insectEntity = world.createTransformEntity(insectMesh);

  world
    .createTransformEntity(insectMesh)
    .addComponent(Interactable)
    .addComponent(Insect)
    //.addComponent(OneHandGrabbable)
    .addComponent(DistanceGrabbable, {
      movementMode: MovementMode.MoveFromTarget,
    })
    .addComponent(AudioSource, {
      src: "/audio/chime.mp3",
      maxInstances: 3,
      playbackMode: PlaybackMode.FadeRestart,
    });

  const panelEntity = world
    .createTransformEntity()
    .addComponent(PanelUI, {
      config: "/ui/welcome.json",
      maxHeight: 0.8,
      maxWidth: 1.6,
    })
    .addComponent(Interactable)
    .addComponent(ScreenSpace, {
      top: "20px",
      left: "20px",
      height: "40%",
    });

    panelEntity.object3D!.position.set(0, 1.8, -1.9);

  const webxrLogoTexture = AssetManager.getTexture("webxr")!;
  webxrLogoTexture.colorSpace = SRGBColorSpace;
  const logoBanner = new Mesh(
    new PlaneGeometry(3.39, 0.96),
    new MeshBasicMaterial({
      map: webxrLogoTexture,
      transparent: true,
    }),
  );
  world.createTransformEntity(logoBanner);
  logoBanner.position.set(0, 1, 1.8);
  logoBanner.rotateY(Math.PI);

  world
    .registerSystem(PanelSystem)
    .registerSystem(RobotSystem)
     .registerComponent(Health)
     .registerComponent(Position)
     //.registerSystem(HealthSystem)
    .registerSystem(InsectSystem);

// Then register systems
//   world.registerSystem(HealthSystem, {
//     priority: -1, // Higher priority systems run first (negative = higher priority)
//     configData: { speed: 2.0 }, // Override default config values
// });
  });


