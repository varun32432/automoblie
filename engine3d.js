// 3D V8 Engine — Realistic Dark Style + Spark Glow
let scene3d,camera3d,renderer3d,engine3dGroup,is3dRunning=false,isXRay=false,crankAngle3d=0,speed3d=1;
let pistons3d=[],conRods3d=[],sparkPlugs3d=[],cylWalls3d=[],sparkLights3d=[];
let mouseDown=false,mouseX=0,mouseY=0,rotX=0.3,rotY=-0.5;
const firingOrder3d=[1,5,4,8,6,3,7,2];

function init3DEngine(){
const c=document.getElementById('engine3dContainer'),w=c.clientWidth,h=c.clientHeight;
scene3d=new THREE.Scene();scene3d.background=new THREE.Color(0x111115);
camera3d=new THREE.PerspectiveCamera(38,w/h,0.1,500);
camera3d.position.set(4,8,22);camera3d.lookAt(0,1,0);
renderer3d=new THREE.WebGLRenderer({antialias:true});
renderer3d.setSize(w,h);renderer3d.setPixelRatio(Math.min(devicePixelRatio,2));
renderer3d.shadowMap.enabled=true;renderer3d.shadowMap.type=THREE.PCFSoftShadowMap;
renderer3d.toneMapping=THREE.ACESFilmicToneMapping;renderer3d.toneMappingExposure=1.3;
renderer3d.outputEncoding=THREE.sRGBEncoding;c.appendChild(renderer3d.domElement);

// Lighting
scene3d.add(new THREE.AmbientLight(0x1a1a22,0.8));
scene3d.add(new THREE.HemisphereLight(0x334455,0x111111,0.6));
const key=new THREE.DirectionalLight(0xffeedd,1.8);key.position.set(10,20,12);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);scene3d.add(key);
const fill=new THREE.DirectionalLight(0x8899bb,0.5);fill.position.set(-10,8,-8);scene3d.add(fill);
const rim=new THREE.DirectionalLight(0xff7733,0.6);rim.position.set(-6,-4,-12);scene3d.add(rim);
const top=new THREE.PointLight(0xffffff,0.5,30);top.position.set(0,14,0);scene3d.add(top);

// Ground
const grid=new THREE.GridHelper(40,40,0x1a1a1a,0x141414);grid.position.y=-6;scene3d.add(grid);
const gnd=new THREE.Mesh(new THREE.PlaneGeometry(50,50),new THREE.MeshStandardMaterial({color:0x0e0e10,roughness:0.9}));
gnd.rotation.x=-Math.PI/2;gnd.position.y=-6;gnd.receiveShadow=true;scene3d.add(gnd);

engine3dGroup=new THREE.Group();scene3d.add(engine3dGroup);
buildEngine();setupMouseControls(c);
window.addEventListener('resize',()=>{const nw=c.clientWidth,nh=c.clientHeight;camera3d.aspect=nw/nh;camera3d.updateProjectionMatrix();renderer3d.setSize(nw,nh);});
animate3D();
}

function buildEngine(){
// Materials - dark glossy like reference
const blk=new THREE.MeshStandardMaterial({color:0x111111,metalness:0.95,roughness:0.12});
const drk=new THREE.MeshStandardMaterial({color:0x0d0d0d,metalness:0.95,roughness:0.1});
const chr=new THREE.MeshStandardMaterial({color:0xaaaaaa,metalness:1,roughness:0.05});
const pst=new THREE.MeshStandardMaterial({color:0xcccccc,metalness:0.85,roughness:0.1});
const rod=new THREE.MeshStandardMaterial({color:0x444444,metalness:0.9,roughness:0.15});
const spk=new THREE.MeshStandardMaterial({color:0xdddddd,metalness:0.6,roughness:0.3});
const blt=new THREE.MeshStandardMaterial({color:0x333333,metalness:0.9,roughness:0.2});
const exh=new THREE.MeshStandardMaterial({color:0x1a1510,metalness:0.8,roughness:0.35});
// Glass for cylinder walls
const glass=()=>new THREE.MeshPhysicalMaterial({color:0x222222,metalness:0.1,roughness:0.05,transparent:true,opacity:0.35,transmission:0.5,thickness:0.5,side:THREE.DoubleSide});

const V=Math.PI/4,S=2.1,R=0.6,H=3.8;

// --- Realistic Machined Engine Block ---
const castIronMat = new THREE.MeshStandardMaterial({color: 0x1a1c1e, roughness: 0.9, metalness: 0.3});
const machinedMat = new THREE.MeshStandardMaterial({color: 0xd0d5d9, roughness: 0.4, metalness: 0.7});
const holeMat = new THREE.MeshStandardMaterial({color: 0x050505, roughness: 1.0});

// Central block core
const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.5, 9), castIronMat);
b1.position.y = -1.2; b1.castShadow = true; engine3dGroup.add(b1); cylWalls3d.push(b1);

