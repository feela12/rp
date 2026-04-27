function openModal(imgElement) {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modal-img");
    if (!modal || !modalImg || !imgElement) return;
    modalImg.src = imgElement.src;
    modal.style.display = "flex";
  }
  
  function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) {
      modal.style.display = "none";
    }
  }


  
  function toggleText(card) {
    card.classList.toggle('active');
  }


  document.addEventListener('DOMContentLoaded', () => {
    const image = document.getElementById('myImage');

    if (image) {
      image.addEventListener('click', () => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  });
    
