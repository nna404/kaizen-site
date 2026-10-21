/* ==========================================================================
   MENUS.JS — menus laterais e pesquisa do header (para o produto.html)

   É a mesma lógica que está no <script> do index.html, em arquivo separado.
   Não use no index.html (lá o código já está embutido).
   ========================================================================== */

(function () {
  'use strict';

  var overlay = document.getElementById('menu-overlay');
  var painelMenu = document.getElementById('side-menu');
  var painelCarrinho = document.getElementById('cart-menu');
  var painelFavoritos = document.getElementById('fav-menu');
  var paineis = [painelMenu, painelCarrinho, painelFavoritos];

  function fecharTudo() {
    paineis.forEach(function (p) { if (p) p.classList.remove('active'); });
    if (overlay) overlay.classList.remove('active');
  }

  function abrir(painel) {
    if (!painel) return;
    fecharTudo();
    painel.classList.add('active');
    if (overlay) overlay.classList.add('active');
  }

  function ligar(botao, acao) {
    if (botao) botao.addEventListener('click', acao);
  }

  ligar(document.getElementById('open-menu'), function () { abrir(painelMenu); });
  ligar(document.querySelector('button[aria-label="Carrinho"]'), function () { abrir(painelCarrinho); });
  ligar(document.querySelector('button[aria-label="Favoritos"]'), function () { abrir(painelFavoritos); });
  ligar(document.getElementById('close-menu'), fecharTudo);
  ligar(document.getElementById('close-cart'), fecharTudo);
  ligar(document.getElementById('close-fav'), fecharTudo);
  ligar(overlay, fecharTudo);

  // Fecha ao clicar em links do menu (delegação: vale também para itens criados depois)
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.side-menu .side-link, .side-menu .cta')) fecharTudo();
  });

  // Pesquisa
  var botaoPesquisa = document.querySelector('button[aria-label="Pesquisar"]');
  var barraPesquisa = document.getElementById('search-bar-overlay');
  var fecharPesquisa = document.getElementById('close-search');
  var campoPesquisa = document.getElementById('search-input');

  function alternarPesquisa() {
    if (!barraPesquisa) return;
    barraPesquisa.classList.toggle('active');
    if (barraPesquisa.classList.contains('active')) {
      setTimeout(function () { if (campoPesquisa) campoPesquisa.focus(); }, 100);
    } else if (campoPesquisa) {
      campoPesquisa.value = '';
    }
  }

  ligar(botaoPesquisa, alternarPesquisa);
  ligar(fecharPesquisa, alternarPesquisa);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (barraPesquisa && barraPesquisa.classList.contains('active')) alternarPesquisa();
    if (overlay && overlay.classList.contains('active')) fecharTudo();
  });
})();
