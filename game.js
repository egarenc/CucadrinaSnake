// ==========================================
// 1. CONSTANTES Y CONFIGURACIÓN DE IMÁGENES
// ==========================================
const RUTA_CABEZA = 'cabeza.jpg';
const RUTA_CUERPO = 'cuerpo.jpg';
const RUTA_FONDO = 'solar.jpg';

const imgCabeza = new Image();
imgCabeza.src = RUTA_CABEZA;

const imgCuerpo = new Image();
imgCuerpo.src = RUTA_CUERPO;

const imgFondo = new Image();
imgFondo.src = RUTA_FONDO;

const sonidoBoton = new Audio('sound_button.mp3');
const sonidoPartida = new Audio('estapera.mp3');
sonidoPartida.loop = true; 

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
const uiCaptures = document.getElementById('ui-captures');
const uiTiempo = document.getElementById('ui-tiempo'); 
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const customModal = document.getElementById('custom-modal');
const modalMensaje = document.getElementById('modal-mensaje');
const modalBtnCerrar = document.getElementById('modal-btn-cerrar');
let accionAlCerrarModal = null; 

// ==========================================
// 3. VARIABLES DE ESTADO DEL JUEGO
// ==========================================
const tamanoCuadricula = 40; 
let serpiente = [];
let comida = {};
let dx = 0; 
let dy = 0; 
let captures = 0;
let segundosTranscurridos = 0; 
let bucleJuego;
let bucleCronometro;          

// ==========================================
// 4. NAVEGACIÓN ENTRE ESCENAS
// ==========================================
function mostrarAlertaPersonalizada(mensaje, callback = null) {
    if (!customModal || !modalMensaje) return;
    
    modalMensaje.innerText = mensaje;
    accionAlCerrarModal = callback; 
    customModal.classList.add('activo'); 
}

modalBtnCerrar.addEventListener('click', () => {
    customModal.classList.remove('activo'); 
    if (accionAlCerrarModal) {
        accionAlCerrarModal();
        accionAlCerrarModal = null; 
    }
});

function cambiarEscena(escenaDestino) {
    escenaBienvenida.classList.remove('activa');
    escenaOpciones.classList.remove('activa');
    escenaJuego.classList.remove('activa');
    escenaDestino.add ? escenaDestino.add('activa') : escenaDestino.classList.add('activa');
}

btnContinuar.addEventListener('click', () => cambiarEscena(escenaOpciones));
btnFeedback.addEventListener('click', () => {
    mostrarAlertaPersonalizada('Gràcies per jugar! Envía els teus comentaris a cucadrinas@gmail.com');
});
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
    captures = 0;
    prepararPartida();
}

function prepararPartida() {
    serpiente = [{ x: canvas.width / 2, y: canvas.height / 2 }];
    dx = tamanoCuadricula; 
    dy = 0;
    
    if (uiCaptures) uiCaptures.innerText = captures;
    
    generarComida();
    
    if (bucleJuego) clearInterval(bucleJuego);
    if (bucleCronometro) clearInterval(bucleCronometro);
    if (toggleSonido && toggleSonido.checked) {
        sonidoPartida.currentTime = 0; 
        sonidoPartida.play().catch(e => console.log("Audio de fondo bloqueado:", e));
    }

    segundosTranscurridos = 0;
    actualizarInterfazTiempo();
    bucleCronometro = setInterval(() => {
        segundosTranscurridos++;
        actualizarInterfazTiempo();
    }, 1000);
    
    const dureza = parseInt(sliderDureza.value);
    const velocidadMs = 200 - (dureza * 15); 
    
    bucleJuego = setInterval(actualizarJuego, velocidadMs);
}

function detenerJuego() {
    if (bucleJuego) clearInterval(bucleJuego);
    if (bucleCronometro) clearInterval(bucleCronometro);
    sonidoPartida.pause();
}

function actualizarInterfazTiempo() {
    if (!uiTiempo) return;
    
    const minutos = Math.floor(segundosTranscurridos / 60);
    const segundos = segundosTranscurridos % 60;
    
    const mm = String(minutos).padStart(2, '0');
    const ss = String(segundos).padStart(2, '0');
    
    uiTiempo.innerText = `${mm}:${ss}`;
}

function generarComida() {
    comida = {
        x: Math.floor(Math.random() * (canvas.width / tamanoCuadricula)) * tamanoCuadricula,
        y: Math.floor(Math.random() * (canvas.height / tamanoCuadricula)) * tamanoCuadricula
    };
    
    serpiente.forEach(segmento => {
        if (segmento.x === comida.x && segmento.y === comida.y) {
            generarComida();
        }
    });
}

function reproducirSonido() {
    if (toggleSonido && toggleSonido.checked) {
        console.log("¡Ñam!"); 
    }
}

function actualizarJuego() {
    const nuevaCabeza = { 
        x: serpiente[0].x + dx, 
        y: serpiente[0].y + dy 
    };

    if (nuevaCabeza.x < 0 || nuevaCabeza.x >= canvas.width || 
        nuevaCabeza.y < 0 || nuevaCabeza.y >= canvas.height) {
        return finDelJuego();
    }

    for (let i = 0; i < serpiente.length; i++) {
        if (nuevaCabeza.x === serpiente[i].x && nuevaCabeza.y === serpiente[i].y) {
            return finDelJuego();
        }
    }

    serpiente.unshift(nuevaCabeza);

    if (nuevaCabeza.x === comida.x && nuevaCabeza.y === comida.y) {
        captures++;
        if (uiCaptures) uiCaptures.innerText = captures;
        reproducirSonido();
        generarComida();
    } else {
        serpiente.pop(); 
    }

    dibujar();
}