// Left & Right bank cast iron body
const lBank = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 9), castIronMat);
lBank.position.set(1.77, 1.77, 0); lBank.rotation.z = -V; lBank.castShadow = true; engine3dGroup.add(lBank); cylWalls3d.push(lBank);
const rBank = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 9), castIronMat);
rBank.position.set(-1.77, 1.77, 0); rBank.rotation.z = V; rBank.castShadow = true; engine3dGroup.add(rBank); cylWalls3d.push(rBank);

// Machined deck plates (Top of cylinder banks)
const deckGeo = new THREE.BoxGeometry(2.8, 0.1, 9.05);
const lDeck = new THREE.Mesh(deckGeo, machinedMat);
lDeck.position.set(2.9, 2.9, 0); lDeck.rotation.z = -V; engine3dGroup.add(lDeck); cylWalls3d.push(lDeck);
const rDeck = new THREE.Mesh(deckGeo, machinedMat);
rDeck.position.set(-2.9, 2.9, 0); rDeck.rotation.z = V; engine3dGroup.add(rDeck); cylWalls3d.push(rDeck);

// Front machined face (Timing cover area)
const fFace = new THREE.Group();
const fBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.0, 0.1), machinedMat);
fBase.position.set(0, -0.5, -4.55); fFace.add(fBase);
const fLeft = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 0.1), machinedMat);
fLeft.position.set(1.77, 1.77, -4.55); fLeft.rotation.z = -V; fFace.add(fLeft);
const fRight = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 0.1), machinedMat);
fRight.position.set(-1.77, 1.77, -4.55); fRight.rotation.z = V; fFace.add(fRight);
// Large center holes (Camshaft & Crankshaft)
const camHole = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.12, 32), holeMat);
camHole.rotation.x = Math.PI/2; camHole.position.set(0, -1.0, -4.56); fFace.add(camHole);
const crankHole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 32), holeMat);
crankHole.rotation.x = Math.PI/2; crankHole.position.set(0, -2.2, -4.56); fFace.add(crankHole);
// Small bolt holes
for(let i=0; i<8; i++){
    const angle = i * Math.PI/4;
    const boltHole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), holeMat);
    boltHole.rotation.x = Math.PI/2; boltHole.position.set(Math.cos(angle)*1.2, -1.0 + Math.sin(angle)*1.2, -4.56);
    fFace.add(boltHole);
}
engine3dGroup.add(fFace); cylWalls3d.push(...fFace.children);
// Rear face (clone of front)
const rFace = fFace.clone(); rFace.rotation.y = Math.PI; engine3dGroup.add(rFace); cylWalls3d.push(...rFace.children);

// Block lower crankcase
const cc=new THREE.Mesh(new THREE.CylinderGeometry(2.3,1.8,9,4),drk);
cc.rotation.x=Math.PI/2;cc.rotation.y=Math.PI/4;cc.position.y=-2.5;cc.castShadow=true;engine3dGroup.add(cc); cylWalls3d.push(cc);
// Oil pan
const pan=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.0,8.8),drk);pan.position.y=-3.8;pan.castShadow=true;engine3dGroup.add(pan);cylWalls3d.push(pan);

