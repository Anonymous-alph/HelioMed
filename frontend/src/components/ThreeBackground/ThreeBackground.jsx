import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './ThreeBackground.module.css';

export default function ThreeBackground() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a5456);
    scene.fog = new THREE.Fog(0x0a5456, 15, 45);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 18);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x7fb9a8, 0.8);
    keyLight.position.set(10, 10, 10);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xd7b86a, 0.5, 40);
    fillLight.position.set(-8, -8, 12);
    scene.add(fillLight);

    const accentLight = new THREE.PointLight(0x4a9eff, 0.4, 30);
    accentLight.position.set(-12, 5, 5);
    scene.add(accentLight);

    // Create DNA Helices
    const dnaHelices = [];
    for (let h = 0; h < 3; h++) {
      const dnaGroup = new THREE.Group();
      const helixHeight = 12;
      const radius = 1.2;
      const segments = 50;
      const turns = 3;

      for (let strand = 0; strand < 2; strand++) {
        const curve = new THREE.CatmullRomCurve3(
          Array.from({ length: segments + 1 }, (_, i) => {
            const t = i / segments;
            const angle = strand * Math.PI + t * Math.PI * 2 * turns;
            return new THREE.Vector3(
              Math.cos(angle) * radius,
              t * helixHeight - helixHeight / 2,
              Math.sin(angle) * radius
            );
          })
        );

        const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.08, 8, false);
        const strandMaterial = new THREE.MeshPhongMaterial({
          color: strand === 0 ? 0x7fb9a8 : 0xd7b86a,
          shininess: 90,
          transparent: true,
          opacity: 0.85,
          emissive: strand === 0 ? 0x7fb9a8 : 0xd7b86a,
          emissiveIntensity: 0.2,
        });

        const strandMesh = new THREE.Mesh(tubeGeometry, strandMaterial);
        dnaGroup.add(strandMesh);
      }

      // Base pairs
      for (let i = 0; i < segments; i += 4) {
        const t = i / segments;
        const angle = t * Math.PI * 2 * turns;
        const y = t * helixHeight - helixHeight / 2;

        const pos1 = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        const pos2 = new THREE.Vector3(
          Math.cos(angle + Math.PI) * radius,
          y,
          Math.sin(angle + Math.PI) * radius
        );

        const rungGeometry = new THREE.CylinderGeometry(0.04, 0.04, pos1.distanceTo(pos2), 6);
        const rungMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
        });
        const rung = new THREE.Mesh(rungGeometry, rungMaterial);
        rung.position.copy(pos1).lerp(pos2, 0.5);
        rung.lookAt(pos2);
        rung.rotateX(Math.PI / 2);
        dnaGroup.add(rung);
      }

      dnaGroup.position.set((h - 1) * 8, 0, -5 + h * 2);
      dnaGroup.userData = {
        rotationSpeed: 0.003 + Math.random() * 0.002,
        floatOffset: Math.random() * Math.PI * 2,
      };

      dnaHelices.push(dnaGroup);
      scene.add(dnaGroup);
    }

    // Create floating particles
    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x7fb9a8),
      new THREE.Color(0xd7b86a),
      new THREE.Color(0x4a9eff),
      new THREE.Color(0xffffff),
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 40;
      positions[i3 + 1] = (Math.random() - 0.5) * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Create molecules
    const molecules = [];
    for (let m = 0; m < 4; m++) {
      const molGroup = new THREE.Group();
      const centerGeom = new THREE.IcosahedronGeometry(0.4, 1);
      const centerMat = new THREE.MeshPhongMaterial({
        color: 0x7fb9a8,
        transparent: true,
        opacity: 0.9,
        emissive: 0x7fb9a8,
        emissiveIntensity: 0.2,
      });
      const center = new THREE.Mesh(centerGeom, centerMat);
      molGroup.add(center);

      const atomCount = 4 + Math.floor(Math.random() * 4);
      for (let a = 0; a < atomCount; a++) {
        const phi = Math.acos(-1 + (2 * a) / atomCount);
        const theta = Math.sqrt(atomCount * Math.PI) * phi;
        const dist = 1.2 + Math.random() * 0.5;

        const atomGeom = new THREE.SphereGeometry(0.18, 12, 12);
        const atomMat = new THREE.MeshPhongMaterial({
          color: Math.random() > 0.5 ? 0xd7b86a : 0x4a9eff,
          transparent: true,
          opacity: 0.85,
        });
        const atom = new THREE.Mesh(atomGeom, atomMat);
        atom.position.set(
          dist * Math.sin(phi) * Math.cos(theta),
          dist * Math.sin(phi) * Math.sin(theta),
          dist * Math.cos(phi)
        );
        molGroup.add(atom);

        // Bond
        const bondGeom = new THREE.CylinderGeometry(0.03, 0.03, dist, 6);
        const bondMat = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.4,
        });
        const bond = new THREE.Mesh(bondGeom, bondMat);
        bond.position.copy(atom.position).multiplyScalar(0.5);
        bond.lookAt(atom.position);
        bond.rotateX(Math.PI / 2);
        molGroup.add(bond);
      }

      molGroup.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15 - 5
      );

      molGroup.userData = {
        rotationSpeedX: 0.003 + Math.random() * 0.004,
        rotationSpeedY: 0.004 + Math.random() * 0.005,
        floatOffset: Math.random() * Math.PI * 2,
      };

      molecules.push(molGroup);
      scene.add(molGroup);
    }

    // Mouse interaction
    const mouse = new THREE.Vector2(0, 0);
    const targetPos = new THREE.Vector3(0, 0, 18);

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation
    const clock = new THREE.Clock();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotate DNA helices
      dnaHelices.forEach((helix) => {
        helix.rotation.y += helix.userData.rotationSpeed;
        helix.position.y = Math.sin(elapsed * 0.5 + helix.userData.floatOffset) * 0.5;
      });

      // Rotate molecules
      molecules.forEach((mol) => {
        mol.rotation.x += mol.userData.rotationSpeedX;
        mol.rotation.y += mol.userData.rotationSpeedY;
        mol.position.y += Math.sin(elapsed * 0.4 + mol.userData.floatOffset) * 0.005;
      });

      // Rotate particles
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;

      // Camera parallax
      targetPos.x = mouse.x * 2;
      targetPos.y = mouse.y * 1.5;
      camera.position.x += (targetPos.x - camera.position.x) * 0.03;
      camera.position.y += (targetPos.y - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = container.offsetWidth;
      const newHeight = container.offsetHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={styles.threeContainer} />;
}
