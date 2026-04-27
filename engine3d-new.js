// 3D V8 Engine Simulator - Mobile Optimized
class Engine3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.engineGroup = null;
        this.pistons = [];
        this.connectingRods = [];
        this.crankshaft = null;
        this.isAnimating = false;
        this.crankAngle = 0;
        this.animationSpeed = 1;
        this.xRayMode = false;
        this.animationId = null;
        
        // Mobile detection
        this.isMobile = this.detectMobile();
        this.isTouch = 'ontouchstart' in window;
        
        // Touch controls
        this.touches = {
            start: { x: 0, y: 0 },
            current: { x: 0, y: 0 },
            distance: 0,
            zoom: 1
        };
        
        // Performance settings for mobile
        this.performanceMode = this.isMobile ? 'mobile' : 'desktop';
        
        // Materials
        this.materials = {
            metal: null,
            piston: null,
            cylinder: null,
            crankshaft: null,
            xRay: null
        };
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }
    
    init() {
        try {
            // Check WebGL support
            if (!window.WebGLRenderingContext) {
                throw new Error('WebGL not supported');
            }
            
            // Setup scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x1a1a1a);
            
            // Mobile-optimized camera
            const aspectRatio = this.isMobile ? window.innerWidth / (window.innerHeight * 0.6) : 800 / 600;
            this.camera = new THREE.PerspectiveCamera(
                this.isMobile ? 60 : 75, // Wider FOV for mobile
                aspectRatio,
                0.1,
                1000
            );
            this.camera.position.set(0, 5, this.isMobile ? 20 : 15);
            this.camera.lookAt(0, 0, 0);
            
            // Mobile-optimized renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: !this.isMobile, // Disable antialiasing on mobile for performance
                alpha: false,
                powerPreference: this.isMobile ? "default" : "high-performance",
                preserveDrawingBuffer: false
            });
            
            // Set size based on device
            if (this.isMobile) {
                this.renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for mobile
            } else {
                this.renderer.setSize(800, 600);
                this.renderer.setPixelRatio(window.devicePixelRatio);
            }
            
            // Optimized shadows for mobile
            this.renderer.shadowMap.enabled = !this.isMobile;
            if (!this.isMobile) {
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }
            
            // Create materials
            this.createMaterials();
            
            // Add lights
            this.setupLights();
            
            // Create engine components
            this.createEngineComponents();
            
            // Setup controls
            this.setupControls();
            
            // Add to container
            const container = document.getElementById('engine3dContainer');
            if (container) {
                container.appendChild(this.renderer.domElement);
            }
            
            // Start animation loop
            this.animate();
            
        } catch (error) {
            console.error('Error initializing 3D engine:', error);
            this.showFallbackMessage();
        }
    }
    
    createMaterials() {
        // Mobile-optimized materials with reduced complexity
        const materialOptions = this.isMobile ? {
            metal: { color: 0x8B8B8B, shininess: 50, specular: 0x111111 },
            piston: { color: 0x4A4A4A, shininess: 25, specular: 0x080808 },
            cylinder: { color: 0x6B6B6B, shininess: 15, specular: 0x080808 },
            crankshaft: { color: 0x3A3A3A, shininess: 40, specular: 0x111111 }
        } : {
            metal: { color: 0x8B8B8B, shininess: 100, specular: 0x222222 },
            piston: { color: 0x4A4A4A, shininess: 50, specular: 0x111111 },
            cylinder: { color: 0x6B6B6B, shininess: 30, specular: 0x111111 },
            crankshaft: { color: 0x3A3A3A, shininess: 80, specular: 0x222222 }
        };

        this.materials = {
            metal: new THREE.MeshPhongMaterial(materialOptions.metal),
            piston: new THREE.MeshPhongMaterial(materialOptions.piston),
            cylinder: new THREE.MeshPhongMaterial(materialOptions.cylinder),
            crankshaft: new THREE.MeshPhongMaterial(materialOptions.crankshaft),
            xRay: new THREE.MeshBasicMaterial({ 
                color: 0x00FFFF, 
                transparent: true, 
                opacity: this.isMobile ? 0.4 : 0.3,
                wireframe: false
            })
        };
    }
    
    setupLights() {
        // Mobile-optimized lighting
        const ambientIntensity = this.isMobile ? 0.8 : 0.6;
        const ambientLight = new THREE.AmbientLight(0x404040, ambientIntensity);
        this.scene.add(ambientLight);
        
        if (!this.isMobile) {
            // Desktop lighting with shadows
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            this.scene.add(directionalLight);
        } else {
            // Mobile lighting without shadows for performance
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(10, 10, 5);
            this.scene.add(directionalLight);
        }
        
        // Point light for dramatic effect
        const pointLight = new THREE.PointLight(0xff6b35, this.isMobile ? 0.8 : 1, 100);
        pointLight.position.set(0, 3, 0);
        this.scene.add(pointLight);
    }
    
    createEngineComponents() {
        this.engineGroup = new THREE.Group();
        
        // Create engine block
        this.createEngineBlock();
        
        // Create cylinders
        this.createCylinders();
        
        // Create crankshaft
        this.createCrankshaft();
        
        // Create pistons
        this.createPistons();
        
        // Create connecting rods
        this.createConnectingRods();
        
        this.scene.add(this.engineGroup);
    }
    
    createEngineBlock() {
        // Main engine block
        const blockGeometry = new THREE.BoxGeometry(12, 4, 8);
        const engineBlock = new THREE.Mesh(blockGeometry, this.materials.metal);
        engineBlock.position.y = 2;
        engineBlock.castShadow = true;
        engineBlock.receiveShadow = true;
        this.engineGroup.add(engineBlock);
        
        // Cylinder banks
        const bankGeometry = new THREE.BoxGeometry(10, 3, 2);
        
        // Left bank
        const leftBank = new THREE.Mesh(bankGeometry, this.materials.cylinder);
        leftBank.position.set(-2, 3.5, -2);
        leftBank.rotation.z = Math.PI / 6;
        leftBank.castShadow = true;
        this.engineGroup.add(leftBank);
        
        // Right bank
        const rightBank = new THREE.Mesh(bankGeometry, this.materials.cylinder);
        rightBank.position.set(2, 3.5, 2);
        rightBank.rotation.z = -Math.PI / 6;
        rightBank.castShadow = true;
        this.engineGroup.add(rightBank);
    }
    
    createCylinders() {
        const cylinderRadius = 0.8;
        const cylinderHeight = 3;
        const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 16);
        
        // Left bank cylinders (1, 3, 5, 7)
        for (let i = 0; i < 4; i++) {
            const cylinder = new THREE.Mesh(cylinderGeometry, this.materials.cylinder);
            cylinder.position.set(-3 + i * 1.5, 4.5, -2.5);
            cylinder.rotation.z = Math.PI / 2;
            cylinder.castShadow = true;
            cylinder.userData = { cylinderNumber: i * 2 + 1, bank: 'left' };
            this.engineGroup.add(cylinder);
        }
        
        // Right bank cylinders (2, 4, 6, 8)
        for (let i = 0; i < 4; i++) {
            const cylinder = new THREE.Mesh(cylinderGeometry, this.materials.cylinder);
            cylinder.position.set(-3 + i * 1.5, 4.5, 2.5);
            cylinder.rotation.z = Math.PI / 2;
            cylinder.castShadow = true;
            cylinder.userData = { cylinderNumber: (i + 1) * 2, bank: 'right' };
            this.engineGroup.add(cylinder);
        }
    }
    
    createCrankshaft() {
        const crankshaftGroup = new THREE.Group();
        
        // Main crankshaft rod
        const mainRodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
        const mainRod = new THREE.Mesh(mainRodGeometry, this.materials.crankshaft);
        mainRod.rotation.z = Math.PI / 2;
        crankshaftGroup.add(mainRod);
        
        // Crankshaft journals
        for (let i = 0; i < 8; i++) {
            const journalGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8);
            const journal = new THREE.Mesh(journalGeometry, this.materials.crankshaft);
            const angle = (i * Math.PI * 2) / 8;
            journal.position.set(Math.cos(angle) * 4, 0, Math.sin(angle) * 4);
            journal.rotation.z = Math.PI / 2;
            crankshaftGroup.add(journal);
        }
        
        crankshaftGroup.position.y = 0.5;
        this.crankshaft = crankshaftGroup;
        this.engineGroup.add(crankshaftGroup);
    }
    
    createPistons() {
        const pistonGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 12);
        
        for (let i = 0; i < 8; i++) {
            const piston = new THREE.Mesh(pistonGeometry, this.materials.piston);
            piston.castShadow = true;
            piston.userData = { 
                cylinderNumber: i + 1, 
                phase: (i * Math.PI * 2) / 8,
                bank: i % 2 === 0 ? 'left' : 'right'
            };
            
            const xPos = i < 4 ? -3 + (i * 1.5) : -3 + ((i - 4) * 1.5);
            const zPos = i < 4 ? -2.5 : 2.5;
            piston.position.set(xPos, 4.5, zPos);
            piston.rotation.z = Math.PI / 2;
            
            this.pistons.push(piston);
            this.engineGroup.add(piston);
        }
    }
    
    createConnectingRods() {
        for (let i = 0; i < 8; i++) {
            const rodGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
            const rod = new THREE.Mesh(rodGeometry, this.materials.metal);
            rod.castShadow = true;
            rod.userData = { cylinderNumber: i + 1 };
            
            this.connectingRods.push(rod);
            this.engineGroup.add(rod);
        }
    }
    
    setupControls() {
        if (this.isTouch) {
            this.setupTouchControls();
        } else {
            this.setupMouseControls();
        }
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupMouseControls() {
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        let isMouseDown = false;
        
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('mousedown', () => isMouseDown = true);
        canvas.addEventListener('mouseup', () => isMouseDown = false);
        canvas.addEventListener('mouseleave', () => isMouseDown = false);
        
        canvas.addEventListener('mousemove', (event) => {
            if (isMouseDown) {
                const rect = canvas.getBoundingClientRect();
                mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            }
        });
        
        // Smooth camera following
        const updateCamera = () => {
            if (isMouseDown) {
                targetX += (mouseX - targetX) * 0.05;
                targetY += (mouseY - targetY) * 0.05;
                
                this.camera.position.x = targetX * 10;
                this.camera.position.y = 5 + targetY * 3;
                this.camera.lookAt(0, 2, 0);
            }
            requestAnimationFrame(updateCamera);
        };
        updateCamera();
        
        // Zoom with mouse wheel
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            const zoomSpeed = 0.1;
            const direction = event.deltaY > 0 ? 1 : -1;
            
            this.camera.position.multiplyScalar(1 + direction * zoomSpeed);
            
            // Limit zoom
            const distance = this.camera.position.length();
            if (distance < 5) {
                this.camera.position.normalize().multiplyScalar(5);
            } else if (distance > 30) {
                this.camera.position.normalize().multiplyScalar(30);
            }
        });
    }
    
    setupTouchControls() {
        const canvas = this.renderer.domElement;
        let lastTouchDistance = 0;
        let isRotating = false;
        let isZooming = false;
        
        // Touch start
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            
            if (event.touches.length === 1) {
                // Single touch - rotation
                isRotating = true;
                this.touches.start.x = event.touches[0].clientX;
                this.touches.start.y = event.touches[0].clientY;
            } else if (event.touches.length === 2) {
                // Two touches - pinch zoom
                isZooming = true;
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
        });
        
        // Touch move
        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            
            if (event.touches.length === 1 && isRotating) {
                // Single touch rotation
                const touch = event.touches[0];
                const deltaX = (touch.clientX - this.touches.start.x) * 0.01;
                const deltaY = (touch.clientY - this.touches.start.y) * 0.01;
                
                // Rotate camera around the engine
                const spherical = new THREE.Spherical();
                spherical.setFromVector3(this.camera.position);
                spherical.theta -= deltaX;
                spherical.phi += deltaY;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                
                this.camera.position.setFromSpherical(spherical);
                this.camera.lookAt(0, 2, 0);
                
                this.touches.start.x = touch.clientX;
                this.touches.start.y = touch.clientY;
                
            } else if (event.touches.length === 2 && isZooming) {
                // Pinch zoom
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                if (lastTouchDistance > 0) {
                    const scale = currentDistance / lastTouchDistance;
                    this.camera.position.multiplyScalar(scale);
                    
                    // Limit zoom
                    const distance = this.camera.position.length();
                    if (distance < 8) {
                        this.camera.position.normalize().multiplyScalar(8);
                    } else if (distance > 40) {
                        this.camera.position.normalize().multiplyScalar(40);
                    }
                }
                
                lastTouchDistance = currentDistance;
            }
        });
        
        // Touch end
        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            
            if (event.touches.length === 0) {
                isRotating = false;
                isZooming = false;
                lastTouchDistance = 0;
            }
        });
        
        // Add gyroscope support if available
        if (window.DeviceOrientationEvent && this.isMobile) {
            window.addEventListener('deviceorientation', (event) => {
                if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
                    // Use gyroscope for subtle camera movement
                    const alpha = event.alpha * Math.PI / 180;
                    const beta = event.beta * Math.PI / 180;
                    const gamma = event.gamma * Math.PI / 180;
                    
                    // Apply gentle rotation based on device orientation
                    const spherical = new THREE.Spherical();
                    spherical.setFromVector3(this.camera.position);
                    spherical.theta += gamma * 0.001;
                    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + beta * 0.001));
                    
                    this.camera.position.setFromSpherical(spherical);
                    this.camera.lookAt(0, 2, 0);
                }
            });
        }
    }
    
    onWindowResize() {
        if (this.isMobile) {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight * 0.6;
            
            this.camera.aspect = newWidth / newHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(newWidth, newHeight);
        } else {
            this.camera.aspect = 800 / 600;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(800, 600);
        }
    }
    
    updatePistonPositions() {
        for (let i = 0; i < this.pistons.length; i++) {
            const piston = this.pistons[i];
            const rod = this.connectingRods[i];
            const phase = piston.userData.phase;
            
            // Calculate piston position
            const pistonOffset = Math.sin(this.crankAngle + phase) * 1.5;
            const baseY = 4.5;
            piston.position.y = baseY + pistonOffset;
            
            // Update connecting rod
            const crankX = Math.cos(this.crankAngle + phase) * 4;
            const crankZ = Math.sin(this.crankAngle + phase) * 4;
            
            rod.position.set(
                (piston.position.x + crankX) / 2,
                (piston.position.y + 0.5) / 2,
                (piston.position.z + crankZ) / 2
            );
            
            rod.lookAt(piston.position.x, piston.position.y, piston.position.z);
        }
        
        // Rotate crankshaft
        if (this.crankshaft) {
            this.crankshaft.rotation.y = this.crankAngle;
        }
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        const degrees = Math.floor((this.crankAngle * 180 / Math.PI) % 360);
        const crankAngleElement = document.getElementById('crankAngle3D');
        if (crankAngleElement) {
            crankAngleElement.textContent = degrees + '°';
        }
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.isAnimating) {
            this.crankAngle += 0.02 * this.animationSpeed;
            this.updatePistonPositions();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    togglePlay() {
        this.isAnimating = !this.isAnimating;
        const playBtn = document.getElementById('play3dBtn');
        if (playBtn) {
            playBtn.textContent = this.isAnimating ? '⏸ Pause' : '▶ Play';
        }
    }
    
    toggleXRay() {
        this.xRayMode = !this.xRayMode;
        
        this.engineGroup.traverse((child) => {
            if (child.isMesh) {
                if (this.xRayMode) {
                    child.material = this.materials.xRay;
                } else {
                    // Restore original material
                    if (child.userData.cylinderNumber) {
                        child.material = this.materials.piston;
                    } else if (child.parent === this.crankshaft) {
                        child.material = this.materials.crankshaft;
                    } else {
                        child.material = this.materials.metal;
                    }
                }
            }
        });
        
        const xrayBtn = document.getElementById('xrayBtn');
        if (xrayBtn) {
            xrayBtn.classList.toggle('active', this.xRayMode);
        }
    }
    
    showFallbackMessage() {
        const container = document.getElementById('engine3dContainer');
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 600px; background: #1a1a1a; color: white; text-align: center; padding: 20px;">
                    <div>
                        <h3>3D Engine Not Available</h3>
                        <p>WebGL is not supported in your browser.</p>
                        <p>Please try using a modern browser like Chrome, Firefox, or Safari.</p>
                        <button onclick="switchTab('2d')" style="margin-top: 20px; padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Switch to 2D Animation
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Global functions for button clicks
let engine3DInstance = null;

function togglePlay3D() {
    if (engine3DInstance) {
        engine3DInstance.togglePlay();
    }
}

function toggleXRay() {
    if (engine3DInstance) {
        engine3DInstance.toggleXRay();
    }
}

// Initialize when 3D tab is shown
function initialize3DEngine() {
    if (!engine3DInstance) {
        engine3DInstance = new Engine3D();
    }
}

// Cleanup when switching tabs
function cleanup3DEngine() {
    if (engine3DInstance) {
        engine3DInstance.destroy();
        engine3DInstance = null;
    }
}