// Cylinder bore rings (machined rims on the deck)
const ringGeo = new THREE.RingGeometry(R, R+0.12, 32);
const ringMat = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.9, side: THREE.FrontSide});
for(let i=0; i<4; i++){
    const z = -3.2 + i * S;
    const lRing = new THREE.Mesh(ringGeo, ringMat);
    const lPos = new THREE.Vector3(2.9 + Math.sin(V)*0.06, 2.9 + Math.cos(V)*0.06, z);
    lRing.position.copy(lPos); lRing.lookAt(lPos.clone().add(new THREE.Vector3(Math.sin(V), Math.cos(V), 0)));
    engine3dGroup.add(lRing); cylWalls3d.push(lRing);
    
    const rRing = new THREE.Mesh(ringGeo, ringMat);
    const rPos = new THREE.Vector3(-2.9 - Math.sin(V)*0.06, 2.9 + Math.cos(V)*0.06, z);
    rRing.position.copy(rPos); rRing.lookAt(rPos.clone().add(new THREE.Vector3(-Math.sin(V), Math.cos(V), 0)));
    engine3dGroup.add(rRing); cylWalls3d.push(rRing);
}

// Engine Stand (Tubular Structure)
const standMat=new THREE.MeshStandardMaterial({color:0x111111,metalness:0.8,roughness:0.3});
// Base plate
const bPlate=new THREE.Mesh(new THREE.BoxGeometry(8,0.2,12),new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:0.9}));
bPlate.position.y=-5.4;bPlate.receiveShadow=true;engine3dGroup.add(bPlate);
// Main longitudinal rails
for(let s=-1;s<=1;s+=2){
const rail=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,11,16),standMat);
rail.rotation.x=Math.PI/2;rail.position.set(s*3,-4.8,0);rail.castShadow=true;engine3dGroup.add(rail);
// Supports
for(let z of [-3.5,0,3.5]){
const supp=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,1.8,8),standMat);
supp.position.set(s*2.3,-4.0,z);supp.rotation.z=s*-Math.PI/6;supp.castShadow=true;engine3dGroup.add(supp);
}
}
// Cross bars
for(let z of [-4.5,4.5]){
const cross=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,6,16),standMat);
cross.rotation.z=Math.PI/2;cross.position.set(0,-4.8,z);cross.castShadow=true;engine3dGroup.add(cross);
}
// Front Arched Tube
const arch=new THREE.Mesh(new THREE.TorusGeometry(3.5,0.2,16,32,Math.PI),standMat);
arch.position.set(0,-4.8,-4.2);arch.castShadow=true;engine3dGroup.add(arch);

// Front timing cover
const fc=new THREE.Mesh(new THREE.BoxGeometry(3.6,4.5,0.4),blk);fc.position.set(0,-1.5,-4.7);fc.castShadow=true;engine3dGroup.add(fc);cylWalls3d.push(fc);

// Crankshaft
const cs=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,10,24),chr);cs.rotation.x=Math.PI/2;cs.position.y=-1.8;engine3dGroup.add(cs);
// Crank counterweights
for(let i=0;i<4;i++){const cw=new THREE.Mesh(new THREE.BoxGeometry(0.3,1.0,0.4),chr);cw.position.set(0,-1.8,-3.5+i*S);engine3dGroup.add(cw);}

// Front pulley assembly
const p1=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,0.25,32),chr);p1.rotation.x=Math.PI/2;p1.position.set(0,-1.8,-5.1);engine3dGroup.add(p1);
const p2=new THREE.Mesh(new THREE.TorusGeometry(1.1,0.08,12,32),chr);p2.position.set(0,-1.8,-5.1);engine3dGroup.add(p2);
// Pulley grooves
for(let r=0.7;r<=1.0;r+=0.15){const g=new THREE.Mesh(new THREE.TorusGeometry(r,0.04,8,32),drk);g.position.set(0,-1.8,-5.15);engine3dGroup.add(g);}
// Center bolt
const cb=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.4,12),spk);cb.rotation.x=Math.PI/2;cb.position.set(0,-1.8,-5.3);engine3dGroup.add(cb);

