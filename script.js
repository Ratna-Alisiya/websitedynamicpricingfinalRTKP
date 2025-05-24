let warnaReferensi = {};

function getAverageRGBFromImage(imgElement) {
  const canvas = document.getElementById("refCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = imgElement.width;
  canvas.height = imgElement.height;
  ctx.drawImage(imgElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, imgElement.width, imgElement.height);
  const data = imageData.data;

  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  };
}

function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

function interpretColor(rgb) {
  let closestLabel = "Tidak Dikenali";
  let minDistance = Infinity;
  for (const label in warnaReferensi) {
    const distance = colorDistance(rgb, warnaReferensi[label]);
    if (distance < minDistance) {
      minDistance = distance;
      closestLabel = label;
    }
  }
  return closestLabel;
}

function getPriceByQuality(quality) {
  switch(quality) {
    case "Sangat Layak Dikonsumsi": return "Rp 25.000";
    case "Masih Layak Dikonsumsi": return "Rp 10.000";
    case "Kurang Layak Dikonsumsi": return "Rp 7.000";
    default: return "Harga tidak tersedia";
  }
}

function updateDisplay(rgb) {
  const quality = interpretColor(rgb);
  const price = getPriceByQuality(quality);
  document.getElementById("quality").innerText = "Kualitas: " + quality;
  document.getElementById("price").innerText = "Harga: " + price;
  document.getElementById("colorSample").style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function extractRGBFromQR(text) {
  try {
    const rgb = JSON.parse(text);
    if (rgb.r !== undefined && rgb.g !== undefined && rgb.b !== undefined) {
      updateDisplay(rgb);
    }
  } catch (e) {
    document.getElementById("quality").innerText = "Format QR tidak sesuai.";
  }
}

const html5QrCode = new Html5Qrcode("reader");
Html5Qrcode.getCameras().then(devices => {
  if (devices && devices.length) {
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        html5QrCode.stop();
        extractRGBFromQR(decodedText);
      }
    );
  }
}).catch(err => {
  document.getElementById("quality").innerText = "Error: " + err;
});

function generateQR() {
  const r = parseInt(document.getElementById("r").value);
  const g = parseInt(document.getElementById("g").value);
  const b = parseInt(document.getElementById("b").value);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    alert("Harap masukkan nilai RGB yang valid (0-255)");
    return;
  }

  const qr = new QRious({
    element: document.getElementById("qrCanvas"),
    size: 200,
    value: JSON.stringify({ r, g, b })
  });
}

document.getElementById("imageInput").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.getElementById("colorCanvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const centerX = Math.floor(img.width / 2);
      const centerY = Math.floor(img.height / 2);
      const pixel = ctx.getImageData(centerX, centerY, 1, 1).data;

      const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };
      updateDisplay(rgb);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

window.onload = function () {
  const sangat = document.getElementById("ref-sangat");
  const masih = document.getElementById("ref-masih");
  const kurang = document.getElementById("ref-kurang");

  sangat.onload = () => {
    warnaReferensi["Sangat Layak Dikonsumsi"] = getAverageRGBFromImage(sangat);
  };
  masih.onload = () => {
    warnaReferensi["Masih Layak Dikonsumsi"] = getAverageRGBFromImage(masih);
  };
  kurang.onload = () => {
    warnaReferensi["Kurang Layak Dikonsumsi"] = getAverageRGBFromImage(kurang);
  };
};
