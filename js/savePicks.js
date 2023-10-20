// clear picks selections for each new week
function handleCheckboxStorage(picks, username) {
    if (picks === 0) {
      for (const key in localStorage) {
        if (key.includes(username) && key.includes("game")) {
          localStorage.removeItem(key)
        }
      }
    }
  }
  
  function handleCheckboxChange(checkbox, username) {
    const dataUrl = checkbox.getAttribute("data-url");
    if (dataUrl !== null) {
      localStorage.setItem(`${username}_${dataUrl}_${checkbox.name}`, checkbox.checked);
    } else {
      localStorage.setItem(`${username}_${checkbox.name}`, checkbox.checked);
    }
    
  }
  
  function restoreCheckboxState(username) {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const dataUrl = checkbox.getAttribute("data-url");
      let storedValue = "";
      if (dataUrl !== null) {
        storedValue = localStorage.getItem(`${username}_${dataUrl}_${checkbox.name}`);
      } else {
        storedValue = localStorage.getItem(`${username}_${checkbox.name}`);
      }
      if (storedValue === "true") {
        checkbox.checked = true;
      }
    });
  }
  
  window.addEventListener("load", function () {
    let username = document.querySelector(".user-profile")?.children[0]?.childNodes[0]?.textContent;
    if (!username) username = "guest"
    restoreCheckboxState(username);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.onchange = function () {
        handleCheckboxChange(checkbox, username);
      };
    });
  });
