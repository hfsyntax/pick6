function updateCountdown(timeUntilReset, paused) {
  // Convert the time until reset to days, hours, minutes, and seconds
  const days = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);
  const countdownElement = document.getElementById('countdown');

  // Update the countdown display
  if (!paused) {
    countdownElement.innerHTML = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
    setTimeout(() => {
      timeUntilReset -= 1000;
      updateCountdown(timeUntilReset, paused);
    }, 1000);
  } else {
    countdownElement.innerHTML = "Paused"
  }
}