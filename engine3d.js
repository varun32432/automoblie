// V8 Engine — Solid Metallic Shell + RPM Tachometer
let scene3d,camera3d,renderer3d,engine3dGroup,is3dRunning=false,isXRay=false,crankAngle3d=0,speed3d=1;
let pistons3d=[],conRods3d=[],sparkPlugs3d=[],cylWalls3d=[],sparkLights3d=[],shellParts3d=[];
let mouseDown=false,mouseX=0,mouseY=0,rotX=0.3,rotY=-0.5;
let currentRPM=800;
const firingOrder3d=[1,5,4,8,6,3,7,2];
const BP_LINE=0xc8b88a, BP_DIM=0x8a7e5e, BP_BG=0xdfe4ea;

// Solid materials
const matBlock=new THREE.MeshStandardMaterial({color:0x40454c,roughness:0.72,metalness:0.28});
const matCastAlum=new THREE.MeshStandardMaterial({color:0xc8cdd3,roughness:0.42,metalness:0.74});
const matAlum=new THREE.MeshStandardMaterial({color:0xd9dde2,roughness:0.26,metalness:0.84});
const matDark=new THREE.MeshStandardMaterial({color:0x16191d,roughness:0.62,metalness:0.22});
const matChrome=new THREE.MeshStandardMaterial({color:0xcfd3d8,roughness:0.12,metalness:1.0});
const matExhaust=new THREE.MeshStandardMaterial({color:0x6c6f73,roughness:0.38,metalness:0.78});
const matValveCover=new THREE.MeshPhysicalMaterial({color:0x25292e,roughness:0.86,metalness:0.08,clearcoat:0.15,clearcoatRoughness:0.78});
const matCoverTrim=new THREE.MeshStandardMaterial({color:0x69717a,roughness:0.35,metalness:0.65});
const matRubber=new THREE.MeshStandardMaterial({color:0x1d2227,roughness:0.9,metalness:0.05});
const matPiston=new THREE.MeshStandardMaterial({color:0xcccccc,roughness:0.1,metalness:0.85});
const matRod=new THREE.MeshStandardMaterial({color:0x555555,roughness:0.15,metalness:0.9});
const matSpark=new THREE.MeshStandardMaterial({color:0xdddddd,roughness:0.3,metalness:0.6});

// Solid shell helper
function registerShell(mesh){
  mesh.userData.baseOpacity=mesh.material.opacity!==undefined?mesh.material.opacity:1;
  mesh.userData.baseTransparent=!!mesh.material.transparent;
  shellParts3d.push(mesh);
  return mesh;
}
function createSolid(geo,mat,isShell){
  const material=mat.clone?mat.clone():mat;
  const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;
  if(isShell)registerShell(m);
  return m;
}
// Wireframe helper for internal parts
function createBP(geo,color,opacity){
  const c=color||BP_LINE, o=opacity||0.7;
  const g=new THREE.Group();
  const fill=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.04,depthWrite:false}));
  g.add(fill);
  const edges=new THREE.EdgesGeometry(geo,15);
  const line=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:o}));
  g.add(line);
  return g;
}

function createRoundedRectShape(width,height,radius){
  const x=-width/2,y=-height/2,r=Math.min(radius,width/2,height/2);
  const shape=new THREE.Shape();
  shape.moveTo(x+r,y);
  shape.lineTo(x+width-r,y);
  shape.quadraticCurveTo(x+width,y,x+width,y+r);
  shape.lineTo(x+width,y+height-r);
  shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  shape.lineTo(x+r,y+height);
  shape.quadraticCurveTo(x,y+height,x,y+height-r);
  shape.lineTo(x,y+r);
  shape.quadraticCurveTo(x,y,x+r,y);
  return shape;
}

function createStudioTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=1024;
  canvas.height=512;
  const ctx=canvas.getContext('2d');
  const base=ctx.createLinearGradient(0,0,0,canvas.height);
  base.addColorStop(0,'#eef2f6');
  base.addColorStop(0.55,'#dde3ea');
  base.addColorStop(1,'#bcc5ce');
  ctx.fillStyle=base;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const halo=ctx.createRadialGradient(canvas.width*0.55,canvas.height*0.32,20,canvas.width*0.55,canvas.height*0.32,360);
  halo.addColorStop(0,'rgba(255,255,255,0.95)');
  halo.addColorStop(0.3,'rgba(248,250,252,0.72)');
  halo.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=halo;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const lowerGlow=ctx.createRadialGradient(canvas.width*0.5,canvas.height*0.86,20,canvas.width*0.5,canvas.height*0.86,260);
  lowerGlow.addColorStop(0,'rgba(150,160,172,0.22)');
  lowerGlow.addColorStop(1,'rgba(150,160,172,0)');
  ctx.fillStyle=lowerGlow;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const texture=new THREE.CanvasTexture(canvas);
  texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.needsUpdate=true;
  return texture;
}

function createShadowTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=512;
  canvas.height=512;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(256,256,16,256,256,240);
  gradient.addColorStop(0,'rgba(0,0,0,0.38)');
  gradient.addColorStop(0.4,'rgba(0,0,0,0.2)');
  gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,512,512);
  return new THREE.CanvasTexture(canvas);
}

