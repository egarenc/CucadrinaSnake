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
sonidoPartida.loop = true; // Hace que la música no se corte si la partida es larga

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
const uiTiempo = document.getElementById('ui-tiempo'); // Nueva referencia para el tiempo
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const customModal = document.getElementById('custom-modal');
const modalMensaje = document.getElementById('modal-mensaje');
const modalBtnCerrar = document.getElementById('modal-btn-cerrar');
let accionAlCerrarModal = null; // Guardará qué hacer cuando el usuario pulse OK

// ==========================================
// 3. VARIABLES DE ESTADO DEL JUEGO
// ==========================================
const tamanoCuadricula = 20; 
let serpiente = [];
let comida = {};
let dx = 0; 
let dy = 0; 
let captures = 0;
let segundosTranscurridos = 0; // Contador de segundos
let bucleJuego;
let bucleCronometro;          // Intervalo del reloj

// ==========================================
// 4. NAVEGACIÓN ENTRE ESCENAS
// ==========================================
// Función que reemplaza al alert() nativo
function mostrarAlertaPersonalizada(mensaje, callback = null) {
    if (!customModal || !modalMensaje) return;
    
    modalMensaje.innerText = mensaje;
    accionAlCerrarModal = callback; // Guardamos la función que deba ejecutarse al cerrar
    customModal.classList.add('activo'); // Muestra la ventana y aplica el blur
}

// Evento para cerrar la ventana al pulsar el botón OK
modalBtnCerrar.addEventListener('click', () => {
    customModal.classList.remove('activo'); // Oculta la ventana
    
    // Si había una acción pendiente (ej. cambiar de pantalla), la ejecutamos ahora
    if (accionAlCerrarModal) {
        accionAlCerrarModal();
        accionAlCerrarModal = null; // Limpiamos la acción
    }
});

function cambiarEscena(escenaDestino) {
    escenaBienvenida.classList.remove('activa');
    escenaOpciones.classList.remove('activa');
    escenaJuego.classList.remove('activa');
    escenaDestino.classList.add('activa');
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
    
    // Limpiar bucles previos por seguridad
    if (bucleJuego) clearInterval(bucleJuego);
    if (bucleCronometro) clearInterval(bucleCronometro);
    if (toggleSonido && toggleSonido.checked) {
        sonidoPartida.currentTime = 0; // Reinicia la canción al segundo 0
        sonidoPartida.play().catch(e => console.log("Audio de fondo bloqueado:", e));
    }

    // Inicializar y arrancar el cronómetro de partida
    segundosTranscurridos = 0;
    actualizarInterfazTiempo();
    bucleCronometro = setInterval(() => {
        segundosTranscurridos++;
        actualizarInterfazTiempo();
    }, 1000);
    
    // Configurar velocidad de la serpiente
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
    
    // Dar formato MM:SS rellenando con un cero a la izquierda si es necesario
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
    
    // Obtener el tiempo final para mostrarlo en el mensaje
    const minutos = Math.floor(segundosTranscurridos / 60);
    const segundos = segundosTranscurridos % 60;
    const mm = String(minutos).padStart(2, '0');
    const ss = String(segundos).padStart(2, '0');
    
    const mensajeFinal = `FI DE LA PARTIDA. Has aconseguit un total de ${captures} captures en un temps de ${mm}:${ss}.`;
    
    // Mostramos el modal y pasamos el cambio de escena como la acción a ejecutar al cerrar
    mostrarAlertaPersonalizada(mensajeFinal, () => {
        cambiarEscena(escenaBienvenida);
    });
}

