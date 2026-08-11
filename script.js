/* ============================================================
   CRICKET TOURNAMENT REGISTRATION — SCRIPT
   ============================================================ */
(function () {
  'use strict';

  // ---- DOM References ----
  const form = document.getElementById('registrationForm');
  const fullNameInput = document.getElementById('fullName');
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

  // ---- DOB Dropdown Setup ----
  const dobDay = document.getElementById('dobDay');
  const dobMonth = document.getElementById('dobMonth');
  const dobYear = document.getElementById('dobYear');

  // Populate days (1-31)
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = String(d).padStart(2, '0');
    opt.textContent = d;
    dobDay.appendChild(opt);
  }

  // Populate years (current year down to 1920)
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1920; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    dobYear.appendChild(opt);
  }

  // Update days when month/year change (handles Feb, 30/31 day months)
  function updateDays() {
    const month = parseInt(dobMonth.value);
    const year = parseInt(dobYear.value);
    const selectedDay = dobDay.value;

    if (!month || !year) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const currentOptions = dobDay.querySelectorAll('option:not([disabled])');

    // Clear existing day options (except placeholder)
    currentOptions.forEach(opt => opt.remove());

    for (let d = 1; d <= daysInMonth; d++) {
      const opt = document.createElement('option');
      opt.value = String(d).padStart(2, '0');
      opt.textContent = d;
      dobDay.appendChild(opt);
    }

    // Restore previously selected day if still valid
    if (parseInt(selectedDay) <= daysInMonth) {
      dobDay.value = selectedDay;
    } else {
      dobDay.value = '';
    }
  }

  dobMonth.addEventListener('change', updateDays);
  dobYear.addEventListener('change', updateDays);

  // ---- DOB Change → Age Calculation ----
  function onDobChange() {
    const day = dobDay.value;
    const month = dobMonth.value;
    const year = dobYear.value;

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

  dobDay.addEventListener('change', onDobChange);
  dobMonth.addEventListener('change', onDobChange);
  dobYear.addEventListener('change', onDobChange);

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
    const phoneValid = phoneInput.value.length === 10;
    const areaValid = areaInput.value.trim().length >= 2;
    const dobValid = dobInput.value && calculateAge(dobInput.value) >= 18;
    const skillValid = document.querySelector('input[name="primarySkill"]:checked');
    const declared = declarationCb.checked;

    submitBtn.disabled = !(nameValid && phoneValid && areaValid && dobValid && skillValid && declared);
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
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeHqncpxCLOfztLAcadB-LClRbvyng2Y959qhs-kDGxP28-G0fXbqRTkLWjBAldophPA/exec';

    // Send data to Google Sheets
    const formData = new FormData(form);

    // Combine multiple selected skills into one comma-separated string for Google Sheets
    const selectedSkills = Array.from(document.querySelectorAll('input[name="primarySkill"]:checked'))
      .map(cb => cb.value).join(', ');
    formData.set('primarySkill', selectedSkills);

    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData
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