// Build both cylinder banks
for(let bank=0;bank<2;bank++){
const ang=bank===0?V:-V,side=bank===0?1:-1;
// Valve cover (long cover on top of bank)
const vcLen=8.2;
const vc=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.5,vcLen),blk);
const vcx=Math.sin(ang)*(H+0.8),vcy=Math.cos(ang)*(H+0.8);
vc.position.set(vcx,vcy,0);vc.rotation.z=-ang;vc.castShadow=true;
engine3dGroup.add(vc);cylWalls3d.push(vc);
// Valve cover bolts
for(let b=0;b<6;b++){const vb=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.2,8),chr);
const bz=-3.5+b*1.5;vb.position.set(vcx+Math.sin(ang)*0.4,vcy+Math.cos(ang)*0.4,bz);engine3dGroup.add(vb);}
// Valve cover filler cap (on first bank only)
if(bank===0){const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.4,16),spk);cap.position.set(vcx+Math.sin(ang)*0.1,vcy+Math.cos(ang)*0.5,-1);cap.rotation.z=-ang;engine3dGroup.add(cap);}

for(let i=0;i<4;i++){
const z=-3.2+i*S;
// Cylinder wall (glass)
const cw=new THREE.Mesh(new THREE.CylinderGeometry(R+0.12,R+0.12,H,24,1,true),glass());
cw.position.set(Math.sin(ang)*(H/2+0.3),Math.cos(ang)*(H/2+0.3),z);cw.rotation.z=-ang;
engine3dGroup.add(cw);cylWalls3d.push(cw);
// Cylinder head
const hd=new THREE.Mesh(new THREE.CylinderGeometry(R+0.22,R+0.18,0.55,24),blk);
hd.position.set(Math.sin(ang)*(H+0.55),Math.cos(ang)*(H+0.55),z);hd.rotation.z=-ang;hd.castShadow=true;
engine3dGroup.add(hd);cylWalls3d.push(hd);
// Head bolts (4 per cylinder)
for(let b=0;b<4;b++){const hb=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.12,8),chr);
const ba=b*Math.PI/2;hb.position.set(Math.sin(ang)*(H+0.85)+Math.cos(ang)*Math.cos(ba)*0.5,Math.cos(ang)*(H+0.85)-Math.sin(ang)*Math.cos(ba)*0.5,z+Math.sin(ba)*0.5);engine3dGroup.add(hb);}

// Piston
const pt=new THREE.Mesh(new THREE.CylinderGeometry(R-0.04,R-0.04,0.55,24),pst);pt.rotation.z=-ang;pt.castShadow=true;
engine3dGroup.add(pt);pistons3d.push({mesh:pt,angle:ang,zPos:z});
// Piston ring grooves
for(let r=0;r<2;r++){const rg=new THREE.Mesh(new THREE.TorusGeometry(R-0.04,0.015,6,24),rod);
rg.rotation.z=-ang;engine3dGroup.add(rg);/* positioned with piston in update */}
// Piston wrist pin
const wp=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.7,8),chr);wp.rotation.z=-ang+Math.PI/2;
engine3dGroup.add(wp);/* positioned with piston */

// Connecting rod
const cr=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.11,2.8,10),rod);cr.rotation.z=-ang;
engine3dGroup.add(cr);conRods3d.push({mesh:cr,angle:ang,zPos:z});

// Spark plug body
const sb=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.4,10),spk);
const spx=Math.sin(ang)*(H+1.3),spy=Math.cos(ang)*(H+1.3);
sb.position.set(spx,spy,z);sb.rotation.z=-ang;engine3dGroup.add(sb);
// Spark plug ceramic
const sc=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.3,10),new THREE.MeshStandardMaterial({color:0xeeeeee,metalness:0.1,roughness:0.8}));
sc.position.set(Math.sin(ang)*(H+1.0),Math.cos(ang)*(H+1.0),z);sc.rotation.z=-ang;engine3dGroup.add(sc);
// Spark plug terminal (cap)
const st=new THREE.Mesh(new THREE.SphereGeometry(0.14,12,12),spk);
const stx=Math.sin(ang)*(H+2.0),sty=Math.cos(ang)*(H+2.0);
st.position.set(stx,sty,z);engine3dGroup.add(st);
sparkPlugs3d.push({mesh:sb,cap:st,x:spx,y:spy,z:z,angle:ang});

