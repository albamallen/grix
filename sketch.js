let font;
let fonts = {
  original: null, // Fuente original (ya cargada en `preload`)
  "sans-serif": null, // Sans Serif
  serif: null, // Serif
  "slab-serif": null, // Slab Serif
  display: null, // Display
  monospace: null, // Monospace
  handwriting: null, // Handwriting
};
let texto = "grix";
let peso = 0; // Intensidad base dependiente del volumen
let numCapas = 5; // Número de capas de contornos
let lineas = []; // Almacena las líneas de texto
let letrasPorLinea = []; // Almacena los puntos de cada letra por línea
let capaColor;
let bgColor; // Color del fondo
let fontColor; // Color de la tipografía
let fontSize = 200; // Tamaño de la tipografía
let lineThickness = 2; // Grosor de la línea
let mic;
let audioContextStarted = false;
let controlsVisible = true; // Control de visibilidad de opciones

function preload() {
  // Cargar las fuentes especificadas
  fonts.original = loadFont('assets/fonts/Haskoy-ExtraBold.ttf');
  fonts["sans-serif"] = loadFont('assets/fonts/Poppins-Black.ttf');
  fonts.serif = loadFont('assets/fonts/PlayfairDisplay-Black.ttf');
  fonts["slab-serif"] = loadFont('assets/fonts/RobotoSlab-Black.ttf');
  fonts.display = loadFont('assets/fonts/Oswald-Bold.ttf');
  fonts.monospace = loadFont('assets/fonts/SpaceMono-Bold.ttf');
  fonts.handwriting = loadFont('assets/fonts/Pacifico-Regular.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  font = fonts.original; // Fuente por defecto

  
  textFont(font);

  // Colores iniciales
  bgColor = color(255); // Blanco
  fontColor = color(0); // Negro

  // Mostrar mensaje inicial para iniciar el audio
  textAlign(CENTER, CENTER);
  textSize(24);
  fill(fontColor);
  text('Haz clic para activar el audio', width / 2, height / 2);

  capaColor = fontColor;

  // Botón para pantalla completa
  const fullscreenButton = createButton('Full ');
  fullscreenButton.position(10, 10);
  fullscreenButton.mousePressed(() => {
    let fs = fullscreen();
    fullscreen(!fs);
    if (fullscreen()) {
      controlsVisible = false;
      toggleControlsVisibility();
    } else {
      controlsVisible = true;
      toggleControlsVisibility();
    }
  });

  // Botón para mostrar/ocultar opciones
  const toggleOptionsButton = createButton('Opciones');
  toggleOptionsButton.position(120, 10);
  toggleOptionsButton.mousePressed(() => {
    controlsVisible = !controlsVisible;
    toggleControlsVisibility();
  });

  // Esperar clic para iniciar el audio
  canvas.addEventListener("click", iniciarAudio);

  // Configurar interacción con el selector de tipografía
  const fontSelector = document.getElementById("fontSelector");
  fontSelector.addEventListener("change", (event) => {
    const selectedFont = event.target.value;
    if (fonts[selectedFont]) {
      font = fonts[selectedFont]; // Cambiar la fuente
      textFont(font);
      actualizarLineas(); // Recalcular las líneas
    } else {
      console.warn(`Fuente "${selectedFont}" no está disponible.`);
    }
  });

  // Configurar otros controles (texto, color, tamaño, grosor, etc.)
  configurarControles();
}

function configurarControles() {
  const textInput = document.getElementById("textInput");
  const updateTextButton = document.getElementById("updateTextButton");
  updateTextButton.addEventListener("click", () => {
    texto = textInput.value || "grix"; // Usar "grix" si el input está vacío
    actualizarLineas(); // Actualizar las líneas y letras
  });

  const fontColorPicker = document.getElementById("fontColorPicker");
  fontColorPicker.addEventListener("input", (event) => {
    fontColor = color(event.target.value); // Actualizar color de la tipografía
    capaColor = fontColor; // Actualizar el color de las capas
  });

  const bgColorPicker = document.getElementById("bgColorPicker");
  bgColorPicker.addEventListener("input", (event) => {
    bgColor = color(event.target.value); // Actualizar color del fondo
  });

  const fontSizeSlider = document.getElementById("fontSizeSlider");
  fontSizeSlider.addEventListener("input", (event) => {
    fontSize = parseInt(event.target.value); // Actualizar el tamaño de la fuente
    actualizarLineas(); // Recalcular las líneas con el nuevo tamaño
  });

  const lineThicknessSlider = document.getElementById("lineThicknessSlider");
  lineThicknessSlider.addEventListener("input", (event) => {
    lineThickness = parseInt(event.target.value); // Actualizar el grosor de la línea
  });
}

function toggleControlsVisibility() {
  const controls = document.getElementById("controls");
  if (controlsVisible) {
    controls.style.display = "block";
  } else {
    controls.style.display = "none";
  }
}

function iniciarAudio() {
  userStartAudio().then(() => {
    mic = new p5.AudioIn();
    mic.start();
    audioContextStarted = true;

    clear();
    actualizarLineas();
  }).catch((error) => {
    console.error("Error al iniciar el audio:", error);
  });

  canvas.removeEventListener("click", iniciarAudio);
}

function draw() {
  if (!audioContextStarted) {
    return;
  }

  background(bgColor);

  let volumen = mic.getLevel()*1; // cambiar el 1 segun el sonido que haya (esd mercadillo navideño 0.08)
  peso = map(volumen, 0, 0.05, 0, 200);
  peso = constrain(peso, 0, 100);

  letrasPorLinea.forEach((letrasLinea, indexLinea) => {
    letrasLinea.forEach(letra => {
      let xOffset = letra.x;
      let yOffset = letra.y;

      noFill();
      stroke(capaColor);
      strokeWeight(lineThickness);

      for (let capa = 0; capa < numCapas; capa++) {
        let factor = getDeformacionFactor(capa);
        dibujarCapa(letra.puntos, xOffset, yOffset, factor, capa, 0);
        dibujarCapa(letra.puntos, xOffset, yOffset, factor, capa, 100);
      }
    });
  });
}

function actualizarLineas() {
  lineas = [];
  letrasPorLinea = [];

  let maxAnchoLinea = width * 0.8;
  let palabras = texto.split(' ');
  let lineaActual = '';
  let anchoLineaActual = 0;

  palabras.forEach((palabra, index) => {
    let anchoPalabra = font.textBounds(palabra + ' ', 0, 0, fontSize).w;

    if (anchoLineaActual + anchoPalabra > maxAnchoLinea) {
      lineas.push(lineaActual.trim());
      lineaActual = palabra + ' ';
      anchoLineaActual = anchoPalabra;
    } else {
      lineaActual += palabra + ' ';
      anchoLineaActual += anchoPalabra;
    }

    if (index === palabras.length - 1) {
      lineas.push(lineaActual.trim());
    }
  });

  let totalAlturaTexto = lineas.length * (fontSize + 20);
  let yInicio = (height - totalAlturaTexto) / 2 + fontSize / 2;

  lineas.forEach((linea, indexLinea) => {
    let letrasLinea = [];
    let xCursor = 0;

    let anchoLinea = font.textBounds(linea, 0, 0, fontSize).w;

    let xInicio = (width - anchoLinea) / 2;

    for (let i = 0; i < linea.length; i++) {
      let letra = linea.charAt(i);
      let puntos = font.textToPoints(letra, 0, 0, fontSize, { sampleFactor: 0.1 });

      let bounds = font.textBounds(letra, 0, 0, fontSize);
      letrasLinea.push({
        puntos: puntos,
        x: xInicio + xCursor,
        y: yInicio + indexLinea * (fontSize + 20)
      });

      xCursor += bounds.w + 10;
    }

    letrasPorLinea.push(letrasLinea);
  });
}

function dibujarCapa(puntos, xOffset, yOffset, factor, capa, semillaExtra) {
  beginShape();
  puntos.forEach((p, index) => {
    if (index > 0 && dist(p.x, p.y, puntos[index - 1].x, puntos[index - 1].y) > fontSize * 0.5) {
      endShape(CLOSE);
      beginShape();
    }
    let ruidoBaseX = noise(p.x * 0.01, p.y * 0.01, capa * 0.5 + semillaExtra);
    let ruidoBaseY = noise(p.y * 0.01, p.x * 0.01, capa * 0.5 + semillaExtra);
    let deformacionX = (ruidoBaseX - 0.5) * factor;
    let deformacionY = (ruidoBaseY - 0.5) * factor;
    vertex(p.x + xOffset + deformacionX, p.y + yOffset + deformacionY);
  });
  endShape(CLOSE);
}

function getDeformacionFactor(capa) {
  return map(capa, 0, numCapas - 1, peso * 0.5, peso * 2.0);
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