function createCoverBadge(){
  const canvas=document.createElement('canvas');
  canvas.width=256;
  canvas.height=96;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='rgba(245,247,250,0.96)';
  roundRect(ctx,0,12,256,72,16);
  ctx.fill();
  ctx.fillStyle='#57a7ff';
  ctx.fillRect(26,28,16,28);
  ctx.fillStyle='#1d2e4f';
  ctx.fillRect(46,28,16,28);
  ctx.fillStyle='#d64646';
  ctx.fillRect(66,28,16,28);
  ctx.fillStyle='#1a1d21';
  ctx.font='bold 34px Arial';
  ctx.textBaseline='middle';
  ctx.fillText('V8',104,48);
  const texture=new THREE.CanvasTexture(canvas);
  const badge=createSolid(
    new THREE.PlaneGeometry(1.85,0.7),
    new THREE.MeshBasicMaterial({map:texture,transparent:true}),
    true
  );
  badge.rotation.x=-Math.PI/2;
  return badge;
}

function init3DEngine(){
  const c=document.getElementById('engine3dContainer'),w=c.clientWidth,h=c.clientHeight;
  scene3d=new THREE.Scene();
  const studioTexture=createStudioTexture();
  scene3d.background=studioTexture;
  scene3d.environment=studioTexture;
  camera3d=new THREE.PerspectiveCamera(38,w/h,0.1,500);
  camera3d.position.set(5.5,7.5,22);camera3d.lookAt(0,1.5,0);
  renderer3d=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer3d.setSize(w,h);renderer3d.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer3d.outputEncoding=THREE.sRGBEncoding;
  c.appendChild(renderer3d.domElement);

  // Softer studio lighting for more natural surfaces.
  scene3d.add(new THREE.AmbientLight(0xf2f5f8,0.55));
  scene3d.add(new THREE.HemisphereLight(0xf8f2ea,0x9098a4,1.15));
  const key=new THREE.DirectionalLight(0xfff3e4,1.85);key.position.set(14,20,12);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene3d.add(key);
  const fill=new THREE.DirectionalLight(0xd8e6f5,0.9);fill.position.set(-16,9,10);scene3d.add(fill);
  const rim=new THREE.DirectionalLight(0xcdd7e2,0.75);rim.position.set(-10,6,-16);scene3d.add(rim);
  const top=new THREE.PointLight(0xffffff,0.45,36);top.position.set(0,14,2);scene3d.add(top);
  renderer3d.shadowMap.enabled=true;renderer3d.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer3d.toneMapping=THREE.ACESFilmicToneMapping;renderer3d.toneMappingExposure=1.08;

  const floor=new THREE.Mesh(
    new THREE.CircleGeometry(34,64),
    new THREE.MeshStandardMaterial({color:0xd2d8df,roughness:0.96,metalness:0.03})
  );
  floor.rotation.x=-Math.PI/2;
  floor.position.y=-5.95;
  floor.receiveShadow=true;
  scene3d.add(floor);

  const shadow=new THREE.Mesh(
    new THREE.PlaneGeometry(18,18),
    new THREE.MeshBasicMaterial({map:createShadowTexture(),transparent:true,depthWrite:false,opacity:0.72})
  );
  shadow.rotation.x=-Math.PI/2;
  shadow.position.y=-5.88;
  scene3d.add(shadow);

  engine3dGroup=new THREE.Group();scene3d.add(engine3dGroup);
  engine3dGroup.position.y=-0.15;
  buildEngine();setupMouseControls(c);
  document.querySelector('.animation-header h2').textContent='Interactive 3D V8 Engine';
  document.querySelector('.animation-subtitle').textContent='Explore the engine in a softer studio view. Drag to orbit and scroll to zoom.';
  document.getElementById('xrayBtn').textContent='X-Ray';
  document.getElementById('play3dBtn').textContent='Resume';
  document.querySelector('.hint-text').textContent='DRAG TO ORBIT / SCROLL TO ZOOM';
  document.querySelector('.controls-3d .btn-primary').textContent='Play / Pause';
  document.querySelector('.controls-3d .btn-secondary').textContent='Reset View';
  document.getElementById('crankAngle3D').textContent='0 deg';
  document.getElementById('firingCyl3D').textContent='-';
  window.addEventListener('resize',()=>{const nw=c.clientWidth,nh=c.clientHeight;camera3d.aspect=nw/nh;camera3d.updateProjectionMatrix();renderer3d.setSize(nw,nh);});
  initRPMGauge();
  animate3D();
}

