// 3D V8 Engine Simulator - Fixed WebGL Context Issue
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
    
    init() {
        try {
            // Check WebGL support
            if (!window.WebGLRenderingContext) {
                throw new Error('WebGL not supported');
            }
            
            // Setup scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x1a1a1a);
            
            // Setup camera
            this.camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
            this.camera.position.set(0, 5, 15);
            this.camera.lookAt(0, 0, 0);
            
            // Setup renderer with WebGL context
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: false,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(800, 600);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
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
        this.materials = {
            metal: new THREE.MeshPhongMaterial({ 
                color: 0x8B8B8B, 
                shininess: 100,
                specular: 0x222222
            }),
            piston: new THREE.MeshPhongMaterial({ 
                color: 0x4A4A4A, 
                shininess: 50,
                specular: 0x111111
            }),
            cylinder: new THREE.MeshPhongMaterial({ 
                color: 0x6B6B6B, 
                shininess: 30,
                specular: 0x111111
            }),
            crankshaft: new THREE.MeshPhongMaterial({ 
                color: 0x3A3A3A, 
                shininess: 80,
                specular: 0x222222
            }),
            xRay: new THREE.MeshBasicMaterial({ 
                color: 0x00FFFF, 
                transparent: true, 
                opacity: 0.3,
                wireframe: false
            })
        };
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point light
        const pointLight = new THREE.PointLight(0xff6b35, 1, 100);
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
        // Mouse controls
        this.setupMouseControls();
        
        // Touch controls for mobile
        this.setupTouchControls();
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
        // Simple touch support for mobile devices
        let touchStartX = 0, touchStartY = 0;
        
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('touchstart', (event) => {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        });
        
        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            const touchX = event.touches[0].clientX;
            const touchY = event.touches[0].clientY;
            
            const deltaX = (touchX - touchStartX) * 0.01;
            const deltaY = (touchY - touchStartY) * 0.01;
            
            this.camera.position.x += deltaX;
            this.camera.position.y -= deltaY;
            this.camera.lookAt(0, 2, 0);
            
            touchStartX = touchX;
            touchStartY = touchY;
        });
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
