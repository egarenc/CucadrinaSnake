// ==========================================
// 1. CONSTANTES Y CONFIGURACIÓN DE IMÁGENES
// ==========================================
const RUTA_CABEZA = 'cabeza.jpg';
const RUTA_CUERPO = 'cuerpo.jpg';

const imgCabeza = new Image();
imgCabeza.src = RUTA_CABEZA;

const imgCuerpo = new Image();
imgCuerpo.src = RUTA_CUERPO;

// ==========================================
// 2. REFERENCIAS AL DOM
// ==========================================
const escenaBienvenida = document.getElementById('pantalla-bienvenida');
const escenaOpciones = document.getElementById('pantalla-opciones');
const escenaJuego = document.getElementById('pantalla-juego');

const btnContinuar = document.getElementById('btn-continuar');
const btnFeedback = document.getElementById('btn-feedback');
const btnIniciar = document.getElementById('btn-iniciar');
const btnVolverOpciones = document.getElementById('btn-volver-opciones');
const btnSalir = document.getElementById('btn-salir');

const sliderDureza = document.getElementById('slider-dureza');
const toggleSonido = document.getElementById('toggle-sonido');
const uiNivel = document.getElementById('ui-nivel');
const uiPuntos = document.getElementById('ui-puntos');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ==========================================
// 3. VARIABLES DE ESTADO DEL JUEGO
// ==========================================
const tamanoCuadricula = 20; // 20x20 píxeles por bloque
let serpiente = [];
let comida = {};
let dx = 0; // Dirección X
let dy = 0; // Dirección Y
let nivelActual = 1;
let puntos = 0;
let piezasComidasNivel = 0;
let bucleJuego;

const PIEZAS_PARA_SUBIR_NIVEL = 5; // Cuántas piezas comer para pasar de nivel
const NIVEL_MAXIMO = 10;

// ==========================================
// 4. NAVEGACIÓN ENTRE ESCENAS
// ==========================================
function cambiarEscena(escenaDestino) {
    escenaBienvenida.classList.remove('activa');
    escenaOpciones.classList.remove('activa');
    escenaJuego.classList.remove('activa');
    escenaDestino.classList.add('activa');
}

btnContinuar.addEventListener('click', () => cambiarEscena(escenaOpciones));
btnFeedback.addEventListener('click', () => alert('¡Gracias por jugar! Envía tus comentarios a dev@tujuego.com'));
btnVolverOpciones.addEventListener('click', () => cambiarEscena(escenaBienvenida));

btnSalir.addEventListener('click', () => {
    detenerJuego();
    cambiarEscena(escenaBienvenida);
});

btnIniciar.addEventListener('click', () => {
    iniciarPartidaGlobal();
    cambiarEscena(escenaJuego);
});

// ==========================================
// 5. LÓGICA PRINCIPAL DEL JUEGO
// ==========================================
function iniciarPartidaGlobal() {
    nivelActual = 1;
    puntos = 0;
    prepararNivel();
}

function prepararNivel() {
    // Resetear serpiente: SOLO la cabeza, centrada
    serpiente = [{ x: canvas.width / 2, y: canvas.height / 2 }];
    dx = tamanoCuadricula; // Arranca moviéndose a la derecha
    dy = 0;
    piezasComidasNivel = 0;
    
    uiNivel.innerText = nivelActual;
    uiPuntos.innerText = puntos;
    
    generarComida();
    
    if (bucleJuego) clearInterval(bucleJuego);
    
    // Calcular velocidad basada en la dureza (de 1 a 10)
    // A mayor dureza, menor es el intervalo (más rápido va)
    const dureza = parseInt(sliderDureza.value);
    const velocidadMs = 200 - (dureza * 15); 
    
    bucleJuego = setInterval(actualizarJuego, velocidadMs);
}

function detenerJuego() {
    if (bucleJuego) clearInterval(bucleJuego);
}

function generarComida() {
    comida = {
        x: Math.floor(Math.random() * (canvas.width / tamanoCuadricula)) * tamanoCuadricula,
        y: Math.floor(Math.random() * (canvas.height / tamanoCuadricula)) * tamanoCuadricula
    };
    
    // Evitar que la comida aparezca sobre el cuerpo de la serpiente
    serpiente.forEach(segmento => {
        if (segmento.x === comida.x && segmento.y === comida.y) {
            generarComida();
        }
    });
}

