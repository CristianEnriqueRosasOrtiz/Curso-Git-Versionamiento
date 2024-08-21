// Procesar el archivo seleccionado por el usuario
function procesarArchivo() {
    const archivo = document.getElementById('fileInput').files[0];
    if (!archivo) return;

    const fileType = archivo.type;
    if (fileType.includes('image')) {
        procesarImagen(archivo);
    } else if (fileType.includes('pdf')) {
        procesarPDF(archivo);
    } else {
        alert('Formato de archivo no soportado.');
    }
}

// Procesar imágenes
function procesarImagen(archivo) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            analizarImagen(img);
        };
        img.src = event.target.result;

        const imagePreview = document.getElementById('imagePreview');
        imagePreview.src = img.src;
        document.getElementById('previewCanvas').style.display = 'none';
    };
    reader.readAsDataURL(archivo);
}

// Procesar archivos PDF usando PDF.js
function procesarPDF(archivo) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const loadingTask = pdfjsLib.getDocument({ data: event.target.result });
        loadingTask.promise.then(function(pdf) {
            pdf.getPage(1).then(function(page) {
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.getElementById('previewCanvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                page.render(renderContext).promise.then(function() {
                    document.getElementById('imagePreview').src = canvas.toDataURL();
                    calcularPrecioPorTamano(viewport.width, viewport.height);
                });
            });
        }).catch(function(error) {
            alert('Error al procesar el PDF: ' + error.message);
        });
    };
    reader.readAsArrayBuffer(archivo);
}

// Analizar si la imagen es a color o blanco y negro
function analizarImagen(img) {
    const canvas = document.getElementById('previewCanvas');
    const context = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);

    const imageData = context.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    let colorPixelCount = 0;
    let bwPixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (Math.abs(r - g) < 10 && Math.abs(r - b) < 10 && Math.abs(g - b) < 10) {
            bwPixelCount++;
        } else {
            colorPixelCount++;
        }
    }

    const totalPixels = colorPixelCount + bwPixelCount;
    const esBlancoYNegro = (bwPixelCount / totalPixels) > 0.9;
    calcularCosto(esBlancoYNegro);
}

// Calcular precio basado en el tamaño de la imagen y la elección de impresión
function calcularPrecioPorTamano(width, height) {
    const totalSize = width * height;
    const basePriceA4 = 5.00; // Precio base para tamaño A4
    const basePriceOficio = 6.00; // Precio base para tamaño Oficio
    const areaFactor = totalSize / (2100 * 2970); // Relación al tamaño de la hoja A4

    const printMode = document.getElementById('printMode').value;
    const paperSize = document.getElementById('paperSize').value;
    const copies = parseInt(document.getElementById('copies').value) || 1;

    let basePrice = (paperSize === 'a4') ? basePriceA4 : basePriceOficio;
    let precioFinal = basePrice * areaFactor;

    if (printMode === 'color') {
        precioFinal += basePrice * 0.05;
    } else {
        precioFinal += basePrice * 0.01;
    }

    precioFinal *= copies; // Multiplicar por el número de copias

    document.getElementById("total").innerText = `$${precioFinal.toFixed(2)}`;
}

// Calcular costo final
function calcularCosto(esBlancoYNegro) {
    const paperSize = document.getElementById('paperSize').value;
    let costoPorHoja = (paperSize === 'a4') ? 5.00 : 6.00;
    const printMode = document.getElementById('printMode').value;

    let costoTinta = 0;
    if (esBlancoYNegro || printMode === 'bn') {
        costoTinta = 0.01 * costoPorHoja;
    } else {
        costoTinta = 0.05 * costoPorHoja;
    }

    const copies = parseInt(document.getElementById('copies').value) || 1;
    const costoTotal = (costoPorHoja + costoTinta) * copies;
    document.getElementById("total").innerText = `$${costoTotal.toFixed(2)}`;
}

// Función para imprimir la vista previa
function imprimirVistaPrevia() {
    const printWindow = window.open('', '', 'height=600,width=800');
    const content = document.getElementById('previewCanvas').toDataURL('image/png');
    
    printWindow.document.write('<html><head><title>Vista Previa</title>');
    printWindow.document.write('</head><body >');
    printWindow.document.write('<img src="' + content + '" style="width:100%"/>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

// Función para cancelar
function cancelar() {
    document.getElementById('fileInput').value = '';
    document.getElementById('imagePreview').src = '';
    document.getElementById('previewCanvas').style.display = 'none';
    document.getElementById('total').innerText = '$0.00';
}
