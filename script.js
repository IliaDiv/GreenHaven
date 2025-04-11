document.addEventListener('DOMContentLoaded', function () {
  // Loop through each carousel container
  document.querySelectorAll('.carousel-container').forEach((carouselWrapper) => {
    const carousel = carouselWrapper.querySelector('.carousel-slides');
    const slides = carouselWrapper.querySelectorAll('.carousel-slide');
    const prevBtn = carouselWrapper.querySelector('.prev-btn');
    const nextBtn = carouselWrapper.querySelector('.next-btn');
    const indicators = carouselWrapper.querySelectorAll('.indicator');

    let currentSlide = 0;
    const slideCount = slides.length;

    function updateCarousel() {
      carousel.style.transform = `translateX(-${currentSlide * 100}%)`;

      indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }

    nextBtn.addEventListener('click', function () {
      currentSlide = (currentSlide + 1) % slideCount;
      updateCarousel();
    });

    prevBtn.addEventListener('click', function () {
      currentSlide = (currentSlide - 1 + slideCount) % slideCount;
      updateCarousel();
    });

    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', function () {
        currentSlide = index;
        updateCarousel();
      });
    });

    updateCarousel();
  });
});
