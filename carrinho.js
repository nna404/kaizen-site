/* ==========================================================================
   CARRINHO.JS — carrinho da KAIZEN (salvo no localStorage)

   Carregue depois do produtos.js, no index.html e no produto.html:
   <script src="carrinho.js"></script>

   - Atualiza o contador (badge) do ícone do carrinho
   - Desenha os itens dentro do menu lateral #cart-menu
   - Expõe window.KaizenCart.adicionar(item) para a página de produto
   ========================================================================== */

(function () {
  'use strict';

  var CHAVE = 'kaizen-cart';

  // Coloque aqui o link do checkout (pagamento, WhatsApp etc.).
  // Enquanto estiver vazio, o botão avisa que o checkout ainda não existe.
  var CHECKOUT_URL = '';


  /* ------------------------------------------------------------------------
     DADOS
     ------------------------------------------------------------------------ */

  function ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || [];
    } catch (e) {
      return [];
    }
  }

  function gravar(itens) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch (e) {
      console.warn('[carrinho.js] Não foi possível salvar o carrinho:', e);
    }
    render();
  }

  function preco(valor) {
    return typeof formatarPreco === 'function'
      ? formatarPreco(valor)
      : 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
  }

  function adicionar(item) {
    var itens = ler();
    var existente = itens.filter(function (i) {
      return i.id === item.id && i.tamanho === item.tamanho;
    })[0];

    if (existente) {
      existente.quantidade += 1;
    } else {
      itens.push({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        tamanho: item.tamanho,
        imagem: item.imagem,
        quantidade: 1
      });
    }
    gravar(itens);
  }

  function alterarQuantidade(indice, delta) {
    var itens = ler();
    if (!itens[indice]) return;
    itens[indice].quantidade += delta;
    if (itens[indice].quantidade < 1) itens.splice(indice, 1);
    gravar(itens);
  }

  function remover(indice) {
    var itens = ler();
    itens.splice(indice, 1);
    gravar(itens);
  }

  // Abre o menu lateral do carrinho (quem trata o clique é o script dos menus)
  function abrir() {
    var botao = document.querySelector('button[aria-label="Carrinho"]');
    if (botao) botao.click();
  }


  /* ------------------------------------------------------------------------
     INTERFACE
     ------------------------------------------------------------------------ */

  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function linkContinuar() {
    var naHome = !!document.getElementById('colecao');
    var link = criar('a', 'cta', 'Explorar Coleção');
    link.href = naHome ? '#colecao' : 'index.html#colecao';
    link.style.cssText = 'display:block;text-align:center;margin-top:30px;';
    link.addEventListener('click', function () {
      var overlay = document.getElementById('menu-overlay');
      if (overlay) overlay.click(); // fecha os painéis
    });
    return link;
  }

  function render() {
    var itens = ler();
    var quantidadeTotal = itens.reduce(function (n, i) { return n + i.quantidade; }, 0);

    var badge = document.querySelector('button[aria-label="Carrinho"] .badge');
    if (badge) badge.textContent = quantidadeTotal;

    var secao = document.querySelector('#cart-menu .side-menu-section');
    if (!secao) return;
    secao.textContent = '';

    secao.appendChild(criar('div', 'side-link-title', 'Seu Carrinho'));

    if (!itens.length) {
      var vazio = criar('p', 'side-menu-intro', 'O seu carrinho está vazio no momento.');
      vazio.style.marginTop = '20px';
      secao.appendChild(vazio);
      secao.appendChild(linkContinuar());
      return;
    }

    var lista = criar('ul', 'cart-list');
    var soma = 0;

    itens.forEach(function (item, indice) {
      soma += (item.preco || 0) * item.quantidade;

      var li = criar('li', 'cart-item');

      var img = criar('img');
      img.src = item.imagem;
      img.alt = item.nome;
      li.appendChild(img);

      var info = criar('div', 'cart-info');
      info.appendChild(criar('strong', '', item.nome));
      info.appendChild(criar('span', '', 'Tamanho: ' + item.tamanho));
      info.appendChild(criar('span', '', preco(item.preco)));

      var qtd = criar('div', 'cart-qty');
      var menos = criar('button', '', '−');
      menos.type = 'button';
      menos.setAttribute('aria-label', 'Diminuir quantidade');
      menos.addEventListener('click', function () { alterarQuantidade(indice, -1); });
      var mais = criar('button', '', '+');
      mais.type = 'button';
      mais.setAttribute('aria-label', 'Aumentar quantidade');
      mais.addEventListener('click', function () { alterarQuantidade(indice, 1); });
      qtd.appendChild(menos);
      qtd.appendChild(criar('span', '', String(item.quantidade)));
      qtd.appendChild(mais);
      info.appendChild(qtd);
      li.appendChild(info);

      var x = criar('button', 'cart-remove', '✕');
      x.type = 'button';
      x.setAttribute('aria-label', 'Remover ' + item.nome);
      x.addEventListener('click', function () { remover(indice); });
      li.appendChild(x);

      lista.appendChild(li);
    });

    secao.appendChild(lista);

    var total = criar('div', 'cart-total');
    total.appendChild(criar('span', '', 'Total'));
    total.appendChild(criar('span', '', preco(soma)));
    secao.appendChild(total);

    var finalizar = criar('button', 'cta cart-checkout', 'Finalizar compra');
    finalizar.type = 'button';
    finalizar.addEventListener('click', function () {
      if (CHECKOUT_URL) {
        window.open(CHECKOUT_URL, '_blank', 'noopener');
      } else {
        alert('O checkout ainda não foi configurado.');
      }
    });
    secao.appendChild(finalizar);
  }

  window.KaizenCart = { adicionar: adicionar, abrir: abrir, ler: ler, render: render };

  // Mantém várias abas sincronizadas
  window.addEventListener('storage', function (e) {
    if (e.key === CHAVE) render();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