function buildEngine(){
  const V=Math.PI/4,S=2.1,R=0.6,H=3.8;

  // === SOLID OUTER SHELL ===
  // Central block
  const b1=createSolid(new THREE.BoxGeometry(2.8,3.3,8.8),matBlock,true);b1.position.y=-1.3;engine3dGroup.add(b1);
  // Left & Right banks
  const lb=createSolid(new THREE.BoxGeometry(2.9,3.15,8.9),matCastAlum,true);lb.position.set(1.92,1.62,0);lb.rotation.z=-V;engine3dGroup.add(lb);
  const rb=createSolid(new THREE.BoxGeometry(2.9,3.15,8.9),matCastAlum,true);rb.position.set(-1.92,1.62,0);rb.rotation.z=V;engine3dGroup.add(rb);
  // Deck plates
  const ld=createSolid(new THREE.BoxGeometry(2.9,0.14,9.05),matAlum,true);ld.position.set(2.95,2.84,0);ld.rotation.z=-V;engine3dGroup.add(ld);
  const rd=createSolid(new THREE.BoxGeometry(2.9,0.14,9.05),matAlum,true);rd.position.set(-2.95,2.84,0);rd.rotation.z=V;engine3dGroup.add(rd);
  // Crankcase + Oil pan
  const cc=createSolid(new THREE.CylinderGeometry(2.55,1.85,9.1,8),matBlock,true);cc.rotation.x=Math.PI/2;cc.rotation.y=Math.PI/8;cc.position.y=-2.55;engine3dGroup.add(cc);
  const pan=createSolid(new THREE.BoxGeometry(2.95,1.05,8.9),matDark,true);pan.position.y=-3.82;engine3dGroup.add(pan);
  // Front timing cover
  const fc=createSolid(new THREE.BoxGeometry(3.9,4.55,0.55),matBlock,true);fc.position.set(0,-1.45,-4.7);engine3dGroup.add(fc);

  // === INTERNAL PARTS (always visible) ===
  // Crankshaft
  const cs=createSolid(new THREE.CylinderGeometry(0.45,0.45,10,24),matChrome,false);cs.rotation.x=Math.PI/2;cs.position.y=-1.8;engine3dGroup.add(cs);
  for(let i=0;i<4;i++){const cw=createSolid(new THREE.BoxGeometry(0.3,1.0,0.4),matChrome,false);cw.position.set(0,-1.8,-3.5+i*S);engine3dGroup.add(cw);}
  // Front pulley
  const p1=createSolid(new THREE.CylinderGeometry(1.1,1.1,0.25,32),matChrome,false);p1.rotation.x=Math.PI/2;p1.position.set(0,-1.8,-5.1);engine3dGroup.add(p1);
  const p2=createSolid(new THREE.TorusGeometry(1.1,0.08,12,32),matChrome,false);p2.position.set(0,-1.8,-5.1);engine3dGroup.add(p2);
  // Center bolt
  const cb=createSolid(new THREE.CylinderGeometry(0.15,0.15,0.4,12),matSpark,false);cb.rotation.x=Math.PI/2;cb.position.set(0,-1.8,-5.3);engine3dGroup.add(cb);

  // Engine stand
  const standMat=new THREE.MeshStandardMaterial({color:0x111111,metalness:0.8,roughness:0.3});
  const bPlate=createSolid(new THREE.BoxGeometry(8,0.2,12),new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:0.9}),false);bPlate.position.y=-5.4;bPlate.receiveShadow=true;engine3dGroup.add(bPlate);
  for(let s=-1;s<=1;s+=2){
    const rail=createSolid(new THREE.CylinderGeometry(0.35,0.35,11,16),standMat,false);rail.rotation.x=Math.PI/2;rail.position.set(s*3,-4.8,0);engine3dGroup.add(rail);
    for(let z of[-3.5,0,3.5]){const sup=createSolid(new THREE.CylinderGeometry(0.15,0.15,1.8,8),standMat,false);sup.position.set(s*2.3,-4.0,z);sup.rotation.z=s*-Math.PI/6;engine3dGroup.add(sup);}
  }
  for(let z of[-4.5,4.5]){const cr2=createSolid(new THREE.CylinderGeometry(0.2,0.2,6,16),standMat,false);cr2.rotation.z=Math.PI/2;cr2.position.set(0,-4.8,z);engine3dGroup.add(cr2);}
  // Arch
  const arch=createSolid(new THREE.TorusGeometry(3.5,0.2,16,32,Math.PI),standMat,false);arch.position.set(0,-4.8,-4.2);engine3dGroup.add(arch);

  // === CYLINDER BANKS ===
  for(let bank=0;bank<2;bank++){
    const ang=bank===0?V:-V;
    // Valve cover (shell)
    const vc=createSolid(new THREE.BoxGeometry(1.6,0.5,8.2),matValveCover,true);
    const vcx=Math.sin(ang)*(H+0.8),vcy=Math.cos(ang)*(H+0.8);
    vc.position.set(vcx,vcy,0);vc.rotation.z=-ang;engine3dGroup.add(vc);
    // Valve cover bolts
    for(let b=0;b<6;b++){const vb=createSolid(new THREE.CylinderGeometry(0.05,0.05,0.2,8),matChrome,false);vb.position.set(vcx+Math.sin(ang)*0.4,vcy+Math.cos(ang)*0.4,-3.5+b*1.5);engine3dGroup.add(vb);}

    for(let i=0;i<4;i++){
      const z=-3.2+i*S;
      // Cylinder wall (shell, glass-like)
      const glMat=new THREE.MeshPhysicalMaterial({color:0x5d636a,metalness:0.1,roughness:0.08,transparent:true,opacity:0.22,transmission:0.45,thickness:0.35,side:THREE.DoubleSide});
      const cw=new THREE.Mesh(new THREE.CylinderGeometry(R+0.12,R+0.12,H,24,1,true),glMat);
      cw.position.set(Math.sin(ang)*(H/2+0.3),Math.cos(ang)*(H/2+0.3),z);cw.rotation.z=-ang;
      engine3dGroup.add(cw);registerShell(cw);
      // Cylinder head (shell)
      const hd=createSolid(new THREE.CylinderGeometry(R+0.22,R+0.18,0.55,24),matCastAlum,true);
      hd.position.set(Math.sin(ang)*(H+0.55),Math.cos(ang)*(H+0.55),z);hd.rotation.z=-ang;engine3dGroup.add(hd);

      // Piston (internal)
      const pt=createSolid(new THREE.CylinderGeometry(R-0.04,R-0.04,0.55,24),matPiston,false);
      pt.rotation.z=-ang;engine3dGroup.add(pt);
      pistons3d.push({mesh:pt,angle:ang,zPos:z});
      // Connecting rod (internal)
      const cr=createSolid(new THREE.CylinderGeometry(0.07,0.11,2.8,10),matRod,false);
      cr.rotation.z=-ang;engine3dGroup.add(cr);
      conRods3d.push({mesh:cr,angle:ang,zPos:z});

      // Spark plug
      const sb=createSolid(new THREE.CylinderGeometry(0.07,0.07,1.4,10),matSpark,false);
      const spx=Math.sin(ang)*(H+1.3),spy=Math.cos(ang)*(H+1.3);
      sb.position.set(spx,spy,z);sb.rotation.z=-ang;engine3dGroup.add(sb);
      const sc=createSolid(new THREE.CylinderGeometry(0.1,0.1,0.3,10),new THREE.MeshStandardMaterial({color:0xeeeeee,metalness:0.1,roughness:0.8}),false);
      sc.position.set(Math.sin(ang)*(H+1.0),Math.cos(ang)*(H+1.0),z);sc.rotation.z=-ang;engine3dGroup.add(sc);
      const st=createSolid(new THREE.SphereGeometry(0.14,12,12),matSpark,false);
      const stx=Math.sin(ang)*(H+2.0),sty=Math.cos(ang)*(H+2.0);
      st.position.set(stx,sty,z);engine3dGroup.add(st);
      sparkPlugs3d.push({mesh:sb,cap:st,x:spx,y:spy,z:z,angle:ang});

      // Spark glow light
      const gl=new THREE.PointLight(0xff6600,0,3,2);gl.position.set(spx,spy,z);engine3dGroup.add(gl);
      sparkLights3d.push(gl);

      // Ignition wire
      const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(stx,sty,z),new THREE.Vector3(stx*0.7,sty+1.5,z*0.7),new THREE.Vector3(stx*0.3,sty+3,z*0.3),new THREE.Vector3(0,H+3.5,0));
      engine3dGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,0.045,8,false),new THREE.MeshStandardMaterial({color:0xbbbbbb,metalness:0.3,roughness:0.5})));
    }
  }

  // === MOLDED INTAKE COVER + RIGHT-SIDE INLET ===
  const coverShape=createRoundedRectShape(5.8,8.9,1.05);
  const coverGeo=new THREE.ExtrudeGeometry(coverShape,{depth:1.2,bevelEnabled:true,bevelThickness:0.22,bevelSize:0.24,bevelSegments:5,curveSegments:20});
  coverGeo.center();
  const cover=createSolid(coverGeo,matValveCover,true);
  cover.rotation.x=-Math.PI/2;
  cover.position.set(-0.05,H+2.2,0.15);
  cover.scale.set(1,1.05,1);
  engine3dGroup.add(cover);

  const topPlate=createSolid(new THREE.BoxGeometry(4.15,0.14,6.55),matCoverTrim,true);
  topPlate.position.set(-0.05,H+2.92,0.1);
  topPlate.rotation.z=-0.02;
  engine3dGroup.add(topPlate);

  const centerSpine=createSolid(new THREE.BoxGeometry(0.58,0.22,6.5),matCoverTrim,true);
  centerSpine.position.set(0.1,H+3.02,0.15);
  engine3dGroup.add(centerSpine);

  for(let s=-1;s<=1;s+=2){
    const shoulder=createSolid(new THREE.BoxGeometry(0.85,0.55,7.65),matValveCover,true);
    shoulder.position.set(s*2.15,H+2.25,0.05);
    shoulder.rotation.z=s*0.2;
    engine3dGroup.add(shoulder);
  }

  for(let i=0;i<5;i++){
    const vent=createSolid(new THREE.BoxGeometry(0.16,0.12,0.95-0.08*i),matDark,true);
    vent.position.set(-1.8+i*0.36,H+3.04,-2.55+i*0.18);
    vent.rotation.y=-0.45;
    vent.rotation.z=-0.06;
    engine3dGroup.add(vent);
  }

  for(let i=0;i<4;i++){
    const recess=createSolid(new THREE.CylinderGeometry(0.16,0.19,0.1,16),matDark,true);
    recess.rotation.x=Math.PI/2;
    recess.position.set(1.9,H+3.02,-2.65+i*1.65);
    engine3dGroup.add(recess);
  }

  const badge=createCoverBadge();
  badge.position.set(1.08,H+3.03,2.2);
  engine3dGroup.add(badge);

  const cap=createSolid(new THREE.CylinderGeometry(0.28,0.28,0.22,20),new THREE.MeshStandardMaterial({color:0xe0b84a,roughness:0.34,metalness:0.5}),false);
  cap.position.set(-1.85,H+3.02,1.7);
  engine3dGroup.add(cap);

  const plenum=createSolid(new THREE.BoxGeometry(3.35,1.25,3.0),matValveCover,true);
  plenum.position.set(2.25,H+1.62,0.05);
  plenum.rotation.z=-0.08;
  engine3dGroup.add(plenum);

  const throttle=createSolid(new THREE.CylinderGeometry(0.9,1.05,2.3,28),matRubber,true);
  throttle.rotation.z=Math.PI/2;
  throttle.position.set(4.25,H+1.78,0.05);
  engine3dGroup.add(throttle);

  const throttleLip=createSolid(new THREE.CylinderGeometry(1.08,1.08,0.22,28),matAlum,false);
  throttleLip.rotation.z=Math.PI/2;
  throttleLip.position.set(5.33,H+1.78,0.05);
  engine3dGroup.add(throttleLip);

  for(let i=0;i<3;i++){
    const clamp=createSolid(new THREE.TorusGeometry(0.95,0.045,8,32),matAlum,false);
    clamp.position.set(4.7+i*0.34,H+1.78,0.05);
    clamp.rotation.y=Math.PI/2;
    engine3dGroup.add(clamp);
  }

  const intakeCurve=new THREE.CubicBezierCurve3(
    new THREE.Vector3(-2.55,H+2.0,-1.3),
    new THREE.Vector3(-3.45,H+2.15,-2.25),
    new THREE.Vector3(-3.8,H+1.7,-3.3),
    new THREE.Vector3(-3.2,H+0.4,-4.15)
  );
  engine3dGroup.add(createSolid(new THREE.TubeGeometry(intakeCurve,28,0.22,10,false),matRubber,true));
  for(let t=0.22;t<=0.8;t+=0.29){
    const p=intakeCurve.getPoint(t);
    const clamp=createSolid(new THREE.TorusGeometry(0.24,0.03,8,20),matAlum,false);
    clamp.position.copy(p);
    engine3dGroup.add(clamp);
  }

  // === IMPROVED VALVE COVERS (ribbed) ===
  for(let bank=0;bank<2;bank++){
    const ang=bank===0?V:-V;
    const vcx=Math.sin(ang)*(H+0.8),vcy=Math.cos(ang)*(H+0.8);
    // Ribs on valve cover
    for(let i=0;i<7;i++){
      const vr=createSolid(new THREE.BoxGeometry(1.7,0.12,0.15),matValveCover,true);
      vr.position.set(vcx,vcy,-3.5+i*1.15);vr.rotation.z=-ang;engine3dGroup.add(vr);
    }
  }

  // === EXHAUST HEADERS ===
  for(let bank=0;bank<2;bank++){const ang=bank===0?V:-V;
  for(let i=0;i<4;i++){const z=-3.2+i*S;
  const ex=Math.sin(ang)*(H*0.35),ey=Math.cos(ang)*(H*0.35)-0.5;
  const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(ex*2,ey,z),new THREE.Vector3(ex*2.8,ey-1,z*0.9+(bank===0?-1:1)),new THREE.Vector3(ex*2.5,ey-3,z*0.6+(bank===0?-3:3)),new THREE.Vector3(ex*2.2,-4.5,bank===0?-5.5:5.5));
  engine3dGroup.add(createSolid(new THREE.TubeGeometry(curve,20,0.12,10,false),matExhaust,true));}}

  // === FLYWHEEL (rear) ===
  const matFW=new THREE.MeshStandardMaterial({color:0x3a3a3a,roughness:0.6,metalness:0.5});
  const fw=createSolid(new THREE.CylinderGeometry(2.8,2.8,0.6,32),matFW,true);
  fw.rotation.x=Math.PI/2;fw.position.set(0,-1.8,5.2);engine3dGroup.add(fw);
  const fwRing=createSolid(new THREE.TorusGeometry(2.8,0.12,8,48),matAlum,true);
  fwRing.position.set(0,-1.8,5.2);engine3dGroup.add(fwRing);
  const fwHub=createSolid(new THREE.CylinderGeometry(0.8,0.8,0.7,16),matChrome,false);
  fwHub.rotation.x=Math.PI/2;fwHub.position.set(0,-1.8,5.2);engine3dGroup.add(fwHub);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;
    const fb=createSolid(new THREE.CylinderGeometry(0.06,0.06,0.15,8),matChrome,false);
    fb.rotation.x=Math.PI/2;fb.position.set(Math.cos(a)*0.5,-1.8+Math.sin(a)*0.5,5.55);engine3dGroup.add(fb);}
  const bell=createSolid(new THREE.CylinderGeometry(3.0,2.2,1.5,8),matBlock,true);
  bell.rotation.x=Math.PI/2;bell.position.set(0,-1.8,6.2);engine3dGroup.add(bell);

  // === FRONT MULTI-PULLEY SYSTEM ===
  // Main crank pulley (large, triple groove)
  for(let r=0.7;r<=1.0;r+=0.15){const g=createSolid(new THREE.TorusGeometry(r,0.04,8,32),matDark,false);g.position.set(0,-1.8,-5.15);engine3dGroup.add(g);}
  // Idler pulley top
  const idler=createSolid(new THREE.CylinderGeometry(0.5,0.5,0.2,16),matAlum,false);
  idler.rotation.x=Math.PI/2;idler.position.set(0,0.5,-5.1);engine3dGroup.add(idler);
  // Tensioner pulley
  const tens=createSolid(new THREE.CylinderGeometry(0.4,0.4,0.2,16),matAlum,false);
  tens.rotation.x=Math.PI/2;tens.position.set(-1.8,-2.5,-5.1);engine3dGroup.add(tens);
  // Alternator
  const altBody=createSolid(new THREE.CylinderGeometry(0.7,0.7,1.2,16),matBlock,true);
  altBody.rotation.x=Math.PI/2;altBody.position.set(2.2,-2.8,-4.2);engine3dGroup.add(altBody);
  const altPulley=createSolid(new THREE.CylinderGeometry(0.45,0.45,0.15,16),matAlum,false);
  altPulley.rotation.x=Math.PI/2;altPulley.position.set(2.2,-2.8,-5.1);engine3dGroup.add(altPulley);
  // A/C compressor
  const acBody=createSolid(new THREE.CylinderGeometry(0.6,0.6,1.0,16),matBlock,true);
  acBody.rotation.x=Math.PI/2;acBody.position.set(-2.0,-3.2,-4.2);engine3dGroup.add(acBody);
  const acPulley=createSolid(new THREE.CylinderGeometry(0.5,0.5,0.15,16),matAlum,false);
  acPulley.rotation.x=Math.PI/2;acPulley.position.set(-2.0,-3.2,-5.1);engine3dGroup.add(acPulley);
  // Serpentine belt
  const belt=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,-1.8,-5.12),new THREE.Vector3(0.8,-0.5,-5.12),new THREE.Vector3(0,0.5,-5.12),
    new THREE.Vector3(-0.8,-0.5,-5.12),new THREE.Vector3(-1.8,-2.5,-5.12),new THREE.Vector3(-2.0,-3.2,-5.12),
    new THREE.Vector3(-0.5,-3.8,-5.12),new THREE.Vector3(1.0,-3.5,-5.12),new THREE.Vector3(2.2,-2.8,-5.12),
    new THREE.Vector3(1.5,-2.0,-5.12)],true);
  engine3dGroup.add(createSolid(new THREE.TubeGeometry(belt,48,0.035,6,true),matDark,false));
  // Water pump
  const wp=createSolid(new THREE.CylinderGeometry(0.7,0.7,0.5,16),matBlock,true);
  wp.rotation.x=Math.PI/2;wp.position.set(0,-0.5,-5.0);engine3dGroup.add(wp);

  // === RIBBED OIL PAN ===
  for(let i=0;i<8;i++){const rib=createSolid(new THREE.BoxGeometry(2.7,0.08,0.12),matDark,true);rib.position.set(0,-3.35,-3.5+i*1.1);engine3dGroup.add(rib);}
  const drain=createSolid(new THREE.CylinderGeometry(0.12,0.12,0.15,8),matChrome,false);drain.position.set(0,-4.3,2);engine3dGroup.add(drain);
  // Oil sump lip
  const sumpLip=createSolid(new THREE.BoxGeometry(2.8,0.15,9.0),matDark,true);sumpLip.position.set(0,-3.3,0);engine3dGroup.add(sumpLip);

  // Oil filter
  const oilF=createSolid(new THREE.CylinderGeometry(0.35,0.35,1.2,12),new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.8,metalness:0.3}),false);
  oilF.position.set(2.0,-3.2,1.0);oilF.rotation.z=Math.PI/6;engine3dGroup.add(oilF);

  // Block bolt pattern on deck faces
  for(let bank=0;bank<2;bank++){const ang=bank===0?V:-V;
    for(let i=0;i<4;i++){const z=-3.2+i*S;
      for(let b=0;b<4;b++){const ba=b*Math.PI/2;
        const hb=createSolid(new THREE.CylinderGeometry(0.05,0.05,0.12,8),matChrome,false);
        hb.position.set(Math.sin(ang)*(H+0.85)+Math.cos(ang)*Math.cos(ba)*0.5,Math.cos(ang)*(H+0.85)-Math.sin(ang)*Math.cos(ba)*0.5,z+Math.sin(ba)*0.5);
        engine3dGroup.add(hb);}}}
}

