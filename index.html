<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Helenas Glutenfri Koekken</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --green:#1D9E75; --green-light:#E1F5EE; --green-mid:#9FE1CB;
    --green-dark:#085041; --green-deep:#0F6E56;
    --amber:#FAEEDA; --amber-deep:#412402;
    --text:#1a1a1a; --text-muted:#666;
    --bg:#f7faf9; --card-bg:#ffffff;
    --border:rgba(0,0,0,0.09);
    --radius:14px;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}

  .site-header{background:white;border-bottom:1px solid var(--border);padding:16px 20px;position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:12px;}
  .logo-icon{font-size:30px;line-height:1;}
  .logo-text{font-family:'Fredoka One',cursive;font-size:20px;color:var(--green-dark);}
  .logo-sub{font-size:11px;color:var(--text-muted);margin-top:1px;}

  .hero{background:linear-gradient(135deg,#d4f5e9 0%,#f0fdf8 100%);padding:36px 20px 28px;text-align:center;}
  .hero-emoji{font-size:52px;display:block;margin-bottom:10px;}
  .hero h1{font-family:'Fredoka One',cursive;font-size:clamp(24px,5vw,36px);color:var(--green-dark);margin-bottom:8px;line-height:1.2;}
  .hero p{font-size:15px;color:#2d6b56;max-width:460px;margin:0 auto;line-height:1.6;}
  .badge-row{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:14px;}
  .badge{background:white;border:1.5px solid var(--green-mid);border-radius:20px;padding:4px 13px;font-size:12px;font-weight:700;color:var(--green-deep);}

  .main{max-width:700px;margin:0 auto;padding:22px 16px 60px;}
  .card{background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius);padding:18px 20px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
  .card-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:12px;}

  .slider-wrap{display:flex;align-items:center;gap:12px;}
  .slider-wrap label{font-size:13px;color:var(--text-muted);white-space:nowrap;}
  input[type=range]{flex:1;-webkit-appearance:none;height:6px;border-radius:3px;background:var(--green-mid);outline:none;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--green);cursor:pointer;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);}
  .days-display{font-family:'Fredoka One',cursive;font-size:24px;color:var(--green);min-width:72px;text-align:right;}

  .meal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;}
  .meal-btn{border:2.5px solid #d0ece4;border-radius:12px;padding:13px 8px;text-align:center;cursor:pointer;background:#f9fdfb;color:#555;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;transition:all 0.15s;user-select:none;position:relative;}
  .meal-btn .me{font-size:26px;display:block;margin-bottom:5px;}
  .meal-btn:hover{border-color:var(--green-mid);background:var(--green-light);}
  .meal-btn.selected{border-color:var(--green);background:var(--green-light);color:var(--green-dark);box-shadow:0 0 0 3px rgba(29,158,117,0.15);}
  .meal-btn.selected::after{content:'✓';position:absolute;top:5px;right:7px;font-size:13px;font-weight:800;color:var(--green);}
  .sel-hint{font-size:12px;color:var(--text-muted);margin-top:10px;text-align:center;}
  .sel-hint span{font-weight:700;color:var(--green-deep);}

  .gen-btn{width:100%;padding:17px;font-family:'Fredoka One',cursive;font-size:21px;letter-spacing:0.5px;border:none;border-radius:16px;background:var(--green);color:white;cursor:pointer;transition:transform 0.1s,background 0.15s;box-shadow:0 4px 16px rgba(29,158,117,0.35);margin-top:4px;}
  .gen-btn:hover{background:var(--green-deep);transform:translateY(-1px);}
  .gen-btn:active{transform:scale(0.98);}
  .gen-btn:disabled{background:#ccc;color:#999;cursor:not-allowed;box-shadow:none;transform:none;}

  .loading-wrap{text-align:center;padding:44px 16px;}
  .loading-emojis{font-size:38px;display:block;margin-bottom:14px;animation:bounce 1s ease-in-out infinite alternate;}
  @keyframes bounce{from{transform:translateY(0);}to{transform:translateY(-8px);}}
  .loading-text{font-family:'Fredoka One',cursive;font-size:20px;color:var(--green-dark);margin-bottom:6px;}
  .loading-sub{font-size:13px;color:var(--text-muted);}
  .spinner{display:inline-block;width:30px;height:30px;border:4px solid var(--green-mid);border-top-color:var(--green);border-radius:50%;animation:spin 0.7s linear infinite;margin-top:14px;}
  @keyframes spin{to{transform:rotate(360deg);}}

  .results-header{font-family:'Fredoka One',cursive;font-size:22px;color:var(--green-dark);margin:16px 0 14px;text-align:center;}
  .day-card{background:white;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);}
  .day-header{background:var(--green-light);padding:13px 17px;display:flex;align-items:center;gap:9px;border-bottom:1px solid #b8e8d4;}
  .day-emoji{font-size:24px;}
  .day-title{font-family:'Fredoka One',cursive;font-size:19px;color:var(--green-dark);}
  .meal-block{padding:15px 17px;border-bottom:1px solid rgba(0,0,0,0.06);}
  .meal-block:last-child{border-bottom:none;}
  .meal-type-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--green);margin-bottom:7px;display:flex;align-items:center;gap:4px;}
  .meal-illus{font-size:40px;display:block;text-align:center;margin:3px 0 9px;}
  .meal-title{font-size:16px;font-weight:800;color:var(--text);margin-bottom:3px;}
  .meal-desc{font-size:13px;color:var(--text-muted);line-height:1.6;margin-bottom:9px;}
  .steps-btn{background:none;border:1.5px solid var(--green-mid);border-radius:20px;padding:4px 13px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;color:var(--green-deep);cursor:pointer;transition:background 0.1s;}
  .steps-btn:hover{background:var(--green-light);}
  .steps-box{margin-top:9px;background:#f6fdf9;border-radius:10px;padding:11px 13px;border:1px solid #c8e8d8;display:none;}
  .steps-box.open{display:block;}
  .step-row{display:flex;gap:9px;padding:4px 0;font-size:13px;line-height:1.5;}
  .step-num{font-weight:800;color:var(--green);min-width:20px;}

  .shopping-card{background:white;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);margin-bottom:18px;}
  .shopping-header{background:var(--amber);padding:13px 17px;border-bottom:1px solid #f0d5a8;}
  .shopping-title{font-family:'Fredoka One',cursive;font-size:19px;color:var(--amber-deep);}
  .store-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;}
  .store-badge{font-size:11px;font-weight:800;padding:3px 9px;border-radius:20px;}
  .badge-netto{background:#fff3cd;color:#7d5a00;border:1px solid #f0c040;}
  .badge-lidl{background:#d6e8fa;color:#0d3c7a;border:1px solid #90b8e8;}
  .badge-rema{background:#fde8e0;color:#8c2800;border:1px solid #f5a080;}
  .shopping-body{padding:15px 17px;}
  .shop-category{margin-bottom:13px;}
  .shop-cat-title{font-size:13px;font-weight:800;color:var(--text);margin-bottom:7px;}
  .shop-items-wrap{display:flex;flex-wrap:wrap;gap:7px;}
  .shop-item{background:#f3f9f6;border:1.5px solid #c0e4d4;border-radius:8px;padding:5px 11px;font-size:13px;font-weight:600;color:var(--text);cursor:pointer;transition:all 0.12s;user-select:none;}
  .shop-item:hover{background:var(--green-light);border-color:var(--green-mid);}
  .shop-item.done{background:#d0f0e4;border-color:var(--green);color:var(--green-dark);text-decoration:line-through;opacity:0.55;}
  .shop-hint{font-size:12px;color:var(--text-muted);text-align:center;margin-top:11px;}

  .tip-box{background:#fff8ee;border:1.5px solid #f5d48a;border-radius:var(--radius);padding:15px 17px;margin-bottom:14px;}
  .tip-title{font-weight:800;color:var(--amber-deep);margin-bottom:4px;font-size:14px;}
  .tip-text{font-size:13px;color:#5c3a00;line-height:1.6;}

  .error-box{background:#fff0f0;border:1.5px solid #f5b0b0;border-radius:var(--radius);padding:17px;text-align:center;color:#8b0000;font-size:14px;margin-top:12px;}

  .site-footer{text-align:center;padding:22px 16px;font-size:12px;color:#aaa;border-top:1px solid var(--border);background:white;}
  .site-footer a{color:var(--green);text-decoration:none;font-weight:700;}

  @media(max-width:480px){.meal-grid{grid-template-columns:repeat(2,1fr);}}
</style>
</head>
<body>

<header class="site-header">
  <span class="logo-icon">&#127806;</span>
  <div>
    <div class="logo-text">Helenas Glutenfri Koekken</div>
    <div class="logo-sub">Laekker mad uden gluten, maelk og soja!</div>
  </div>
</header>

<div class="hero">
  <span class="hero-emoji">&#129382;&#127859;&#127805;&#127827;</span>
  <h1>Din personlige glutenfri madplan</h1>
  <p>Vaelg antal dage og hvilke maaltider du vil have - saa finder vi laekre opskrifter til dig!</p>
  <div class="badge-row">
    <span class="badge">&#10003; Uden gluten</span>
    <span class="badge">&#10003; Uden maelk</span>
    <span class="badge">&#10003; Uden soja</span>
    <span class="badge">&#128722; Netto &middot; Lidl &middot; Rema</span>
  </div>
</div>

<div class="main">

  <div class="card">
    <div class="card-title">&#128197; Antal dage</div>
    <div class="slider-wrap">
      <label>1 dag</label>
      <input type="range" id="daysSlider" min="1" max="7" value="3" step="1">
      <label>7 dage</label>
      <div class="days-display" id="daysDisplay">3 dage</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">&#127869; Vaelg dine maaltider &mdash; en eller flere</div>
    <div class="meal-grid" id="mealGrid">
      <button class="meal-btn selected" data-meal="morgenmad"><span class="me">&#127749;</span>Morgenmad</button>
      <button class="meal-btn selected" data-meal="frokost"><span class="me">&#129367;</span>Frokost</button>
      <button class="meal-btn selected" data-meal="madpakke"><span class="me">&#129393;</span>Madpakke</button>
      <button class="meal-btn selected" data-meal="aftensmad"><span class="me">&#127869;</span>Aftensmad</button>
      <button class="meal-btn" data-meal="mellemmaltid"><span class="me">&#127822;</span>Mellemmaltid</button>
    </div>
    <p class="sel-hint">Du har valgt: <span id="selCount">4 maaltider</span></p>
  </div>

  <button class="gen-btn" id="genBtn" onclick="generatePlan()">&#10024; Lav min madplan!</button>

  <div id="output"></div>
</div>

<footer class="site-footer">
  Lavet med kjaerlighed &bull; Opskrifter genereret af AI &bull; Foelg altid laegens anvisninger ved allergi &bull;
  <a href="https://www.glutenfristart.dk" target="_blank">glutenfristart.dk</a>
</footer>

<script>
  const slider = document.getElementById('daysSlider');
  const display = document.getElementById('daysDisplay');
  slider.addEventListener('input', function() {
    var v = slider.value;
    display.textContent = v == 1 ? '1 dag' : v + ' dage';
  });

  var mealBtns = document.querySelectorAll('.meal-btn');
  mealBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      btn.classList.toggle('selected');
      updateHint();
    });
  });

  function updateHint() {
    var sel = Array.from(document.querySelectorAll('.meal-btn.selected'));
    var count = sel.length;
    var names = sel.map(function(b){ return b.getAttribute('data-meal'); }).join(', ');
    document.getElementById('selCount').textContent = count === 0 ? 'ingen endnu' : count + ': ' + names;
  }
  updateHint();

  function toggleSteps(id, btn) {
    var box = document.getElementById(id);
    var open = box.classList.toggle('open');
    btn.textContent = open ? 'Skjul fremgangsmaade' : 'Vis fremgangsmaade';
  }

  function toggleItem(el) { el.classList.toggle('done'); }

  async function generatePlan() {
    var days = parseInt(slider.value);
    var meals = Array.from(document.querySelectorAll('.meal-btn.selected')).map(function(b){ return b.getAttribute('data-meal'); });

    if (meals.length === 0) {
      document.getElementById('output').innerHTML = '<div class="error-box">Vaelg mindst eet maaltid for at fortsaette</div>';
      return;
    }

    var btn = document.getElementById('genBtn');
    btn.disabled = true;
    btn.textContent = 'Laver din madplan...';

    document.getElementById('output').innerHTML =
      '<div class="loading-wrap">' +
      '<span class="loading-emojis">&#129382;&#127859;&#129382;</span>' +
      '<div class="loading-text">Finder laekre opskrifter...</div>' +
      '<div class="loading-sub">Det tager et ojeblik - snart klar!</div>' +
      '<div class="spinner"></div></div>';

    var prompt = 'Du er en venlig dansk kok der hjaelper familier med glutenfrit madlavning (ingen gluten, ingen maelk, ingen soja, ingen kaffe).\n\n' +
      'Lav en varieret og laekker madplan for ' + days + ' dag(e) med PRAECIS disse maaltider hver dag: ' + meals.join(', ') + '.\n\n' +
      'VIGTIGE regler:\n' +
      '- Ingen hvede, rug, byg, spelt, alm. havre, malt\n' +
      '- Ingen maelk, smoer, floede, ost, yoghurt, valle, kasein, laktose\n' +
      '- Ingen soja (sojamalk, tofu, edamame)\n' +
      '- Brug: ris, quinoa, boghvede, hirse, glutenfri havregryn, glutenfri pasta, kartofler, majs\n' +
      '- Brug plantemalk: mandelmalk, kokosmalk, havremalk (glutenfri), rismalk\n' +
      '- Koed, fisk, aeg, groentsager, frugt, baelgfrugter og noedder er fine\n' +
      '- Alle ingredienser skal faas i Netto, Lidl eller Rema 1000\n' +
      '- SIMPLE trin som et barn paa 10 aar kan foelge. Brug sjovt og venligt dansk sprog.\n\n' +
      'Svar KUN med valid JSON uden markdown:\n' +
      '{"days":[{"day":"Dag 1","emoji":"star","meals":[{"type":"morgenmad","typeEmoji":"sun","title":"Navn","desc":"Kort beskrivelse","illustration":"bowl","steps":["Trin 1","Trin 2","Trin 3"]}]}],' +
      '"shopping":{"Frugt og groentsager":["banan","tomat"],"Koed og fisk":["kylling","laks"],"Toervarer":["glutenfri pasta","quinoa"],"Plantemalk":["mandelmalk","kokosmalk"],"Andet":["aeg","olivenolie"]},' +
      '"tip":"Et nyttigt tip til glutenfri madlavning"}';

    try {
      var res = await fetch('/.netlify/functions/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });
      var data = await res.json();
      var raw = (data.content || []).map(function(i){ return i.text || ''; }).join('');
      var clean = raw.replace(/```json|```/g, '').trim();
      var plan = JSON.parse(clean);
      renderPlan(plan);
    } catch(e) {
      document.getElementById('output').innerHTML = '<div class="error-box">Ups! Noget gik galt. Proev igen.<br><small>' + e.message + '</small></div>';
    }

    btn.disabled = false;
    btn.textContent = 'Lav en ny madplan!';
  }

  function renderPlan(plan) {
    var html = '<div class="results-header">Din madplan er klar!</div>';

    plan.days.forEach(function(day) {
      html += '<div class="day-card"><div class="day-header"><span class="day-emoji">' + (day.emoji || '') + '</span><span class="day-title">' + day.day + '</span></div>';
      day.meals.forEach(function(meal) {
        var uid = 'steps_' + Math.random().toString(36).slice(2,9);
        html += '<div class="meal-block">' +
          '<div class="meal-type-label">' + (meal.typeEmoji||'') + ' ' + meal.type + '</div>' +
          '<span class="meal-illus">' + (meal.illustration||'') + '</span>' +
          '<div class="meal-title">' + meal.title + '</div>' +
          '<div class="meal-desc">' + meal.desc + '</div>' +
          '<button class="steps-btn" onclick="toggleSteps(\'' + uid + '\',this)">Vis fremgangsmaade</button>' +
          '<div class="steps-box" id="' + uid + '">' +
          meal.steps.map(function(s,i){ return '<div class="step-row"><span class="step-num">'+(i+1)+'.</span><span>'+s+'</span></div>'; }).join('') +
          '</div></div>';
      });
      html += '</div>';
    });

    if (plan.shopping) {
      html += '<div class="shopping-card"><div class="shopping-header"><div class="shopping-title">Indkoebsliste</div>' +
        '<div class="store-badges"><span class="store-badge badge-netto">Netto</span><span class="store-badge badge-lidl">Lidl</span><span class="store-badge badge-rema">Rema 1000</span></div></div>' +
        '<div class="shopping-body">';
      Object.entries(plan.shopping).forEach(function(entry) {
        html += '<div class="shop-category"><div class="shop-cat-title">' + entry[0] + '</div><div class="shop-items-wrap">' +
          entry[1].map(function(item){ return '<span class="shop-item" onclick="toggleItem(this)">'+item+'</span>'; }).join('') +
          '</div></div>';
      });
      html += '<p class="shop-hint">Tryk paa en vare for at markere den som koebt</p></div></div>';
    }

    if (plan.tip) {
      html += '<div class="tip-box"><div class="tip-title">Godt at vide!</div><div class="tip-text">' + plan.tip + '</div></div>';
    }

    document.getElementById('output').innerHTML = html;
    document.getElementById('output').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>
</body>
</html>
