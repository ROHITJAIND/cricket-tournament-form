/* ============================================================
   CRICKET TOURNAMENT REGISTRATION — SCRIPT
   ============================================================ */
(function () {
  'use strict';

  // ---- DOM References ----
  const form = document.getElementById('registrationForm');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const areaInput = document.getElementById('area');
  const dobInput = document.getElementById('dob');
  const ageValue = document.getElementById('ageValue');
  const ageDisplay = document.getElementById('ageDisplay');
  const ageStatus = document.getElementById('ageStatus');
  const declarationCb = document.getElementById('declaration');
  const submitBtn = document.getElementById('submitBtn');

  const successModal = document.getElementById('successModal');
  const duplicateModal = document.getElementById('duplicateModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const duplicateCloseBtn = document.getElementById('duplicateCloseBtn');

  // Error elements
  const fullNameError = document.getElementById('fullNameError');
  const emailError = document.getElementById('emailError');
  const phoneError = document.getElementById('phoneError');
  const areaError = document.getElementById('areaError');
  const dobError = document.getElementById('dobError');
  const skillError = document.getElementById('skillError');
  const declarationError = document.getElementById('declarationError');

  // localStorage key for registered phone numbers
  const STORAGE_KEY = 'cricket_registered_phones';

  // ---- Helpers ----
  function getRegisteredPhones() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function savePhone(phone) {
    const phones = getRegisteredPhones();
    phones.push(phone);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phones));
  }

  function isPhoneRegistered(phone) {
    return getRegisteredPhones().includes(phone);
  }

  // ---- Age Calculation ----
  function calculateAge(dob) {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // ---- Scroll Animation (Intersection Observer) ----
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    observer.observe(el);
  });

  // ---- DOB Scroll Wheel Picker ----
  const ITEM_HEIGHT = 32;
  const VISIBLE_ITEMS = 5;
  const PADDING_ITEMS = 2; // empty items above/below for centering

  const wheelDay = document.getElementById('wheelDay');
  const wheelMonth = document.getElementById('wheelMonth');
  const wheelYear = document.getElementById('wheelYear');

  const months = [
    { value: '01', label: 'Jan' },
    { value: '02', label: 'Feb' },
    { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' },
    { value: '05', label: 'May' },
    { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' },
    { value: '08', label: 'Aug' },
    { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
  ];

  // Build wheel items with padding spacers
  function buildWheel(container, items) {
    container.innerHTML = '';

    // Top padding spacers
    for (let i = 0; i < PADDING_ITEMS; i++) {
      const spacer = document.createElement('div');
      spacer.className = 'wheel-item wheel-spacer';
      spacer.style.height = ITEM_HEIGHT + 'px';
      container.appendChild(spacer);
    }

    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'wheel-item';
      el.dataset.value = item.value;
      el.textContent = item.label;
      el.style.height = ITEM_HEIGHT + 'px';
      el.addEventListener('click', () => {
        const idx = items.indexOf(item);
        container.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
      });
      container.appendChild(el);
    });

    // Bottom padding spacers
    for (let i = 0; i < PADDING_ITEMS; i++) {
      const spacer = document.createElement('div');
      spacer.className = 'wheel-item wheel-spacer';
      spacer.style.height = ITEM_HEIGHT + 'px';
      container.appendChild(spacer);
    }
  }

  // Get the currently selected value from a wheel
  function getWheelValue(container) {
    const scrollTop = container.scrollTop;
    const idx = Math.round(scrollTop / ITEM_HEIGHT);
    const items = container.querySelectorAll('.wheel-item:not(.wheel-spacer)');
    if (idx >= 0 && idx < items.length) {
      return items[idx].dataset.value;
    }
    return null;
  }

  // ---- Audio Context for Tick Sound ----
  let audioCtx;

  function initAudio() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) { }
  }

  // Unlock audio context on first interaction (required by browsers)
  ['touchstart', 'click'].forEach(evt => {
    document.addEventListener(evt, function unlockAudio() {
      initAudio();
      document.removeEventListener(evt, unlockAudio);
    }, { once: true });
  });

  function playTickSound() {
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'square';
      // A sharper, crisper tick
      osc.frequency.setValueAtTime(6200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.015);

      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.015);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.015);
    } catch (e) {
      // Ignore audio errors (e.g., if blocked by browser policy)
    }
  }

  function playSuccessSound() {
    try {
      initAudio();

      // Play a happy 4-note ascending chime (C5, E5, G5, C6)
      const notes = [
        { freq: 523.25, time: 0 },
        { freq: 659.25, time: 0.1 },
        { freq: 783.99, time: 0.2 },
        { freq: 1046.50, time: 0.3 }
      ];

      notes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = note.freq;

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + note.time);
        gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + note.time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + note.time + 0.4);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + note.time);
        osc.stop(audioCtx.currentTime + note.time + 0.4);
      });
    } catch (e) { }
  }

  // Highlight the selected item in a wheel
  function updateHighlight(container) {
    const scrollTop = container.scrollTop;
    const idx = Math.round(scrollTop / ITEM_HEIGHT);

    // Play sound if index changed
    const prevIdx = container.dataset.currentIdx;
    if (prevIdx !== undefined && prevIdx !== String(idx)) {
      playTickSound();
    }
    container.dataset.currentIdx = idx;

    const items = container.querySelectorAll('.wheel-item:not(.wheel-spacer)');
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === idx);
    });
  }

  // Generate day items for a given month/year
  function getDayItems(month, year) {
    let maxDay = 31;
    if (month && year) {
      maxDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    }
    const items = [];
    for (let d = 1; d <= maxDay; d++) {
      items.push({ value: String(d).padStart(2, '0'), label: String(d) });
    }
    return items;
  }

  // Generate year items
  function getYearItems() {
    const currentYear = new Date().getFullYear();
    const items = [];
    for (let y = currentYear; y >= 1920; y--) {
      items.push({ value: String(y), label: String(y) });
    }
    return items;
  }

  // Initialize wheels
  buildWheel(wheelDay, getDayItems(null, null));
  buildWheel(wheelMonth, months);
  buildWheel(wheelYear, getYearItems());

  // Debounce scroll for snapping
  let scrollTimers = {};
  function onWheelScroll(container, key) {
    updateHighlight(container);

    clearTimeout(scrollTimers[key]);
    scrollTimers[key] = setTimeout(() => {
      // Snap to nearest item
      const idx = Math.round(container.scrollTop / ITEM_HEIGHT);
      container.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
      updateHighlight(container);

      // Rebuild days if month or year changed
      if (key === 'month' || key === 'year') {
        rebuildDays();
      }

      // Recalculate age
      onDobChange();
    }, 100);
  }

  // Rebuild day wheel when month/year changes
  function rebuildDays() {
    const month = getWheelValue(wheelMonth);
    const year = getWheelValue(wheelYear);
    const currentDay = getWheelValue(wheelDay);
    const dayItems = getDayItems(month, year);

    buildWheel(wheelDay, dayItems);

    // Try to restore previous day
    if (currentDay) {
      const dayIdx = dayItems.findIndex(d => d.value === currentDay);
      if (dayIdx >= 0) {
        wheelDay.scrollTop = dayIdx * ITEM_HEIGHT;
      } else {
        // Day was out of range, scroll to last valid day
        wheelDay.scrollTop = (dayItems.length - 1) * ITEM_HEIGHT;
      }
    }
    updateHighlight(wheelDay);
  }

  wheelDay.addEventListener('scroll', () => onWheelScroll(wheelDay, 'day'));
  wheelMonth.addEventListener('scroll', () => onWheelScroll(wheelMonth, 'month'));
  wheelYear.addEventListener('scroll', () => onWheelScroll(wheelYear, 'year'));

  // ---- DOB Change → Age Calculation ----
  function onDobChange() {
    const day = getWheelValue(wheelDay);
    const month = getWheelValue(wheelMonth);
    const year = getWheelValue(wheelYear);

    if (!day || !month || !year) {
      ageValue.textContent = '—';
      ageDisplay.className = 'age-display';
      ageStatus.textContent = '';
      ageStatus.className = 'age-status';
      dobError.textContent = '';
      dobInput.value = '';
      updateSubmitState();
      return;
    }

    const dob = `${year}-${month}-${day}`;
    dobInput.value = dob; // Set hidden input for form submission

    const age = calculateAge(dob);

    if (age < 0 || age > 120) {
      ageValue.textContent = '—';
      ageDisplay.className = 'age-display';
      ageStatus.textContent = '';
      dobError.textContent = 'Please enter a valid date of birth';
      updateSubmitState();
      return;
    }

    ageValue.textContent = age;
    dobError.textContent = '';

    if (age > 60) {
      ageDisplay.className = 'age-display age-warn';
      ageStatus.textContent = '⚠️ Play at your own risk';
      ageStatus.className = 'age-status status-warn';
    } else if (age >= 18) {
      ageDisplay.className = 'age-display age-valid';
      ageStatus.textContent = '✓ Eligible to play';
      ageStatus.className = 'age-status status-ok';
    } else {
      ageDisplay.className = 'age-display age-invalid';
      ageStatus.textContent = '✗ Must be 18 or older';
      ageStatus.className = 'age-status status-fail';
    }

    updateSubmitState();
  }

  // ---- Phone Input validation ----
  phoneInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 10);

    if (this.value.length === 10) {
      phoneError.textContent = '';
      this.classList.remove('input-error');
      this.classList.add('input-success');
    } else {
      this.classList.remove('input-success');
      if (this.value.length > 0) {
        phoneError.textContent = 'Please enter a valid 10-digit phone number';
        this.classList.add('input-error');
      }
    }

    if (this.value.length === 0) {
      phoneError.textContent = '';
      this.classList.remove('input-error', 'input-success');
    }

    updateSubmitState();
  });

  phoneInput.addEventListener('blur', function () {
    if (this.value.length > 0 && this.value.length < 10) {
      phoneError.textContent = 'Please enter a valid 10-digit phone number';
      this.classList.add('input-error');
    }
  });

  // ---- Name Input validation ----
  fullNameInput.addEventListener('input', function () {
    if (this.value.trim().length >= 2) {
      fullNameError.textContent = '';
      this.classList.remove('input-error');
      this.classList.add('input-success');
    } else {
      this.classList.remove('input-success');
    }
    updateSubmitState();
  });

  // ---- Email Input validation ----
  emailInput.addEventListener('input', function () {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim())) {
      emailError.textContent = '';
      this.classList.remove('input-error');
      this.classList.add('input-success');
    } else {
      this.classList.remove('input-success');
    }
    updateSubmitState();
  });

  // ---- Area Input validation ----
  areaInput.addEventListener('input', function () {
    if (this.value.trim().length >= 2) {
      areaError.textContent = '';
      this.classList.remove('input-error');
      this.classList.add('input-success');
    } else {
      this.classList.remove('input-success');
    }
    updateSubmitState();
  });

  // ---- Skill Selection ----
  const skillCheckboxes = document.querySelectorAll('input[name="primarySkill"]');
  const skillDetails = {
    Batsman: document.getElementById('batsmanDetail'),
    Bowler: document.getElementById('bowlerDetail'),
    'All-Rounder': document.getElementById('allRounderDetail'),
  };

  skillCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      if (skillDetails[this.value]) {
        if (this.checked) {
          skillDetails[this.value].classList.add('expanded');
        } else {
          skillDetails[this.value].classList.remove('expanded');
        }
      }

      skillError.textContent = '';
      updateSubmitState();
    });
  });

  // ---- Tag Buttons ----
  document.querySelectorAll('.tag-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const textarea = document.getElementById(targetId);
      const tagText = this.textContent.trim();

      this.classList.toggle('tag-active');

      if (this.classList.contains('tag-active')) {
        // Add tag to textarea
        const current = textarea.value.trim();
        textarea.value = current ? current + ', ' + tagText : tagText;
      } else {
        // Remove tag from textarea
        let current = textarea.value;
        // Remove with various separators
        current = current.replace(new RegExp(',?\\s*' + escapeRegex(tagText) + '\\s*,?', 'g'), ', ');
        current = current.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
        textarea.value = current;
      }
    });
  });

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ---- Declaration Checkbox ----
  declarationCb.addEventListener('change', function () {
    if (this.checked) {
      declarationError.textContent = '';
    }
    updateSubmitState();
  });

  // ---- Submit Button State ----
  function updateSubmitState() {
    const nameValid = fullNameInput.value.trim().length >= 2;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    const phoneValid = phoneInput.value.length === 10;
    const areaValid = areaInput.value.trim().length >= 2;
    const dobValid = dobInput.value && calculateAge(dobInput.value) >= 18;
    const skillValid = document.querySelector('input[name="primarySkill"]:checked');
    const declared = declarationCb.checked;

    submitBtn.disabled = !(nameValid && emailValid && phoneValid && areaValid && dobValid && skillValid && declared);
  }

  // ---- Form Submission ----
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    let valid = true;

    // Validate name
    if (fullNameInput.value.trim().length < 2) {
      fullNameError.textContent = 'Please enter your full name';
      fullNameInput.classList.add('input-error');
      valid = false;
    }

    // Validate email
    const email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Please enter a valid email address';
      emailInput.classList.add('input-error');
      valid = false;
    }

    // Validate area
    if (areaInput.value.trim().length < 2) {
      areaError.textContent = 'Please enter your area';
      areaInput.classList.add('input-error');
      valid = false;
    }

    // Validate phone
    const phone = phoneInput.value.trim();
    if (phone.length !== 10) {
      phoneError.textContent = 'Please enter a valid 10-digit phone number';
      phoneInput.classList.add('input-error');
      valid = false;
    }

    // Validate DOB & age
    if (!dobInput.value) {
      dobError.textContent = 'Please select your date of birth';
      valid = false;
    } else if (calculateAge(dobInput.value) < 18) {
      dobError.textContent = 'You must be 18 years or older to register';
      valid = false;
    }

    // Validate skill
    const selectedSkill = document.querySelector('input[name="primarySkill"]:checked');
    if (!selectedSkill) {
      skillError.textContent = 'Please select your primary playing role';
      valid = false;
    }

    // Validate declaration
    if (!declarationCb.checked) {
      declarationError.textContent = 'You must accept the declaration to proceed';
      valid = false;
    }

    if (!valid) return;

    // Check duplicate phone
    if (isPhoneRegistered(phone)) {
      showModal(duplicateModal);
      return;
    }

    // Show loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Simulate submission delay for UX
    // ----------------------------------------------------------------------
    // GOOGLE SHEETS INTEGRATION
    // ----------------------------------------------------------------------
    // 1. Create a Google Sheet.
    // 2. Go to Extensions > Apps Script.
    // 3. Paste the provided Apps Script code and deploy it as a Web App.
    // 4. Paste the Web App URL below:
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTivCWKIHnC1pOXJB8wo6v1f3zwVcby01y0iHxmzJzhdQgj8QPYb1pIkc-8sO92wr7/exec';

    // Send data to Google Sheets
    const formData = new FormData(form);

    // Combine multiple selected skills into one comma-separated string for Google Sheets
    const selectedSkills = Array.from(document.querySelectorAll('input[name="primarySkill"]:checked'))
      .map(cb => cb.value).join(', ');
    formData.set('primarySkill', selectedSkills);

    // Google Apps Script requires data to be URL-encoded (application/x-www-form-urlencoded) 
    // to properly populate the `e.parameter` object.
    const urlEncodedData = new URLSearchParams(formData).toString();

    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: urlEncodedData
    })
      .then(() => {
        // With no-cors, the response is opaque, so we assume success if no network error occurred
        onSuccess();
      })
      .catch(error => {
        console.error('Error!', error.message);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        alert('Something went wrong. Please try again.');
      });

    function onSuccess() {
      // Save phone
      savePhone(phone);

      // Reset button
      submitBtn.classList.remove('loading');

      // Show success
      showModal(successModal);
      playSuccessSound();

      // 🎉 Fire Confetti!
      const count = 250;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 2000, // Show above modal
        colors: ['#d4af37', '#b8942e', '#22c55e', '#ffffff'] // Gold theme colors
      };

      function fire(particleRatio, opts) {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      // Reset form
      form.reset();
      ageValue.textContent = '—';
      ageDisplay.className = 'age-display';
      ageStatus.textContent = '';
      ageStatus.className = 'age-status';
      Object.values(skillDetails).forEach((detail) => detail.classList.remove('expanded'));
      document.querySelectorAll('.tag-btn').forEach((btn) => btn.classList.remove('tag-active'));
      document.querySelectorAll('.form-input').forEach((input) => {
        input.classList.remove('input-success', 'input-error');
      });
      submitBtn.disabled = true;
    }
  });

  // ---- Modal Controls ----
  function showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function hideModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalCloseBtn.addEventListener('click', () => hideModal(successModal));
  duplicateCloseBtn.addEventListener('click', () => hideModal(duplicateModal));

  // Close modals on overlay click
  [successModal, duplicateModal].forEach((modal) => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) hideModal(this);
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      hideModal(successModal);
      hideModal(duplicateModal);
    }
  });

  // ---- Initial state ----
  updateSubmitState();
})();
