let totalWeight = 0;
let scannerRunning = false;
let lastScannedCode = null;

function parseQuantity(q) {
  if (!q) return 0;
  const m = q.match(/([\d,.]+)\s*(g|kg|ml)/i);
  if (!m) return 0;
  let num = parseFloat(m[1].replace(',', '.'));
  if (/kg/i.test(m[2])) num *= 1000;
  return num;
}

function displayProduct(name, weight) {
  totalWeight += weight;
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `<span class="product-name">${name}</span>
                   <span class="product-weight">${(weight/1000).toFixed(2)} kg</span>`;
  document.getElementById('product-list').appendChild(div);
  document.getElementById('total-weight').innerText = (totalWeight / 1000).toFixed(3);
}

function fetchProduct(barcode) {
  fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 1) {
        const p = data.product;
        const name = p.product_name || p.generic_name || 'Nomaʼlum';
        const weight = parseQuantity(p.quantity);
        if (weight > 0) {
          displayProduct(name, weight);
        } else {
          displayProduct(name + " (og‘irlik yo‘q)", 0);
        }
      } else {
        displayProduct("Mahsulot topilmadi", 0);
      }
    })
    .catch(err => {
      console.error('Fetch error', err);
      displayProduct("Xatolik yuz berdi", 0);
    });
}

function startScanner() {
  if (scannerRunning) return;

  lastScannedCode = null; // yangi skan boshlanishida oldingi kodni tozalaymiz

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector('#scanner-container'),
      constraints: { facingMode: "environment" }
    },
    decoder: { readers: ["ean_reader", "code_128_reader"] }
  }, err => {
    if (err) {
      console.error(err);
      return;
    }
    Quagga.start();
    scannerRunning = true;
  });

  Quagga.onDetected(d => {
    const barcode = d.codeResult.code;

    if (barcode === lastScannedCode) {
      // Agar barcode oldingisi bilan bir xil bo'lsa, hech nima qilmaymiz
      return;
    }

    lastScannedCode = barcode;  // Yangi barcode saqlanadi
    Quagga.stop();
    scannerRunning = false;

    fetchProduct(barcode);
  });
}

document.getElementById('reset').onclick = () => {
  totalWeight = 0;
  document.getElementById('product-list').innerHTML = '';
  document.getElementById('total-weight').innerText = '0';
};

document.getElementById('next-btn').onclick = () => {
  startScanner();
};