function addLabel(text,x,y,z){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='rgba(30,32,40,0.7)';ctx.strokeStyle='#c8b88a';ctx.lineWidth=2;
  roundRect(ctx,2,2,252,60,8);ctx.fill();ctx.stroke();
  ctx.font='bold 18px monospace';ctx.fillStyle='#c8b88a';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(text,128,32);
  const tex=new THREE.CanvasTexture(canvas);
  const sp=new THREE.SpriteMaterial({map:tex,transparent:true,opacity:0.8});
  const sprite=new THREE.Sprite(sp);sprite.position.set(x,y,z);sprite.scale.set(2.5,0.6,1);
  engine3dGroup.add(sprite);
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

// Spark glow materials for solid style
const fireGlow=new THREE.MeshStandardMaterial({color:0xff5500,emissive:0xff4400,emissiveIntensity:4,metalness:0.3,roughness:0.3});
const defSpk=new THREE.MeshStandardMaterial({color:0xdddddd,metalness:0.6,roughness:0.3});

function animate3D(){
  requestAnimationFrame(animate3D);
  if(is3dRunning){
    speed3d=currentRPM/1000;
    crankAngle3d+=0.02*speed3d;
    updatePistons();updateInfoPanel();
  }
  engine3dGroup.rotation.y=rotY;engine3dGroup.rotation.x=rotX;
  document.getElementById('crankAngle3D').textContent=Math.floor(((crankAngle3d*180/Math.PI)%360+360)%360)+'°';
  updateRPMGauge();
  document.getElementById('crankAngle3D').textContent=Math.floor(((crankAngle3d*180/Math.PI)%360+360)%360)+' deg';
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
  }
}

