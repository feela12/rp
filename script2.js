function openModal(imgElement) {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modal-img");
    modalImg.src = imgElement.src;
    modal.style.display = "flex";
  }
  
  function closeModal() {
    document.getElementById("modal").style.display = "none";
  }


  
  function toggleText(card) {
    card.classList.toggle('active');
  }


  document.getElementById('myImage').addEventListener('click', () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  });

  
    function toggleMenu() {
      document.getElementById('menu').classList.toggle('active');
    }

    function scrollToSection() {
      document.getElementById('uvod').scrollIntoView({ behavior: 'smooth' });
    }