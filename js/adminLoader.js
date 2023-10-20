window.addEventListener("load", function(){
    const operations = document.getElementById("operations")
    const fileLabel = document.getElementById("fileLabel")
    const fileCheckbox = document.getElementById("fileCheckbox")
    const deleteLabel = document.getElementById("deleteLabel")
    const deleteCheckbox = document.getElementById("deleteCheckbox")
    const format = document.getElementById("format")
    

    const usernameLabel = document.getElementById("usernameLabel")
    const usernameInput = document.getElementById("usernameInput")
    const passwordLabel = document.getElementById("passwordLabel")
    const passwordInput = document.getElementById("passwordInput")
    const userTypeLabel = document.getElementById("userTypeLabel")
    const userTypeInput = document.getElementById("userTypeInput")
    const userGpLabel = document.getElementById("userGpLabel")
    const userGpInput = document.getElementById("userGpInput")
    const userGpNumberLabel = document.getElementById("userGpNumberLabel")
    const userGpNumberInput = document.getElementById("userGpNumberInput")
    const timerLabel = document.getElementById("timerLabel")
    const timerInput = document.getElementById("timerInput")
    const weekLabel = document.getElementById("weekLabel")
    const weekInput = document.getElementById("weekInput")
    const seasonLabel = document.getElementById("seasonLabel")
    const seasonInput = document.getElementById("seasonInput")
    const fileInput = document.getElementById("fileInput")
    
    operations.onchange = function() {
        let selectedValue = operations[operations.selectedIndex].value;
    
        switch (selectedValue) {
            case "Toggle Timer":
                format.innerHTML = "Sets the timer to either paused or unpaused depending on the state."
                usernameLabel.style.display = "none"
                usernameInput.style.display = "none"
                passwordLabel.style.display = "none"
                passwordInput.style.display = "none"
                userTypeLabel.style.display = "none"
                userTypeInput.style.display = "none"
                userGpLabel.style.display = "none"
                userGpInput.style.display = "none"
                userGpNumberLabel.style.display = "none"
                userGpNumberInput.style.display = "none"
                timerLabel.style.display = "none"
                timerInput.style.display = "none"
                weekLabel.style.display = "none"
                weekInput.style.display = "none"
                seasonLabel.style.display = "none"
                seasonInput.style.display = "none"
                fileInput.style.display = "none"
                fileLabel.style.display = "none"
                fileCheckbox.style.display = "none"
                deleteLabel.style.display = "none"
                deleteCheckbox.style.display = "none"
                break;
            case "Edit Timer":
                format.innerHTML = 'Sets the timers time, cannot be empty. Format: <a href="https://www.php.net/manual/en/function.strtotime.php#example-2174" target="_blank">https://www.php.net/manual/en/function.strtotime.php#example-2174</a>';
                usernameLabel.style.display = "none"
                usernameInput.style.display = "none"
                passwordLabel.style.display = "none"
                passwordInput.style.display = "none"
                userTypeLabel.style.display = "none"
                userTypeInput.style.display = "none"
                userGpLabel.style.display = "none"
                userGpInput.style.display = "none"
                userGpNumberLabel.style.display = "none"
                userGpNumberInput.style.display = "none"
                timerLabel.style.display = "block"
                timerInput.style.display = "block"
                weekLabel.style.display = "none"
                weekInput.style.display = "none"
                seasonLabel.style.display = "none"
                seasonInput.style.display = "none"
                fileInput.style.display = "none"
                fileLabel.style.display = "none"
                fileCheckbox.style.display = "none"
                deleteLabel.style.display = "none"
                deleteCheckbox.style.display = "none"
                break;
            case "Upload Games":
                format.innerHTML = "Uploads games for the current week from a games csv file."
                usernameLabel.style.display = "none"
                usernameInput.style.display = "none"
                passwordLabel.style.display = "none"
                passwordInput.style.display = "none"
                userTypeLabel.style.display = "none"
                userTypeInput.style.display = "none"
                userGpLabel.style.display = "none"
                userGpInput.style.display = "none"
                userGpNumberLabel.style.display = "none"
                userGpNumberInput.style.display = "none"
                timerLabel.style.display = "none"
                timerInput.style.display = "none"
                weekLabel.style.display = "none"
                weekInput.style.display = "none"
                seasonLabel.style.display = "none"
                seasonInput.style.display = "none"
                fileInput.style.display = "block"
                fileLabel.style.display = "none"
                fileCheckbox.style.display = "none"
                deleteLabel.style.display = "none"
                deleteCheckbox.style.display = "none"
                break;
            case "Upload Picks":
                    format.innerHTML = "Uploads picks for the current week from a picks csv file."
                    usernameLabel.style.display = "none"
                    usernameInput.style.display = "none"
                    passwordLabel.style.display = "none"
                    passwordInput.style.display = "none"
                    userTypeLabel.style.display = "none"
                    userTypeInput.style.display = "none"
                    userGpLabel.style.display = "none"
                    userGpInput.style.display = "none"
                    userGpNumberLabel.style.display = "none"
                    userGpNumberInput.style.display = "none"
                    timerLabel.style.display = "none"
                    timerInput.style.display = "none"
                    weekLabel.style.display = "none"
                    weekInput.style.display = "none"
                    seasonLabel.style.display = "none"
                    seasonInput.style.display = "none"
                    fileInput.style.display = "block"
                    fileLabel.style.display = "none"
                    fileCheckbox.style.display = "none"
                    deleteLabel.style.display = "none"
                    deleteCheckbox.style.display = "none"
                    break;
            case "Enter Winners":
                format.innerHTML = "Uploads winning teams/players for the current week from a games csv file."
                usernameLabel.style.display = "none"
                usernameInput.style.display = "none"
                passwordLabel.style.display = "none"
                passwordInput.style.display = "none"
                userTypeLabel.style.display = "none"
                userTypeInput.style.display = "none"
                userGpLabel.style.display = "none"
                userGpInput.style.display = "none"
                userGpNumberLabel.style.display = "none"
                userGpNumberInput.style.display = "none"
                timerLabel.style.display = "none"
                timerInput.style.display = "none"
                weekLabel.style.display = "none"
                weekInput.style.display = "none"
                seasonLabel.style.display = "none"
                seasonInput.style.display = "none"
                fileInput.style.display = "block"
                fileLabel.style.display = "none"
                fileCheckbox.style.display = "none"
                deleteLabel.style.display = "none"
                deleteCheckbox.style.display = "none"
                break;
            case "Upload Old Data":
                    format.innerHTML = "Uploads old data. Use process_seasons.bat to create the seasons.zip."
                    usernameLabel.style.display = "none"
                    usernameInput.style.display = "none"
                    passwordLabel.style.display = "none"
                    passwordInput.style.display = "none"
                    userTypeLabel.style.display = "none"
                    userTypeInput.style.display = "none"
                    userGpLabel.style.display = "none"
                    userGpInput.style.display = "none"
                    userGpNumberLabel.style.display = "none"
                    userGpNumberInput.style.display = "none"
                    timerLabel.style.display = "none"
                    timerInput.style.display = "none"
                    weekLabel.style.display = "none"
                    weekInput.style.display = "none"
                    seasonLabel.style.display = "none"
                    seasonInput.style.display = "none"
                    fileInput.style.display = "block"
                    fileLabel.style.display = "none"
                    fileCheckbox.style.display = "none"
                    deleteLabel.style.display = "none"
                    deleteCheckbox.style.display = "none"
                    break;
            case "Insert User":
                format.innerHTML = "Inserts new users. Format for file uploads is: (user,password,gp,type,group_number) per line. Type is either admin or user"
                fileLabel.style.display = "inline-block";
                fileCheckbox.style.display = "inline-block"
                deleteLabel.style.display = "none"
                deleteCheckbox.style.display = "none"
                usernameLabel.style.display = fileCheckbox.checked ? "none" : "block"
                usernameInput.style.display = fileCheckbox.checked ? "none" : "block"
                passwordLabel.style.display = fileCheckbox.checked ? "none" : "block"
                passwordInput.style.display = fileCheckbox.checked ? "none" : "block"
                userTypeLabel.style.display = fileCheckbox.checked ? "none" : "block"
                userTypeInput.style.display = fileCheckbox.checked ? "none" : "block"
                userGpLabel.style.display = fileCheckbox.checked ? "none" : "block"
                userGpInput.style.display = fileCheckbox.checked ? "none" : "block"
                userGpNumberLabel.style.display = fileCheckbox.checked ? "none" : "block"
                userGpNumberInput.style.display = fileCheckbox.checked ? "none" : "block"
                timerLabel.style.display = "none"
                timerInput.style.display = "none"
                weekLabel.style.display = "none"
                weekInput.style.display = "none"
                seasonLabel.style.display = "none"
                seasonInput.style.display = "none"
                fileInput.style.display = fileCheckbox.checked ? "block" : "none"
                break;
            case "Delete User":
                format.innerHTML = "If hard delete is checked all of the users data/stats will be removed otherwise it sets user(s) as inactive. Format for file uploads is: (user,user ...)."
                fileLabel.style.display = "inline-block";
                fileCheckbox.style.display = "inline-block"
                deleteLabel.style.display = "inline-block"
                deleteCheckbox.style.display = "inline-block"
                usernameLabel.style.display = fileCheckbox.checked ? "none" : "block"
                usernameInput.style.display = fileCheckbox.checked ? "none" : "block"
                passwordLabel.style.display = "none"
                passwordInput.style.display = "none"
                userTypeLabel.style.display = "none"
                userTypeInput.style.display = "none"
                userGpLabel.style.display = "none"
                userGpInput.style.display = "none"
                userGpNumberLabel.style.display = "none"
                userGpNumberInput.style.display = "none"
                timerLabel.style.display = "none"
                timerInput.style.display = "none"
                weekLabel.style.display = "none"
                weekInput.style.display = "none"
                seasonLabel.style.display = "none"
                seasonInput.style.display = "none"
                fileInput.style.display = fileCheckbox.checked ? "block" : "none"
                break;
            case "Set Week/Season":
                format.innerHTML = "Sets a week and/or season. If neither are specified the week/season will be set to the environment variables set."
                fileLabel.style.display = "none"
                fileCheckbox.style.display = "none"
                usernameLabel.style.display = "none"
                usernameInput.style.display = "none"
                passwordLabel.style.display = "none"
                passwordInput.style.display = "none"
                userTypeLabel.style.display = "none"
                userTypeInput.style.display = "none"
                userGpLabel.style.display = "none"
                userGpInput.style.display = "none"
                userGpNumberLabel.style.display = "none"
                userGpNumberInput.style.display = "none"
                timerLabel.style.display = "none"
                timerInput.style.display = "none"
                weekLabel.style.display = "block"
                weekInput.style.display = "block"
                seasonLabel.style.display = "block"
                seasonInput.style.display = "block"
                fileInput.style.display = "none"
                deleteLabel.style.display = "none"
                deleteCheckbox.style.display = "none"
                break;
        }
    };
    
    fileCheckbox.onclick = function() {
        let selectedValue = operations[operations.selectedIndex].value;
        if (fileCheckbox.checked) {
            switch (selectedValue) {
                case "Insert User":
                case "Delete User":
                    fileInput.style.display = "block";
                    usernameLabel.style.display = "none"
                    usernameInput.style.display = "none"
                    passwordLabel.style.display = "none"
                    passwordInput.style.display = "none"
                    userTypeLabel.style.display = "none"
                    userTypeInput.style.display = "none"
                    userGpLabel.style.display = "none"
                    userGpInput.style.display = "none"
                    userGpNumberLabel.style.display = "none"
                    userGpNumberInput.style.display = "none"
                    weekLabel.style.display = "none"
                    weekInput.style.display = "none"
                    seasonLabel.style.display = "none"
                    seasonInput.style.display = "none"
                    break;
            }
        } else {
            switch (selectedValue) {
                case "Insert User":
                    fileInput.style.display = "none";
                    usernameLabel.style.display = "block"
                    usernameInput.style.display = "block"
                    passwordLabel.style.display = "block"
                    passwordInput.style.display = "block"
                    userTypeLabel.style.display = "block"
                    userTypeInput.style.display = "block"
                    userGpLabel.style.display = "block"
                    userGpInput.style.display = "block"
                    userGpNumberLabel.style.display = "block"
                    userGpNumberInput.style.display = "block"
                    weekLabel.style.display = "none"
                    weekInput.style.display = "none"
                    seasonLabel.style.display = "none"
                    seasonInput.style.display = "none"
                    break;
                case "Delete User":
                    fileInput.style.display = "none"
                    usernameLabel.style.display = "block"
                    usernameInput.style.display = "block"
                    passwordLabel.style.display = "none"
                    passwordInput.style.display = "none"
                    userTypeLabel.style.display = "none"
                    userTypeInput.style.display = "none"
                    userGpLabel.style.display = "none"
                    userGpInput.style.display = "none"
                    userGpNumberLabel.style.display = "none"
                    userGpNumberInput.style.display = "none"
                    weekLabel.style.display = "none"
                    weekInput.style.display = "none"
                    seasonLabel.style.display = "none"
                    seasonInput.style.display = "none"
                    break;
            }
        }
    };
})