// SPARK GLOW — point light at each spark plug (off by default)
const gl=new THREE.PointLight(0xff6600,0,3,2);gl.position.set(spx,spy,z);engine3dGroup.add(gl);
sparkLights3d.push(gl);

// Ignition wire — thick white wire from plug to distributor
const curve=new THREE.CubicBezierCurve3(
new THREE.Vector3(stx,sty,z),
new THREE.Vector3(stx*0.7,sty+1.5,z*0.7),
new THREE.Vector3(stx*0.3,sty+3,z*0.3),
new THREE.Vector3(0,H+3.5,0));
const wire=new THREE.Mesh(new THREE.TubeGeometry(curve,24,0.045,8,false),
new THREE.MeshStandardMaterial({color:0xbbbbbb,metalness:0.3,roughness:0.5}));
engine3dGroup.add(wire);
}}

// Distributor
const dBase=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.65,0.9,16),blk);dBase.position.y=H+3.5;dBase.castShadow=true;engine3dGroup.add(dBase);
const dCap=new THREE.Mesh(new THREE.SphereGeometry(0.55,16,8,0,Math.PI*2,0,Math.PI/2),drk);dCap.position.y=H+3.95;engine3dGroup.add(dCap);

// Intake manifold
for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(1.1,0.13,10,16,Math.PI),blk);
m.position.set(0,H*0.75,-3.2+i*S);m.rotation.y=Math.PI/2;engine3dGroup.add(m);}

// Exhaust headers — dark thick tubes
for(let bank=0;bank<2;bank++){const ang=bank===0?V:-V;
for(let i=0;i<4;i++){const z=-3.2+i*S;
const ex=Math.sin(ang)*(H*0.35),ey=Math.cos(ang)*(H*0.35)-0.5;
const curve=new THREE.CubicBezierCurve3(
new THREE.Vector3(ex*2,ey,z),new THREE.Vector3(ex*2.8,ey-1,z*0.9+(bank===0?-1:1)),
new THREE.Vector3(ex*2.5,ey-3,z*0.6+(bank===0?-3:3)),new THREE.Vector3(ex*2.2,-4.5,bank===0?-5.5:5.5));
engine3dGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve,20,0.12,10,false),exh));}}

// Water pump housing (front)
const wp=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.5,16),blk);wp.rotation.x=Math.PI/2;wp.position.set(0,0,-5.0);engine3dGroup.add(wp);
}

const fireGlow=new THREE.MeshStandardMaterial({color:0xff5500,emissive:0xff4400,emissiveIntensity:4,metalness:0.3,roughness:0.3});
const defSpk=new THREE.MeshStandardMaterial({color:0xdddddd,metalness:0.6,roughness:0.3});

function animate3D(){
requestAnimationFrame(animate3D);
if(is3dRunning){crankAngle3d+=0.02*speed3d;updatePistons();updateInfoPanel();}
engine3dGroup.rotation.y=rotY;engine3dGroup.rotation.x=rotX;
document.getElementById('crankAngle3D').textContent=Math.floor(((crankAngle3d*180/Math.PI)%360+360)%360)+'°';
renderer3d.render(scene3d,camera3d);
}