function updateInfoPanel(){
  const sn=['Intake','Compression','Power','Exhaust'];
  const sd=['Piston down — drawing fuel-air mixture in.','Piston up — compressing the mixture.','SPARK! Explosion forces piston down — POWER!','Piston up — pushing burnt gases out.'];
  const cp=((crankAngle3d/(Math.PI*2))%1+1)%1,ci=Math.floor(cp*8)%8,si=Math.floor(cp*32)%4;
  const $=id=>document.getElementById(id);
  $('currentStroke3D').textContent=sn[si];$('strokeDesc3D').textContent=sd[si];
  const cleanDescriptions=['Piston down - drawing the fuel-air mix in.','Piston up - compressing the mixture.','Spark! Combustion drives the piston down and makes power.','Piston up - pushing burnt gases out.'];
  $('strokeDesc3D').textContent=cleanDescriptions[si];
  $('firingCyl3D').textContent=firingOrder3d[ci];$('rpm3D').textContent=currentRPM;
  $('progress3D').textContent=Math.floor(cp*100);
}

function toggleXRay(){isXRay=!isXRay;document.getElementById('xrayBtn').classList.toggle('xray-active');
  shellParts3d.forEach(m=>{
    const baseOpacity=m.userData.baseOpacity!==undefined?m.userData.baseOpacity:1;
    const baseTransparent=!!m.userData.baseTransparent||baseOpacity<1;
    m.material.transparent=isXRay||baseTransparent;
    m.material.opacity=isXRay?Math.min(0.12,Math.max(0.04,baseOpacity*0.35)):baseOpacity;
    m.material.depthWrite=!isXRay;
    m.material.needsUpdate=true;
  });}
