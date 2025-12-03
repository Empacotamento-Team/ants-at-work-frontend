import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Shipment, Load } from "@/types/Shipment";
import { Package } from "@/types/Package";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface Optimization3DViewProps {
  shipment: Shipment | null;
  selectedLoad?: Load | null;
}

const getFamilyColor = (familyId: number): string => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52BE80",
    "#EC7063", "#5DADE2", "#58D68D", "#F4D03F", "#AF7AC5"
  ];
  return colors[familyId % colors.length];
};

const cmToM = (cm: number): number => cm / 100;

const SCALE_FACTOR = 3;

const sortPackagesByCoordinates = (packages: Package[]): Package[] => {
  return [...packages].sort((a, b) => {
    const zA = a.zPosition || 0;
    const zB = b.zPosition || 0;
    if (Math.abs(zA - zB) > 0.01) return zA - zB;
    
    const yA = a.yPosition || 0;
    const yB = b.yPosition || 0;
    if (Math.abs(yA - yB) > 0.01) return yA - yB;
    
    const xA = a.xPosition || 0;
    const xB = b.xPosition || 0;
    return xA - xB;
  });
};

export default function Optimization3DView({ shipment, selectedLoad }: Optimization3DViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const packageMeshesRef = useRef<THREE.Mesh[]>([]);
  const containerMeshesRef = useRef<THREE.Mesh[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const animationTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const animationStartTimeRef = useRef<number>(0);
  const pausedAtTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const speedRef = useRef<number>(1);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!mountRef.current || (!shipment && !selectedLoad)) {
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );
    const isometricDistance = 30;
    camera.position.set(
      isometricDistance * 0.7,
      isometricDistance * 0.7,
      isometricDistance * 0.7
    );
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = `${width}px`;
    renderer.domElement.style.height = `${height}px`;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    const createVisualization = () => {
      packageMeshesRef.current.forEach(mesh => scene.remove(mesh));
      containerMeshesRef.current.forEach(mesh => scene.remove(mesh));
      packageMeshesRef.current = [];
      containerMeshesRef.current = [];

      const loadsToShow = selectedLoad ? [selectedLoad] : (shipment?.loads || []);

      loadsToShow.forEach((load: Load, loadIndex: number) => {
        if (loadIndex === 0) {
          console.log('📦 Dados do Load:', {
            loadId: load.id,
            relatedTruck: load.relatedTruck,
            truckId: load.relatedTruck?.id,
            truckPlate: load.relatedTruck?.plate,
            internalDimensions: load.relatedTruck?.internalDimensions,
            packagesCount: load.packages?.length || 0
          });
        }
        
        const internalDims = load.relatedTruck?.internalDimensions;
        const truckLength = internalDims?.length;
        const truckWidth = internalDims?.width;
        const truckHeight = internalDims?.height;
        
        const truckDimensions = {
          length: (truckLength && truckLength > 0) ? truckLength : 12,
          width: (truckWidth && truckWidth > 0) ? truckWidth : 12,
          height: (truckHeight && truckHeight > 0) ? truckHeight : 12
        };
        
        if (!internalDims || !truckLength || !truckWidth || !truckHeight || truckLength === 0 || truckWidth === 0 || truckHeight === 0) {
          console.warn('⚠️ Dimensões do caminhão não encontradas ou zeradas, usando valores padrão (12x12x12):', {
            received: internalDims,
            using: truckDimensions
          });
        }

        const containerGeometry = new THREE.BoxGeometry(
          truckDimensions.length * SCALE_FACTOR,
          truckDimensions.height * SCALE_FACTOR,
          truckDimensions.width * SCALE_FACTOR
        );
        const containerMaterial = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide
        });
        const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
        const containerOffsetX = selectedLoad ? 0 : loadIndex * (truckDimensions.length * SCALE_FACTOR + 10);
        const containerCenterX = containerOffsetX + (truckDimensions.length * SCALE_FACTOR) / 2;
        const containerCenterY = (truckDimensions.height * SCALE_FACTOR) / 2;
        const containerCenterZ = (truckDimensions.width * SCALE_FACTOR) / 2;
        
        containerMesh.position.set(
          containerCenterX,
          containerCenterY,
          containerCenterZ
        );
        
        if (loadIndex === 0) {
          console.log('🚚 Container posicionado:', {
            containerDims: truckDimensions,
            containerCenter: { x: containerCenterX, y: containerCenterY, z: containerCenterZ },
            containerOffsetX: containerOffsetX,
            selectedLoad: !!selectedLoad
          });
        }
        containerMesh.receiveShadow = true;
        scene.add(containerMesh);
        containerMeshesRef.current.push(containerMesh);

        const edges = new THREE.EdgesGeometry(containerGeometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 })
        );
        line.position.copy(containerMesh.position);
        scene.add(line);

        // Criar pacotes ordenados por coordenadas (z, y, x)
        if (load.packages && load.packages.length > 0) {
          const sortedPackages = sortPackagesByCoordinates(load.packages);
          
          sortedPackages.forEach((pkg: Package, pkgIndex: number) => {
            if (pkgIndex === 0) {
              console.log('📦 Dados do primeiro pacote:', {
                packageId: pkg.id,
                packaging: pkg.packaging,
                internalDimensions: pkg.packaging?.internalDimensions,
                xPosition: pkg.xPosition,
                yPosition: pkg.yPosition,
                zPosition: pkg.zPosition,
                orientation: pkg.orientation
              });
            }
            
            const pkgDimensions = pkg.packaging?.internalDimensions;
            if (!pkgDimensions || !pkgDimensions.length || !pkgDimensions.width || !pkgDimensions.height) {
              console.warn(`⚠️ Dimensões do pacote ${pkg.id} não encontradas, usando valores padrão:`, {
                received: pkgDimensions,
                using: { length: 100, width: 100, height: 100 }
              });
            }
            
            const defaultDimensions = {
              length: 100,
              width: 100,
              height: 100
            };
            
            const finalPkgDimensions = pkgDimensions || defaultDimensions;

            let length = cmToM(finalPkgDimensions.length || 100);
            let width = cmToM(finalPkgDimensions.width || 100);
            let height = cmToM(finalPkgDimensions.height || 100);

            if (pkg.orientation === "wlh") {
              [length, width] = [width, length];
            } else if (pkg.orientation === "hwl") {
              [length, width, height] = [height, width, length];
            } else if (pkg.orientation === "hlw") {
              [length, width, height] = [height, length, width];
            } else if (pkg.orientation === "lhw") {
              [length, width, height] = [length, height, width];
            } else if (pkg.orientation === "whl") {
              [length, width, height] = [width, height, length];
            }

            const packageGeometry = new THREE.BoxGeometry(
              length * SCALE_FACTOR, 
              height * SCALE_FACTOR, 
              width * SCALE_FACTOR
            );
            
            const familyId = (pkg.product?.id || 0) % 15;
            const color = getFamilyColor(familyId);
            const packageMaterial = new THREE.MeshStandardMaterial({
              color: color,
              transparent: true,
              opacity: 0.85
            });

            const packageMesh = new THREE.Mesh(packageGeometry, packageMaterial);
            packageMesh.castShadow = true;
            packageMesh.receiveShadow = true;
            
            const xPos = ((pkg.xPosition || 0) / 100) * SCALE_FACTOR;
            const yPos = ((pkg.yPosition || 0) / 100) * SCALE_FACTOR;
            const zPos = ((pkg.zPosition || 0) / 100) * SCALE_FACTOR;
            
            const containerOffsetX = selectedLoad ? 0 : loadIndex * (truckDimensions.length * SCALE_FACTOR + 10);
            const containerCornerX = containerOffsetX;
            const containerCornerY = 0;
            const containerCornerZ = 0;
            
            const finalX = containerCornerX + xPos + (length * SCALE_FACTOR) / 2;
            const finalY = containerCornerY + zPos + (height * SCALE_FACTOR) / 2;
            const finalZ = containerCornerZ + yPos + (width * SCALE_FACTOR) / 2;
            
            const initialX = finalX;
            const initialY = (truckDimensions.height * SCALE_FACTOR) + 2;
            const initialZ = finalZ;
            
            if (pkgIndex === 0) {
              console.log('📍 Posicionamento do primeiro pacote:', {
                packageId: pkg.id,
                rawPositions: {
                  xPosition: pkg.xPosition,
                  yPosition: pkg.yPosition,
                  zPosition: pkg.zPosition
                },
                convertedPositions: { xPos, yPos, zPos },
                containerDims: truckDimensions,
                packageDims: { length, width, height },
                finalPos: { x: finalX.toFixed(3), y: finalY.toFixed(3), z: finalZ.toFixed(3) },
                initialPos: { x: initialX.toFixed(3), y: initialY.toFixed(3), z: initialZ.toFixed(3) },
                containerCenter: {
                  x: (containerOffsetX + truckDimensions.length / 2).toFixed(3),
                  y: (truckDimensions.height / 2).toFixed(3),
                  z: (truckDimensions.width / 2).toFixed(3)
                },
                containerOffsetX: containerOffsetX.toFixed(3)
              });
            }
            
            (packageMesh as any).finalPosition = {
              x: finalX,
              y: finalY,
              z: finalZ
            };
            (packageMesh as any).initialPosition = {
              x: initialX,
              y: initialY,
              z: initialZ
            };
            (packageMesh as any).animationStartTime = pkgIndex * 0.4;
            (packageMesh as any).packageIndex = pkgIndex;
            (packageMesh as any).isVisible = false;

            packageMesh.position.set(initialX, initialY, initialZ);
            packageMesh.visible = false;
            
            packageMaterial.opacity = 0.85;
            packageMaterial.transparent = true;

            scene.add(packageMesh);
            packageMeshesRef.current.push(packageMesh);
            
            if (!scene.children.includes(packageMesh)) {
              console.error(`ERRO: Pacote ${pkgIndex} não foi adicionado à cena!`);
            }
            
            console.log(`📦 Pacote ${pkgIndex} criado:`, {
              id: pkg.id,
              finalPos: { x: finalX.toFixed(2), y: finalY.toFixed(2), z: finalZ.toFixed(2) },
              initialPos: { x: initialX.toFixed(2), y: initialY.toFixed(2), z: initialZ.toFixed(2) },
              startTime: (pkgIndex * 0.4).toFixed(2) + 's',
              visible: packageMesh.visible,
              inScene: scene.children.includes(packageMesh),
              dimensions: { length: length.toFixed(2), width: width.toFixed(2), height: height.toFixed(2) }
            });
          });
        }
      });

      // Ajustar câmera e target do OrbitControls para ver o(s) container(s)
      // Só reposicionar a câmera se os controles ainda não existirem (primeira vez)
      if (loadsToShow.length > 0 && !controlsRef.current) {
        if (selectedLoad) {
          // Focar no container selecionado (com escala aplicada)
          const dim = loadsToShow[0].relatedTruck?.internalDimensions || { length: 12, width: 12, height: 12 };
          const maxDim = Math.max(dim.length || 12, dim.width || 12, dim.height || 12) * SCALE_FACTOR;
          const distance = maxDim * 2.5;
          const targetPoint = new THREE.Vector3(
            ((dim.length || 12) * SCALE_FACTOR) / 2,
            ((dim.height || 12) * SCALE_FACTOR) / 2,
            ((dim.width || 12) * SCALE_FACTOR) / 2
          );
          camera.position.set(
            targetPoint.x + distance * 0.7,
            targetPoint.y + distance * 0.7,
            targetPoint.z + distance * 0.7
          );
        } else {
          // Ver todos os containers (com escala aplicada)
          const totalWidth = loadsToShow.length * 22 * SCALE_FACTOR;
          const distance = 30 * SCALE_FACTOR;
          const targetPoint = new THREE.Vector3(totalWidth / 2, 0, 0);
          camera.position.set(
            targetPoint.x + distance * 0.7,
            targetPoint.y + distance * 0.7,
            targetPoint.z + distance * 0.7
          );
        }
      }
    };

    createVisualization();

    // Controles de câmera usando OrbitControls (com escala aplicada)
    // Sempre recriar os controles quando o componente montar ou quando shipment/selectedLoad mudar
    // Isso garante que os controles funcionem corretamente no modal
    // Usar requestAnimationFrame para garantir que o DOM esteja totalmente renderizado
    requestAnimationFrame(() => {
      if (!mountRef.current || !renderer.domElement) return;
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      const loadsCount = selectedLoad ? 1 : (shipment?.loads.length || 1);
      const selectedTruckDims = selectedLoad?.relatedTruck?.internalDimensions;
      
      // Calcular o target baseado no centro do container
      const targetPoint = new THREE.Vector3(
        selectedLoad ? ((selectedTruckDims?.length || 12) * SCALE_FACTOR) / 2 : loadsCount * 11 * SCALE_FACTOR,
        selectedLoad ? ((selectedTruckDims?.height || 12) * SCALE_FACTOR) / 2 : 0, // Centro vertical do container
        selectedLoad ? ((selectedTruckDims?.width || 12) * SCALE_FACTOR) / 2 : 0
      );

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(targetPoint);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1; // Permitir zoom muito próximo
      controls.maxDistance = 100; // Limitar zoom máximo para não ir muito longe
      controls.maxPolarAngle = Math.PI * 0.9; // Limitar rotação vertical
      controls.minPolarAngle = Math.PI * 0.1;
      controls.enablePan = true;
      controls.enableZoom = true; // Habilitar zoom explicitamente
      controls.panSpeed = 0.8;
      controls.zoomSpeed = 1.2;
      controls.rotateSpeed = 0.8;
      controlsRef.current = controls;
      
      // Ajustar posição inicial da câmera para focar no centro do container
      if (selectedLoad && selectedTruckDims) {
        const maxDim = Math.max(
          (selectedTruckDims.length || 12) * SCALE_FACTOR,
          (selectedTruckDims.width || 12) * SCALE_FACTOR,
          (selectedTruckDims.height || 12) * SCALE_FACTOR
        );
        // Calcular distância baseada no tamanho do container e na altura do viewport
        const viewportHeight = mountRef.current?.clientHeight || height;
        const distance = Math.max(maxDim * 2.0, viewportHeight * 0.8); // Ajustar para centralizar melhor
        // Focar no centro do container com ângulo isométrico
        camera.position.set(
          targetPoint.x + distance * 0.7,
          targetPoint.y + distance * 0.7,
          targetPoint.z + distance * 0.7
        );
        camera.lookAt(targetPoint);
        controls.target.copy(targetPoint);
        controls.update();
      }
      
      controls.update();
    });

    // Resetar refs quando o load muda
    lastTimeRef.current = 0;
    animationStartTimeRef.current = 0;
    pausedAtTimeRef.current = 0;
    
    // Animação
    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      
      // Atualizar controles de câmera
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Usar refs para ter acesso ao estado atual dentro do loop de animação
      const playing = isPlayingRef.current;
      const currentSpeed = speedRef.current;
      
      // Resetar tempo de início quando começar a tocar
      // Verificar se acabamos de começar a tocar (último estado era false)
      const wasPlaying = lastTimeRef.current > 0 && animationStartTimeRef.current > 0;
      if (playing && !wasPlaying && animationStartTimeRef.current === 0) {
        // Primeira vez que começa a tocar: definir o tempo de início como agora
        animationStartTimeRef.current = currentTime;
        pausedAtTimeRef.current = 0; // Resetar tempo pausado
        console.log('🎬 Animação iniciada em:', currentTime, 'Pacotes:', packageMeshesRef.current.length);
        // Resetar visibilidade dos pacotes
        packageMeshesRef.current.forEach((mesh) => {
          mesh.visible = false;
          (mesh as any).isVisible = false;
          const initialPos = (mesh as any).initialPosition;
          if (initialPos) {
            mesh.position.set(initialPos.x, initialPos.y, initialPos.z);
          }
        });
      }
      
      // Pausar: salvar o tempo decorrido até agora
      if (!playing && animationStartTimeRef.current > 0) {
        pausedAtTimeRef.current = (currentTime - animationStartTimeRef.current) * currentSpeed;
        animationStartTimeRef.current = 0;
        console.log('Animação pausada. Tempo decorrido:', pausedAtTimeRef.current);
      }
      
      lastTimeRef.current = currentTime;

      // Sempre processar animação se estiver tocando (mesmo no primeiro frame)
      if (playing) {
        // Garantir que temos um tempo de início válido
        if (animationStartTimeRef.current === 0) {
          animationStartTimeRef.current = currentTime;
          pausedAtTimeRef.current = 0;
          console.log('⚠️ Tempo de início definido dentro do loop:', currentTime);
        }
        
        // Calcular progresso total da animação (0 a 1)
        // Cada pacote leva 0.4s de delay + 0.6s de animação = 1s por pacote
        const totalAnimationTime = Math.max(1, packageMeshesRef.current.length * 0.4 + 0.6); // Tempo total baseado no número de pacotes
        // Tempo decorrido desde o início da animação (em segundos)
        const elapsed = ((currentTime - animationStartTimeRef.current) * currentSpeed + pausedAtTimeRef.current) / 1000;
        const newProgress = Math.min(1, elapsed / totalAnimationTime);
        
        setAnimationProgress(newProgress);
        
        // Log apenas no início e fim
        if (elapsed < 0.1 || (elapsed > 1.3 && elapsed < 1.4)) {
          console.log('⏱️ Animação:', {
            elapsed: elapsed.toFixed(2) + 's',
            progress: (newProgress * 100).toFixed(0) + '%',
            packages: packageMeshesRef.current.length
          });
        }
        
        // Animar pacotes sequencialmente na ordem de inserção (baseado em coordenadas)
        packageMeshesRef.current.forEach((mesh, index) => {
          const finalPos = (mesh as any).finalPosition;
          const initialPos = (mesh as any).initialPosition;
          const packageStartTime = (mesh as any).animationStartTime || 0; // Delay em segundos
          const packageDuration = 0.6; // Duração da animação de cada pacote em segundos
          const isVisible = (mesh as any).isVisible;
          const packageIndex = (mesh as any).packageIndex ?? index;
          
          // Calcular progresso da animação deste pacote específico
          const packageElapsed = elapsed - packageStartTime;
          const packageProgress = Math.max(0, Math.min(1, packageElapsed / packageDuration));
          
          // Debug apenas quando pacote se torna visível
          // (removido log excessivo)
          
          // Tornar visível quando começar a animar (quando o tempo de delay passar)
          if (packageElapsed > 0 && !isVisible) {
            mesh.visible = true;
            (mesh as any).isVisible = true;
            console.log(`✅ Pacote ${packageIndex} tornou-se visível em ${elapsed.toFixed(2)}s (packageElapsed: ${packageElapsed.toFixed(2)}s, startTime: ${packageStartTime.toFixed(2)}s)`);
          }
          
          // Animar movimento do pacote da posição inicial para a final
          if (packageElapsed > 0) {
            if (packageProgress <= 1) {
              // Easing: começa rápido e desacelera (ease out cubic)
              const easedProgress = 1 - Math.pow(1 - packageProgress, 3);
              
              // Interpolar suavemente entre posição inicial e final
              const startVec = new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z);
              const endVec = new THREE.Vector3(finalPos.x, finalPos.y, finalPos.z);
              mesh.position.lerpVectors(startVec, endVec, easedProgress);
              
              // Log apenas quando pacote se torna visível (já feito acima)
            } else {
              // Garantir que está exatamente na posição final quando a animação terminar
              mesh.position.set(finalPos.x, finalPos.y, finalPos.z);
            }
          }
        });
      } else {

      }

  
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };


    animationFrameRef.current = requestAnimationFrame(animate);


    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
    };

    window.addEventListener("resize", handleResize);


    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
    
    console.log('=== Criação da Visualização ===');
    console.log('Pacotes criados:', packageMeshesRef.current.length);
    console.log('Load selecionado:', selectedLoad?.id);
    console.log('Shipment:', shipment?.id);
    if (packageMeshesRef.current.length > 0) {
      packageMeshesRef.current.forEach((mesh, idx) => {
        console.log(`Pacote ${idx}:`, {
          visible: mesh.visible,
          position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
          finalPos: (mesh as any).finalPosition,
          initialPos: (mesh as any).initialPosition,
          startTime: (mesh as any).animationStartTime,
          packageIndex: (mesh as any).packageIndex
        });
      });
    }
  }, [shipment, selectedLoad]); 

 
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    speedRef.current = speed;
  }, [isPlaying, speed]);

  const handlePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    isPlayingRef.current = newPlayingState;
    
    if (newPlayingState) {

      animationTimeRef.current = 0;
      lastTimeRef.current = 0;
      animationStartTimeRef.current = 0; 
      pausedAtTimeRef.current = 0;
      setAnimationProgress(0);
      
      packageMeshesRef.current.forEach((mesh) => {
        const initialPos = (mesh as any).initialPosition;
        if (initialPos) {
          mesh.position.set(initialPos.x, initialPos.y, initialPos.z);
          mesh.visible = false;
          (mesh as any).isVisible = false;
        }
      });
      console.log('🔄 Resetando animação para começar do zero. Pacotes:', packageMeshesRef.current.length);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAnimationProgress(0);
    animationTimeRef.current = 0;
    lastTimeRef.current = 0;
    animationStartTimeRef.current = 0;
    pausedAtTimeRef.current = 0;
    // Resetar posições dos pacotes para posição inicial
    packageMeshesRef.current.forEach((mesh) => {
      const initialPos = (mesh as any).initialPosition;
      if (initialPos) {
        mesh.position.set(initialPos.x, initialPos.y, initialPos.z);
        mesh.visible = false;
        (mesh as any).isVisible = false;
      }
    });
    // Forçar re-render imediatamente
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  if ((!shipment || !shipment.loads || shipment.loads.length === 0) && !selectedLoad) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Nenhum dado de carregamento disponível</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-[10px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 ml-4">
            <label className="text-sm text-gray-600">Velocidade:</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{speed}x</span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Progresso: {Math.round(animationProgress * 100)}%
        </div>
      </div>
      <div
        className="w-full bg-gray-100 rounded-lg border overflow-hidden relative"
        style={{ 
          height: "500px", 
          overflow: "hidden",
          position: "relative"
        }}
      >
        <div
          ref={mountRef}
          className="w-full h-full"
          style={{ 
            cursor: "grab",
            position: "absolute",
            top: 0,
            left: 0
          }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500">
        Visualização 3D - Arraste para rotacionar | Scroll para zoom
      </div>
    </div>
  );
}

