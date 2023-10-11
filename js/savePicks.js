function handleCheckboxStorage(picks, username) {
    if (picks === 0) {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        // dont clear saved sorting options
        if (checkbox.name !== "descCheckbox" && checkbox.name !== "gpCheckbox" && checkbox.name !== "ascCheckbox") {
          const storedValue = localStorage.getItem(`${username}_${checkbox.name}`);
          if (storedValue) {
            localStorage.removeItem(`${username}_${checkbox.name}`);
          }
        }
          
      });
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
    const username = document.querySelector(".user-profile").children[0].childNodes[0].textContent
    restoreCheckboxState(username);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.onchange = function () {
        handleCheckboxChange(checkbox, username);
      };
    });
  });