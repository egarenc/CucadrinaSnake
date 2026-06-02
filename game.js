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
const modalRankingForm = document.getElementById('modal-ranking-form');
const modalIniciales = document.getElementById('modal-iniciales');
const modalBtnEnviar = document.getElementById('modal-btn-enviar');
const btnRanking = document.getElementById('btn-ranking');
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
    if (modalRankingForm) modalRankingForm.style.display = 'none'; // Asegura ocultarlo al cerrar
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

// Listener para consultar el Ranking en game.js
btnRanking.addEventListener('click', () => {
    mostrarAlertaPersonalizada('Cargant rànquing...');
    
    // Cambiamos temporalmente el botón de OK a "Esperando"
    modalBtnCerrar.disabled = true;
    modalBtnCerrar.innerText = "Espera...";

    const urlAPI = 'https://script.google.com/macros/s/AKfycbwbtyD0_pFAITj6cqS7VmcdLwvjMAHSbPT4t43LiGKrzvuC5jfVoJ4TD_X_X4gtQPWT/exec?action=getRankings';

    fetch(urlAPI)
    .then(response => response.json())
    .then(datos => {
        modalBtnCerrar.disabled = false;
        modalBtnCerrar.innerText = "OK";

        if (!datos || datos.length === 0) {
            modalMensaje.innerText = "Encara no hi ha puntuacions registrades.";
            return;
        }

        // 1. ORDENACIÓN PERSONALIZADA EN FRONTEND:
        // Primero por segundosTranscurridos (Mayor a Menor -> b - a)
        // Si empatan, por dificultad (Mayor a Menor -> b - a)
        datos.sort((a, b) => {
            if (b.segundosTranscurridos !== a.segundosTranscurridos) {
                return b.segundosTranscurridos - a.segundosTranscurridos;
            }
            return b.dificultad - a.dificultad;
        });

        // 2. CONSTRUIR TABLA HTML PARA EL MODAL
        let tablaHTML = `<b style="color:#4CAF50; font-size:18px;">🏆 TOP RANKING 🏆</b><br><br>`;
        tablaHTML += `<table style="width:100%; border-collapse: collapse; text-align:center; font-size:14px;">
                        <tr style="border-bottom: 2px solid #4CAF50; color:#4CAF50;">
                            <th>Pos</th>
                            <th>Jugador</th>
                            <th>Temps</th>
                            <th>Dif</th>
                        </tr>`;
        
        // Mostramos el Top 10 para no saturar el modal
        const topMax = Math.min(datos.length, 10);
        for (let i = 0; i < topMax; i++) {
            const minutos = Math.floor(datos[i].segundosTranscurridos / 60);
            const segundos = datos[i].segundosTranscurridos % 60;
            const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
            
            tablaHTML += `<tr style="border-bottom: 1px solid #444; height:30px;">
                            <td>${i + 1}</td>
                            <td style="font-weight:bold;">${datos[i].iniciales}</td>
                            <td>${tiempoFormateado}</td>
                            <td>⭐${datos[i].dificultad}</td>
                          </tr>`;
        }
        tablaHTML += `</table>`;

        // Inyectamos la tabla en el cuerpo del modal
        modalMensaje.innerHTML = tablaHTML;
    })
    .catch(error => {
        console.error("Error cargando el ranking:", error);
        modalBtnCerrar.disabled = false;
        modalBtnCerrar.innerText = "OK";
        modalMensaje.innerText = "Error en connectar amb el servidor de rànquing.";
    });
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
    const velocidadMs = 300 - (dureza * 15); 
    
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
    
    // 1. Mostramos el modal común
    mostrarAlertaPersonalizada(mensajeFinal, () => {
        cambiarEscena(escenaBienvenida);
    });

    // 2. Hacemos visible el bloque del ranking e inicializamos el input vacío
    if (modalRankingForm && modalIniciales && modalBtnEnviar) {
        modalRankingForm.style.display = 'block';
        modalIniciales.value = '';
        modalBtnEnviar.disabled = false;
        modalBtnEnviar.innerText = "ENVIAR RANKING";

        // 3. Eliminamos listeners antiguos clonando el botón (evita duplicados de partidas anteriores)
        const nuevoBtnEnviar = modalBtnEnviar.cloneNode(true);
        modalBtnEnviar.parentNode.replaceChild(nuevoBtnEnviar, modalBtnEnviar);

        // 4. Programamos el evento de envío
        nuevoBtnEnviar.addEventListener('click', () => {
            const iniciales = modalIniciales.value.trim().toUpperCase();
            
            if (iniciales === '') {
                alert('Por si de cas, introdueix unes inicials vàlides.');
                return;
            }

            nuevoBtnEnviar.disabled = true;
            nuevoBtnEnviar.innerText = "Enviant...";

            // Estructura de datos solicitada
            const datosRanking = {
                timestamp: Date.now(), // Hora actual en milisegundos
                iniciales: iniciales,
                segundosTranscurridos: segundosTranscurridos,
                dificultad: parseInt(sliderDureza.value)
            };

            const urlAPI = 'https://script.google.com/macros/s/AKfycbxAlIJ5a_jWJCKiHCYbEQX8BM9WA3DCWXIHAKs6NCKy8ExbVBlmFNUPAVIOvzYmJuXd/exec';

            // Petición HTTP POST a Google Apps Script
            fetch(urlAPI, {
                method: 'POST',
                mode: 'no-cors', // Necesario para evitar bloqueos CORS con Google Scripts
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosRanking)
            })
            .then(() => {
                nuevoBtnEnviar.innerText = "¡ENVIAT!";
                setTimeout(() => {
                    // Cerramos el modal simulando el click en OK tras un envío exitoso
                    modalBtnCerrar.click();
                }, 1200);
            })
            .catch(error => {
                console.error("Error enviando al ranking:", error);
                nuevoBtnEnviar.disabled = false;
                nuevoBtnEnviar.innerText = "ERROR (Reintentar)";
            });
        });
    }
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