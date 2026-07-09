import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontJson from 'three/examples/fonts/gentilis_bold.typeface.json';

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

// Color palette
const colors = [0xADD8E6, 0x90EE90, 0xFFD700, 0xFF6347];

// Define the block size
const blockSize = 0.25; // Size of each block
const bevelSize = blockSize * 0.1; // Bevel size

// Calculate the grid size based on the dimensions of the ring segments
const innerRadius = 1.1; // Inner radius of the ring
const outerRadius = innerRadius + blockSize; // Outer radius of the ring
const thetaLength = Math.PI / 8; // Angle of the segment
const maxHeight = 2; // Maximum height of the grid

const gridHeight = Math.ceil(maxHeight / blockSize);
const gridTheta = Math.ceil((2 * Math.PI) / thetaLength);

// Initialize a 2D array to track block positions
const grid = Array.from({ length: gridTheta }, () =>
    Array(gridHeight).fill(null)
);

// Load font for text labels
const fontLoader = new FontLoader();
let font = fontLoader.parse(fontJson);

// Function to create a ring segment shape with rounded edges/corners
function createRingSegmentShape(innerRadius, outerRadius, thetaStart, thetaLength) {
    const shape = new THREE.Shape();
    shape.moveTo(innerRadius * Math.cos(thetaStart), innerRadius * Math.sin(thetaStart));
    shape.lineTo(outerRadius * Math.cos(thetaStart), outerRadius * Math.sin(thetaStart));
    shape.absarc(0, 0, outerRadius, thetaStart, thetaStart + thetaLength, false);
    shape.lineTo(innerRadius * Math.cos(thetaStart + thetaLength), innerRadius * Math.sin(thetaStart + thetaLength));
    shape.absarc(0, 0, innerRadius, thetaStart + thetaLength, thetaStart, true);
    return shape;
}

// Function to create a ring segment block
function createRingSegmentBlock(innerRadius, outerRadius, thetaStart, thetaLength, thickness) {
    const shape = createRingSegmentShape(innerRadius, outerRadius, thetaStart, thetaLength);
    const extrudeSettings = {
        steps: 1,
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: bevelSize,
        bevelSize: bevelSize,
        bevelSegments: 1
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    return geometry;
}

// Function to create text geometry
function createText(text, size = 0.05) {
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: size,
        depth: 0.01, // Use depth instead of height
        curveSegments: 12,
        bevelEnabled: false
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    return textMesh;
}

// Function to snap theta to the nearest grid position
function snapTheta(theta) {
    const snappedTheta = Math.round(theta / thetaLength) * thetaLength;
    return snappedTheta;
}

// Function to add a new ring segment to the scene
function addRingSegment() {
    let thetaStart = Math.random() * 2 * Math.PI; // Random start angle
    thetaStart = snapTheta(thetaStart); // Snap to nearest grid position
    const thickness = blockSize; // Thickness of the block

    const geometry = createRingSegmentBlock(innerRadius, outerRadius, thetaStart, thetaLength, thickness);
    const color = colors[Math.floor(Math.random() * colors.length)]; // Random color
    const material = new THREE.MeshStandardMaterial({ color });
    const ringSegment = new THREE.Mesh(geometry, material);
    scene.add(ringSegment);

    // Position the ring segment
    const startHeight = maxHeight; // Initial height above the ground
    ringSegment.position.set(0, startHeight, 0);
    ringSegment.rotation.x = -Math.PI / 2; // Rotate to align with the ground

    // Store the initial thetaStart for collision detection
    ringSegment.userData.thetaStart = thetaStart;

    // Set the flag to indicate the block is moving
    isBlockMoving = true;

    // Add the ring segment to the array
    ringSegments.push(ringSegment);
}

// Variable to control the speed of the blocks
let blockSpeed = 0.25; // Fall one block length at a time

// Variable to control the delay between each block's movement (in milliseconds)
let blockDelay = 500; // Initial delay, can be adjusted manually

// Flag to track whether the current block is moving
let isBlockMoving = false;

// Function to check for collisions and update the grid
function checkCollisionAndUpdateGrid(ringSegment) {
    // Clamp the y position to ensure it is within the expected range
    ringSegment.position.y = Math.max(0, Math.min(maxHeight, ringSegment.position.y));

    const yIndex = Math.floor(ringSegment.position.y / blockSize);
    const thetaIndex = Math.floor((ringSegment.userData.thetaStart / (2 * Math.PI)) * gridTheta);

    console.log(`Checking collision for block at yIndex: ${yIndex}, thetaIndex: ${thetaIndex}`);

    // Ensure indices are within bounds
    if (thetaIndex < 0 || thetaIndex >= gridTheta || yIndex < 0 || yIndex >= gridHeight) {
        console.log('Block out of bounds');
        return false;
    }

    // Check if the block should stop due to collision with another block or the ground
    if (yIndex <= 0 || grid[thetaIndex][yIndex - 1] !== null) {
        console.log('Collision detected, snapping to grid position');
        // Snap to grid position
        ringSegment.position.y = yIndex * blockSize;
        grid[thetaIndex][yIndex] = ringSegment;

        return true;
    }

    return false;
}

// Array to store all ring segments
const ringSegments = [];

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

// Animation loop with delay
function animate() {
    setTimeout(() => {
        requestAnimationFrame(animate);

        // Move ring segments downward at a constant speed
        ringSegments.forEach(ringSegment => {
            if (!checkCollisionAndUpdateGrid(ringSegment)) {
                ringSegment.position.y -= blockSpeed; // Use the speed variable
            } else {
                // Block has stopped moving
                isBlockMoving = false;
            }
        });

        // Add a new ring segment if the current block has stopped moving
        if (!isBlockMoving && ringSegments.length === 0) {
            addRingSegment();
        }

        renderer.render(scene, camera);
    }, blockDelay);
}

animate();
