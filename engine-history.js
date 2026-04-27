(() => {
  const ERAS = [
    {
      era: "External Combustion",
      num: "01",
      title: "Era of Steam",
      desc: "Before engines lived inside cars, they were massive iron giants powering mines, factories, and the first big leap in machine-driven civilization.",
      engine: "steam",
      events: [
        { y: "60 AD", b: "Hero of Alexandria", t: "described the aeolipile, a steam turbine treated more like a curiosity than a machine for work." },
        { y: "1712", b: "Thomas Newcomen", t: "built the first commercially successful atmospheric steam engine for pumping water out of mines." },
        { y: "1769", b: "James Watt", t: "added a separate condenser, making steam power efficient enough to accelerate the Industrial Revolution." }
      ]
    },
    {
      era: "Internal Combustion",
      num: "02",
      title: "The IC Breakthrough",
      desc: "Moving combustion inside the engine itself made power smaller, lighter, and portable enough for the automobile to become practical.",
      engine: "ic",
      events: [
        { y: "1860", b: "Etienne Lenoir", t: "developed one of the first commercially successful internal combustion engines, inefficient but historically pivotal." },
        { y: "1876", b: "Nicolaus Otto", t: "patented the four-stroke cycle that still defines most gasoline engines today." },
        { y: "1885", b: "Karl Benz", t: "built the Benz Patent-Motorwagen, widely recognized as the first practical automobile powered by an IC engine." },
        { y: "1892", b: "Rudolf Diesel", t: "patented the diesel engine, pushing efficiency forward through compression ignition." }
      ]
    },
    {
      era: "High Performance",
      num: "03",
      title: "Modern Innovation",
      desc: "Engines became precision systems: roaring V8s, compact rotaries, hybrids, and electric motors all reshaping what performance can feel like.",
      engine: "modern",
      events: [
        { y: "1950s", b: "V8 and Turbocharging", t: "set the tone for performance and luxury across racing, muscle cars, and grand tourers." },
        { y: "1957", b: "Felix Wankel", t: "introduced the rotary engine, replacing pistons with a triangular rotor in a compact housing." },
        { y: "2000s", b: "Hybrid Drivetrains", t: "paired combustion engines with electric motors for better efficiency without giving up range." },
        { y: "Today", b: "Electric Motors", t: "deliver instant torque, fewer moving parts, and a new definition of what an engine can be." }
      ]
    }
  ];

  class EngineHistory {
    constructor(root) {
      this.root = root;
      this.canvas = document.getElementById("engineHistoryCanvas");
      this.eraEl = document.getElementById("engineHistoryEra");
      this.numEl = document.getElementById("engineHistoryNum");
      this.titleEl = document.getElementById("engineHistoryTitle");
      this.descEl = document.getElementById("engineHistoryDesc");
      this.eventsEl = document.getElementById("engineHistoryEvents");
      this.dotsEl = document.getElementById("engineHistoryDots");
      this.navEl = document.getElementById("engineHistoryNav");
      this.fadeTargets = Array.from(root.querySelectorAll(".history-fade-target"));
      this.index = 0;
      this.targetRotY = -0.3;
      this.wheelLock = false;
      this.unlockTimer = 0;
      this.sceneState = null;
      this.onResize = this.onResize.bind(this);
      this.onMove = this.onMove.bind(this);
      this.onLeave = this.onLeave.bind(this);
      this.onWheel = this.onWheel.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.buildControls();
      this.mountScene();
      this.bindEvents();
      this.render();
    }

    buildControls() {
      ERAS.forEach((era, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "engine-history-dot";
        dot.setAttribute("aria-label", `Show ${era.title}`);
        dot.addEventListener("click", () => this.setIndex(index));
        this.dotsEl.appendChild(dot);

        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "engine-history-tab";
        tab.addEventListener("click", () => this.setIndex(index));
        tab.innerHTML = `<span class="engine-history-tab-index">0${index + 1}</span><span class="engine-history-tab-label">${era.title}</span>`;
        this.navEl.appendChild(tab);
      });
    }

    bindEvents() {
      this.root.addEventListener("mousemove", this.onMove);
      this.root.addEventListener("mouseleave", this.onLeave);
      this.root.addEventListener("wheel", this.onWheel, { passive: false });
      this.root.addEventListener("keydown", this.onKeydown);
      window.addEventListener("resize", this.onResize);
    }

    mountScene() {
      if (typeof THREE === "undefined") {
        const fallback = document.createElement("div");
        fallback.className = "engine-history-fallback";
        fallback.textContent = "Three.js failed to load, so the history model could not start.";
        this.canvas.appendChild(fallback);
        return;
      }

      const width = this.canvas.clientWidth || this.root.clientWidth;
      const height = this.canvas.clientHeight || this.root.clientHeight || 680;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.04);

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(6, 3.5, 8);
      camera.lookAt(0, 0.5, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      this.canvas.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0x222233, 0.6));
      const key = new THREE.DirectionalLight(0xffb060, 1.4);
      key.position.set(5, 6, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x4080ff, 0.8);
      rim.position.set(-6, 2, -4);
      scene.add(rim);
      const fill = new THREE.PointLight(0xd4841a, 1.2, 15);
      fill.position.set(0, 1, 3);
      scene.add(fill);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4, metalness: 0.8 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.5;
      scene.add(floor);

      const group = new THREE.Group();
      scene.add(group);

      const mats = {
        brass: new THREE.MeshStandardMaterial({ color: 0xb8732a, roughness: 0.35, metalness: 0.95 }),
        iron: new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.6, metalness: 0.7 }),
        steel: new THREE.MeshStandardMaterial({ color: 0x707880, roughness: 0.25, metalness: 0.95 }),
        dark: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.6 }),
        accent: new THREE.MeshStandardMaterial({ color: 0xd4841a, roughness: 0.3, metalness: 0.9, emissive: 0x331100, emissiveIntensity: 0.4 }),
        copper: new THREE.MeshStandardMaterial({ color: 0xc87533, roughness: 0.4, metalness: 0.9 })
      };

      const state = { kind: "steam", pistons: [], spinners: [], steam: [], rotor: null, disposable: [] };
      const glow = () => {
        const material = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.35 });
        state.disposable.push(material);
        return material;
      };
      const clear = () => {
        group.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
        });
        state.disposable.splice(0).forEach((material) => material.dispose());
        group.clear();
        state.pistons = [];
        state.spinners = [];
        state.steam = [];
        state.rotor = null;
      };
      const build = (kind) => {
        clear();
        state.kind = kind;
        if (kind === "steam") this.buildSteam(group, mats, state, glow);
        else if (kind === "ic") this.buildIC(group, mats, state, glow);
        else this.buildModern(group, mats, state, glow);
      };

      const clock = new THREE.Clock();
      const animate = () => {
        const t = clock.getElapsedTime();
        group.rotation.y += (this.targetRotY - group.rotation.y) * 0.05;

        if (state.kind === "steam") {
          state.spinners.forEach((wheel) => { wheel.rotation.z = -t * 1.8; });
          state.pistons.forEach((rod) => { rod.position.x = 2.4 + Math.cos(t * 1.8) * 0.35; });
          state.steam.forEach((puff, index) => {
            const phase = (t * 0.6 + index * 0.4) % 2.5;
            puff.position.y = 2.1 + phase * 0.5;
            puff.scale.setScalar(1 + phase * 0.4);
            puff.material.opacity = Math.max(0, 0.5 - phase * 0.2);
          });
        } else if (state.kind === "ic") {
          state.pistons.forEach((piston) => {
            piston.position.y = piston.userData.baseY + Math.sin(t * 8 + piston.userData.phase) * 0.18;
          });
          state.spinners.forEach((part) => { part.rotation.x = t * 8; });
          state.steam.forEach((spark, index) => {
            const fire = (Math.sin(t * 8 + index * (Math.PI / 2)) + 1) * 0.5;
            spark.material.opacity = fire * 0.9;
            spark.scale.setScalar(0.8 + fire * 1.2);
          });
        } else {
          if (state.rotor) {
            const rotation = t * 1.2;
            state.rotor.rotation.z = rotation;
            state.rotor.position.x = Math.cos(rotation * 3) * 0.18;
            state.rotor.position.y = 0.3 + Math.sin(rotation * 3) * 0.18;
          }
          state.steam.forEach((core) => {
            const pulse = (Math.sin(t * 4) + 1) * 0.5;
            core.scale.setScalar(0.8 + pulse * 0.5);
            core.material.opacity = 0.5 + pulse * 0.4;
          });
        }

        renderer.render(scene, camera);
        this.sceneState.rafId = window.requestAnimationFrame(animate);
      };

      this.sceneState = { camera, renderer, build, rafId: 0 };
      build(ERAS[0].engine);
      animate();
    }

    buildSteam(group, mats, state, glow) {
      const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 3.1, 28), mats.iron);
      boiler.rotation.z = Math.PI / 2;
      boiler.position.y = 0.2;
      group.add(boiler);

      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.5, 16), mats.iron);
      stack.position.set(-1.25, 1.35, 0);
      group.add(stack);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2), mats.brass);
      dome.position.set(0.2, 1.25, 0);
      group.add(dome);

      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 12), mats.steel);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(2.4, -0.2, 0.45);
      group.add(rod);
      state.pistons.push(rod);

      const wheel = new THREE.Group();
      wheel.position.set(2.1, -0.45, 0.45);
      wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.12, 10, 28), mats.iron));
      for (let i = 0; i < 8; i += 1) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.42, 0.06), mats.steel);
        spoke.rotation.z = (i / 8) * Math.PI * 2;
        wheel.add(spoke);
      }
      group.add(wheel);
      state.spinners.push(wheel);

      for (let i = 0; i < 5; i += 1) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.08, 10, 10), glow());
        puff.position.set(-1.25, 2.1 + i * 0.2, (Math.random() - 0.5) * 0.18);
        group.add(puff);
        state.steam.push(puff);
      }
    }

    buildIC(group, mats, state, glow) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 1.6), mats.dark);
      block.position.y = 0.1;
      group.add(block);
      const head = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.35, 1.7), mats.steel);
      head.position.y = 0.98;
      group.add(head);
      const cover = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 1.4), mats.accent);
      cover.position.y = 1.28;
      group.add(cover);

      for (let i = 0; i < 4; i += 1) {
        const x = -0.9 + i * 0.6;
        const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16), mats.brass);
        piston.position.set(x, 1.55, 0);
        piston.userData.baseY = 1.55;
        piston.userData.phase = i * (Math.PI / 2);
        group.add(piston);
        state.pistons.push(piston);

        const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glow());
        spark.position.set(x, 1.9, 0);
        group.add(spark);
        state.steam.push(spark);
      }

      const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 16), mats.copper);
      crank.rotation.z = Math.PI / 2;
      crank.position.y = -0.7;
      group.add(crank);
      state.spinners.push(crank);

      const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.18, 30), mats.iron);
      flywheel.rotation.z = Math.PI / 2;
      flywheel.position.set(1.55, -0.7, 0);
      group.add(flywheel);
      state.spinners.push(flywheel);
    }

    buildModern(group, mats, state, glow) {
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.1, 40), mats.dark);
      housing.rotation.x = Math.PI / 2;
      housing.position.y = 0.3;
      group.add(housing);
      const frontRim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.06, 12, 40), mats.accent);
      frontRim.position.set(0, 0.3, 0.55);
      group.add(frontRim);
      const rearRim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.06, 12, 40), mats.accent);
      rearRim.position.set(0, 0.3, -0.55);
      group.add(rearRim);

      const triangle = new THREE.Shape();
      [[0, -0.88], [0.77, 0.44], [-0.77, 0.44]].forEach(([x, y], index) => {
        if (index === 0) triangle.moveTo(x, y);
        else triangle.lineTo(x, y);
      });
      triangle.closePath();
      const rotor = new THREE.Mesh(new THREE.ExtrudeGeometry(triangle, { depth: 0.92, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 }), mats.accent);
      rotor.geometry.center();
      rotor.position.set(0, 0.3, 0);
      group.add(rotor);
      state.rotor = rotor;

      for (let i = 0; i < 5; i += 1) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.04, 8, 28), mats.copper);
        ring.position.set(-2 + i * 0.06, 0.3, 0);
        ring.rotation.y = Math.PI / 2;
        group.add(ring);
      }

      const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), glow());
      core.position.set(-2, 0.3, 0);
      group.add(core);
      state.steam.push(core);

      const base = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.15, 1.5), mats.dark);
      base.position.y = -0.5;
      group.add(base);
    }

    onResize() {
      if (!this.sceneState) return;
      const width = this.canvas.clientWidth || this.root.clientWidth;
      const height = this.canvas.clientHeight || this.root.clientHeight || 680;
      this.sceneState.camera.aspect = width / height;
      this.sceneState.camera.updateProjectionMatrix();
      this.sceneState.renderer.setSize(width, height);
    }

    onMove(event) {
      if (!this.sceneState) return;
      const rect = this.root.getBoundingClientRect();
      const mx = (event.clientX - rect.left) / rect.width - 0.5;
      const my = (event.clientY - rect.top) / rect.height - 0.5;
      this.targetRotY = -0.3 + mx * 0.6;
      this.sceneState.camera.position.y = 3.5 - my * 1.2;
      this.sceneState.camera.lookAt(0, 0.5, 0);
    }

    onLeave() {
      if (!this.sceneState) return;
      this.targetRotY = -0.3;
      this.sceneState.camera.position.y = 3.5;
      this.sceneState.camera.lookAt(0, 0.5, 0);
    }

    onWheel(event) {
      if (this.wheelLock || Math.abs(event.deltaY) < 8) return;
      const next = Math.max(0, Math.min(ERAS.length - 1, this.index + (event.deltaY > 0 ? 1 : -1)));
      if (next === this.index) return;
      event.preventDefault();
      this.wheelLock = true;
      this.setIndex(next);
      window.clearTimeout(this.unlockTimer);
      this.unlockTimer = window.setTimeout(() => { this.wheelLock = false; }, 700);
    }

    onKeydown(event) {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        this.setIndex(this.index + 1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        this.setIndex(this.index - 1);
      }
    }

    setIndex(next) {
      const clamped = Math.max(0, Math.min(ERAS.length - 1, next));
      if (clamped === this.index) return;
      this.index = clamped;
      this.render();
    }

    renderEvents(events) {
      this.eventsEl.innerHTML = "";
      events.forEach((event, index) => {
        const row = document.createElement("div");
        row.className = "engine-history-event history-fade-in";
        row.style.animationDelay = `${index * 90}ms`;
        row.style.animationFillMode = "both";
        row.innerHTML = `<div class="engine-history-event-year">${event.y}</div><div class="engine-history-event-body"><span class="engine-history-event-name">${event.b}</span> - ${event.t}</div>`;
        this.eventsEl.appendChild(row);
      });
    }

    render() {
      const current = ERAS[this.index];
      this.eraEl.textContent = current.era;
      this.numEl.textContent = current.num;
      this.titleEl.textContent = current.title;
      this.descEl.textContent = current.desc;

      this.fadeTargets.forEach((element) => {
        element.classList.remove("history-fade-in");
        void element.offsetWidth;
        element.classList.add("history-fade-in");
      });

      this.renderEvents(current.events);
      Array.from(this.dotsEl.children).forEach((dot, index) => dot.classList.toggle("is-active", index === this.index));
      Array.from(this.navEl.children).forEach((tab, index) => tab.classList.toggle("is-active", index === this.index));
      if (this.sceneState) this.sceneState.build(current.engine);
    }
  }

  const init = () => {
    const root = document.getElementById("engineHistoryStage");
    if (!root || root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    new EngineHistory(root);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