function reproducirSonido() {
    if (toggleSonido.value === 'activo') {
        // Simulación de sonido de comer
        console.log("¡Ñam!"); 
    }
}

function actualizarJuego() {
    // 1. Calcular nueva posición de la cabeza
    const nuevaCabeza = { 
        x: serpiente[0].x + dx, 
        y: serpiente[0].y + dy 
    };

    // 2. Comprobar colisión con paredes
    if (nuevaCabeza.x < 0 || nuevaCabeza.x >= canvas.width || 
        nuevaCabeza.y < 0 || nuevaCabeza.y >= canvas.height) {
        return finDelJuego();
    }

    // 3. Comprobar colisión consigo misma
    for (let i = 0; i < serpiente.length; i++) {
        if (nuevaCabeza.x === serpiente[i].x && nuevaCabeza.y === serpiente[i].y) {
            return finDelJuego();
        }
    }

    // 4. Mover la serpiente (añadir nueva cabeza)
    serpiente.unshift(nuevaCabeza);

    // 5. Comprobar si ha comido
    if (nuevaCabeza.x === comida.x && nuevaCabeza.y === comida.y) {
        puntos += 10 * nivelActual; // Más puntos a niveles más altos
        piezasComidasNivel++;
        uiPuntos.innerText = puntos;
        reproducirSonido();

        // Subida de nivel
        if (piezasComidasNivel >= PIEZAS_PARA_SUBIR_NIVEL) {
            nivelActual++;
            if (nivelActual > NIVEL_MAXIMO) {
                detenerJuego();
                alert(`¡HAS GANADO! Has superado los 10 niveles con ${puntos} puntos.`);
                cambiarEscena(escenaBienvenida);
                return;
            } else {
                // Prepara el siguiente nivel (resetea el tamaño de la serpiente a 1)
                prepararNivel();
                return; 
            }
        } else {
            generarComida(); // Generar otra pieza en el mismo nivel
        }
    } else {
        // Si no come, eliminamos la cola para que no crezca infinitamente
        serpiente.pop(); 
    }

    // 6. Dibujar el fotograma
    dibujar();
}

function finDelJuego() {
    detenerJuego();
    alert(`FIN DE LA PARTIDA. Llegaste al nivel ${nivelActual} con ${puntos} puntos.`);
    cambiarEscena(escenaBienvenida);
}

function dibujar() {
    // Limpiar pantalla
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar comida (roja)
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(comida.x, comida.y, tamanoCuadricula, tamanoCuadricula);

    // Dibujar serpiente
    serpiente.forEach((segmento, index) => {
        if (index === 0) {
            // CABEZA
            if (imgCabeza.complete && imgCabeza.naturalWidth !== 0) {
                ctx.drawImage(imgCabeza, segmento.x, segmento.y, tamanoCuadricula, tamanoCuadricula);
            } else {
                ctx.fillStyle = '#4CAF50'; // Fallback si no carga imagen
                ctx.fillRect(segmento.x, segmento.y, tamanoCuadricula, tamanoCuadricula);
            }
        } else {
            // CUERPO
            if (imgCuerpo.complete && imgCuerpo.naturalWidth !== 0) {
                ctx.drawImage(imgCuerpo, segmento.x, segmento.y, tamanoCuadricula, tamanoCuadricula);
            } else {
                ctx.fillStyle = '#81C784'; // Fallback si no carga imagen
                ctx.fillRect(segmento.x, segmento.y, tamanoCuadricula, tamanoCuadricula);
            }
        }
    });
}

// ==========================================
// 6. CONTROLES DEL TECLADO (Flechas o WASD)
// ==========================================
window.addEventListener('keydown', e => {
    // Evita que la serpiente se dé la vuelta sobre sí misma
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy === 0) { dx = 0; dy = -tamanoCuadricula; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy === 0) { dx = 0; dy = tamanoCuadricula; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx === 0) { dx = -tamanoCuadricula; dy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx === 0) { dx = tamanoCuadricula; dy = 0; }
            break;
    }
});