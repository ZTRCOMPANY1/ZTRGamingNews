document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

const THEME_KEY = 'pixelpress-theme';
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem(THEME_KEY);

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.body.classList.add('dark');
}

function getThemeMeta() {
  const dark = document.body.classList.contains('dark');
  return {
    icon: dark ? '☀️' : '🌙',
    label: dark ? 'Modo claro' : 'Modo escuro',
    title: dark ? 'Trocar para modo claro' : 'Trocar para modo escuro'
  };
}

function updateThemeButton(button) {
  if (!button) return;
  const meta = getThemeMeta();
  button.setAttribute('aria-label', meta.title);
  button.setAttribute('title', meta.title);
  button.innerHTML = `<span aria-hidden="true">${meta.icon}</span><span class="theme-label">${meta.label}</span>`;
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeButton(document.getElementById('theme-toggle'));
}

(function mountThemeToggle() {
  const tools = document.querySelector('.masthead-tools');
  if (!tools || document.getElementById('theme-toggle')) return;
  const button = document.createElement('button');
  button.id = 'theme-toggle';
  button.type = 'button';
  button.addEventListener('click', toggleTheme);
  tools.appendChild(button);
  updateThemeButton(button);
})();

document.querySelectorAll('[data-newsletter]').forEach(form => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input || !input.value.trim()) {
      alert('Digite um e-mail para assinar a newsletter.');
      return;
    }
    alert('Inscrição recebida. Obrigado por acompanhar o PixelPress.');
    form.reset();
  });
});

document.querySelectorAll('.contact-form').forEach(form => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('Mensagem enviada com sucesso.');
    form.reset();
  });
});