function finDelJuego() {
    detenerJuego();
    
    const minutos = Math.floor(segundosTranscurridos / 60);
    const segundos = segundosTranscurridos % 60;
    const mm = String(minutos).padStart(2, '0');
    const ss = String(segundos).padStart(2, '0');
    
    const mensajeFinal = `FI DE LA PARTIDA. Has aconseguit un total de ${captures} captures en un temps de ${mm}:${ss}.`;
    
    mostrarAlertaPersonalizada(mensajeFinal, () => {
        cambiarEscena(escenaBienvenida);
    });
}

function dibujar() {
    if (imgFondo.complete && imgFondo.naturalWidth !== 0) {
        ctx.drawImage(imgFondo, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const centroComidaX = comida.x + tamanoCuadricula / 2;
    const centroComidaY = comida.y + tamanoCuadricula / 2;

    ctx.fillStyle = '#FFD700'; 
    ctx.beginPath();
    ctx.arc(centroComidaX, centroComidaY, tamanoCuadricula / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = `${tamanoCuadricula * 0.6}px Arial`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const emoticonoElegido = '🚧'; 
    ctx.fillText(emoticonoElegido, centroComidaX, centroComidaY);

    const superposicion = 6; 
    const radio = (tamanoCuadricula + superposicion) / 2;

    for (let i = serpiente.length - 1; i >= 0; i--) {
        const segmento = serpiente[i];
        
        const centroX = segmento.x + tamanoCuadricula / 2;
        const centroY = segmento.y + tamanoCuadricula / 2;

        ctx.save(); 

        ctx.beginPath();
        ctx.arc(centroX, centroY, radio, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip(); 

        if (i === 0) {
            if (imgCabeza.complete && imgCabeza.naturalWidth !== 0) {
                ctx.drawImage(imgCabeza, centroX - radio, centroY - radio, radio * 2, radio * 2);
            } else {
                ctx.fillStyle = '#4CAF50'; 
                ctx.fillRect(centroX - radio, centroY - radio, radio * 2, radio * 2);
            }
        } else {
            if (imgCuerpo.complete && imgCuerpo.naturalWidth !== 0) {
                ctx.drawImage(imgCuerpo, centroX - radio, centroY - radio, radio * 2, radio * 2);
            } else {
                ctx.fillStyle = '#81C784'; 
                ctx.fillRect(centroX - radio, centroY - radio, radio * 2, radio * 2);
            }
        }

        ctx.restore(); 
    }
}

// ==========================================
// 6. CONTROLES (TECLADO Y CRUCETA MÓVIL)
// ==========================================
function cambiarDireccion(direccion) {
    switch (direccion) {
        case 'ARRIBA':
            if (dy === 0) { dx = 0; dy = -tamanoCuadricula; }
            break;
        case 'ABAJO':
            if (dy === 0) { dx = 0; dy = tamanoCuadricula; }
            break;
        case 'IZQUIERDA':
            if (dx === 0) { dx = -tamanoCuadricula; dy = 0; }
            break;
        case 'DERECHA':
            if (dx === 0) { dx = tamanoCuadricula; dy = 0; }
            break;
    }
}

// Eventos de teclado
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': cambiarDireccion('ARRIBA'); break;
        case 'ArrowDown': case 's': case 'S': cambiarDireccion('ABAJO'); break;
        case 'ArrowLeft': case 'a': case 'A': cambiarDireccion('IZQUIERDA'); break;
        case 'ArrowRight': case 'd': case 'D': cambiarDireccion('DERECHA'); break;
    }
});

// Eventos táctiles para el D-Pad (Evitamos clicks fantasma con preventDefault si es táctil)
const vincularBotonDpad = (id, direccion) => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', () => cambiarDireccion(direccion));
    }
};

vincularBotonDpad('dpad-arriba', 'ARRIBA');
vincularBotonDpad('dpad-abajo', 'ABAJO');
vincularBotonDpad('dpad-izq', 'IZQUIERDA');
vincularBotonDpad('dpad-der', 'DERECHA');


// ==========================================
// 7. GESTIÓN AUTOMÁTICA DE SONIDO EN BOTONES
// ==========================================
function reproducirSonidoBoton() {
    if (toggleSonido && toggleSonido.checked) {
        sonidoBoton.currentTime = 0; 
        sonidoBoton.play().catch(e => console.log("Audio bloqueado:", e));
    }
}

document.querySelectorAll('button').forEach(boton => {
    boton.addEventListener('click', reproducirSonidoBoton);
});

if (toggleSonido) {
    toggleSonido.addEventListener('change', () => {
        if (bucleJuego) {
            if (toggleSonido.checked) {
                sonidoPartida.play().catch(e => console.log(e));
            } else {
                sonidoPartida.pause();
            }
        }
    });
}