function dibujar() {
    // 1. Dibujar el fondo espacial
    if (imgFondo.complete && imgFondo.naturalWidth !== 0) {
        ctx.drawImage(imgFondo, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Dibujar la comida (Fondo amarillo con un emoticono encima)
    const centroComidaX = comida.x + tamanoCuadricula / 2;
    const centroComidaY = comida.y + tamanoCuadricula / 2;

    // Pintamos la base circular en color amarillo
    ctx.fillStyle = '#FFD700'; // Amarillo oro (puedes usar '#FFFF00' si lo quieres más brillante)
    ctx.beginPath();
    ctx.arc(centroComidaX, centroComidaY, tamanoCuadricula / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Configuración para pintar el emoticono perfectamente centrado
    ctx.font = `${tamanoCuadricula * 0.6}px Arial`; // Tamaño del emoji un poco menor que la cuadrícula
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Aquí eliges el emoticono de tu galería/teclado. Ejemplos: '😎', '🍕', '🪙', '🐛', '⭐'
    const emoticonoElegido = '🚧'; 
    
    // Dibujamos el emoji justo en el centro del círculo amarillo
    ctx.fillText(emoticonoElegido, centroComidaX, centroComidaY);

    // ==========================================================
    // CONFIGURACIÓN DE SUPERPOSICIÓN
    // ==========================================================
    const superposicion = 6; // Píxeles extra que se expande cada pieza para solaparse
    const radio = (tamanoCuadricula + superposicion) / 2;

    // 3. Dibujar la serpiente al revés (de cola a cabeza) para gestionar las capas
    for (let i = serpiente.length - 1; i >= 0; i--) {
        const segmento = serpiente[i];
        
        // Encontramos el centro exacto de la celda actual
        const centroX = segmento.x + tamanoCuadricula / 2;
        const centroY = segmento.y + tamanoCuadricula / 2;

        ctx.save(); // Guardamos el estado limpio del lienzo

        // 4. Crear máscara circular completa centrado en la pieza
        ctx.beginPath();
        ctx.arc(centroX, centroY, radio, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip(); // Aplicamos el recorte esférico

        // 5. Dibujar la imagen expandida dentro de la máscara circular
        if (i === 0) {
            // CABEZA (Tu dragón de Cucadrinas quedará arriba de todo)
            if (imgCabeza.complete && imgCabeza.naturalWidth !== 0) {
                ctx.drawImage(imgCabeza, centroX - radio, centroY - radio, radio * 2, radio * 2);
            } else {
                ctx.fillStyle = '#4CAF50'; 
                ctx.fillRect(centroX - radio, centroY - radio, radio * 2, radio * 2);
            }
        } else {
            // CUERPO (Las escamas se superpondrán elegantemente)
            if (imgCuerpo.complete && imgCuerpo.naturalWidth !== 0) {
                ctx.drawImage(imgCuerpo, centroX - radio, centroY - radio, radio * 2, radio * 2);
            } else {
                ctx.fillStyle = '#81C784'; 
                ctx.fillRect(centroX - radio, centroY - radio, radio * 2, radio * 2);
            }
        }

        ctx.restore(); // Restauramos el lienzo para el siguiente segmento
    }
}

// ==========================================
// 6. CONTROLES DEL TECLADO (Flechas o WASD)
// ==========================================
window.addEventListener('keydown', e => {
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

// ==========================================
// 7. GESTIÓN AUTOMÁTICA DE SONIDO EN BOTONES
// ==========================================
function reproducirSonidoBoton() {
    // Comprobamos si el elemento existe y si el checkbox está marcado (checked)
    if (toggleSonido && toggleSonido.checked) {
        sonidoBoton.currentTime = 0; // Reinicia el puntero para permitir clics rápidos seguidos
        sonidoBoton.play().catch(e => console.log("Audio bloqueado por el navegador hasta la primera interacción:", e));
    }
}

// Buscamos todos los botones del DOM y les asignamos la función de sonido al hacer click
document.querySelectorAll('button').forEach(boton => {
    boton.addEventListener('click', reproducirSonidoBoton);
});

// Controlar si el usuario cambia el interruptor de sonido en medio de una partida
if (toggleSonido) {
    toggleSonido.addEventListener('change', () => {
        // Si bucleJuego no es null, significa que hay una partida activa actualmente
        if (bucleJuego) {
            if (toggleSonido.checked) {
                sonidoPartida.play().catch(e => console.log(e));
            } else {
                sonidoPartida.pause();
            }
        }
    });
}