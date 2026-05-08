const menuToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isActive = navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  });
}

const navDropdowns = document.querySelectorAll('.nav-dropdown');
if (navDropdowns.length) {
  navDropdowns.forEach((dropdown) => {
    dropdown.addEventListener('mouseenter', () => {
      dropdown.setAttribute('open', '');
    });
    dropdown.addEventListener('mouseleave', () => {
      dropdown.removeAttribute('open');
    });
  });
}

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitText = document.querySelector('#submit-text');
    if (submitText) {
      submitText.textContent = 'Message sent!';
      setTimeout(() => {
        submitText.textContent = 'Send Message';
      }, 2500);
    }
    contactForm.reset();
  });
}
