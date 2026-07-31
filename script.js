document.addEventListener('DOMContentLoaded', function() {
  // ── DOM refs ──
  const PWD     = document.getElementById('passwordInput');
  const TOGGLE  = document.getElementById('toggleVisibility');
  const CLEAR   = document.getElementById('clearBtn');
  const CIRCLE  = document.getElementById('progressCircle');
  const SCORE   = document.getElementById('scoreDisplay');
  const BAR     = document.getElementById('barFill');
  const SDOT    = document.getElementById('statusDot');
  const SLABEL  = document.getElementById('statusLabel');
  const STEXT   = document.getElementById('statusText');
  const SHINT   = document.getElementById('statusHint');
  const ALEN    = document.getElementById('anLength');
  const AENT    = document.getElementById('anEntropy');
  const ATIME   = document.getElementById('anTime');
  const AVAR    = document.getElementById('anVariety');
  const ACOMP   = document.getElementById('compositionText');
  const CBAR    = document.getElementById('compositionBar');
  const RULES   = document.querySelectorAll('.rule');
  const THEME   = document.getElementById('themeToggle');
  const GEN_TOG = document.getElementById('genToggle');
  const GEN_BODY= document.getElementById('genBody');
  const GEN_ARR = document.getElementById('genArrow');
  const GEN_LEN = document.getElementById('genLength');
  const GEN_DISP= document.getElementById('genLenDisplay');
  const GEN_OUT = document.getElementById('genOutput');
  const GEN_BTN = document.getElementById('genBtn');
  const GEN_CPY = document.getElementById('genCopyBtn');
  const TEST_BTN= document.getElementById('testBtn');
  const RESET_BTN= document.getElementById('resetBtn');
  const TOAST   = document.getElementById('toast');

  const GEN_LOWER = document.getElementById('genLower');
  const GEN_UPPER = document.getElementById('genUpper');
  const GEN_NUMBER = document.getElementById('genNumber');
  const GEN_SYMBOL = document.getElementById('genSymbol');

  const CIRCUM = 2 * Math.PI * 50;
  const COMMON_PASSWORDS = new Set([
    '123456','password','12345678','qwerty','123456789','12345','1234','111111',
    '1234567','sunshine','qwerty123','iloveyou','princess','admin','welcome',
    '666666','abc123','football','123123','monkey','654321','!@#$%^&*',
    'charlie','aa123456','dragon','master','batman','login','passw0rd',
    'shadow','michael','superman','qazwsx','trustno1','letmein'
  ]);

  // ── Theme ──
  function initTheme() {
    const saved = localStorage.getItem('pwdTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    THEME.textContent = saved === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
  }
  
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pwdTheme', next);
    THEME.textContent = next === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
  }
  initTheme();
  THEME.addEventListener('click', toggleTheme);

  // ── Utils ──
  function showToast(msg, duration) {
    duration = duration || 2200;
    TOAST.textContent = msg;
    TOAST.classList.add('show');
    clearTimeout(TOAST._toastTimer);
    TOAST._toastTimer = setTimeout(() => TOAST.classList.remove('show'), duration);
  }

  function setProgress(score, color) {
    const offset = CIRCUM - (score / 100) * CIRCUM;
    CIRCLE.style.strokeDashoffset = offset;
    CIRCLE.style.stroke = color;
    BAR.style.width = score + '%';
    BAR.style.background = `linear-gradient(90deg, ${color}ee, ${color}88)`;
    BAR.style.boxShadow = `0 0 24px ${color}55`;
    SCORE.style.color = color;
  }

  function getStrengthColor(score, level) {
    if (level === 'alta')    return '#30d080';
    if (level === 'media')   return '#f0c030';
    if (level === 'baja')    return '#ff4060';
    if (score === 0)         return 'var(--text-muted)';
    return '#ff8c42';
  }

  function getStatusLabel(level) {
    const m = { 'alta': '\u{1F7E2} Alta', 'media': '\u{1F7E1} Media', 'baja': '\u{1F534} Baja' };
    return m[level] || '\u{23F3} Esperando...';
  }

  function getStatusHint(level, pw) {
    if (!pw) return '';
    if (level === 'baja')  return '\u{26A0}\u{FE0F} Muy débil. Agrega variedad de caracteres y hazla más larga.';
    if (level === 'media') return '\u{1F7E1} Mejorable. Mezcla más tipos de caracteres y alarga la contraseña.';
    return '\u{2705} ¡Excelente! Tu contraseña es muy segura.';
  }

  // ── Entropy calculation ──
  function calcEntropy(pw) {
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
    if (pool === 0) return 0;
    return Math.round(pw.length * Math.log2(pool) * 10) / 10;
  }

  // ── Crack time ──
  function crackTime(entropy, score) {
    if (score === 0) return '--';
    if (score < 20) return 'menos de un segundo';
    const combos = Math.pow(2, entropy);
    const perSec = 1e10; 
    const seconds = combos / perSec;
    if (seconds < 1) return 'menos de un segundo';
    if (seconds < 60) return `${Math.round(seconds)} segundos`;
    if (seconds < 3600) return `${Math.round(seconds/60)} minutos`;
    if (seconds < 86400) return `${Math.round(seconds/3600)} horas`;
    if (seconds < 31536000) return `${Math.round(seconds/86400)} días`;
    if (seconds < 31536000 * 100) return `${Math.round(seconds/31536000)} años`;
    return `más de 100 años`;
  }

  // ── Pattern detection ──
  function hasSequential(pw) {
    const seq = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const lower = pw.toLowerCase();
    for (let i = 0; i < lower.length - 2; i++) {
      const sub = lower.slice(i, i + 3);
      if (seq.includes(sub)) return true;
    }
    return false;
  }
  
  function hasRepeated(pw) {
    return /(.)\1{2,}/.test(pw);
  }
  
  function hasKeyboardPattern(pw) {
    const rows = ['qwertyuiop','asdfghjkl','zxcvbnm'];
    const lower = pw.toLowerCase();
    for (const row of rows) {
      for (let i = 0; i < lower.length - 2; i++) {
        const sub = lower.slice(i, i + 3);
        if (row.includes(sub)) return true;
      }
    }
    return false;
  }

  // ── Main strength calc ──
  function calcStrength(pw) {
    if (!pw) return { score: 0, level: 'none', entropy: 0, variety: 0, patterns: [] };

    let score = 0;
    const patterns = [];

    // Length points (up to 30)
    if (pw.length >= 8)  score += 10;
    if (pw.length >= 10) score += 5;
    if (pw.length >= 12) score += 8;
    if (pw.length >= 16) score += 7;
    score = Math.min(30, score);

    // Character variety (up to 35)
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum   = /[0-9]/.test(pw);
    const hasSym   = /[^A-Za-z0-9]/.test(pw);
    const types = [hasLower, hasUpper, hasNum, hasSym];
    const typeCount = types.filter(Boolean).length;
    if (hasLower) score += 7;
    if (hasUpper) score += 8;
    if (hasNum)   score += 8;
    if (hasSym)   score += 12;
    // Bonus for mixing types
    if (typeCount >= 2) score += 5;
    if (typeCount >= 3) score += 8;
    if (typeCount >= 4) score += 10;

    // Patterns (penalties)
    if (hasSequential(pw))   { score -= 15; patterns.push('secuencia'); }
    if (hasRepeated(pw))     { score -= 12; patterns.push('repetición'); }
    if (hasKeyboardPattern(pw)) { score -= 10; patterns.push('teclado'); }

    // Common password check (major penalty)
    if (COMMON_PASSWORDS.has(pw.toLowerCase())) {
      score -= 30;
      patterns.push('común');
    }

    score = Math.max(0, Math.min(100, score));
    const entropy = calcEntropy(pw);
    let level = 'baja';
    if (score >= 70) level = 'alta';
    else if (score >= 40) level = 'media';

    // Boost level if entropy is very high despite score
    if (entropy >= 80 && score >= 55) level = 'alta';
    if (entropy >= 60 && score >= 35) level = 'media';

    return { score, level, entropy, variety: typeCount, patterns, hasLower, hasUpper, hasNum, hasSym };
  }

  // ── Composition analysis ──
  function compAnalysis(pw) {
    const bars = CBAR.querySelectorAll('span');
    if (!pw) {
      bars.forEach(b => b.style.opacity = '0.2');
      ACOMP.textContent = 'Esperando datos...';
      return;
    }
    const total = pw.length || 1;
    const low  = (pw.match(/[a-z]/g) || []).length;
    const up   = (pw.match(/[A-Z]/g) || []).length;
    const num  = (pw.match(/[0-9]/g) || []).length;
    const sym  = total - low - up - num;
    const pcts = [low/total, up/total, num/total, sym/total];
    bars.forEach((b, i) => {
      b.style.width = Math.max(pcts[i] * 100, 0) + '%';
      b.style.opacity = pcts[i] > 0 ? '1' : '0.2';
    });
    const parts = [];
    if (low > 0) parts.push(`${Math.round(low/total*100)}% minúsculas`);
    if (up > 0)  parts.push(`${Math.round(up/total*100)}% mayúsculas`);
    if (num > 0) parts.push(`${Math.round(num/total*100)}% números`);
    if (sym > 0) parts.push(`${Math.round(sym/total*100)}% símbolos`);
    ACOMP.textContent = parts.join(', ') || 'Solo espacios y otros';
  }

  // ── Update UI ──
  function update(pw) {
    const { score, level, entropy, variety, patterns, hasLower, hasUpper, hasNum, hasSym } = calcStrength(pw);
    const color = getStrengthColor(score, level);

    // Gauge & Bar
    setProgress(score, color);

    // Score
    SCORE.textContent = score;

    // Status
    SDOT.style.background = color;
    SLABEL.textContent = getStatusLabel(level);
    STEXT.style.color = color;
    if (!pw) {
      STEXT.textContent = 'Ingresa una contraseña';
      SHINT.textContent = '';
    } else {
      STEXT.textContent = level === 'alta' ? '\u{1F389} Contraseña segura' :
                          level === 'media' ? '\u{1F4A1} Contraseña aceptable' :
                          '\u{26A0}\u{FE0F} Contraseña débil';
      SHINT.textContent = getStatusHint(level, pw);
      if (patterns.length > 0 && level !== 'alta') {
        SHINT.textContent += ` Detectado: ${patterns.join(', ')}.`;
      }
    }

    // Analysis
    ALEN.textContent = pw.length || 0;
    AENT.textContent = entropy;
    ATIME.textContent = crackTime(entropy, score);
    AVAR.textContent = `${variety}/4`;

    // Composition
    compAnalysis(pw);

    // Rules
    const ruleMap = {
      length8:  pw.length >= 8,
      length12: pw.length >= 12,
      lower:    hasLower,
      upper:    hasUpper,
      number:   hasNum,
      symbol:   hasSym,
      noSeq:    !hasSequential(pw) && !hasRepeated(pw) && !hasKeyboardPattern(pw)
    };
    RULES.forEach(r => {
      const key = r.dataset.rule;
      const met = ruleMap[key] || false;
      r.classList.toggle('met', met);
      r.querySelector('.check').textContent = met ? '\u2713' : '\u2715';
    });
  }

  // ── Events ──
  PWD.addEventListener('input', () => update(PWD.value));

  TOGGLE.addEventListener('click', () => {
    const type = PWD.type === 'password' ? 'text' : 'password';
    PWD.type = type;
    TOGGLE.textContent = type === 'password' ? '\u{1F441}' : '\u{1F648}'; // Cambia el icono a "ojos tapados"
  });

  CLEAR.addEventListener('click', () => {
    PWD.value = '';
    PWD.type = 'password';
    TOGGLE.textContent = '\u{1F441}';
    update('');
    PWD.focus();
  });

  // ── Generator ──
  GEN_TOG.addEventListener('click', () => {
    const open = GEN_BODY.classList.toggle('open');
    GEN_ARR.classList.toggle('open', open);
  });

  GEN_LEN.addEventListener('input', () => {
    GEN_DISP.textContent = GEN_LEN.value;
  });

  function generatePassword() {
    const len = parseInt(GEN_LEN.value);
    const sets = [];
    if (GEN_LOWER.checked) sets.push('abcdefghijklmnopqrstuvwxyz');
    if (GEN_UPPER.checked) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (GEN_NUMBER.checked) sets.push('0123456789');
    if (GEN_SYMBOL.checked) sets.push('!@#$%^&*()_+-=[]{}|;:,.<>?');

    if (sets.length === 0) {
      showToast('Selecciona al menos un tipo de carácter');
      return '';
    }

    let pw = '';
    const allChars = sets.join('');
    sets.forEach(s => pw += s[Math.floor(Math.random() * s.length)]);

    for (let i = pw.length; i < len; i++) {
      pw += allChars[Math.floor(Math.random() * allChars.length)];
    }

    pw = pw.split('').sort(() => Math.random() - 0.5).join('');
    return pw;
  }

  GEN_BTN.addEventListener('click', () => {
    const pw = generatePassword();
    if (pw) {
      GEN_OUT.value = pw;
      showToast('\u{2728} Contraseña generada');
    }
  });

  GEN_CPY.addEventListener('click', () => {
    if (!GEN_OUT.value) { 
        showToast('Genera una contraseña primero'); 
        return; 
    }
    
    // API Moderna del portapapeles
    navigator.clipboard.writeText(GEN_OUT.value).then(() => {
        showToast('\u{1F4CB} Copiada al portapapeles');
    }).catch(err => {
        console.error('Error al copiar: ', err);
        showToast('No se pudo copiar');
    });
  });

  // ── Test & Reset ──
  TEST_BTN.addEventListener('click', () => {
    const examples = [
      'hola123', 'MiPerroEsRex2024!', 'abc123', 'P@ssw0rd!2024Segura',
      'qwerty123', 'Clave#Fuerte$99%', '12345678', 'N0_M3_Import4!'
    ];
    const pick = examples[Math.floor(Math.random() * examples.length)];
    PWD.value = pick;
    PWD.type = 'text';
    TOGGLE.textContent = '\u{1F648}'; // Oculto
    update(pick);
    showToast(`Probando: "${pick}"`);
  });

  RESET_BTN.addEventListener('click', () => {
    PWD.value = '';
    PWD.type = 'password';
    TOGGLE.textContent = '\u{1F441}';
    update('');
    GEN_OUT.value = '';
    PWD.focus();
    showToast('Todo restablecido');
  });

  // ── Init ──
  update('');
});
