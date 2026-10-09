const filters = document.querySelectorAll('[data-filter]');
const cards = document.querySelectorAll('[data-category]');

filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const value = filter.dataset.filter;
    filters.forEach((item) => {
      const active = item === filter;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    cards.forEach((card) => {
      card.hidden = value !== 'all' && card.dataset.category !== value;
    });
  });
});

const canvas = document.querySelector('#scene-canvas');

if (canvas) {
  const loadScene = async () => {
    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js');
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x080b12, 7, 15);

      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
      camera.position.set(0, 0.2, 8.4);

      const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const constellation = new THREE.Group();
      scene.add(constellation);

      scene.add(new THREE.AmbientLight(0x93a4c4, 1.8));
      const keyLight = new THREE.PointLight(0xb6e85f, 18, 14);
      keyLight.position.set(-2.5, 3.4, 4.2);
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(0x6c8dff, 14, 12);
      fillLight.position.set(4, -2, 3);
      scene.add(fillLight);

      const products = [
        {label: 'SOCIAL', color: 0x7d5cff, position: [-2.9, 1.1, 0.2], scale: 1.08},
        {label: 'FORMA', color: 0xf5a623, position: [2.7, 1.15, -0.2], scale: 0.9},
        {label: 'YUK', color: 0x5a8cff, position: [2.4, -1.35, 0.2], scale: 1.12},
        {label: 'BERBER', color: 0x34c759, position: [-2.55, -1.55, -0.3], scale: 0.82},
        {label: 'MATCH', color: 0xb6e85f, position: [0.15, 2.05, -0.5], scale: 0.72},
        {label: 'PUZZLE', color: 0xff6b8a, position: [0.45, -2.1, -0.1], scale: 0.64}
      ];

      const centerGeometry = new THREE.IcosahedronGeometry(0.62, 2);
      const center = new THREE.Mesh(centerGeometry, new THREE.MeshStandardMaterial({color: 0xf8fafc, metalness: 0.65, roughness: 0.18}));
      constellation.add(center);
      const centerHalo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.86, 1), new THREE.MeshBasicMaterial({color: 0xb6e85f, wireframe: true, transparent: true, opacity: 0.32}));
      constellation.add(centerHalo);

      const nodeMeshes = [];
      products.forEach((product, index) => {
        const geometry = new THREE.BoxGeometry(0.58 * product.scale, 0.58 * product.scale, 0.58 * product.scale);
        const material = new THREE.MeshStandardMaterial({color: product.color, metalness: 0.48, roughness: 0.24});
        const node = new THREE.Mesh(geometry, material);
        node.position.set(...product.position);
        node.rotation.set(index * 0.25, index * 0.42, index * 0.18);
        node.userData = {baseY: node.position.y, phase: index * 0.82};
        nodeMeshes.push(node);
        constellation.add(node);

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.3}));
        node.add(edges);

        const connectorGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(...product.position)]);
        const connector = new THREE.Line(connectorGeometry, new THREE.LineBasicMaterial({color: product.color, transparent: true, opacity: 0.28}));
        constellation.add(connector);
      });

      const orbitMaterial = new THREE.MeshBasicMaterial({color: 0x9aaccb, transparent: true, opacity: 0.22, wireframe: true});
      const orbitOne = new THREE.Mesh(new THREE.TorusGeometry(3.18, 0.009, 8, 160), orbitMaterial);
      orbitOne.rotation.set(0.4, 0.12, -0.3);
      constellation.add(orbitOne);
      const orbitTwo = new THREE.Mesh(new THREE.TorusGeometry(4.05, 0.007, 8, 160), orbitMaterial.clone());
      orbitTwo.rotation.set(-0.22, 0.52, 0.35);
      orbitTwo.material.opacity = 0.14;
      constellation.add(orbitTwo);

      const starPositions = [];
      for (let index = 0; index < 150; index += 1) {
        starPositions.push((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, -2 - Math.random() * 5);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
      scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({color: 0x91a4c6, size: 0.025, transparent: true, opacity: 0.72})));

      const grid = new THREE.GridHelper(14, 14, 0x26334a, 0x111827);
      grid.rotation.x = Math.PI / 2;
      grid.position.z = -2.15;
      grid.material.transparent = true;
      grid.material.opacity = 0.25;
      scene.add(grid);

      const pointer = {x: 0, y: 0};
      const target = {x: 0, y: 0};
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const resize = () => {
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      const movePointer = (event) => {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      };

      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', movePointer, {passive: true});
      resize();

      const render = (time = 0) => {
        const seconds = time * 0.001;
        target.x += (pointer.y * 0.16 - target.x) * 0.035;
        target.y += (pointer.x * 0.22 - target.y) * 0.035;
        constellation.rotation.x = target.x + (reducedMotion ? 0 : seconds * 0.035);
        constellation.rotation.y = target.y + (reducedMotion ? 0 : seconds * 0.06);
        center.rotation.x = seconds * 0.16;
        center.rotation.y = seconds * 0.24;
        centerHalo.rotation.z = -seconds * 0.18;
        products.forEach((product, index) => {
          const node = nodeMeshes[index];
          if (node && node.userData) {
            node.position.y = node.userData.baseY + (reducedMotion ? 0 : Math.sin(seconds * 0.8 + node.userData.phase) * 0.08);
            node.rotation.x += reducedMotion ? 0 : 0.0025;
            node.rotation.y += reducedMotion ? 0 : 0.0035;
          }
        });
        orbitOne.rotation.z += reducedMotion ? 0 : 0.0008;
        orbitTwo.rotation.x -= reducedMotion ? 0 : 0.0005;
        renderer.render(scene, camera);
        if (!reducedMotion) window.requestAnimationFrame(render);
      };

      render();
    } catch (error) {
      canvas.classList.add('scene-fallback');
      canvas.setAttribute('aria-label', '3D sahne kullanılamıyor');
    }
  };

  loadScene();
}
