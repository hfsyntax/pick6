Element.prototype.toggle = function() { 
    this.style.display === "block" ? this.style.display = "none" : this.style.display = "block"
}

window.addEventListener("load", function(){
    const settingsBar = document.querySelector("#settings_bar")
    const settings = document.querySelector("#settings")
    const userProfile = document.querySelector(".user-profile")
    const profileHover = document.querySelector(".profile-hover")
    const profileOverlay = document.querySelector("#profile-overlay")
    const settingsOverlay = document.querySelector("#settings-overlay")
    const profileIcon = document.querySelector(".user-profile-icon.fa.fa-user-circle")
    const logoffButton = document.getElementById("logoff")
    const dropdown = document.getElementById("dropdown")
    const ascCheckbox = document.getElementById("ascCheckbox")
    const descCheckbox = document.getElementById("descCheckbox")
    const gpCheckbox = document.getElementById("gpCheckbox")
    
    if (settingsBar) {
        settingsBar.onclick = function () {
            settings.classList.toggle("open");
            settingsOverlay.toggle();
        }
    }
    
    if (userProfile) {
        userProfile.onclick = function () {
            profileHover.toggle();
            profileOverlay.toggle();
        }
    }
    

    if (profileOverlay) {
        profileOverlay.onclick = function () {
            profileOverlay.toggle();
            profileHover.toggle();
        }
    }
    

    if (settingsOverlay) {
        settingsOverlay.onclick = function () {
            settings.classList.toggle("open");
            settingsOverlay.toggle();
        }
    }
    
    if (profileIcon) {
        profileIcon.onclick = function () {
            window.location.href = "profile.php";
        }
    }
    
    if (logoffButton) {
        logoffButton.onclick = function () {
            window.location.href = "php/logoff.php";
        }
    }
    
    if (dropdown) {
        const urlParams = new URLSearchParams(window.location.search);
        const season = urlParams.get('season');
        const week = urlParams.get('week')
        if (season && week) {
            dropdown.value = `Week ${week} of Season ${season}`
            dropdown.onchange = function() {
                const selectedValue = dropdown.value;
                const parts = selectedValue.split(' '); 
                if (parts.length === 5 && parts[0] === 'Week') {
                    const seasonNumber = parts[4]; 
                    const weekNumber = parts[1]; 
                    const newQueryString = `season=${seasonNumber}&week=${weekNumber}`;
                    const urlParts = window.location.href.split('?');
                    const baseUrl = urlParts[0];
                    const newUrl = `${baseUrl}?${newQueryString}`;
                    window.location.href = newUrl;
                } 
            }
        }
        else if (season) {
            dropdown.value = `Season ${season}`
            dropdown.onchange = function() {
                const selectedValue = dropdown.value;
                const parts = selectedValue.split(' '); 
                const seasonNumber = parts[1]; 
                const newQueryString = `season=${seasonNumber}`;
                const urlParts = window.location.href.split('?');
                const baseUrl = urlParts[0];
                const newUrl = `${baseUrl}?${newQueryString}`;
                window.location.href = newUrl;
            }
        }
    }

    if (ascCheckbox && descCheckbox && gpCheckbox) {
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        const currentSort = searchParams.get("sort");
        const currentOrder = searchParams.get("order");
        // if url not set
        if (ascCheckbox.checked && currentOrder === null) {
            searchParams.set("order", "asc");
            window.history.replaceState({}, '', url);
            location.reload();
        } else if (descCheckbox.checked &&  currentOrder === null) {
            searchParams.set("order", "desc");
            window.history.replaceState({}, '', url);
            location.reload();
        }

        if (gpCheckbox.checked && currentSort === null) {
            searchParams.set("sort", "gp");
            window.history.replaceState({}, '', url);
            location.reload();
        }
        
        ascCheckbox.addEventListener("click", function () {
            if (!ascCheckbox.checked && descCheckbox.checked) {
                if (searchParams.get("order") && searchParams.get("order") === "desc") return
                if (searchParams.get("order") && searchParams.get("order") !== "desc") {
                    searchParams.set("order", "desc");
                    window.history.replaceState({}, '', url);
                    location.reload();
                }
            } 
            if (ascCheckbox.checked)
                currentOrder === null ? searchParams.append("order", "asc") : searchParams.set("order", "asc");
            else if (!descCheckbox.checked && !ascCheckbox.checked)
                searchParams.delete("order");
            window.history.replaceState({}, '', url);
            location.reload();
        });
        descCheckbox.addEventListener("click", function () {
            if (ascCheckbox.checked && !descCheckbox.checked) {
                if (searchParams.get("order") && searchParams.get("order") === "asc") return
                if (searchParams.get("order") && searchParams.get("order") !== "asc") {
                    searchParams.set("order", "asc");
                    window.history.replaceState({}, '', url);
                    location.reload();
                }
            }
            if (descCheckbox.checked)
                currentOrder === null ? searchParams.append("order", "desc") : searchParams.set("order", "desc");
            else if (!descCheckbox.checked && !ascCheckbox.checked)
                searchParams.delete("order");
            window.history.replaceState({}, '', url);
            location.reload();
        });
        gpCheckbox.addEventListener("click", function () {
            if (gpCheckbox.checked)
                currentSort === null ? searchParams.append("sort", "gp") : null;
            else 
                searchParams.delete("sort");
            window.history.replaceState({}, '', url);
            location.reload();
        });  
    }
    
})