function togglePlay3D(){is3dRunning=!is3dRunning;const b=document.getElementById('play3dBtn');
b.textContent=is3dRunning?'⏸ Pause':'▶ Resume';b.classList.toggle('active-pause',is3dRunning);}
function reset3D(){is3dRunning=false;crankAngle3d=0;rotX=0.3;rotY=-0.5;currentRPM=800;
document.getElementById('rpmSlider').value=800;
document.getElementById('play3dBtn').textContent='▶ Resume';document.getElementById('play3dBtn').classList.remove('active-pause');
document.getElementById('currentStroke3D').textContent='Idle';document.getElementById('strokeDesc3D').textContent='Press Play to start.';
document.getElementById('firingCyl3D').textContent='—';document.getElementById('rpm3D').textContent='0';document.getElementById('progress3D').textContent='0';
updatePistons();}
function togglePlay3D(){is3dRunning=!is3dRunning;const b=document.getElementById('play3dBtn');
b.textContent=is3dRunning?'Pause':'Resume';b.classList.toggle('active-pause',is3dRunning);}
function reset3D(){is3dRunning=false;crankAngle3d=0;rotX=0.3;rotY=-0.5;currentRPM=800;
document.getElementById('rpmSlider').value=800;
document.getElementById('play3dBtn').textContent='Resume';document.getElementById('play3dBtn').classList.remove('active-pause');
document.getElementById('currentStroke3D').textContent='Idle';document.getElementById('strokeDesc3D').textContent='Press Play to start.';
document.getElementById('firingCyl3D').textContent='-';document.getElementById('rpm3D').textContent='0';document.getElementById('progress3D').textContent='0';
document.getElementById('rpmValue').textContent='800 rpm';
updatePistons();}
function set3DSpeed(v){speed3d=parseFloat(v);document.getElementById('speed3dValue').textContent=v+'x';}

