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
controls.enableZoom = false; // Disable zoom
controls.enablePan = false; // Disable panning
controls.target.set(0, 0, 0); // Set the target to the center of the floor

// Set the camera position to be 6 feet above the ground
camera.position.set(0, 1.83, 0); // Position the camera 6 feet above the center
camera.lookAt(0, 0, 1); // Make the camera look forward initially

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
floorTexture.repeat.set(3, 3); // Adjust texture repeat to fit the 30 ft square

// Create a ground plane with texture
const groundGeometry = new THREE.PlaneGeometry(9.14, 9.14); // 30 ft square
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
    const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25); // Smaller cube size
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const cubeShape = new CANNON.Box(new CANNON.Vec3(0.125, 0.125, 0.125)); // Smaller cube size
    const cubeBody = new CANNON.Body({
        mass: 1
    });
    cubeBody.addShape(cubeShape);

    // Calculate random position in a circular pattern around the camera
    const radius = 1.1; // Reduced radius of the circle
    const angle = Math.random() * 2 * Math.PI; // Random angle
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    cubeBody.position.set(x, 10, z); // Drop from a height of 10 units
    world.addBody(cubeBody);

    // Add collision event listener to make blocks stick to each other
    cubeBody.addEventListener('collide', (event) => {
        const contact = event.contact;
        const otherBody = contact.bi === cubeBody ? contact.bj : contact.bi;

        // Check if the other body is a cube
        if (otherBody.shapes[0] instanceof CANNON.Box) {
            const constraint = new CANNON.LockConstraint(cubeBody, otherBody);
            world.addConstraint(constraint);
        }
    });

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