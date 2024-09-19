import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import * as CANNON from 'cannon-es';

// Initialize the Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // Set the background color
document.body.appendChild(renderer.domElement);

// Add OrbitControls to allow camera swivel
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping (inertia)
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Set the camera position
camera.position.z = 30;
camera.position.y = 20;
camera.lookAt(0, 0, 0); // Make the camera look at the center

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Add a directional light to simulate sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Load texture for the floor
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('assets/images/wood-grain.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10, 10);

// Create a ground plane with texture
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
scene.add(groundMesh);

// Create the physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Set gravity to pull objects downward

// Create a ground plane in the physics world
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
    mass: 0 // Mass of 0 makes it static
});
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to be horizontal
world.addBody(groundBody);

// Function to add a new cube to the scene and physics world
function addCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const cubeBody = new CANNON.Body({
        mass: 1
    });
    cubeBody.addShape(cubeShape);
    cubeBody.position.set(Math.random() * 10 - 5, 10, Math.random() * 10 - 5);
    world.addBody(cubeBody);

    return { mesh: cube, body: cubeBody };
}

// Array to store all cubes
const cubes = [];

// Add a new cube every second
setInterval(() => {
    cubes.push(addCube());
}, 1000);

// Object to store the current state of key presses
const keys = {};

// Add event listeners for keydown and keyup
window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Function to handle user input and move cubes
function handleUserInput() {
    cubes.forEach(({ body }) => {
        if (keys['ArrowLeft']) {
            body.position.x -= 0.1;
        }
        if (keys['ArrowRight']) {
            body.position.x += 0.1;
        }
        if (keys['ArrowUp']) {
            body.position.z -= 0.1;
        }
        if (keys['ArrowDown']) {
            body.position.z += 0.1;
        }
    });
}

// Rendering loop
function animate() {
    requestAnimationFrame(animate);

    // Handle user input
    handleUserInput();

    // Update physics
    world.step(1 / 60);

    // Update cube positions
    cubes.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    });

    // Update controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

animate();