function setRPM(val){
  currentRPM=parseInt(val);
  document.getElementById('rpmValue').textContent=currentRPM.toLocaleString()+' rpm';
}

// ============ RPM TACHOMETER GAUGE ============
let rpmCanvas,rpmCtx;
function initRPMGauge(){
  rpmCanvas=document.getElementById('rpmGauge');
  if(!rpmCanvas)return;
  rpmCtx=rpmCanvas.getContext('2d');
  // Set canvas resolution
  const dpr=window.devicePixelRatio||1;
  const rect=rpmCanvas.getBoundingClientRect();
  rpmCanvas.width=rect.width*dpr;rpmCanvas.height=rect.height*dpr;
  rpmCtx.scale(dpr,dpr);
  rpmCanvas.style.width=rect.width+'px';rpmCanvas.style.height=rect.height+'px';
}

function updateRPMGauge(){
  if(!rpmCtx)return;
  const w=rpmCanvas.style.width?parseInt(rpmCanvas.style.width):400;
  const h=rpmCanvas.style.height?parseInt(rpmCanvas.style.height):300;
  const cx=w/2,cy=h*0.52;
  const radius=Math.min(w,h)*0.42;
  const startAngle=0.75*Math.PI; // 135deg
  const sweep=1.5*Math.PI; // 270deg
  const maxRPM=8000;

  rpmCtx.clearRect(0,0,w*2,h*2);

  // Outer ring
  rpmCtx.beginPath();rpmCtx.arc(cx,cy,radius,0,Math.PI*2);
  rpmCtx.strokeStyle='rgba(200,210,220,0.12)';rpmCtx.lineWidth=2;rpmCtx.stroke();

  // Inner ring
  rpmCtx.beginPath();rpmCtx.arc(cx,cy,radius*0.97,0,Math.PI*2);
  rpmCtx.strokeStyle='rgba(200,210,220,0.06)';rpmCtx.lineWidth=1;rpmCtx.stroke();

  // Red zone arc (6000-8000)
  const redStart=startAngle+(6000/maxRPM)*sweep;
  const redEnd=startAngle+sweep;
  rpmCtx.beginPath();rpmCtx.arc(cx,cy,radius*0.96,redStart,redEnd);
  rpmCtx.strokeStyle='rgba(255,60,60,0.25)';rpmCtx.lineWidth=8;rpmCtx.stroke();

  // Major ticks & numbers (0-8)
  for(let i=0;i<=8;i++){
    const frac=i/8;
    const angle=startAngle+frac*sweep;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    const inR=radius*0.82,outR=radius*0.95;
    rpmCtx.beginPath();
    rpmCtx.moveTo(cx+cos*inR,cy+sin*inR);
    rpmCtx.lineTo(cx+cos*outR,cy+sin*outR);
    rpmCtx.strokeStyle=i>=6?'rgba(255,80,80,0.8)':'rgba(150,165,185,0.7)';
    rpmCtx.lineWidth=2.5;rpmCtx.stroke();
    // Number
    const tR=radius*0.7;
    rpmCtx.font='bold 16px "Courier New",monospace';
    rpmCtx.fillStyle=i>=6?'rgba(255,100,100,0.9)':'rgba(190,200,215,0.85)';
    rpmCtx.textAlign='center';rpmCtx.textBaseline='middle';
    rpmCtx.fillText(i.toString(),cx+cos*tR,cy+sin*tR);
  }

  // Minor ticks
  for(let i=0;i<80;i++){
    if(i%10===0)continue;
    const frac=i/80;
    const angle=startAngle+frac*sweep;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    const inR=i%5===0?radius*0.87:radius*0.90;
    const outR=radius*0.95;
    rpmCtx.beginPath();
    rpmCtx.moveTo(cx+cos*inR,cy+sin*inR);
    rpmCtx.lineTo(cx+cos*outR,cy+sin*outR);
    rpmCtx.strokeStyle=frac>=0.75?'rgba(255,80,80,0.3)':'rgba(120,130,150,0.3)';
    rpmCtx.lineWidth=1;rpmCtx.stroke();
  }

  // Needle
  const needleFrac=Math.min(currentRPM/maxRPM,1);
  const needleAngle=startAngle+needleFrac*sweep;
  const needleLen=radius*0.65;
  // Needle shadow
  rpmCtx.beginPath();rpmCtx.moveTo(cx+1,cy+1);
  rpmCtx.lineTo(cx+1+Math.cos(needleAngle)*needleLen,cy+1+Math.sin(needleAngle)*needleLen);
  rpmCtx.strokeStyle='rgba(0,0,0,0.3)';rpmCtx.lineWidth=3;rpmCtx.stroke();
  // Needle
  rpmCtx.beginPath();rpmCtx.moveTo(cx,cy);
  rpmCtx.lineTo(cx+Math.cos(needleAngle)*needleLen,cy+Math.sin(needleAngle)*needleLen);
  rpmCtx.strokeStyle=needleFrac>=0.75?'rgba(255,100,100,0.9)':'rgba(210,215,225,0.85)';
  rpmCtx.lineWidth=2;rpmCtx.stroke();

  // Center hub
  rpmCtx.beginPath();rpmCtx.arc(cx,cy,8,0,Math.PI*2);
  rpmCtx.fillStyle='rgba(100,110,125,0.7)';rpmCtx.fill();
  rpmCtx.strokeStyle='rgba(160,170,185,0.4)';rpmCtx.lineWidth=1;rpmCtx.stroke();

  // Digital RPM
  rpmCtx.font='bold 42px "Courier New",monospace';
  rpmCtx.fillStyle='rgba(220,225,235,0.92)';
  rpmCtx.textAlign='center';rpmCtx.textBaseline='middle';
  rpmCtx.fillText(currentRPM.toLocaleString(),cx,cy+radius*0.38);
  rpmCtx.font='13px "Courier New",monospace';
  rpmCtx.fillStyle='rgba(140,150,170,0.65)';
  rpmCtx.fillText('R P M  ×  1 0 0 0',cx,cy+radius*0.52);
}

