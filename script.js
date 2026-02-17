// --- Globální funkce pro HTML ---
window.openModal = function(imgElement) {
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  modalImg.src = imgElement.src;
  modal.style.display = "flex";
};

window.closeModal = function() {
  document.getElementById("modal").style.display = "none";
};

window.toggleText = function(card) {
  card.classList.toggle('active');
};

window.toggleMenu = function() {
  document.getElementById("menu").classList.toggle("active");
};

window.scrollToSection = function() {
  document.getElementById("uvod").scrollIntoView({ behavior: "smooth" });
};

// --- Smooth scroll po kliknutí na nápis ---
document.addEventListener("DOMContentLoaded", () => {
  const myImage = document.getElementById("myImage");
  if (myImage) {
    myImage.addEventListener("click", () => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    });
  }
});

// --- Three.js + DRACOLoader ---
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// Scéna, kamera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// DRACO Loader
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
);

gltfLoader.setDRACOLoader(dracoLoader);

// Ukázka načtení GLTF modelu
gltfLoader.load(
  "path/to/model.gltf",
  (gltf) => {
    scene.add(gltf.scene);
    camera.position.z = 5;
    renderer.render(scene, camera);
  },
  undefined,
  (error) => {
    console.error("Chyba při načítání GLTF:", error);
  }
);

const searchElement = document.getElementById('mysearch');

  searchElement.onclick = function() {
    // Tohle vypíše do konzole (F12), jestli se na to kliklo
    console.log("Kliknuto na lupu!"); 
    this.classList.toggle('move');
  };


