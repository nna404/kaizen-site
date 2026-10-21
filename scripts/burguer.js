// Lógica do Menu Lateral
const openMenu = document.getElementById('open-menu');
const closeMenu = document.getElementById('close-menu');
const sideMenu = document.getElementById('side-menu');
const menuOverlay = document.getElementById('menu-overlay');

function toggleMenu() {
  sideMenu.classList.toggle('active');
  menuOverlay.classList.toggle('active');
}

// Abrir e fechar ao clicar nos botões e no fundo escuro
openMenu.addEventListener('click', toggleMenu);
closeMenu.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);

// Fecha o menu automaticamente quando clicar em um dos links
document.querySelectorAll('.side-link').forEach(link => {
  link.addEventListener('click', toggleMenu);
});