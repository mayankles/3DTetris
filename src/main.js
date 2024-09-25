import * as THREE from 'three';

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

// Set the camera position to be 6 feet above the ground
camera.position.set(0, 1.83, 0); // Position the camera 6 feet above the center
camera.rotation.x = 0; // Make the camera look straight ahead

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Add a directional light to simulate sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Load texture for the floor
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('assets/images/floor.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(3, 3); // Adjust texture repeat to fit the 30 ft square

// Create a ground plane with texture
const groundGeometry = new THREE.PlaneGeometry(9.14, 9.14); // 30 ft square
const groundMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
scene.add(groundMesh);

// Define the block size
const blockSize = 0.25; // Size of each block

// Color palette
const colors = [0xADD8E6, 0x90EE90, 0xFFD700, 0xFF6347];

// Function to create a rounded rectangle shape with rounded corners
function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2 + radius, -height / 2);
    shape.lineTo(width / 2 - radius, -height / 2);
    shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
    shape.lineTo(width / 2, height / 2 - radius);
    shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
    shape.lineTo(-width / 2 + radius, height / 2);
    shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
    shape.lineTo(-width / 2, -height / 2 + radius);
    shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);
    return shape;
}

// Function to create a rounded block
function createRoundedBlock(size, radius) {
    const shape = createRoundedRectShape(size, size, radius);
    const extrudeSettings = { depth: size, bevelEnabled: true, bevelSegments: 2, steps: 4, bevelSize: radius, bevelThickness: radius };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    return geometry;
}

// Function to add a new cube to the scene
function addCube() {
    const geometry = createRoundedBlock(blockSize, blockSize * 0.2); // Rounded block with rounded corners
    const color = colors[Math.floor(Math.random() * colors.length)]; // Random color
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Calculate random position in a circular pattern around the camera
    const radius = 1.1; // Radius of the circle
    const angle = Math.random() * 2 * Math.PI; // Random angle
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    // Snap the initial position to the nearest grid position in polar coordinates
    const snappedPosition = snapToPolarGrid(x, z);
    const startHeight = 2; // Initial height above the ground
    cube.position.set(snappedPosition.x, startHeight, snappedPosition.z);

    return cube;
}

// Initialize a 3D array to track block positions
const gridSize = 36; // Assuming a 6x6 grid with 6 blocks high
const grid = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () =>
        Array(gridSize).fill(null)
    )
);

// Function to calculate the nearest grid position in polar coordinates
function snapToPolarGrid(x, z) {
    const radius = Math.sqrt(x * x + z * z);
    const angle = Math.atan2(z, x);
    const snappedRadius = Math.round(radius / blockSize) * blockSize;
    const snappedAngle = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8); // Snap to 16 angular positions
    return {
        x: snappedRadius * Math.cos(snappedAngle),
        z: snappedRadius * Math.sin(snappedAngle)
    };
}

// Array to store all cubes
const cubes = [];

// Add a new cube every second
setInterval(() => {
    cubes.push(addCube());
}, 1000);

// Variables to track mouse and touch movement and camera angles
let isMouseDown = false;
let isTouching = false;
let mouseX = 0;
let mouseY = 0;
let touchX = 0;
let touchY = 0;
let theta = 0; // Horizontal angle
let phi = Math.PI / 2; // Vertical angle (start looking straight ahead)

// Event listeners for mouse movements
document.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
});

document.addEventListener('mouseup', () => {
    isMouseDown = false;
});

document.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        mouseX = event.clientX;
        mouseY = event.clientY;

        // Update angles based on mouse movement
        theta -= deltaX * 0.005;
        phi -= deltaY * 0.005;

        // Clamp the vertical angle to avoid flipping
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

        // Update camera position based on angles
        const radius = 1.83; // Distance from the center
        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(0, 0, 0); // Always look at the center
    }
});

// Event listeners for touch movements
document.addEventListener('touchstart', (event) => {
    isTouching = true;
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
});

document.addEventListener('touchend', () => {
    isTouching = false;
});

document.addEventListener('touchmove', (event) => {
    if (isTouching) {
        const deltaX = event.touches[0].clientX - touchX;
        const deltaY = event.touches[0].clientY - touchY;
        touchX = event.touches[0].clientX;
        touchY = event.touches[0].clientY;

        // Update angles based on touch movement
        theta -= deltaX * 0.005;
        phi -= deltaY * 0.005;

        // Clamp the vertical angle to avoid flipping
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

        // Update camera position based on angles
        const radius = 1.83; // Distance from the center
        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(0, 0, 0); // Always look at the center
    }
});

// Function to check for collisions and update the grid
function checkCollisionAndUpdateGrid(cube) {
    const xIndex = Math.round(cube.position.x / blockSize) + gridSize / 2;
    const yIndex = Math.round(cube.position.y / blockSize);
    const zIndex = Math.round(cube.position.z / blockSize) + gridSize / 2;

    if (yIndex <= 0 || grid[xIndex][yIndex - 1][zIndex] !== null) {
        // Snap to grid position
        cube.position.y = yIndex * blockSize;
        grid[xIndex][yIndex][zIndex] = cube;

        return true;
    }

    return false;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Move cubes downward at a constant speed
    cubes.forEach(cube => {
        if (!checkCollisionAndUpdateGrid(cube)) {
            cube.position.y -= 0.01; // Adjust speed as needed
        }
    });

    renderer.render(scene, camera);
}

animate();