function updatePistons(){
const ord=[0,4,1,5,3,7,2,6],H=3.8,str=1.3;
for(let i=0;i<pistons3d.length;i++){
const p=pistons3d[i],r=conRods3d[i],fi=ord.indexOf(i);
const phase=crankAngle3d+fi*Math.PI/4,travel=Math.cos(phase)*str;
const d=H*0.4+travel,px=Math.sin(p.angle)*d,py=Math.cos(p.angle)*d;
p.mesh.position.set(px,py,p.zPos);
const cY=-1.8;r.mesh.position.set(px/2,(py+cY)/2,p.zPos);
r.mesh.rotation.z=-Math.atan2(px,py-cY);
r.mesh.scale.y=Math.sqrt(px*px+(py-cY)*(py-cY))/2.8;
// Spark glow
const sp=((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
const firing=sp>Math.PI*0.85&&sp<Math.PI*1.15;
sparkPlugs3d[i].mesh.material=firing?fireGlow:defSpk;
sparkPlugs3d[i].cap.material=firing?fireGlow:defSpk;
sparkLights3d[i].intensity=firing?3.0:0;
sparkLights3d[i].color.set(firing?0xff5500:0x000000);
}}

function updateInfoPanel(){
const sn=['Intake','Compression','Power','Exhaust'];
const sd=['Piston down — drawing fuel-air mixture in.','Piston up — compressing the mixture.','SPARK! Explosion forces piston down — POWER!','Piston up — pushing burnt gases out.'];
const cp=((crankAngle3d/(Math.PI*2))%1+1)%1,ci=Math.floor(cp*8)%8,si=Math.floor(cp*32)%4;
const $=id=>document.getElementById(id);
$('currentStroke3D').textContent=sn[si];$('strokeDesc3D').textContent=sd[si];
$('firingCyl3D').textContent=firingOrder3d[ci];$('rpm3D').textContent=Math.floor(speed3d*1000+cp*500);
$('progress3D').textContent=Math.floor(cp*100);
}

function toggleXRay(){isXRay=!isXRay;document.getElementById('xrayBtn').classList.toggle('xray-active');
cylWalls3d.forEach(m=>{m.material.transparent=true;m.material.opacity=isXRay?0.08:m.material.side===THREE.DoubleSide?0.35:1;m.material.needsUpdate=true;});}

function togglePlay3D(){is3dRunning=!is3dRunning;const b=document.getElementById('play3dBtn');
b.textContent=is3dRunning?'⏸ Pause':'▶ Resume';b.classList.toggle('active-pause',is3dRunning);}

function reset3D(){is3dRunning=false;crankAngle3d=0;rotX=0.3;rotY=-0.5;speed3d=1;
document.getElementById('speed3dSlider').value=1;document.getElementById('speed3dValue').textContent='1x';
document.getElementById('play3dBtn').textContent='▶ Resume';document.getElementById('play3dBtn').classList.remove('active-pause');
document.getElementById('currentStroke3D').textContent='Idle';document.getElementById('strokeDesc3D').textContent='Press Play to start.';
document.getElementById('firingCyl3D').textContent='—';document.getElementById('rpm3D').textContent='0';document.getElementById('progress3D').textContent='0';
updatePistons();}

function set3DSpeed(v){speed3d=parseFloat(v);document.getElementById('speed3dValue').textContent=v+'x';}

function setupMouseControls(c){
c.addEventListener('mousedown',e=>{mouseDown=true;mouseX=e.clientX;mouseY=e.clientY;});
c.addEventListener('mousemove',e=>{if(!mouseDown)return;rotY+=(e.clientX-mouseX)*0.005;rotX=Math.max(-1.2,Math.min(1.2,rotX+(e.clientY-mouseY)*0.005));mouseX=e.clientX;mouseY=e.clientY;});
c.addEventListener('mouseup',()=>mouseDown=false);c.addEventListener('mouseleave',()=>mouseDown=false);
c.addEventListener('wheel',e=>{e.preventDefault();camera3d.position.z=Math.max(8,Math.min(35,camera3d.position.z+e.deltaY*0.01));},{passive:false});
c.addEventListener('touchstart',e=>{mouseDown=true;mouseX=e.touches[0].clientX;mouseY=e.touches[0].clientY;});
c.addEventListener('touchmove',e=>{if(!mouseDown)return;rotY+=(e.touches[0].clientX-mouseX)*0.005;rotX=Math.max(-1.2,Math.min(1.2,rotX+(e.touches[0].clientY-mouseY)*0.005));mouseX=e.touches[0].clientX;mouseY=e.touches[0].clientY;});
c.addEventListener('touchend',()=>mouseDown=false);
}