function setupMouseControls(c){
  c.addEventListener('mousedown',e=>{mouseDown=true;mouseX=e.clientX;mouseY=e.clientY;});
  c.addEventListener('mousemove',e=>{if(!mouseDown)return;rotY+=(e.clientX-mouseX)*0.005;rotX=Math.max(-1.2,Math.min(1.2,rotX+(e.clientY-mouseY)*0.005));mouseX=e.clientX;mouseY=e.clientY;});
  c.addEventListener('mouseup',()=>mouseDown=false);c.addEventListener('mouseleave',()=>mouseDown=false);
  c.addEventListener('wheel',e=>{e.preventDefault();camera3d.position.z=Math.max(8,Math.min(35,camera3d.position.z+e.deltaY*0.01));},{passive:false});
  c.addEventListener('touchstart',e=>{mouseDown=true;mouseX=e.touches[0].clientX;mouseY=e.touches[0].clientY;});
  c.addEventListener('touchmove',e=>{if(!mouseDown)return;rotY+=(e.touches[0].clientX-mouseX)*0.005;rotX=Math.max(-1.2,Math.min(1.2,rotX+(e.touches[0].clientY-mouseY)*0.005));mouseX=e.touches[0].clientX;mouseY=e.touches[0].clientY;});
  c.addEventListener('touchend',()=>mouseDown=false);
}
